"use client";

import { useSyncExternalStore } from "react";

import { localIsoDate } from "@/lib/outfits/dates";

const subscribe = () => () => {};

/** The device's calendar date ("2026-11-09"); null while rendering on the server. */
export function useLocalToday(): string | null {
  return useSyncExternalStore(subscribe, localIsoDate, () => null);
}
