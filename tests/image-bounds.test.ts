import { describe, expect, it } from "vitest";

import { alphaBounds, expandBox } from "@/lib/images/bounds";

function rgba(width: number, height: number, opaque: Array<[number, number]>): Uint8ClampedArray {
  const data = new Uint8ClampedArray(width * height * 4);
  for (const [x, y] of opaque) data[(y * width + x) * 4 + 3] = 255;
  return data;
}

describe("alphaBounds", () => {
  it("finds the box around opaque pixels", () => {
    const data = rgba(10, 8, [[2, 3], [6, 3], [4, 5]]);
    expect(alphaBounds(data, 10, 8)).toEqual({ x: 2, y: 3, width: 5, height: 3 });
  });

  it("ignores nearly transparent pixels", () => {
    const data = rgba(4, 4, [[1, 1]]);
    data[(0 * 4 + 3) * 4 + 3] = 10; // faint pixel at (3, 0), below threshold
    expect(alphaBounds(data, 4, 4)).toEqual({ x: 1, y: 1, width: 1, height: 1 });
  });

  it("returns null for a fully transparent image", () => {
    expect(alphaBounds(rgba(5, 5, []), 5, 5)).toBeNull();
  });
});

describe("expandBox", () => {
  it("scales back to full size and pads, clamped to the image", () => {
    // Found at 1/4 scale: (10,10) 20x40 -> full (40,40) 80x160, pad 10% of 160 = 16
    expect(expandBox({ x: 10, y: 10, width: 20, height: 40 }, 0.25, 0.1, 1000, 1000)).toEqual({
      x: 24,
      y: 24,
      width: 112,
      height: 192,
    });
  });

  it("clamps padding at the edges", () => {
    expect(expandBox({ x: 0, y: 0, width: 10, height: 10 }, 1, 0.5, 12, 12)).toEqual({ x: 0, y: 0, width: 12, height: 12 });
  });
});
