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

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null; // storage blocked (private mode, previews)
  }
}

/**
 * A small per-device preference (e.g. grid density) kept in localStorage.
 * Renders `fallback` on the server and until storage is readable, so it never
 * causes a hydration mismatch, and the page works when storage is unavailable.
 */
export function useStoredPreference<T extends string>(key: string, allowed: readonly T[], fallback: T): [T, (value: T) => void] {
  const raw = useSyncExternalStore(subscribe, () => read(key), () => null);
  const value = raw !== null && (allowed as readonly string[]).includes(raw) ? (raw as T) : fallback;

  const setValue = useCallback(
    (next: T) => {
      try {
        localStorage.setItem(key, next);
      } catch {
        // Not critical.
      }
      listeners.forEach((l) => l());
    },
    [key],
  );

  return [value, setValue];
}
