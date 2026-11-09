import "server-only";

import { mkdirSync } from "node:fs";

import { neon } from "@neondatabase/serverless";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-http";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";

import * as schema from "./schema";

export type Database = PgDatabase<PgQueryResultHKT, typeof schema>;

/** Local embedded Postgres location, used when DATABASE_URL is not set. */
export const LOCAL_DB_DIR = "./.data/pglite";

function createDb(): Database {
  const url = process.env.DATABASE_URL;
  if (url) {
    return drizzleNeon({ client: neon(url), schema }) as unknown as Database;
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

export const db: Database = globalForDb.fitCheckDb ?? createDb();

if (process.env.NODE_ENV !== "production") {
  globalForDb.fitCheckDb = db;
}
