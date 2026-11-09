import { defineConfig } from "drizzle-kit";

// With DATABASE_URL set (Neon), migrations target that database.
// Without it, they target the local embedded PGlite database in ./.data.
const url = process.env.DATABASE_URL;

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  ...(url
    ? { dbCredentials: { url } }
    : { driver: "pglite", dbCredentials: { url: "./.data/pglite" } }),
  strict: true,
  verbose: true,
});
