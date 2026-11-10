"use client";

import type { WeatherSnapshot } from "@/lib/db/schema";
import { weatherLine, weatherRange, weatherTemp } from "@/lib/outfits/weather";
import { useTempUnit } from "@/lib/weather/prefs";

/** Temperatures in the unit chosen in Settings (a per-device preference). */
export function WeatherText({ weather, format }: { weather: WeatherSnapshot; format: "line" | "temp" | "range" }) {
  const [unit] = useTempUnit();
  if (format === "line") return weatherLine(weather, unit);
  if (format === "temp") return weatherTemp(weather, unit);
  return weatherRange(weather, unit);
}
