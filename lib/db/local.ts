import "server-only";

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";

import { LOCAL_DB_DIR } from "./local-paths";
import * as schema from "./schema";

/**
 * PGlite is a single-process database: two processes opening the same data
 * directory corrupt it. The app process is therefore the only thing that ever
 * opens LOCAL_DB_DIR. It applies migrations itself, and a lock file stops a
 * second process (another dev server, a script) from opening the directory.
 * The lock file sits next to the directory: `<dir>.lock`.
 */

function processIsAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    // EPERM means the process exists but belongs to someone else.
    return (error as NodeJS.ErrnoException).code === "EPERM";
  }
}

function acquireLock(dir: string): void {
  const lockFile = `${dir}.lock`;
  try {
    const holder = Number.parseInt(readFileSync(lockFile, "utf8"), 10);
    if (Number.isInteger(holder) && holder !== process.pid && processIsAlive(holder)) {
      throw new Error(
        `The local database (${dir}) is already open in process ${holder}. ` +
          "PGlite supports one process at a time; stop that process first.",
      );
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
  writeFileSync(lockFile, String(process.pid));
}

/** A WASM abort leaves the instance unusable; the caller should drop it. */
export function isFatalPgliteError(error: unknown): boolean {
  return error instanceof Error && (error.name === "RuntimeError" || /\bAborted\(/.test(error.message));
}

const QUERY_METHODS = new Set(["query", "exec", "transaction"]);

/**
 * Opens the local database. Queries wait until pending migrations are applied.
 * `onFatal` runs if PGlite crashes, so the next request can reopen it.
 */
export function openLocalDb(onFatal: () => void, dir: string = LOCAL_DB_DIR) {
  mkdirSync(dir, { recursive: true });
  acquireLock(dir);

  const client = new PGlite(dir);
  const ready = migrate(drizzle({ client }), {
    migrationsFolder: path.join(process.cwd(), "drizzle"),
  });

  let dead = false;
  const fail = (error: unknown) => {
    if (!dead && isFatalPgliteError(error)) {
      dead = true;
      onFatal();
    }
    throw error;
  };
  ready.catch(fail).catch(() => {});

  const guarded = new Proxy(client, {
    get(target, prop) {
      const value = Reflect.get(target, prop, target);
      if (typeof value !== "function") return value;
      if (!QUERY_METHODS.has(prop as string)) return value.bind(target);
      return async (...args: unknown[]) => {
        await ready;
        try {
          return await value.apply(target, args);
        } catch (error) {
          return fail(error);
        }
      };
    },
  });

  return drizzle({ client: guarded, schema });
}
