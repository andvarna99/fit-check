// Weather and city search from Open-Meteo (free, no API key). Called from the
// browser, so the device's location goes straight to Open-Meteo, never to our server.

import type { WeatherSnapshot } from "@/lib/db/schema";

const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";
const GEOCODE_URL = "https://geocoding-api.open-meteo.com/v1/search";

/** WMO weather code → short condition. https://open-meteo.com/en/docs */
export function conditionFor(code: number): { condition: string; wet: boolean } {
  if (code === 0) return { condition: "Clear", wet: false };
  if (code === 1) return { condition: "Mostly clear", wet: false };
  if (code === 2) return { condition: "Partly cloudy", wet: false };
  if (code === 3) return { condition: "Cloudy", wet: false };
  if (code === 45 || code === 48) return { condition: "Foggy", wet: false };
  if (code >= 51 && code <= 57) return { condition: "Drizzle", wet: true };
  if (code >= 61 && code <= 67) return { condition: "Rain", wet: true };
  if (code >= 71 && code <= 77) return { condition: "Snow", wet: true };
  if (code >= 80 && code <= 82) return { condition: "Showers", wet: true };
  if (code === 85 || code === 86) return { condition: "Snow showers", wet: true };
  if (code >= 95) return { condition: "Thunderstorms", wet: true };
  return { condition: "Cloudy", wet: false };
}

/** Rain is likely enough to plan for. */
const WET_CHANCE = 50;

type ForecastResponse = {
  current?: { temperature_2m?: number; weather_code?: number };
  daily?: { temperature_2m_max?: number[]; temperature_2m_min?: number[]; precipitation_probability_max?: Array<number | null> };
};

export function snapshotFromForecast(data: ForecastResponse): WeatherSnapshot | null {
  const temp = data.current?.temperature_2m;
  const code = data.current?.weather_code;
  if (typeof temp !== "number" || typeof code !== "number") return null;
  const { condition, wet } = conditionFor(code);
  const high = data.daily?.temperature_2m_max?.[0];
  const low = data.daily?.temperature_2m_min?.[0];
  const chance = data.daily?.precipitation_probability_max?.[0];
  return {
    tempC: Math.round(temp * 10) / 10,
    ...(typeof high === "number" && typeof low === "number" ? { highC: high, lowC: low } : {}),
    condition,
    wet: wet || (typeof chance === "number" && chance >= WET_CHANCE),
  };
}

/** Coordinates are rounded to about 1 km: plenty for weather, and less precise to share. */
const round = (n: number) => Math.round(n * 100) / 100;

export async function fetchWeather(latitude: number, longitude: number, signal?: AbortSignal): Promise<WeatherSnapshot> {
  const params = new URLSearchParams({
    latitude: String(round(latitude)),
    longitude: String(round(longitude)),
    current: "temperature_2m,weather_code",
    daily: "temperature_2m_max,temperature_2m_min,precipitation_probability_max",
    timezone: "auto",
    forecast_days: "1",
  });
  const res = await fetch(`${FORECAST_URL}?${params}`, { signal });
  if (!res.ok) throw new Error(`Weather request failed (${res.status})`);
  const snapshot = snapshotFromForecast(await res.json());
  if (!snapshot) throw new Error("Weather response was incomplete");
  return snapshot;
}

export type City = { name: string; region: string | null; latitude: number; longitude: number };

type GeocodeResponse = {
  results?: Array<{ name: string; admin1?: string; country?: string; latitude: number; longitude: number }>;
};

export function cityLabel(city: City): string {
  return city.region ? `${city.name}, ${city.region}` : city.name;
}

export async function searchCities(query: string, signal?: AbortSignal): Promise<City[]> {
  const params = new URLSearchParams({ name: query.trim(), count: "6", language: "en", format: "json" });
  const res = await fetch(`${GEOCODE_URL}?${params}`, { signal });
  if (!res.ok) throw new Error(`City search failed (${res.status})`);
  const data = (await res.json()) as GeocodeResponse;
  return (data.results ?? []).map((r) => ({
    name: r.name,
    region: [r.admin1, r.country].filter(Boolean).join(", ") || null,
    latitude: r.latitude,
    longitude: r.longitude,
  }));
}
