import { describe, expect, it } from "vitest";

import { alphaBounds, expandBox } from "@/lib/images/bounds";

function rgba(width: number, height: number, opaque: Array<[number, number]>, alpha = 255): Uint8ClampedArray {
  const data = new Uint8ClampedArray(width * height * 4);
  for (const [x, y] of opaque) data[(y * width + x) * 4 + 3] = alpha;
  return data;
}

/** All pixels in a rectangle. */
function rect(x0: number, y0: number, w: number, h: number): Array<[number, number]> {
  const out: Array<[number, number]> = [];
  for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) out.push([x, y]);
  return out;
}

describe("alphaBounds", () => {
  it("finds the box around a solid garment", () => {
    const data = rgba(100, 120, rect(20, 30, 40, 50));
    expect(alphaBounds(data, 100, 120)).toEqual({ x: 20, y: 30, width: 40, height: 50 });
  });

  it("ignores stray specks far from the garment", () => {
    // Garment in the middle plus single-pixel noise near two corners.
    const data = rgba(200, 200, [...rect(60, 50, 80, 100), [2, 3], [195, 197]]);
    expect(alphaBounds(data, 200, 200)).toEqual({ x: 60, y: 50, width: 80, height: 100 });
  });

  it("keeps thin parts attached to the garment, like sleeve tips", () => {
    // Body 80x100, plus 1px-wide sleeve tips sticking out 15px on each side.
    const sleeves = [...rect(45, 60, 15, 1), ...rect(140, 60, 15, 1)];
    const data = rgba(200, 200, [...rect(60, 50, 80, 100), ...sleeves]);
    expect(alphaBounds(data, 200, 200)).toEqual({ x: 45, y: 50, width: 110, height: 100 });
  });

  it("drops a speck even when it sits next to a thin attached part", () => {
    // Sleeve tip reaches x=45; speck at x=20 is separated by empty columns.
    const data = rgba(200, 200, [...rect(60, 50, 80, 100), ...rect(45, 60, 15, 1), [20, 60]]);
    expect(alphaBounds(data, 200, 200)?.x).toBe(45);
  });

  it("ignores faint, nearly transparent background haze", () => {
    const haze = rect(0, 0, 50, 50);
    const data = rgba(50, 50, haze, 20); // whole image at alpha 20, below threshold
    for (const [x, y] of rect(10, 10, 20, 25)) data[(y * 50 + x) * 4 + 3] = 255;
    expect(alphaBounds(data, 50, 50)).toEqual({ x: 10, y: 10, width: 20, height: 25 });
  });

  it("keeps thin garments (e.g. a belt) instead of discarding them as noise", () => {
    // A 1px-tall strap across most of the width: every row is below the line minimum
    // in the other direction, so it falls back to the plain box rather than nothing.
    const data = rgba(200, 200, rect(10, 100, 180, 1));
    expect(alphaBounds(data, 200, 200)).toEqual({ x: 10, y: 100, width: 180, height: 1 });
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
