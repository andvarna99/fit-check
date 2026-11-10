import { z } from "zod";

import { OCCASIONS } from "@/lib/closet/constants";

import { MAX_ACCESSORIES } from "./slots";

export const MAX_OUTFIT_NAME = 60;

export const outfitInputSchema = z.object({
  name: z
    .string()
    .trim()
    .max(MAX_OUTFIT_NAME, `Keep the name under ${MAX_OUTFIT_NAME} characters.`)
    .transform((s) => s.replace(/\s+/g, " ") || null),
  occasion: z.enum(OCCASIONS).nullable(),
  // Outerwear, top or dress, bottom, shoes, plus accessories.
  itemIds: z
    .array(z.uuid())
    .max(4 + MAX_ACCESSORIES)
    .transform((ids) => [...new Set(ids)]),
});

export type OutfitInput = z.input<typeof outfitInputSchema>;

export const ratingSchema = z.number().int().min(1).max(5).nullable();

/** Weather sent by the device with a wear log; checked because it's stored as-is. */
export const weatherSnapshotSchema = z
  .object({
    tempC: z.number().min(-90).max(60),
    highC: z.number().min(-90).max(60).optional(),
    lowC: z.number().min(-90).max(60).optional(),
    condition: z.string().trim().min(1).max(40),
    wet: z.boolean().optional(),
  })
  .strip();
