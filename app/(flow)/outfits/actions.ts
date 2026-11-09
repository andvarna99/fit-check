"use server";

import { randomUUID } from "node:crypto";

import { and, eq, inArray, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireSession } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { items, outfitItems, outfits, wearLogItems, wearLogs } from "@/lib/db/schema";
import { isPlausibleToday } from "@/lib/outfits/dates";
import { outfitInputSchema, ratingSchema, type OutfitInput } from "@/lib/outfits/input";
import { checkOutfitPieces, slotForCategory, type OutfitPiece } from "@/lib/outfits/slots";

export type ActionResult<T = object> = ({ ok: true } & T) | { ok: false; error: string };

function isUuid(id: string): boolean {
  return /^[0-9a-f-]{36}$/i.test(id);
}

function revalidateOutfits(id?: string) {
  revalidatePath("/outfits");
  if (id) revalidatePath(`/outfits/${id}`);
  // Item detail pages list the outfits an item is in.
  revalidatePath("/closet/[id]", "page");
}

function revalidateHistory(id?: string) {
  revalidatePath("/history");
  if (id) revalidatePath(`/history/${id}`);
  revalidatePath("/outfits/[id]", "page");
  revalidatePath("/closet/[id]", "page");
}

/** Loads the chosen items and checks they make a valid outfit. */
async function loadPieces(itemIds: string[]): Promise<ActionResult<{ pieces: OutfitPiece[] }>> {
  if (itemIds.length === 0) return { ok: false, error: "Add at least one piece to save this outfit." };
  const rows = await db
    .select({ id: items.id, category: items.category, isDraft: items.isDraft })
    .from(items)
    .where(and(inArray(items.id, itemIds), isNull(items.deletedAt)));
  if (rows.length !== itemIds.length) {
    return { ok: false, error: "One of those pieces isn't in your closet anymore. Pick another." };
  }
  const pieces: OutfitPiece[] = [];
  for (const row of rows) {
    if (row.isDraft || !row.category) return { ok: false, error: "Finish tagging drafts before using them in outfits." };
    pieces.push({ id: row.id, category: row.category });
  }
  const check = checkOutfitPieces(pieces);
  return check.ok ? { ok: true, pieces } : check;
}

/** Creates an outfit, or replaces an existing one's name, occasion and items. */
export async function saveOutfit(id: string | null, input: OutfitInput): Promise<ActionResult<{ id: string }>> {
  await requireSession();
  if (id !== null && !isUuid(id)) return { ok: false, error: "That outfit doesn't exist anymore." };
  const parsed = outfitInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "That outfit didn't look right." };

  const loaded = await loadPieces(parsed.data.itemIds);
  if (!loaded.ok) return loaded;

  const outfitId = id ?? randomUUID();
  const values = { name: parsed.data.name, occasion: parsed.data.occasion };
  const rows = loaded.pieces.map((p) => ({ outfitId, itemId: p.id, slot: slotForCategory(p.category) }));

  try {
    const found = await db.transaction(async (tx) => {
      if (id === null) {
        await tx.insert(outfits).values({ id: outfitId, ...values });
      } else {
        const updated = await tx
          .update(outfits)
          .set({ ...values, updatedAt: new Date() })
          .where(eq(outfits.id, outfitId))
          .returning({ id: outfits.id });
        if (updated.length === 0) return false;
        await tx.delete(outfitItems).where(eq(outfitItems.outfitId, outfitId));
      }
      await tx.insert(outfitItems).values(rows);
      return true;
    });
    if (!found) return { ok: false, error: "That outfit doesn't exist anymore." };
  } catch (error) {
    console.error("saveOutfit failed", error);
    return { ok: false, error: "That outfit didn't save. Try again." };
  }

  revalidateOutfits(outfitId);
  return { ok: true, id: outfitId };
}

/** Deletes a saved outfit. Its wear history stays, without the outfit link. */
export async function deleteOutfit(id: string): Promise<void> {
  await requireSession();
  if (isUuid(id)) await db.delete(outfits).where(eq(outfits.id, id));
  revalidateOutfits(id);
  revalidateHistory();
  redirect("/outfits");
}

/**
 * Logs a saved outfit as worn on the device's `today`. Logging the same
 * outfit twice on one day returns the existing entry.
 */
export async function wearOutfit(outfitId: string, today: string): Promise<ActionResult<{ logId: string; rating: number | null }>> {
  await requireSession();
  if (!isUuid(outfitId)) return { ok: false, error: "That outfit doesn't exist anymore." };
  if (!isPlausibleToday(today)) return { ok: false, error: "Your device's date looks off. Check it and try again." };

  try {
    const result = await db.transaction(async (tx) => {
      const [existing] = await tx
        .select({ id: wearLogs.id, rating: wearLogs.rating })
        .from(wearLogs)
        .where(and(eq(wearLogs.outfitId, outfitId), eq(wearLogs.wornOn, today)));
      if (existing) return { logId: existing.id, rating: existing.rating };

      const pieces = await tx
        .select({ itemId: outfitItems.itemId })
        .from(outfitItems)
        .where(eq(outfitItems.outfitId, outfitId));
      if (pieces.length === 0) return null;

      const logId = randomUUID();
      await tx.insert(wearLogs).values({ id: logId, outfitId, wornOn: today });
      await tx.insert(wearLogItems).values(pieces.map((p) => ({ wearLogId: logId, itemId: p.itemId })));
      return { logId, rating: null };
    });
    if (!result) return { ok: false, error: "This outfit has no pieces left to wear." };
    revalidateHistory(result.logId);
    revalidatePath(`/outfits/${outfitId}`);
    return { ok: true, ...result };
  } catch (error) {
    console.error("wearOutfit failed", error);
    return { ok: false, error: "That didn't log. Try again." };
  }
}

export async function setWearRating(logId: string, rating: number | null): Promise<ActionResult> {
  await requireSession();
  const parsed = ratingSchema.safeParse(rating);
  if (!isUuid(logId) || !parsed.success) return { ok: false, error: "That rating didn't save. Try again." };
  await db.update(wearLogs).set({ rating: parsed.data }).where(eq(wearLogs.id, logId));
  revalidateHistory(logId);
  return { ok: true };
}

export async function deleteWearLog(logId: string): Promise<void> {
  await requireSession();
  if (isUuid(logId)) await db.delete(wearLogs).where(eq(wearLogs.id, logId));
  revalidateHistory(logId);
  redirect("/history");
}
