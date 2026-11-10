// Weather and season rules: how warm an outfit should be, and what to tell
// the user about layering.

import type { Conditions, Piece, Season } from "./types";

/** Warmth (1–5) an outfit should have at a temperature. */
export function targetWarmth(tempC: number): number {
  if (tempC >= 27) return 1;
  if (tempC >= 21) return 2;
  if (tempC >= 15) return 3;
  if (tempC >= 8) return 4;
  return 5;
}

/** Below this, an outfit without outerwear loses points. */
export const NEEDS_LAYER_BELOW_C = 14;
/** Above this, outerwear loses points. */
export const TOO_WARM_FOR_LAYER_C = 24;

/** Short layering advice for the weather card, e.g. "Light layer". */
export function layerAdvice(weather: Conditions): string {
  const t = weather.tempC;
  if (weather.wet && t >= 8) return "Rain layer";
  if (t >= 22) return "No layer needed";
  if (t >= 15) return "Light layer";
  if (t >= 8) return "Bring a jacket";
  return "Coat weather";
}

/** Meteorological season for a date; flipped south of the equator. */
export function seasonFor(isoDate: string, latitude: number | null = null): Season {
  const month = Number(isoDate.slice(5, 7));
  const north: Season = month <= 2 || month === 12 ? "winter" : month <= 5 ? "spring" : month <= 8 ? "summer" : "fall";
  if (latitude === null || latitude >= 0) return north;
  const flip: Record<Season, Season> = { winter: "summer", spring: "fall", summer: "winter", fall: "spring" };
  return flip[north];
}

export type WeatherResult = { value: number; note: string | null; problem: string | null };

/** Warmth of the outfit's clothes (not shoes or accessories), with outerwear adding on top. */
export function outfitWarmth(pieces: readonly Piece[]): number | null {
  const base = pieces.filter((p) => (p.category === "top" || p.category === "bottom" || p.category === "dress") && p.warmth !== null);
  const outer = pieces.find((p) => p.category === "outerwear" && p.warmth !== null);
  if (base.length === 0 && !outer) return null;
  const mean = base.length ? base.reduce((s, p) => s + (p.warmth ?? 0), 0) / base.length : 1;
  return mean + (outer ? (outer.warmth ?? 0) * 0.4 : 0);
}

/** 0–1 fit between the outfit and the weather (and season, when known). */
export function weatherScore(pieces: readonly Piece[], weather: Conditions, season: Season | null): WeatherResult {
  const target = targetWarmth(weather.tempC);
  const warmth = outfitWarmth(pieces);
  const hasOuter = pieces.some((p) => p.category === "outerwear");

  let value = 0.7;
  let note: string | null = null;
  let problem: string | null = null;

  if (warmth !== null) {
    const diff = warmth - target;
    value = Math.max(0, 1 - Math.abs(diff) / 3);
    if (diff <= -1.5) problem = "too light for today";
    else if (diff >= 1.5) problem = "too warm for today";
    else note = "warm enough";
  }

  if (!hasOuter && weather.tempC < NEEDS_LAYER_BELOW_C) {
    value -= 0.3;
    problem ??= "needs a layer";
  }
  if (hasOuter && weather.tempC > TOO_WARM_FOR_LAYER_C) {
    value -= 0.3;
    problem ??= "too warm for a layer";
  }

  if (season) {
    const off = pieces.filter((p) => p.seasons.length > 0 && !p.seasons.includes(season)).length;
    if (off > 0) {
      value -= Math.min(0.3, off * 0.1);
      if (off > 1) problem ??= `out of season for ${season}`;
    }
  }

  value = Math.max(0, Math.min(1, value));
  return { value, note: problem ? null : note, problem };
}
