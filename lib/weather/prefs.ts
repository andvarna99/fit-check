"use client";

// Weather settings are per device (localStorage): which unit to show and where
// to get the weather for. They never leave the phone.

import { useCallback, useMemo } from "react";

import { TEMP_UNITS, type TempUnit } from "@/lib/outfits/weather";
import { readStored, useStoredPreference, useStoredString, writeStored } from "@/lib/ui/use-stored-preference";

import type { City } from "./open-meteo";

const UNIT_KEY = "fc-temp-unit";
const LOCATION_KEY = "fc-weather-location";

export function useTempUnit(): [TempUnit, (unit: TempUnit) => void] {
  return useStoredPreference(UNIT_KEY, TEMP_UNITS, "F");
}

/** Use the phone's location, or a city chosen in Settings. */
export type WeatherLocation = { mode: "device" } | { mode: "city"; city: City };

const DEVICE: WeatherLocation = { mode: "device" };

export function parseLocation(raw: string | null): WeatherLocation {
  if (!raw) return DEVICE;
  try {
    const city = JSON.parse(raw) as Partial<City>;
    if (typeof city.name === "string" && typeof city.latitude === "number" && typeof city.longitude === "number") {
      return { mode: "city", city: { name: city.name, region: city.region ?? null, latitude: city.latitude, longitude: city.longitude } };
    }
  } catch {
    // Fall through to the default.
  }
  return DEVICE;
}

export function readWeatherLocation(): WeatherLocation {
  return parseLocation(readStored(LOCATION_KEY));
}

export function useWeatherLocation(): [WeatherLocation, (location: WeatherLocation) => void] {
  const raw = useStoredString(LOCATION_KEY);
  const location = useMemo(() => parseLocation(raw), [raw]);
  const setLocation = useCallback((next: WeatherLocation) => {
    writeStored(LOCATION_KEY, next.mode === "city" ? JSON.stringify(next.city) : null);
  }, []);
  return [location, setLocation];
}
