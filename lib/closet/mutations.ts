import "server-only";

import { eq, inArray } from "drizzle-orm";

import { db } from "@/lib/db";
import { items, itemTags, tags } from "@/lib/db/schema";

import type { ItemInput } from "./item-input";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

/** Replaces an item's tags, creating tag rows as needed. */
export async function setItemTags(tx: Tx, itemId: string, names: string[]): Promise<void> {
  await tx.delete(itemTags).where(eq(itemTags.itemId, itemId));
  if (names.length === 0) return;
  await tx.insert(tags).values(names.map((name) => ({ name }))).onConflictDoNothing({ target: tags.name });
  const rows = await tx.select({ id: tags.id }).from(tags).where(inArray(tags.name, names));
  await tx.insert(itemTags).values(rows.map((r) => ({ itemId, tagId: r.id })));
}

/** Column values for an item from validated form input. */
export function itemValues(input: ItemInput) {
  return {
    name: input.name,
    category: input.category,
    subcategory: input.subcategory,
    colors: input.colors,
    pattern: input.pattern,
    material: input.material,
    seasons: input.seasons,
    formality: input.formality,
    warmth: input.warmth,
    brand: input.brand,
    priceCents: input.priceCents,
    purchasedOn: input.purchasedOn,
    // A draft with a category stays a draft until the user saves it properly.
    isDraft: input.isDraft,
  } satisfies Partial<typeof items.$inferInsert>;
}
