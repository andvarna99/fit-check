// Scores one outfit from 0 to 100 and explains the score in a short caption.

import type { Occasion } from "@/lib/outfits/slots";

import { colorScore } from "./colors";
import { weatherScore } from "./conditions";
import type { Piece, ScoreContext } from "./types";

/** Formality range (1–5) that suits each occasion. */
export const OCCASION_FORMALITY: Record<Occasion, readonly [number, number]> = {
  casual: [1, 2],
  smart_casual: [2, 4],
  formal: [4, 5],
};

/** How much each part counts. Parts that can't be scored are left out and the rest re-weighted. */
export const WEIGHTS = { color: 0.35, weather: 0.25, formality: 0.25, recency: 0.15 } as const;

type Part = { value: number; note: string | null; problem: string | null };

export function formalityScore(pieces: readonly Piece[], occasion: Occasion | null): Part {
  const levels = pieces.filter((p) => p.category !== "accessory" && p.formality !== null).map((p) => p.formality as number);
  if (levels.length === 0) return { value: 0.75, note: null, problem: null };

  let value = 1;
  let note: string | null = null;
  let problem: string | null = null;

  if (occasion) {
    const [lo, hi] = OCCASION_FORMALITY[occasion];
    const misses = levels.map((f) => (f < lo ? lo - f : f > hi ? -(f - hi) : 0));
    const avgMiss = misses.reduce((s, m) => s + Math.abs(m), 0) / levels.length;
    value -= avgMiss * 0.35;
    const under = misses.filter((m) => m > 0).length;
    const over = misses.filter((m) => m < 0).length;
    if (avgMiss >= 0.5) problem = under >= over ? "too casual for the occasion" : "too dressy for the occasion";
    else note = "right for the occasion";
  }

  // Sneakers with a ball gown: pieces far apart in formality look accidental.
  const spread = Math.max(...levels) - Math.min(...levels);
  if (spread > 2) {
    value -= (spread - 2) * 0.25;
    problem ??= "mixes dressy and casual";
  }

  value = Math.max(0, Math.min(1, value));
  return { value, note: problem ? null : note, problem };
}

/** Days between two ISO dates (b − a). */
function daysBetween(a: string, b: string): number {
  return Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86_400_000);
}

/** Prefer pieces that haven't been worn lately. A piece rests fully after two weeks. */
export function recencyScore(pieces: readonly Piece[], today: string): Part {
  const clothes = pieces.filter((p) => p.category !== "accessory");
  if (clothes.length === 0) return { value: 1, note: null, problem: null };
  const values = clothes.map((p) => {
    if (!p.lastWornOn) return 1;
    const days = daysBetween(p.lastWornOn, today);
    if (days <= 1) return 0;
    return Math.min(days, 14) / 14;
  });
  const value = values.reduce((s, v) => s + v, 0) / values.length;
  const wornLately = values.some((v) => v === 0);
  return {
    value,
    note: value >= 0.9 ? "fresh picks" : null,
    problem: wornLately ? "worn very recently" : null,
  };
}

export type OutfitScore = {
  /** 0–100. */
  score: number;
  parts: Partial<Record<keyof typeof WEIGHTS, number>>;
  /** Short caption, e.g. "Colors agree · warm enough". */
  caption: string;
  /**
   * False when no piece has the tags the score depends on (colors on two
   * pieces, formality, or warmth): the number is then only defaults.
   */
  judged: boolean;
};

function capitalize(s: string): string {
  return s ? s[0].toUpperCase() + s.slice(1) : s;
}

export function scoreOutfit(pieces: readonly Piece[], ctx: ScoreContext): OutfitScore {
  const parts: Partial<Record<keyof typeof WEIGHTS, Part>> = { color: colorScore(pieces) };
  if (ctx.weather) parts.weather = weatherScore(pieces, ctx.weather, ctx.season);
  parts.formality = formalityScore(pieces, ctx.occasion);
  if (ctx.today) parts.recency = recencyScore(pieces, ctx.today);

  let total = 0;
  let weight = 0;
  for (const [key, part] of Object.entries(parts) as Array<[keyof typeof WEIGHTS, Part]>) {
    total += part.value * WEIGHTS[key];
    weight += WEIGHTS[key];
  }
  const score = weight ? Math.round((total / weight) * 100) : 0;

  // Problems first (worst part first), then what's going well.
  // Ties keep the order of WEIGHTS (sort is stable).
  const list = Object.values(parts);
  const problems = [...list].sort((a, b) => a.value - b.value).map((p) => p.problem).filter((s): s is string => !!s);
  const notes = [...list].sort((a, b) => b.value - a.value).map((p) => p.note).filter((s): s is string => !!s);
  const caption = capitalize((problems.length ? problems : notes).slice(0, 2).join(" · "));

  return {
    score,
    parts: Object.fromEntries(Object.entries(parts).map(([k, p]) => [k, p.value])),
    caption,
    judged:
      pieces.filter((p) => p.colors.length > 0).length >= 2 ||
      pieces.some((p) => p.category !== "accessory" && (p.formality !== null || p.warmth !== null)),
  };
}
