"use server";

import { randomUUID } from "node:crypto";

import { and, eq, inArray, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireSession } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { items, outfitItems, outfits, wearLogItems, wearLogs, type WeatherSnapshot } from "@/lib/db/schema";
import { isPlausibleToday } from "@/lib/outfits/dates";
import { outfitInputSchema, ratingSchema, weatherSnapshotSchema, type OutfitInput } from "@/lib/outfits/input";
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
  // Today prefers pieces that haven't been worn lately.
  revalidatePath("/");
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
export async function saveOutfit(
  id: string | null,
  input: OutfitInput,
  /** "rules" when saved from a Today suggestion. */
  source: "user" | "rules" = "user",
): Promise<ActionResult<{ id: string }>> {
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
        await tx.insert(outfits).values({ id: outfitId, ...values, createdBy: source === "rules" ? "rules" : "user" });
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
export async function wearOutfit(
  outfitId: string,
  today: string,
  weather: WeatherSnapshot | null = null,
): Promise<ActionResult<{ logId: string; rating: number | null }>> {
  await requireSession();
  if (!isUuid(outfitId)) return { ok: false, error: "That outfit doesn't exist anymore." };
  if (!isPlausibleToday(today)) return { ok: false, error: "Your device's date looks off. Check it and try again." };
  const snapshot = parseWeather(weather);

  try {
    const result = await db.transaction(async (tx) => {
      const [existing] = await tx
        .select({ id: wearLogs.id, rating: wearLogs.rating })
        .from(wearLogs)
        .where(and(eq(wearLogs.outfitId, outfitId), eq(wearLogs.wornOn, today)));
      if (existing) {
        if (snapshot) await tx.update(wearLogs).set({ weather: snapshot }).where(and(eq(wearLogs.id, existing.id), isNull(wearLogs.weather)));
        return { logId: existing.id, rating: existing.rating };
      }

      const pieces = await tx
        .select({ itemId: outfitItems.itemId })
        .from(outfitItems)
        .where(eq(outfitItems.outfitId, outfitId));
      if (pieces.length === 0) return null;

      const logId = randomUUID();
      await tx.insert(wearLogs).values({ id: logId, outfitId, wornOn: today, weather: snapshot });
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

function parseWeather(weather: WeatherSnapshot | null): WeatherSnapshot | null {
  if (!weather) return null;
  const parsed = weatherSnapshotSchema.safeParse(weather);
  return parsed.success ? parsed.data : null;
}

const sameSet = (a: readonly string[], b: readonly string[]) => a.length === b.length && a.every((id) => b.includes(id));

/**
 * Logs pieces picked on Today as worn on the device's `today`. Links the
 * entry to a saved outfit with exactly these pieces, if there is one.
 * Logging the same pieces twice on one day returns the existing entry.
 */
export async function wearPieces(
  itemIds: string[],
  today: string,
  weather: WeatherSnapshot | null = null,
): Promise<ActionResult<{ logId: string; rating: number | null }>> {
  await requireSession();
  if (!isPlausibleToday(today)) return { ok: false, error: "Your device's date looks off. Check it and try again." };
  const ids = outfitInputSchema.shape.itemIds.safeParse(itemIds);
  if (!ids.success) return { ok: false, error: "That outfit didn't look right. Try again." };
  const loaded = await loadPieces(ids.data);
  if (!loaded.ok) return loaded;
  const chosen = loaded.pieces.map((p) => p.id);
  const snapshot = parseWeather(weather);

  try {
    const result = await db.transaction(async (tx) => {
      const todays = await tx.query.wearLogs.findMany({
        where: eq(wearLogs.wornOn, today),
        columns: { id: true, rating: true, weather: true },
        with: { items: { columns: { itemId: true } } },
      });
      const existing = todays.find((log) => sameSet(log.items.map((i) => i.itemId), chosen));
      if (existing) {
        if (snapshot && !existing.weather) await tx.update(wearLogs).set({ weather: snapshot }).where(eq(wearLogs.id, existing.id));
        return { logId: existing.id, rating: existing.rating, outfitId: null };
      }

      // A saved outfit with exactly these pieces gets the credit.
      const candidates = await tx
        .select({ outfitId: outfitItems.outfitId })
        .from(outfitItems)
        .where(eq(outfitItems.itemId, chosen[0]));
      let outfitId: string | null = null;
      if (candidates.length) {
        const rows = await tx
          .select({ outfitId: outfitItems.outfitId, itemId: outfitItems.itemId })
          .from(outfitItems)
          .where(inArray(outfitItems.outfitId, candidates.map((c) => c.outfitId)));
        const byOutfit = new Map<string, string[]>();
        for (const row of rows) byOutfit.set(row.outfitId, [...(byOutfit.get(row.outfitId) ?? []), row.itemId]);
        outfitId = [...byOutfit].find(([, items]) => sameSet(items, chosen))?.[0] ?? null;
      }

      const logId = randomUUID();
      await tx.insert(wearLogs).values({ id: logId, outfitId, wornOn: today, weather: snapshot });
      await tx.insert(wearLogItems).values(chosen.map((itemId) => ({ wearLogId: logId, itemId })));
      return { logId, rating: null, outfitId };
    });
    revalidateHistory(result.logId);
    if (result.outfitId) revalidatePath(`/outfits/${result.outfitId}`);
    return { ok: true, logId: result.logId, rating: result.rating };
  } catch (error) {
    console.error("wearPieces failed", error);
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
