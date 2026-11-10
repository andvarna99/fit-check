"use client";

// Today's weather, shared by every screen that needs it (Today, Wear today),
// fetched at most every 30 minutes per location.

import { useEffect, useSyncExternalStore } from "react";

import type { WeatherSnapshot } from "@/lib/db/schema";

import { fetchWeather } from "./open-meteo";
import { readWeatherLocation, type WeatherLocation } from "./prefs";

export type WeatherState =
  | { status: "loading" }
  | { status: "ready"; weather: WeatherSnapshot; latitude: number }
  /** "location": no permission or no fix. "network": Open-Meteo didn't answer. */
  | { status: "unavailable"; reason: "location" | "network" };

const MAX_AGE_MS = 30 * 60 * 1000;
const TIMEOUT_MS = 12_000;
const CACHE_KEY = "fc-weather";

let state: WeatherState = { status: "loading" };
let fetchedAt = 0;
let fetchedFor: string | null = null;
let inFlight: Promise<void> | null = null;
const listeners = new Set<() => void>();

function set(next: WeatherState) {
  state = next;
  listeners.forEach((l) => l());
}

function locationKey(location: WeatherLocation): string {
  return location.mode === "city" ? `city:${location.city.latitude},${location.city.longitude}` : "device";
}

type Cached = { at: number; key: string; weather: WeatherSnapshot; latitude: number };

function readCache(key: string): Cached | null {
  try {
    const cached = JSON.parse(sessionStorage.getItem(CACHE_KEY) ?? "null") as Cached | null;
    return cached && cached.key === key && Date.now() - cached.at < MAX_AGE_MS ? cached : null;
  } catch {
    return null;
  }
}

function writeCache(cached: Cached) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(cached));
  } catch {
    // Not critical.
  }
}

function devicePosition(): Promise<{ latitude: number; longitude: number }> {
  return new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) return reject(new Error("no geolocation"));
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      reject,
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: MAX_AGE_MS },
    );
  });
}

async function load(force: boolean): Promise<void> {
  const location = readWeatherLocation();
  const key = locationKey(location);
  if (!force && state.status === "ready" && fetchedFor === key && Date.now() - fetchedAt < MAX_AGE_MS) return;

  const cached = force ? null : readCache(key);
  if (cached) {
    fetchedAt = cached.at;
    fetchedFor = key;
    set({ status: "ready", weather: cached.weather, latitude: cached.latitude });
    return;
  }

  set({ status: "loading" });
  let coords: { latitude: number; longitude: number };
  try {
    coords = location.mode === "city" ? location.city : await devicePosition();
  } catch {
    set({ status: "unavailable", reason: "location" });
    return;
  }
  try {
    const weather = await fetchWeather(coords.latitude, coords.longitude, AbortSignal.timeout(TIMEOUT_MS));
    fetchedAt = Date.now();
    fetchedFor = key;
    writeCache({ at: fetchedAt, key, weather, latitude: coords.latitude });
    set({ status: "ready", weather, latitude: coords.latitude });
  } catch {
    set({ status: "unavailable", reason: "network" });
  }
}

/** Loads the weather unless it's fresh. `force` skips the cache (Retry, or after changing location). */
export function loadWeather(force = false): Promise<void> {
  inFlight ??= load(force).finally(() => (inFlight = null));
  return inFlight;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const SERVER_STATE: WeatherState = { status: "loading" };

/** Current weather; loads on mount and refreshes when the app comes back after a while. */
export function useWeather(): WeatherState {
  useEffect(() => {
    void loadWeather();
    const onVisible = () => {
      if (document.visibilityState === "visible") void loadWeather();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, []);
  return useSyncExternalStore(subscribe, () => state, () => SERVER_STATE);
}

/** The weather if it's already loaded (e.g. by Today), without asking for location. */
export function useLoadedWeather(): WeatherSnapshot | null {
  const current = useSyncExternalStore(subscribe, () => state, () => SERVER_STATE);
  return current.status === "ready" ? current.weather : null;
}
