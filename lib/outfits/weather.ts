import type { WeatherSnapshot } from "@/lib/db/schema";

export type TempUnit = "F" | "C";
export const TEMP_UNITS: readonly TempUnit[] = ["F", "C"];

export function toUnit(c: number, unit: TempUnit): number {
  return Math.round(unit === "F" ? (c * 9) / 5 + 32 : c);
}

/** "64° partly cloudy". */
export function weatherLine(w: WeatherSnapshot, unit: TempUnit = "F"): string {
  return `${toUnit(w.tempC, unit)}° ${w.condition.toLowerCase()}`;
}

export function weatherTemp(w: WeatherSnapshot, unit: TempUnit = "F"): string {
  return `${toUnit(w.tempC, unit)}°`;
}

/** "H 61° · L 49°", or null without a range. */
export function weatherRange(w: WeatherSnapshot, unit: TempUnit = "F"): string | null {
  if (w.highC === undefined || w.lowC === undefined) return null;
  return `H ${toUnit(w.highC, unit)}° · L ${toUnit(w.lowC, unit)}°`;
}
