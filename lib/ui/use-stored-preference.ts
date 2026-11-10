"use client";

import { useCallback, useSyncExternalStore } from "react";

const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

/** Reads a stored string, or null when missing or storage is blocked (private mode, previews). */
export function readStored(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

/** Stores a string (null removes it) and notifies every hook reading it. */
export function writeStored(key: string, value: string | null): void {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    // Not critical.
  }
  listeners.forEach((l) => l());
}

/** The raw stored string; null on the server and until storage is readable. */
export function useStoredString(key: string): string | null {
  return useSyncExternalStore(subscribe, () => readStored(key), () => null);
}

/**
 * A small per-device preference (e.g. grid density) kept in localStorage.
 * Renders `fallback` on the server and until storage is readable, so it never
 * causes a hydration mismatch, and the page works when storage is unavailable.
 */
export function useStoredPreference<T extends string>(key: string, allowed: readonly T[], fallback: T): [T, (value: T) => void] {
  const raw = useStoredString(key);
  const value = raw !== null && (allowed as readonly string[]).includes(raw) ? (raw as T) : fallback;
  const setValue = useCallback((next: T) => writeStored(key, next), [key]);
  return [value, setValue];
}
