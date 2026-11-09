import { describe, expect, it } from "vitest";

import {
  groupByHistoryLabel,
  historyGroupLabel,
  isPlausibleToday,
  localIsoDate,
  wearDayLabel,
  wearDayTitle,
} from "@/lib/outfits/dates";
import { outfitInputSchema } from "@/lib/outfits/input";
import {
  checkOutfitPieces,
  defaultSelection,
  EMPTY_SELECTION,
  selectedIds,
  selectionFromPieces,
  shuffleSelection,
  type BuilderRow,
  type Category,
} from "@/lib/outfits/slots";

const ids = {
  jacket: "jacket",
  tee: "tee",
  dress: "dress",
  jeans: "jeans",
  boots: "boots",
  bag: "bag",
};
const category: Record<string, Category> = {
  jacket: "outerwear",
  tee: "top",
  dress: "dress",
  jeans: "bottom",
  boots: "shoes",
  bag: "accessory",
};
const categoryOf = (id: string) => category[id];

describe("selectedIds", () => {
  it("lists the chosen pieces in slot order", () => {
    const sel = { outerwear: ids.jacket, core: ids.tee, bottom: ids.jeans, shoes: ids.boots, accessories: [ids.bag] };
    expect(selectedIds(sel, categoryOf)).toEqual(["jacket", "tee", "jeans", "boots", "bag"]);
  });

  it("drops the bottom while a dress is chosen", () => {
    const sel = { ...EMPTY_SELECTION, core: ids.dress, bottom: ids.jeans, shoes: ids.boots };
    expect(selectedIds(sel, categoryOf)).toEqual(["dress", "boots"]);
  });
});

describe("selectionFromPieces", () => {
  it("puts tops and dresses in the core row and collects accessories", () => {
    const pieces = ["jacket", "dress", "boots", "bag"].map((id) => ({ id, category: category[id] }));
    expect(selectionFromPieces(pieces)).toEqual({
      outerwear: "jacket",
      core: "dress",
      bottom: null,
      shoes: "boots",
      accessories: ["bag"],
    });
  });
});

describe("defaultSelection", () => {
  it("prefers a top over a newer dress, and leaves optional rows empty", () => {
    const pieces = ["dress", "jacket", "tee", "jeans", "boots", "bag"].map((id) => ({ id, category: category[id] }));
    expect(defaultSelection(pieces)).toEqual({ outerwear: null, core: "tee", bottom: "jeans", shoes: "boots", accessories: [] });
  });

  it("falls back to a dress when there are no tops", () => {
    expect(defaultSelection([{ id: "dress", category: "dress" }]).core).toBe("dress");
  });
});

describe("checkOutfitPieces", () => {
  const piece = (id: string, c: Category) => ({ id, category: c });

  it("accepts a normal outfit", () => {
    expect(checkOutfitPieces([piece("a", "top"), piece("b", "bottom"), piece("c", "shoes"), piece("d", "accessory"), piece("e", "accessory")])).toEqual({ ok: true });
  });

  it("rejects empty outfits, duplicate slots and a dress with a top", () => {
    expect(checkOutfitPieces([]).ok).toBe(false);
    expect(checkOutfitPieces([piece("a", "shoes"), piece("b", "shoes")]).ok).toBe(false);
    expect(checkOutfitPieces([piece("a", "dress"), piece("b", "top")]).ok).toBe(false);
    expect(checkOutfitPieces([piece("a", "dress"), piece("b", "bottom")]).ok).toBe(false);
  });

  it("caps accessories", () => {
    const many = Array.from({ length: 7 }, (_, i) => piece(`x${i}`, "accessory"));
    expect(checkOutfitPieces(many).ok).toBe(false);
  });
});

describe("shuffleSelection", () => {
  const options: Record<BuilderRow, string[]> = {
    outerwear: ["j1", "j2"],
    core: ["t1", "t2", "t3"],
    bottom: ["b1", "b2"],
    shoes: ["s1"],
  };
  const start = { outerwear: null, core: "t1", bottom: "b1", shoes: "s1", accessories: ["bag"] };

  it("changes unlocked rows to a different item, and keeps locked rows", () => {
    const next = shuffleSelection(start, options, new Set<BuilderRow>(["bottom"]), () => 0);
    expect(next.core).toBe("t2");
    expect(next.bottom).toBe("b1");
    expect(next.shoes).toBe("s1"); // only one choice
    expect(next.accessories).toEqual(["bag"]);
  });

  it("leaves an empty optional row empty", () => {
    expect(shuffleSelection(start, options, new Set(), () => 0.99).outerwear).toBeNull();
  });
});

describe("outfit input", () => {
  it("normalizes the name and removes duplicate items", () => {
    const id = "0f8fad5b-d9cb-469f-a165-70867728950e";
    expect(outfitInputSchema.parse({ name: "  Brunch   uniform ", occasion: "casual", itemIds: [id, id] })).toEqual({
      name: "Brunch uniform",
      occasion: "casual",
      itemIds: [id],
    });
    expect(outfitInputSchema.parse({ name: "   ", occasion: null, itemIds: [] }).name).toBeNull();
    expect(outfitInputSchema.safeParse({ name: "", occasion: "party", itemIds: [] }).success).toBe(false);
  });
});

describe("wear dates", () => {
  it("formats the local date", () => {
    expect(localIsoDate(new Date(2026, 10, 9, 23, 30))).toBe("2026-11-09");
  });

  it("accepts a device date within a day of the server's UTC date", () => {
    const now = new Date("2026-11-09T03:00:00Z");
    expect(isPlausibleToday("2026-11-08", now)).toBe(true);
    expect(isPlausibleToday("2026-11-10", now)).toBe(true);
    expect(isPlausibleToday("2026-11-11", now)).toBe(false);
    expect(isPlausibleToday("2026-02-30", now)).toBe(false);
  });

  it("labels days and history groups (weeks start Monday)", () => {
    const today = "2026-11-09"; // Monday
    expect(wearDayLabel("2026-11-09", today)).toBe("Today · Mon, Nov 9");
    expect(wearDayLabel("2026-11-08", today)).toBe("Yesterday · Sun, Nov 8");
    expect(wearDayTitle("2026-11-07")).toBe("Saturday, Nov 7");
    expect(historyGroupLabel("2026-11-09", today)).toBe("This week");
    expect(historyGroupLabel("2026-11-08", today)).toBe("Last week");
    expect(historyGroupLabel("2026-11-02", today)).toBe("Last week");
    expect(historyGroupLabel("2026-10-30", today)).toBe("October");
    expect(historyGroupLabel("2025-12-30", today)).toBe("December 2025");
  });

  it("groups consecutive entries under one heading", () => {
    const entries = ["2026-11-09", "2026-11-05", "2026-11-03", "2026-10-20"].map((wornOn) => ({ wornOn }));
    const groups = groupByHistoryLabel(entries, "2026-11-10");
    expect(groups.map((g) => [g.label, g.entries.length])).toEqual([
      ["This week", 1],
      ["Last week", 2],
      ["October", 1],
    ]);
  });
});
