import { z } from "zod";

import { normalizeTags } from "./item-input";
import { CATEGORIES, COLOR_NAMES, SEASONS, type Category, type Season } from "./options";

/** The fields bulk tagging works with (Review, One-by-one, Quick-tag). */
export type TagValues = {
  category: Category | null;
  colors: string[];
  seasons: Season[];
  formality: number | null;
  warmth: number | null;
};

/**
 * Quick-tag changes for many items at once. Only fields the user touched are
 * present: colors and tags are added to each item; everything else is set.
 */
export type QuickTagPatch = {
  category?: Category;
  addColors?: string[];
  seasons?: Season[];
  formality?: number;
  warmth?: number;
  addTags?: string[];
};

const scale = z.number().int().min(1).max(5);

export const quickTagPatchSchema = z
  .object({
    category: z.enum(CATEGORIES).optional(),
    addColors: z.array(z.enum(COLOR_NAMES as [string, ...string[]])).max(14).optional(),
    seasons: z.array(z.enum(SEASONS)).max(4).optional(),
    formality: scale.optional(),
    warmth: scale.optional(),
    addTags: z.array(z.string()).max(20).optional().transform((t) => (t ? normalizeTags(t) : undefined)),
  })
  .strict();

export const tagValuesSchema = z
  .object({
    category: z.enum(CATEGORIES).nullable(),
    colors: z.array(z.enum(COLOR_NAMES as [string, ...string[]])).max(14),
    seasons: z.array(z.enum(SEASONS)).max(4),
    formality: scale.nullable(),
    warmth: scale.nullable(),
  })
  .strict();

export const itemIdsSchema = z.array(z.string().uuid()).min(1).max(100);

export function isPatchEmpty(patch: QuickTagPatch): boolean {
  return (
    patch.category === undefined &&
    !patch.addColors?.length &&
    patch.seasons === undefined &&
    patch.formality === undefined &&
    patch.warmth === undefined &&
    !patch.addTags?.length
  );
}

/** Applies a quick-tag patch to one item's values (tags are handled separately). */
export function applyQuickTag(values: TagValues, patch: QuickTagPatch): TagValues {
  return {
    category: patch.category ?? values.category,
    colors: patch.addColors?.length ? [...new Set([...values.colors, ...patch.addColors])] : values.colors,
    seasons: patch.seasons ?? values.seasons,
    formality: patch.formality ?? values.formality,
    warmth: patch.warmth ?? values.warmth,
  };
}

/** An item counts as tagged (ready for the closet) once it has a category. */
export function isTagged(values: Pick<TagValues, "category">): boolean {
  return values.category !== null;
}
