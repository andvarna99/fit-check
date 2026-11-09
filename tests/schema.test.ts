import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { PGlite } from "@electric-sql/pglite";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/pglite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import * as schema from "@/lib/db/schema";

// Applies the generated migrations to an in-memory database, so these tests
// also catch a schema.ts change that was not followed by `npm run db:generate`.
const client = new PGlite();
const db = drizzle({ client, schema });

beforeAll(async () => {
  const dir = join(process.cwd(), "drizzle");
  const files = readdirSync(dir)
    .filter((f) => f.endsWith(".sql"))
    .sort();
  for (const file of files) {
    const sql = readFileSync(join(dir, file), "utf8");
    for (const statement of sql.split("--> statement-breakpoint")) {
      if (statement.trim()) await client.exec(statement);
    }
  }
});

afterAll(async () => {
  await client.close();
});

describe("database schema", () => {
  it("saves an untagged draft item", async () => {
    const [draft] = await db.insert(schema.items).values({ imageUrl: "a.png" }).returning();
    expect(draft.isDraft).toBe(true);
    expect(draft.category).toBeNull();
    expect(draft.colors).toEqual([]);
    expect(draft.status).toBe("clean");
  });

  it("requires a category on finished items", async () => {
    await expect(db.insert(schema.items).values({ isDraft: false })).rejects.toThrow();
  });

  it("enforces 1-5 ranges for formality and warmth", async () => {
    await expect(
      db.insert(schema.items).values({ category: "top", isDraft: false, formality: 6 }),
    ).rejects.toThrow();
    await expect(
      db.insert(schema.items).values({ category: "top", isDraft: false, warmth: 0 }),
    ).rejects.toThrow();
  });

  it("links outfits, items and wear logs, and keeps history when an outfit is deleted", async () => {
    const [top] = await db
      .insert(schema.items)
      .values({ category: "top", isDraft: false, colors: ["navy"], seasons: ["fall", "winter"] })
      .returning();
    const [outfit] = await db.insert(schema.outfits).values({ name: "Fall fit" }).returning();
    await db.insert(schema.outfitItems).values({ outfitId: outfit.id, itemId: top.id, slot: "top" });
    const [log] = await db
      .insert(schema.wearLogs)
      .values({ outfitId: outfit.id, wornOn: "2026-11-09", rating: 5 })
      .returning();
    await db.insert(schema.wearLogItems).values({ wearLogId: log.id, itemId: top.id });

    const loaded = await db.query.outfits.findFirst({
      where: eq(schema.outfits.id, outfit.id),
      with: { outfitItems: { with: { item: true } } },
    });
    expect(loaded?.outfitItems[0]?.item.seasons).toEqual(["fall", "winter"]);

    await db.delete(schema.outfits).where(eq(schema.outfits.id, outfit.id));
    const [kept] = await db.select().from(schema.wearLogs).where(eq(schema.wearLogs.id, log.id));
    expect(kept.outfitId).toBeNull();
  });
});
