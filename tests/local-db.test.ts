import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { sql } from "drizzle-orm";
import { afterAll, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const { isFatalPgliteError, openLocalDb } = await import("@/lib/db/local");
const { items } = await import("@/lib/db/schema");

const root = mkdtempSync(join(tmpdir(), "fit-check-local-db-"));
afterAll(() => rmSync(root, { recursive: true, force: true }));

describe("openLocalDb", () => {
  it("applies migrations before the first query", async () => {
    const db = openLocalDb(() => {}, join(root, "fresh"));
    // Runs immediately, without waiting: the query must wait for migrations itself.
    const rows = await db.select({ id: items.id }).from(items);
    expect(rows).toEqual([]);
    const applied = await db.execute(sql`select count(*)::int as n from drizzle.__drizzle_migrations`);
    expect(applied.rows[0]).toMatchObject({ n: expect.any(Number) });
    expect((applied.rows[0] as { n: number }).n).toBeGreaterThan(0);
  });

  it("refuses a directory another live process has open", () => {
    const dir = join(root, "locked");
    // The parent of this test process is alive and is not us.
    writeFileSync(`${dir}.lock`, String(process.ppid));
    expect(() => openLocalDb(() => {}, dir)).toThrow(/already open in process/);
  });

  it("takes over a lock left by a process that has exited", async () => {
    const dir = join(root, "stale");
    writeFileSync(`${dir}.lock`, "2147483646");
    const db = openLocalDb(() => {}, dir);
    await expect(db.select({ id: items.id }).from(items)).resolves.toEqual([]);
  });

  it("recognizes a WASM abort as fatal, and SQL errors as not fatal", () => {
    const abort = new Error("Aborted(). Build with -sASSERTIONS for more info.");
    abort.name = "RuntimeError";
    expect(isFatalPgliteError(abort)).toBe(true);
    expect(isFatalPgliteError(new Error('relation "nope" does not exist'))).toBe(false);
  });
});
