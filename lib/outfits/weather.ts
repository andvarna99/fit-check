import type { WeatherSnapshot } from "@/lib/db/schema";

const toF = (c: number) => Math.round((c * 9) / 5 + 32);

/** "64° partly cloudy" (Fahrenheit, as in the mockups). */
export function weatherLine(w: WeatherSnapshot): string {
  return `${toF(w.tempC)}° ${w.condition.toLowerCase()}`;
}

export function weatherTemp(w: WeatherSnapshot): string {
  return `${toF(w.tempC)}°`;
}

/** "H 61° · L 49°", or null without a range. */
export function weatherRange(w: WeatherSnapshot): string | null {
  if (w.highC === undefined || w.lowC === undefined) return null;
  return `H ${toF(w.highC)}° · L ${toF(w.lowC)}°`;
}
