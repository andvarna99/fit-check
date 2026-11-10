import type { ClosetItem } from "@/lib/closet/queries";

import type { Piece } from "./types";

/** Closet items as recommender pieces. Items without a category are skipped. */
export function piecesFromCloset(items: readonly ClosetItem[], lastWorn: Readonly<Record<string, string>> = {}): Piece[] {
  return items.flatMap((item) =>
    item.category
      ? [
          {
            id: item.id,
            category: item.category,
            colors: item.colors,
            pattern: item.pattern,
            formality: item.formality,
            warmth: item.warmth,
            seasons: item.seasons,
            lastWornOn: lastWorn[item.id] ?? null,
          },
        ]
      : [],
  );
}
