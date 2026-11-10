// Builds candidate outfits from the closet and ranks them.

import type { BuilderRow, Category, Selection } from "@/lib/outfits/slots";

import { scoreOutfit, type OutfitScore } from "./score";
import type { Piece, ScoreContext } from "./types";

/** Pieces kept per row before combining, so the search stays small. */
const POOL_SIZE = 8;
const OUTERWEAR_POOL_SIZE = 4;

export type Suggestion = { selection: Selection; score: OutfitScore };

export type SuggestOptions = {
  /** Rows to keep as they are. Outerwear can be locked to null (no layer). */
  locked?: Partial<Record<BuilderRow, string | null>>;
  /** Accessories to carry over; the recommender doesn't pick them. */
  accessories?: readonly string[];
  /** Combo key to avoid (the current outfit, when shuffling). */
  avoid?: string | null;
  /**
   * Choose randomly among the top few outfits instead of always the best,
   * so shuffling gives variety. Only outfits within `spread` points of the
   * best are eligible.
   */
  variety?: { top: number; spread: number };
  random?: () => number;
};

/** Identifies an outfit by its main pieces (accessories aside). */
export function comboKey(s: Pick<Selection, "outerwear" | "core" | "bottom" | "shoes">): string {
  return [s.outerwear, s.core, s.bottom, s.shoes].map((id) => id ?? "-").join("|");
}

function piecesOf(selection: Selection, byId: Map<string, Piece>): Piece[] {
  const ids = [selection.outerwear, selection.core, selection.bottom, selection.shoes, ...selection.accessories];
  return ids.map((id) => (id ? byId.get(id) : undefined)).filter((p): p is Piece => !!p);
}

/** Scores a builder selection (the bottom is ignored under a dress). */
export function scoreSelection(selection: Selection, pieces: readonly Piece[], ctx: ScoreContext): OutfitScore | null {
  const byId = new Map(pieces.map((p) => [p.id, p]));
  const dress = selection.core !== null && byId.get(selection.core)?.category === "dress";
  const chosen = piecesOf(dress ? { ...selection, bottom: null } : selection, byId);
  return chosen.length ? scoreOutfit(chosen, ctx) : null;
}

/** The best few pieces for a row, judged on their own (formality, warmth, recency, season). */
function pool(pieces: readonly Piece[], categories: readonly Category[], ctx: ScoreContext, size: number): Piece[] {
  return pieces
    .filter((p) => categories.includes(p.category))
    .map((p) => ({ p, s: scoreOutfit([p], ctx).score }))
    .sort((a, b) => b.s - a.s)
    .slice(0, size)
    .map(({ p }) => p);
}

/** Suggests an outfit from clean, finished pieces. Null when the closet can't make one. */
export function suggestOutfit(pieces: readonly Piece[], ctx: ScoreContext, options: SuggestOptions = {}): Suggestion | null {
  const { locked = {}, accessories = [], avoid = null, variety, random = Math.random } = options;
  const byId = new Map(pieces.map((p) => [p.id, p]));
  const accessoryPieces = accessories.map((id) => byId.get(id)).filter((p): p is Piece => !!p);

  const lockedPiece = (row: BuilderRow): Piece | null | undefined => {
    if (!(row in locked)) return undefined;
    const id = locked[row];
    return id ? (byId.get(id) ?? null) : null;
  };

  const rowPool = (row: BuilderRow, categories: readonly Category[], size: number): Array<Piece | null> => {
    const fixed = lockedPiece(row);
    return fixed !== undefined ? [fixed] : pool(pieces, categories, ctx, size);
  };

  const bottoms = rowPool("bottom", ["bottom"], POOL_SIZE).filter((p): p is Piece => !!p);
  // Tops and dresses are pooled separately so one can't crowd out the other.
  // Tops need a bottom; a locked bottom means the user wants it, so no dresses.
  const coreFixed = lockedPiece("core");
  const cores: Piece[] =
    coreFixed !== undefined
      ? coreFixed
        ? [coreFixed]
        : []
      : [
          ...(bottoms.length ? pool(pieces, ["top"], ctx, POOL_SIZE) : []),
          ...(locked.bottom ? [] : pool(pieces, ["dress"], ctx, POOL_SIZE)),
        ];
  const shoes = rowPool("shoes", ["shoes"], POOL_SIZE).filter((p): p is Piece => !!p);
  const outerFixed = lockedPiece("outerwear");
  const outers: Array<Piece | null> = outerFixed !== undefined ? [outerFixed] : [null, ...pool(pieces, ["outerwear"], ctx, OUTERWEAR_POOL_SIZE)];

  const ranked: Suggestion[] = [];
  for (const core of cores) {
    const bottomChoices: Array<Piece | null> = core.category === "dress" ? [null] : bottoms;
    for (const bottom of bottomChoices) {
      for (const shoe of shoes) {
        for (const outer of outers) {
          const selection: Selection = {
            outerwear: outer?.id ?? null,
            core: core.id,
            bottom: bottom?.id ?? null,
            shoes: shoe.id,
            accessories: accessoryPieces.map((p) => p.id),
          };
          const chosen = [outer, core, bottom, shoe, ...accessoryPieces].filter((p): p is Piece => !!p);
          ranked.push({ selection, score: scoreOutfit(chosen, ctx) });
        }
      }
    }
  }
  if (ranked.length === 0) return null;

  ranked.sort((a, b) => b.score.score - a.score.score);
  const fresh = ranked.filter((r) => comboKey(r.selection) !== avoid);
  const options_ = fresh.length ? fresh : ranked;
  if (!variety) return options_[0];

  const best = options_[0].score.score;
  const eligible = options_.slice(0, variety.top).filter((r) => r.score.score >= best - variety.spread);
  return eligible[Math.floor(random() * eligible.length)] ?? options_[0];
}

export type Readiness = {
  ready: boolean;
  /** Categories still missing. */
  missing: number;
  rows: Array<{ key: "core" | "bottom" | "shoes"; label: string; have: number; need: number }>;
};

/** Whether the closet can make an outfit: a top and a bottom (or a dress), plus shoes. */
export function closetReadiness(pieces: readonly Piece[]): Readiness {
  const n = (c: Category) => pieces.filter((p) => p.category === c).length;
  const dresses = n("dress");
  const rows: Readiness["rows"] = [
    { key: "core", label: "Tops or dresses", have: n("top") + dresses, need: 1 },
    { key: "bottom", label: "Bottoms", have: n("bottom"), need: dresses > 0 ? 0 : 1 },
    { key: "shoes", label: "Shoes", have: n("shoes"), need: 1 },
  ];
  const missing = rows.filter((r) => r.have < r.need).length;
  return { ready: missing === 0, missing, rows };
}
