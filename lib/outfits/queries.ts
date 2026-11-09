import "server-only";

import { count, desc, eq, inArray, max } from "drizzle-orm";

import { requireSession } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { outfits, wearLogs, type Item, type WeatherSnapshot } from "@/lib/db/schema";

import { SLOT_ORDER, type Occasion, type Slot } from "./slots";

export type OutfitPieceView = Pick<Item, "id" | "name" | "category" | "subcategory" | "thumbUrl" | "imageUrl" | "status"> & {
  slot: Slot;
  /** Soft-deleted items still show in wear history, but can't be opened. */
  deleted: boolean;
};

const pieceColumns = {
  id: true,
  name: true,
  category: true,
  subcategory: true,
  thumbUrl: true,
  imageUrl: true,
  status: true,
  deletedAt: true,
} as const;

type PieceRow = Pick<Item, keyof typeof pieceColumns>;

function toPiece(item: PieceRow, slot: Slot): OutfitPieceView {
  const { deletedAt, ...rest } = item;
  return { ...rest, slot, deleted: deletedAt !== null };
}

function bySlot(a: OutfitPieceView, b: OutfitPieceView): number {
  return SLOT_ORDER.indexOf(a.slot) - SLOT_ORDER.indexOf(b.slot);
}

function isUuid(id: string): boolean {
  return /^[0-9a-f-]{36}$/i.test(id);
}

async function wearStats(outfitIds: string[]): Promise<Map<string, { times: number; last: string | null }>> {
  const map = new Map<string, { times: number; last: string | null }>();
  if (outfitIds.length === 0) return map;
  const rows = await db
    .select({ outfitId: wearLogs.outfitId, times: count(), last: max(wearLogs.wornOn) })
    .from(wearLogs)
    .where(inArray(wearLogs.outfitId, outfitIds))
    .groupBy(wearLogs.outfitId);
  for (const row of rows) if (row.outfitId) map.set(row.outfitId, { times: Number(row.times), last: row.last });
  return map;
}

export type OutfitSummary = {
  id: string;
  name: string | null;
  occasion: Occasion | null;
  pieces: OutfitPieceView[];
  timesWorn: number;
  lastWornOn: string | null;
};

/** Every saved outfit, newest first. */
export async function listOutfits(): Promise<OutfitSummary[]> {
  await requireSession();
  const rows = await db.query.outfits.findMany({
    orderBy: desc(outfits.createdAt),
    with: { outfitItems: { with: { item: { columns: pieceColumns } } } },
  });
  const stats = await wearStats(rows.map((r) => r.id));
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    occasion: row.occasion,
    pieces: row.outfitItems.map((oi) => toPiece(oi.item, oi.slot)).sort(bySlot),
    timesWorn: stats.get(row.id)?.times ?? 0,
    lastWornOn: stats.get(row.id)?.last ?? null,
  }));
}

export async function getOutfit(id: string): Promise<OutfitSummary | null> {
  await requireSession();
  if (!isUuid(id)) return null;
  const row = await db.query.outfits.findFirst({
    where: eq(outfits.id, id),
    with: { outfitItems: { with: { item: { columns: pieceColumns } } } },
  });
  if (!row) return null;
  const stats = (await wearStats([id])).get(id);
  return {
    id: row.id,
    name: row.name,
    occasion: row.occasion,
    pieces: row.outfitItems.map((oi) => toPiece(oi.item, oi.slot)).sort(bySlot),
    timesWorn: stats?.times ?? 0,
    lastWornOn: stats?.last ?? null,
  };
}

export type WearEntry = {
  id: string;
  wornOn: string;
  rating: number | null;
  weather: WeatherSnapshot | null;
  outfit: { id: string; name: string | null } | null;
  pieces: OutfitPieceView[];
};

const wearWith = {
  outfit: { columns: { id: true, name: true } },
  items: { with: { item: { columns: pieceColumns } } },
} as const;

type WearRow = {
  id: string;
  wornOn: string;
  rating: number | null;
  weather: WeatherSnapshot | null;
  outfit: { id: string; name: string | null } | null;
  items: Array<{ item: PieceRow }>;
};

function toWearEntry(row: WearRow): WearEntry {
  return {
    id: row.id,
    wornOn: row.wornOn,
    rating: row.rating,
    weather: row.weather,
    outfit: row.outfit,
    // A wear log doesn't record slots, so the item's category stands in.
    pieces: row.items
      .filter((li) => li.item.category !== null)
      .map((li) => toPiece(li.item, li.item.category as Slot))
      .sort(bySlot),
  };
}

/** Wear history, newest first. */
export async function listWearLogs(): Promise<WearEntry[]> {
  await requireSession();
  const rows = await db.query.wearLogs.findMany({
    orderBy: [desc(wearLogs.wornOn), desc(wearLogs.createdAt)],
    with: wearWith,
  });
  return rows.map(toWearEntry);
}

export async function getWearLog(id: string): Promise<WearEntry | null> {
  await requireSession();
  if (!isUuid(id)) return null;
  const row = await db.query.wearLogs.findFirst({ where: eq(wearLogs.id, id), with: wearWith });
  return row ? toWearEntry(row) : null;
}
