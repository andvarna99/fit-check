// Pure outfit rules shared by the builder (client) and the save action (server).

import type { CATEGORIES, OCCASIONS, SLOTS } from "@/lib/closet/constants";

export type Category = (typeof CATEGORIES)[number];
export type Slot = (typeof SLOTS)[number];
export type Occasion = (typeof OCCASIONS)[number];

export const OCCASION_LABEL: Record<Occasion, string> = {
  casual: "Casual",
  smart_casual: "Smart casual",
  formal: "Formal",
};

export const SLOT_LABEL: Record<Slot, string> = {
  outerwear: "Outerwear",
  top: "Top",
  dress: "Dress",
  bottom: "Bottom",
  shoes: "Shoes",
  accessory: "Accessory",
};

/** Display order for an outfit's items, top of the body to the feet, then extras. */
export const SLOT_ORDER: readonly Slot[] = ["outerwear", "top", "dress", "bottom", "shoes", "accessory"];

/** Every item category fills the slot of the same name. */
export function slotForCategory(category: Category): Slot {
  return category;
}

/**
 * The builder's rows. "core" is the Top / Dress row: one carousel holding
 * both, because a dress replaces the top and the bottom.
 */
export type BuilderRow = "outerwear" | "core" | "bottom" | "shoes";

export const ROW_CATEGORIES: Record<BuilderRow, readonly Category[]> = {
  outerwear: ["outerwear"],
  core: ["top", "dress"],
  bottom: ["bottom"],
  shoes: ["shoes"],
};

export const ROW_LABEL: Record<BuilderRow, string> = {
  outerwear: "Outerwear",
  core: "Top or dress",
  bottom: "Bottom",
  shoes: "Shoes",
};

export const OPTIONAL_ROWS: ReadonlySet<BuilderRow> = new Set(["outerwear"]);

export type Selection = {
  outerwear: string | null;
  core: string | null;
  bottom: string | null;
  shoes: string | null;
  accessories: string[];
};

export const EMPTY_SELECTION: Selection = { outerwear: null, core: null, bottom: null, shoes: null, accessories: [] };

export type OutfitPiece = { id: string; category: Category };

/** Item ids in the selection that the outfit actually uses (the bottom is skipped under a dress). */
export function selectedIds(selection: Selection, categoryOf: (id: string) => Category | undefined): string[] {
  const dress = selection.core !== null && categoryOf(selection.core) === "dress";
  const ids = [selection.outerwear, selection.core, dress ? null : selection.bottom, selection.shoes, ...selection.accessories];
  return ids.filter((id): id is string => id !== null);
}

/**
 * Starting selection for a new outfit: the first (newest) piece in each
 * required row, preferring a top over a dress so the bottom row shows.
 */
export function defaultSelection(pieces: Array<{ id: string; category: Category | null }>): Selection {
  const first = (cats: readonly Category[]) => pieces.find((p) => p.category && cats.includes(p.category))?.id ?? null;
  return {
    outerwear: null,
    core: first(["top"]) ?? first(["dress"]),
    bottom: first(ROW_CATEGORIES.bottom),
    shoes: first(ROW_CATEGORIES.shoes),
    accessories: [],
  };
}

/** Builds a builder selection from an outfit's items (editing a saved outfit). */
export function selectionFromPieces(pieces: OutfitPiece[]): Selection {
  const selection: Selection = { ...EMPTY_SELECTION, accessories: [] };
  for (const piece of pieces) {
    switch (piece.category) {
      case "outerwear":
        selection.outerwear ??= piece.id;
        break;
      case "top":
      case "dress":
        selection.core ??= piece.id;
        break;
      case "bottom":
        selection.bottom ??= piece.id;
        break;
      case "shoes":
        selection.shoes ??= piece.id;
        break;
      case "accessory":
        selection.accessories.push(piece.id);
        break;
    }
  }
  return selection;
}

export const MAX_ACCESSORIES = 6;

export type OutfitCheck = { ok: true } | { ok: false; error: string };

/**
 * Server-side rules for a saved outfit: at least one item, one item per slot
 * except accessories, and a dress never alongside a top or a bottom.
 */
export function checkOutfitPieces(pieces: OutfitPiece[]): OutfitCheck {
  if (pieces.length === 0) return { ok: false, error: "Add at least one piece to save this outfit." };
  const counts = new Map<Category, number>();
  for (const p of pieces) counts.set(p.category, (counts.get(p.category) ?? 0) + 1);
  for (const [category, n] of counts) {
    if (category !== "accessory" && n > 1) return { ok: false, error: `An outfit can have only one ${category}.` };
  }
  if ((counts.get("accessory") ?? 0) > MAX_ACCESSORIES) {
    return { ok: false, error: `An outfit can have up to ${MAX_ACCESSORIES} accessories.` };
  }
  if (counts.has("dress") && (counts.has("top") || counts.has("bottom"))) {
    return { ok: false, error: "A dress replaces the top and bottom. Remove one to save." };
  }
  return { ok: true };
}

/**
 * Picks a random item for each unlocked row that has choices. Optional rows
 * that are empty stay empty; accessories are left alone.
 */
export function shuffleSelection(
  selection: Selection,
  options: Record<BuilderRow, readonly string[]>,
  locked: ReadonlySet<BuilderRow>,
  random: () => number = Math.random,
): Selection {
  const next: Selection = { ...selection, accessories: [...selection.accessories] };
  for (const row of Object.keys(options) as BuilderRow[]) {
    if (locked.has(row)) continue;
    if (OPTIONAL_ROWS.has(row) && selection[row] === null) continue;
    const choices = options[row];
    if (choices.length === 0) continue;
    // Prefer a different item than the current one when there is a choice.
    const pool = choices.length > 1 ? choices.filter((id) => id !== selection[row]) : choices;
    next[row] = pool[Math.floor(random() * pool.length)] ?? null;
  }
  return next;
}
