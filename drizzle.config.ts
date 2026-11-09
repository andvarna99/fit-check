import { defineConfig } from "drizzle-kit";

import { LOCAL_DB_DIR } from "./lib/db/local-paths";

// With DATABASE_URL set (Neon), commands target that database.
//
// Without it, only `generate` (which never connects) is allowed. The local
// PGlite database supports one process at a time, so the app applies its own
// migrations on startup; a second process opening it can corrupt it.
const url = process.env.DATABASE_URL;

const CONNECTING_COMMANDS = ["migrate", "push", "pull", "studio", "introspect", "check", "up"];
if (!url && process.argv.some((arg) => CONNECTING_COMMANDS.includes(arg))) {
  throw new Error(
    "DATABASE_URL is not set, so this would open the local PGlite database from a second process. " +
      "The app applies local migrations itself on startup: restart `npm run dev` instead.",
  );
}

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  ...(url
    ? { dbCredentials: { url } }
    : { driver: "pglite", dbCredentials: { url: LOCAL_DB_DIR } }),
  strict: true,
  verbose: true,
});
