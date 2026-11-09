import { describe, expect, it } from "vitest";

import { cycleIndex } from "@/lib/ui/carousel";
import { matchStateForScore } from "@/lib/ui/match";

describe("cycleIndex", () => {
  it("moves forward and backward", () => {
    expect(cycleIndex(1, 1, 5)).toBe(2);
    expect(cycleIndex(1, -1, 5)).toBe(0);
  });

  it("wraps at both ends", () => {
    expect(cycleIndex(4, 1, 5)).toBe(0);
    expect(cycleIndex(0, -1, 5)).toBe(4);
    expect(cycleIndex(0, -7, 5)).toBe(3);
  });

  it("returns 0 for an empty list", () => {
    expect(cycleIndex(0, 1, 0)).toBe(0);
    expect(cycleIndex(3, -1, 0)).toBe(0);
  });
});

describe("matchStateForScore", () => {
  it("uses the handoff thresholds: >= 70 match, < 50 clash, otherwise neutral", () => {
    expect(matchStateForScore(100)).toBe("match");
    expect(matchStateForScore(70)).toBe("match");
    expect(matchStateForScore(69.9)).toBe("neutral");
    expect(matchStateForScore(50)).toBe("neutral");
    expect(matchStateForScore(49.9)).toBe("clash");
    expect(matchStateForScore(0)).toBe("clash");
  });
});
