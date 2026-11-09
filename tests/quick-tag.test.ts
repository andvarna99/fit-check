import { describe, expect, it } from "vitest";

import {
  applyQuickTag,
  isPatchEmpty,
  isTagged,
  itemIdsSchema,
  quickTagPatchSchema,
  tagValuesSchema,
  type TagValues,
} from "@/lib/closet/quick-tag";

const untouched: TagValues = { category: null, colors: ["black"], seasons: ["summer"], formality: 3, warmth: null };

describe("applyQuickTag", () => {
  it("changes only touched fields", () => {
    expect(applyQuickTag(untouched, { category: "shoes" })).toEqual({ ...untouched, category: "shoes" });
    expect(applyQuickTag(untouched, {})).toEqual(untouched);
  });

  it("adds colors without duplicates, and replaces seasons, formality and warmth", () => {
    expect(
      applyQuickTag(untouched, { addColors: ["brown", "black"], seasons: ["fall", "winter"], formality: 2, warmth: 3 }),
    ).toEqual({ category: null, colors: ["black", "brown"], seasons: ["fall", "winter"], formality: 2, warmth: 3 });
  });

  it("lets an explicit empty season list clear seasons", () => {
    expect(applyQuickTag(untouched, { seasons: [] }).seasons).toEqual([]);
  });
});

describe("quick-tag validation", () => {
  it("accepts a valid patch and normalizes tags", () => {
    const parsed = quickTagPatchSchema.parse({ category: "shoes", addTags: [" Boots ", "boots"] });
    expect(parsed).toEqual({ category: "shoes", addTags: ["boots"] });
  });

  it("rejects unknown fields and bad values", () => {
    expect(quickTagPatchSchema.safeParse({ name: "x" }).success).toBe(false);
    expect(quickTagPatchSchema.safeParse({ formality: 9 }).success).toBe(false);
    expect(quickTagPatchSchema.safeParse({ addColors: ["chartreuse"] }).success).toBe(false);
    expect(tagValuesSchema.safeParse({ ...untouched, category: "hat" }).success).toBe(false);
  });

  it("requires 1–100 item ids that are UUIDs", () => {
    expect(itemIdsSchema.safeParse([]).success).toBe(false);
    expect(itemIdsSchema.safeParse(["not-a-uuid"]).success).toBe(false);
    expect(itemIdsSchema.safeParse(["0f8fad5b-d9cb-469f-a165-70867728950e"]).success).toBe(true);
  });

  it("detects empty patches and tagged items", () => {
    expect(isPatchEmpty({})).toBe(true);
    expect(isPatchEmpty({ addColors: [], addTags: [] })).toBe(true);
    expect(isPatchEmpty({ seasons: [] })).toBe(false);
    expect(isTagged({ category: null })).toBe(false);
    expect(isTagged({ category: "top" })).toBe(true);
  });
});
