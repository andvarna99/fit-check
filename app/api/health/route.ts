import { sql } from "drizzle-orm";
import { connection } from "next/server";

import { db } from "@/lib/db";

// Behind the login via proxy.ts. Confirms the app can reach the database.
export async function GET() {
  await connection();
  try {
    await db.execute(sql`select 1`);
    return Response.json({ ok: true, database: process.env.DATABASE_URL ? "neon" : "pglite" });
  } catch (error) {
    console.error("Health check failed", error);
    return Response.json({ ok: false }, { status: 503 });
  }
}
