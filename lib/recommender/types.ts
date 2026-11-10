// Inputs to the outfit recommender. Pure data, no database or UI types.

import type { SEASONS } from "@/lib/closet/constants";
import type { Category, Occasion } from "@/lib/outfits/slots";

export type Season = (typeof SEASONS)[number];

/** One clothing item as the recommender sees it. */
export type Piece = {
  id: string;
  category: Category;
  colors: readonly string[];
  pattern: string | null;
  /** 1 (very casual) to 5 (very formal), or null when not tagged. */
  formality: number | null;
  /** 1 (lightest) to 5 (warmest), or null when not tagged. */
  warmth: number | null;
  seasons: readonly Season[];
  /** ISO date of the last wear, or null if never worn. */
  lastWornOn: string | null;
};

/** Today's weather, in Celsius. */
export type Conditions = {
  tempC: number;
  highC?: number;
  lowC?: number;
  /** Rain, snow or showers expected. */
  wet?: boolean;
};

export type ScoreContext = {
  occasion: Occasion | null;
  /** Null when weather is unavailable: the weather part is skipped. */
  weather: Conditions | null;
  /** Null to skip the season check. */
  season: Season | null;
  /** The device's ISO date. Null to skip recency (e.g. in the builder). */
  today: string | null;
};
