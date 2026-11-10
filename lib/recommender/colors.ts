// Color harmony rules. Deliberately simple and easy to tune: neutrals go with
// everything, one accent color is ideal, and a few accent pairs are known to
// work well or badly together.

import type { Piece } from "./types";

/** Colors that go with anything. */
export const NEUTRALS: ReadonlySet<string> = new Set(["black", "white", "cream", "gray", "brown", "camel", "navy"]);

const pair = (a: string, b: string) => [a, b].sort().join("+");

/** Accent pairs that look intentional together. */
const HARMONY: ReadonlySet<string> = new Set([
  pair("pink", "lavender"),
  pair("pink", "green"),
  pair("pink", "blue"),
  pair("blue", "yellow"),
  pair("lavender", "yellow"),
  pair("green", "yellow"),
  pair("red", "blue"),
]);

/** Accent pairs that fight each other. */
const CLASH: ReadonlySet<string> = new Set([
  pair("red", "pink"),
  pair("red", "lavender"),
  pair("red", "green"),
  pair("red", "yellow"),
  pair("green", "lavender"),
]);

export type ColorResult = { value: number; note: string | null; problem: string | null };

/** Blue on a bottom is denim, which behaves like a neutral. */
function accentsOf(piece: Piece): string[] {
  return piece.colors.filter((c) => c !== "multi" && !NEUTRALS.has(c) && !(c === "blue" && piece.category === "bottom"));
}

function isPatterned(piece: Piece): boolean {
  return piece.pattern !== null && piece.pattern.toLowerCase() !== "solid";
}

/** 0–1 color harmony for a set of pieces. */
export function colorScore(pieces: readonly Piece[]): ColorResult {
  const tagged = pieces.filter((p) => p.colors.length > 0);
  if (tagged.length < 2) return { value: 0.75, note: null, problem: null };

  const accents = [...new Set(tagged.flatMap(accentsOf))];
  const busy = tagged.filter((p) => p.colors.includes("multi")).length;
  const patterned = tagged.filter(isPatterned).length;

  let value: number;
  let note: string | null = null;
  let problem: string | null = null;

  if (accents.length === 0) {
    value = 0.85;
    note = busy ? "one statement piece" : "easy neutrals";
  } else if (accents.length === 1) {
    value = 1;
    note = "colors agree";
  } else if (accents.length === 2) {
    const key = pair(accents[0], accents[1]);
    if (CLASH.has(key)) {
      value = 0.25;
      problem = `${accents[0]} and ${accents[1]} clash`;
    } else if (HARMONY.has(key)) {
      value = 0.9;
      note = `${accents[0]} and ${accents[1]} work`;
    } else {
      value = 0.6;
    }
  } else {
    value = 0.3;
    problem = "too many colors";
  }

  // A print plus more color, or two prints, gets loud.
  if (busy >= 2) {
    value -= 0.4;
    problem = "two busy prints";
  } else if (busy === 1 && accents.length > 0) {
    value -= 0.2;
    problem ??= "print fights the color";
  }
  if (patterned >= 2 && busy < 2) {
    value -= 0.25;
    problem ??= "patterns compete";
  }

  value = Math.max(0, Math.min(1, value));
  return { value, note: problem ? null : note, problem };
}
