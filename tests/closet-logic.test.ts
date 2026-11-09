import { describe, expect, it } from "vitest";

import { activeFilterCount, EMPTY_FILTERS, filterItems, type FilterableItem } from "@/lib/closet/filter";
import { costPerWearCents, formatDate, formatPrice, priceInputValue } from "@/lib/closet/format";
import {
  CATEGORY_REQUIRED_MESSAGE,
  fieldErrorsFrom,
  itemInputFromFormData,
  normalizeTags,
  parsePriceToCents,
} from "@/lib/closet/item-input";
import { sniffImageType } from "@/lib/images/sniff";

function form(entries: Array<[string, string]>): FormData {
  const fd = new FormData();
  for (const [k, v] of entries) fd.append(k, v);
  return fd;
}

describe("item input", () => {
  it("requires a category to save, but not for a draft", () => {
    const save = itemInputFromFormData(form([["intent", "save"], ["name", "Boots"]]));
    expect(save.success).toBe(false);
    if (!save.success) expect(fieldErrorsFrom(save.error).category).toBe(CATEGORY_REQUIRED_MESSAGE);

    const draft = itemInputFromFormData(form([["intent", "draft"], ["name", "Boots"]]));
    expect(draft.success).toBe(true);
    if (draft.success) {
      expect(draft.data.isDraft).toBe(true);
      expect(draft.data.category).toBeNull();
    }
  });

  it("parses a full item", () => {
    const result = itemInputFromFormData(
      form([
        ["intent", "save"],
        ["name", "  Pink cropped jacket "],
        ["category", "outerwear"],
        ["subcategory", "Jacket"],
        ["colors", "pink"],
        ["colors", "white"],
        ["colors", "pink"],
        ["pattern", "Solid"],
        ["seasons", "fall"],
        ["seasons", "winter"],
        ["formality", "2"],
        ["warmth", "4"],
        ["price", "$1,250.5"],
        ["purchasedOn", "2026-03-14"],
        ["tags", "Fuzzy"],
        ["tags", " going   out "],
        ["tags", "fuzzy"],
      ]),
    );
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data).toMatchObject({
      name: "Pink cropped jacket",
      category: "outerwear",
      colors: ["pink", "white"],
      seasons: ["fall", "winter"],
      formality: 2,
      warmth: 4,
      priceCents: 125050,
      purchasedOn: "2026-03-14",
      tags: ["fuzzy", "going out"],
      isDraft: false,
      brand: null,
      material: null,
    });
  });

  it("rejects unknown colors, out-of-range scales and bad prices", () => {
    expect(itemInputFromFormData(form([["intent", "draft"], ["colors", "chartreuse"]])).success).toBe(false);
    expect(itemInputFromFormData(form([["intent", "draft"], ["formality", "6"]])).success).toBe(false);
    const badPrice = itemInputFromFormData(form([["intent", "draft"], ["price", "12.345"]]));
    expect(badPrice.success).toBe(false);
    if (!badPrice.success) expect(fieldErrorsFrom(badPrice.error).price).toMatch(/price/i);
  });

  it("parses prices and tags", () => {
    expect(parsePriceToCents("")).toBeNull();
    expect(parsePriceToCents("50")).toBe(5000);
    expect(parsePriceToCents("49.99")).toBe(4999);
    expect(parsePriceToCents("-5")).toBe("invalid");
    expect(parsePriceToCents("abc")).toBe("invalid");
    expect(normalizeTags(["  A ", "a", "", "b  c"])).toEqual(["a", "b c"]);
  });
});

describe("closet filters", () => {
  const base: FilterableItem = {
    name: null, category: null, subcategory: null, colors: [], seasons: [], formality: null,
    warmth: null, status: "clean", brand: null, material: null, pattern: null, tags: [],
  };
  const jacket = { ...base, name: "Pink cropped jacket", category: "outerwear" as const, subcategory: "Jacket", colors: ["pink"], seasons: ["fall" as const, "winter" as const], formality: 2, warmth: 4, tags: ["fuzzy"] };
  const tee = { ...base, name: "Cream knit tee", category: "top" as const, subcategory: "Tee", colors: ["cream"], seasons: ["summer" as const], formality: 1, warmth: 1 };
  const jeans = { ...base, name: "Wide-leg jeans", category: "bottom" as const, colors: ["blue"], status: "laundry" as const };
  const items = [jacket, tee, jeans];

  it("returns everything with no filters", () => {
    expect(filterItems(items, EMPTY_FILTERS)).toHaveLength(3);
  });

  it("ORs within a group and ANDs across groups", () => {
    expect(filterItems(items, { ...EMPTY_FILTERS, colors: ["pink", "cream"] })).toEqual([jacket, tee]);
    expect(filterItems(items, { ...EMPTY_FILTERS, colors: ["pink", "cream"], seasons: ["summer"] })).toEqual([tee]);
  });

  it("excludes items without a value when a scale filter is set", () => {
    expect(filterItems(items, { ...EMPTY_FILTERS, formality: [1, 2] })).toEqual([jacket, tee]);
  });

  it("searches name, subcategory, category, colors and tags", () => {
    expect(filterItems(items, { ...EMPTY_FILTERS, query: "fuzzy" })).toEqual([jacket]);
    expect(filterItems(items, { ...EMPTY_FILTERS, query: "OUTERWEAR pink" })).toEqual([jacket]);
    expect(filterItems(items, { ...EMPTY_FILTERS, query: "velvet" })).toEqual([]);
  });

  it("filters by category and status", () => {
    expect(filterItems(items, { ...EMPTY_FILTERS, category: "top" })).toEqual([tee]);
    expect(filterItems(items, { ...EMPTY_FILTERS, statuses: ["laundry"] })).toEqual([jeans]);
  });

  it("counts active filter groups", () => {
    expect(activeFilterCount({ ...EMPTY_FILTERS, query: "x", category: "top" })).toBe(0);
    expect(activeFilterCount({ ...EMPTY_FILTERS, colors: ["pink", "blue"], seasons: ["fall"] })).toBe(2);
  });
});

describe("formatting", () => {
  it("formats prices and cost per wear", () => {
    expect(formatPrice(5000)).toBe("$50");
    expect(formatPrice(833)).toBe("$8.33");
    expect(priceInputValue(4999)).toBe("49.99");
    expect(priceInputValue(5000)).toBe("50");
    expect(costPerWearCents(5000, 6)).toBe(833);
    expect(costPerWearCents(5000, 0)).toBe(5000);
    expect(costPerWearCents(null, 3)).toBeNull();
  });

  it("formats date-only values without timezone drift", () => {
    expect(formatDate("2026-03-14")).toBe("Mar 14, 2026");
    expect(formatDate("2026-10-28", { year: false })).toBe("Oct 28");
  });
});

describe("sniffImageType", () => {
  it("detects JPEG, PNG and WebP by magic bytes", () => {
    expect(sniffImageType(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]))).toBe("image/jpeg");
    expect(sniffImageType(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))).toBe("image/png");
    expect(sniffImageType(new TextEncoder().encode("RIFF\0\0\0\0WEBPVP8 "))).toBe("image/webp");
  });

  it("rejects other content", () => {
    expect(sniffImageType(new TextEncoder().encode("<svg xmlns="))).toBeNull();
    expect(sniffImageType(new Uint8Array([]))).toBeNull();
  });
});
