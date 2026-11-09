import "server-only";

import { and, count, desc, eq, inArray, isNull, max, sql } from "drizzle-orm";

import { requireSession } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { items, itemTags, outfitItems, tags, wearLogItems, wearLogs, type Item } from "@/lib/db/schema";

export type ClosetItem = Pick<
  Item,
  | "id"
  | "name"
  | "category"
  | "subcategory"
  | "colors"
  | "seasons"
  | "formality"
  | "warmth"
  | "status"
  | "brand"
  | "material"
  | "pattern"
  | "isDraft"
  | "thumbUrl"
  | "imageUrl"
> & { tags: string[] };

async function tagsByItem(itemIds: string[]): Promise<Map<string, string[]>> {
  const map = new Map<string, string[]>();
  if (itemIds.length === 0) return map;
  const rows = await db
    .select({ itemId: itemTags.itemId, name: tags.name })
    .from(itemTags)
    .innerJoin(tags, eq(tags.id, itemTags.tagId))
    .where(inArray(itemTags.itemId, itemIds))
    .orderBy(tags.name);
  for (const row of rows) {
    const list = map.get(row.itemId) ?? [];
    list.push(row.name);
    map.set(row.itemId, list);
  }
  return map;
}

/** Every item (finished and drafts), newest first. Single user, so the whole closet is small enough to load at once. */
export async function listClosetItems(): Promise<ClosetItem[]> {
  await requireSession();
  const rows = await db
    .select({
      id: items.id,
      name: items.name,
      category: items.category,
      subcategory: items.subcategory,
      colors: items.colors,
      seasons: items.seasons,
      formality: items.formality,
      warmth: items.warmth,
      status: items.status,
      brand: items.brand,
      material: items.material,
      pattern: items.pattern,
      isDraft: items.isDraft,
      thumbUrl: items.thumbUrl,
      imageUrl: items.imageUrl,
    })
    .from(items)
    .where(isNull(items.deletedAt))
    .orderBy(desc(items.createdAt));
  const tagMap = await tagsByItem(rows.map((r) => r.id));
  return rows.map((r) => ({ ...r, tags: tagMap.get(r.id) ?? [] }));
}

export type ItemDetail = Item & {
  tags: string[];
  timesWorn: number;
  lastWornOn: string | null;
  outfits: Array<{ id: string; name: string | null; thumbs: Array<string | null> }>;
};

export async function getItemDetail(id: string): Promise<ItemDetail | null> {
  await requireSession();
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;

  const [item] = await db
    .select()
    .from(items)
    .where(and(eq(items.id, id), isNull(items.deletedAt)));
  if (!item) return null;

  const [tagMap, [wear], outfitRows] = await Promise.all([
    tagsByItem([id]),
    db
      .select({ times: count(), last: max(wearLogs.wornOn) })
      .from(wearLogItems)
      .innerJoin(wearLogs, eq(wearLogs.id, wearLogItems.wearLogId))
      .where(eq(wearLogItems.itemId, id)),
    db.query.outfitItems.findMany({
      where: eq(outfitItems.itemId, id),
      with: {
        outfit: {
          columns: { id: true, name: true },
          with: { outfitItems: { with: { item: { columns: { thumbUrl: true } } } } },
        },
      },
    }),
  ]);

  return {
    ...item,
    tags: tagMap.get(id) ?? [],
    timesWorn: Number(wear?.times ?? 0),
    lastWornOn: wear?.last ?? null,
    outfits: outfitRows.map((row) => ({
      id: row.outfit.id,
      name: row.outfit.name,
      thumbs: row.outfit.outfitItems.slice(0, 4).map((oi) => oi.item.thumbUrl),
    })),
  };
}

export async function countItems(): Promise<{ total: number; drafts: number }> {
  await requireSession();
  const [row] = await db
    .select({ total: count(), drafts: sql<number>`count(*) filter (where ${items.isDraft})` })
    .from(items)
    .where(isNull(items.deletedAt));
  return { total: Number(row?.total ?? 0), drafts: Number(row?.drafts ?? 0) };
}

/** Number of saved outfits that include an item (for the delete confirmation). */
export async function countOutfitsWithItem(id: string): Promise<number> {
  await requireSession();
  const [row] = await db.select({ n: count() }).from(outfitItems).where(eq(outfitItems.itemId, id));
  return Number(row?.n ?? 0);
}
