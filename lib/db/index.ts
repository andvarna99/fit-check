import "server-only";

import { mkdirSync } from "node:fs";

import { Pool } from "@neondatabase/serverless";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-serverless";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";

import * as schema from "./schema";

export type Database = PgDatabase<PgQueryResultHKT, typeof schema>;

/** Local embedded Postgres location, used when DATABASE_URL is not set. */
export const LOCAL_DB_DIR = "./.data/pglite";

function createDb(): Database {
  const url = process.env.DATABASE_URL;
  if (url) {
    // WebSocket Pool driver (not neon-http) because item saves need transactions.
    // Node 22+ provides the global WebSocket it uses.
    return drizzleNeon({ client: new Pool({ connectionString: url }), schema }) as unknown as Database;
  }
  if (process.env.NODE_ENV === "production" && process.env.VERCEL) {
    throw new Error("DATABASE_URL must be set in production.");
  }
  mkdirSync(LOCAL_DB_DIR, { recursive: true });
  return drizzlePglite(LOCAL_DB_DIR, { schema }) as unknown as Database;
}

// Reuse one instance across hot reloads in development; PGlite allows only
// one open handle per data directory.
const globalForDb = globalThis as unknown as { fitCheckDb?: Database };

function getDb(): Database {
  if (!globalForDb.fitCheckDb) globalForDb.fitCheckDb = createDb();
  return globalForDb.fitCheckDb;
}

/**
 * Connects lazily on first use, so importing this module (e.g. while
 * `next build` collects pages) never opens a database.
 */
export const db: Database = new Proxy({} as Database, {
  get(_target, prop) {
    const real = getDb();
    const value = Reflect.get(real, prop, real);
    return typeof value === "function" ? value.bind(real) : value;
  },
});
