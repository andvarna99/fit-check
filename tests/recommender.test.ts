import { describe, expect, it } from "vitest";

import { colorScore } from "@/lib/recommender/colors";
import { layerAdvice, seasonFor, targetWarmth, weatherScore } from "@/lib/recommender/conditions";
import { closetReadiness, comboKey, scoreSelection, suggestOutfit } from "@/lib/recommender/generate";
import { formalityScore, recencyScore, scoreOutfit } from "@/lib/recommender/score";
import type { Piece, ScoreContext } from "@/lib/recommender/types";

function piece(id: string, overrides: Partial<Piece> & Pick<Piece, "category">): Piece {
  return { id, colors: [], pattern: null, formality: null, warmth: null, seasons: [], lastWornOn: null, ...overrides };
}

const tee = piece("tee", { category: "top", colors: ["cream"], formality: 1, warmth: 1 });
const sweater = piece("sweater", { category: "top", colors: ["black"], formality: 2, warmth: 4 });
const pinkTee = piece("pink-tee", { category: "top", colors: ["pink"], formality: 1, warmth: 1 });
const jeans = piece("jeans", { category: "bottom", colors: ["blue"], formality: 1, warmth: 2 });
const redSkirt = piece("red-skirt", { category: "bottom", colors: ["red"], formality: 2, warmth: 1 });
const dress = piece("dress", { category: "dress", colors: ["lavender"], formality: 4, warmth: 1 });
const sneakers = piece("sneakers", { category: "shoes", colors: ["white"], formality: 1, warmth: null });
const heels = piece("heels", { category: "shoes", colors: ["black"], formality: 5, warmth: null });
const coat = piece("coat", { category: "outerwear", colors: ["camel"], formality: 3, warmth: 5 });

const noContext: ScoreContext = { occasion: null, weather: null, season: null, today: null };

describe("colorScore", () => {
  it("likes one accent with neutrals, and treats blue jeans as neutral", () => {
    const r = colorScore([pinkTee, jeans, sneakers]);
    expect(r.value).toBe(1);
    expect(r.note).toBe("colors agree");
  });

  it("flags clashing accents", () => {
    const r = colorScore([pinkTee, redSkirt]);
    expect(r.value).toBeLessThan(0.5);
    expect(r.problem).toBe("pink and red clash");
  });

  it("penalizes two busy prints", () => {
    const a = piece("a", { category: "top", colors: ["multi"] });
    const b = piece("b", { category: "bottom", colors: ["multi"] });
    expect(colorScore([a, b]).problem).toBe("two busy prints");
  });

  it("stays neutral with fewer than two tagged pieces", () => {
    expect(colorScore([tee]).value).toBe(0.75);
  });
});

describe("weather rules", () => {
  it("maps temperature to a warmth target", () => {
    expect(targetWarmth(30)).toBe(1);
    expect(targetWarmth(18)).toBe(3);
    expect(targetWarmth(2)).toBe(5);
  });

  it("gives layering advice", () => {
    expect(layerAdvice({ tempC: 25 })).toBe("No layer needed");
    expect(layerAdvice({ tempC: 17 })).toBe("Light layer");
    expect(layerAdvice({ tempC: 12, wet: true })).toBe("Rain layer");
    expect(layerAdvice({ tempC: 3 })).toBe("Coat weather");
  });

  it("knows the season, flipped in the southern hemisphere", () => {
    expect(seasonFor("2026-11-09")).toBe("fall");
    expect(seasonFor("2026-01-15", 40)).toBe("winter");
    expect(seasonFor("2026-01-15", -33)).toBe("summer");
  });

  it("prefers a coat and sweater in the cold, and a tee in the heat", () => {
    const cold = { tempC: 2 };
    const hot = { tempC: 30 };
    expect(weatherScore([sweater, jeans, coat], cold, null).value).toBeGreaterThan(weatherScore([tee, jeans], cold, null).value);
    expect(weatherScore([tee, jeans], cold, null).problem).toBe("too light for today");
    expect(weatherScore([tee, jeans], hot, null).value).toBeGreaterThan(weatherScore([sweater, jeans, coat], hot, null).value);
  });

  it("marks down pieces out of season", () => {
    const summerTee = { ...tee, seasons: ["summer"] as Piece["seasons"] };
    const mild = { tempC: 18 };
    expect(weatherScore([summerTee, jeans], mild, "winter").value).toBeLessThan(weatherScore([summerTee, jeans], mild, "summer").value);
  });
});

describe("formalityScore", () => {
  it("matches the occasion", () => {
    expect(formalityScore([tee, jeans, sneakers], "casual").note).toBe("right for the occasion");
    expect(formalityScore([tee, jeans, sneakers], "formal").problem).toBe("too casual for the occasion");
    expect(formalityScore([dress, heels], "casual").problem).toBe("too dressy for the occasion");
  });

  it("flags pieces far apart in formality", () => {
    expect(formalityScore([dress, sneakers, heels], null).problem).toBe("mixes dressy and casual");
  });
});

describe("recencyScore", () => {
  it("prefers pieces that have rested", () => {
    const today = "2026-11-10";
    const worn = { ...tee, lastWornOn: "2026-11-09" };
    expect(recencyScore([worn], today)).toMatchObject({ value: 0, problem: "worn very recently" });
    expect(recencyScore([tee], today).value).toBe(1);
    expect(recencyScore([{ ...tee, lastWornOn: "2026-11-03" }], today).value).toBeCloseTo(0.5);
  });
});

describe("scoreOutfit", () => {
  it("scores 0–100 and leaves out parts it can't judge", () => {
    const r = scoreOutfit([pinkTee, jeans, sneakers], { ...noContext, occasion: "casual" });
    expect(r.score).toBeGreaterThanOrEqual(90);
    expect(Object.keys(r.parts).sort()).toEqual(["color", "formality"]);
    expect(r.caption).toBe("Colors agree · right for the occasion");
  });

  it("says when there's nothing to judge", () => {
    const bare = [piece("a", { category: "top" }), piece("b", { category: "bottom" })];
    expect(scoreOutfit(bare, noContext).judged).toBe(false);
    expect(scoreOutfit([tee, jeans], noContext).judged).toBe(true);
  });

  it("leads the caption with problems", () => {
    const r = scoreOutfit([pinkTee, redSkirt, sneakers], { ...noContext, occasion: "casual" });
    expect(r.score).toBeLessThan(70);
    expect(r.caption).toBe("Pink and red clash");
    expect(scoreOutfit([pinkTee, redSkirt, heels], { ...noContext, occasion: "casual" }).caption).toBe("Too dressy for the occasion · pink and red clash");
  });
});

describe("suggestOutfit", () => {
  const closet = [tee, sweater, pinkTee, jeans, redSkirt, dress, sneakers, heels, coat];

  it("dresses for the cold", () => {
    const s = suggestOutfit(closet, { occasion: "casual", weather: { tempC: 2 }, season: "winter", today: "2026-11-10" });
    expect(s?.selection).toMatchObject({ core: "sweater", outerwear: "coat" });
  });

  it("skips outerwear in the heat and suits the occasion", () => {
    const s = suggestOutfit(closet, { occasion: "formal", weather: { tempC: 26 }, season: "summer", today: "2026-11-10" });
    expect(s?.selection).toMatchObject({ outerwear: null, core: "dress", bottom: null, shoes: "heels" });
  });

  it("keeps locked rows and avoids the current outfit", () => {
    const ctx: ScoreContext = { occasion: "casual", weather: null, season: null, today: null };
    const first = suggestOutfit(closet, ctx, { locked: { bottom: "jeans" } });
    expect(first?.selection.bottom).toBe("jeans");
    expect(first?.selection.core).not.toBe("dress");
    const next = suggestOutfit(closet, ctx, { locked: { bottom: "jeans" }, avoid: comboKey(first!.selection) });
    expect(next?.selection.bottom).toBe("jeans");
    expect(comboKey(next!.selection)).not.toBe(comboKey(first!.selection));
  });

  it("picks among the top few with variety", () => {
    const ctx: ScoreContext = { occasion: "casual", weather: null, season: null, today: null };
    const picks = new Set([0, 0.5, 0.99].map((r) => comboKey(suggestOutfit(closet, ctx, { variety: { top: 5, spread: 100 }, random: () => r })!.selection)));
    expect(picks.size).toBeGreaterThan(1);
  });

  it("returns null when the closet can't make an outfit", () => {
    expect(suggestOutfit([tee, jeans], noContext)).toBeNull();
  });

  it("uses a dress when there are no bottoms", () => {
    expect(suggestOutfit([tee, dress, sneakers], noContext)?.selection).toMatchObject({ core: "dress", bottom: null });
  });
});

describe("scoreSelection", () => {
  it("ignores the bottom under a dress", () => {
    const withBottom = scoreSelection({ outerwear: null, core: "dress", bottom: "red-skirt", shoes: "heels", accessories: [] }, [dress, redSkirt, heels], noContext);
    const without = scoreSelection({ outerwear: null, core: "dress", bottom: null, shoes: "heels", accessories: [] }, [dress, heels], noContext);
    expect(withBottom?.score).toBe(without?.score);
  });
});

describe("closetReadiness", () => {
  it("counts what's missing", () => {
    const r = closetReadiness([tee, pinkTee]);
    expect(r.ready).toBe(false);
    expect(r.missing).toBe(2);
    expect(r.rows.map((row) => [row.key, row.have, row.need])).toEqual([
      ["core", 2, 1],
      ["bottom", 0, 1],
      ["shoes", 0, 1],
    ]);
  });

  it("doesn't need bottoms when there's a dress", () => {
    expect(closetReadiness([dress, sneakers]).ready).toBe(true);
  });
});

describe("Open-Meteo mapping", async () => {
  const { conditionFor, snapshotFromForecast } = await import("@/lib/weather/open-meteo");

  it("maps weather codes to conditions", () => {
    expect(conditionFor(2)).toEqual({ condition: "Partly cloudy", wet: false });
    expect(conditionFor(63)).toEqual({ condition: "Rain", wet: true });
    expect(conditionFor(95).wet).toBe(true);
  });

  it("builds a snapshot, marking a likely-rainy day as wet", () => {
    const snap = snapshotFromForecast({
      current: { temperature_2m: 17.84, weather_code: 3 },
      daily: { temperature_2m_max: [20], temperature_2m_min: [11], precipitation_probability_max: [70] },
    });
    expect(snap).toEqual({ tempC: 17.8, highC: 20, lowC: 11, condition: "Cloudy", wet: true });
    expect(snapshotFromForecast({})).toBeNull();
  });
});
