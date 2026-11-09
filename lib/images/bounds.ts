export type Box = { x: number; y: number; width: number; height: number };

export type AlphaBoundsOptions = {
  /** Pixels with alpha above this count as part of the garment. */
  threshold?: number;
  /**
   * A row or column only counts if this fraction of its length is opaque, so
   * stray specks the model leaves in the background don't stretch the box.
   * Falls back to the plain box if this would discard everything.
   */
  minLineFraction?: number;
};

/**
 * Bounding box of opaque pixels in an RGBA buffer, ignoring sparse noise.
 * Returns null when the image is fully transparent.
 */
export function alphaBounds(
  rgba: Uint8ClampedArray,
  width: number,
  height: number,
  { threshold = 32, minLineFraction = 0.02 }: AlphaBoundsOptions = {},
): Box | null {
  const rowCounts = new Uint32Array(height);
  const colCounts = new Uint32Array(width);
  let total = 0;
  for (let y = 0; y < height; y++) {
    const row = y * width * 4;
    for (let x = 0; x < width; x++) {
      if (rgba[row + x * 4 + 3] > threshold) {
        rowCounts[y]++;
        colCounts[x]++;
        total++;
      }
    }
  }
  if (total === 0) return null;

  // Find the solid core (lines with enough opaque pixels), then grow outward while
  // the neighboring line still has any opaque pixel. Thin parts attached to the
  // garment (sleeve tips, straps) are kept; specks separated by empty lines are not.
  const span = (counts: Uint32Array, min: number): [number, number] | null => {
    let first = -1;
    let last = -1;
    for (let i = 0; i < counts.length; i++) {
      if (counts[i] >= min) {
        if (first < 0) first = i;
        last = i;
      }
    }
    if (first < 0) return null;
    while (first > 0 && counts[first - 1] > 0) first--;
    while (last < counts.length - 1 && counts[last + 1] > 0) last++;
    return [first, last];
  };

  // Rows are judged against the image width, columns against its height.
  const minRow = Math.max(1, Math.ceil(width * minLineFraction));
  const minCol = Math.max(1, Math.ceil(height * minLineFraction));
  const ys = span(rowCounts, minRow) ?? span(rowCounts, 1);
  const xs = span(colCounts, minCol) ?? span(colCounts, 1);
  if (!ys || !xs) return null;
  return { x: xs[0], y: ys[0], width: xs[1] - xs[0] + 1, height: ys[1] - ys[0] + 1 };
}

/**
 * Scales a box found on a downsampled image back to full size, adds padding
 * (as a fraction of the larger side), and clamps it to the image.
 */
export function expandBox(box: Box, scale: number, padding: number, fullWidth: number, fullHeight: number): Box {
  const x = box.x / scale;
  const y = box.y / scale;
  const w = box.width / scale;
  const h = box.height / scale;
  const pad = Math.max(w, h) * padding;
  const left = Math.max(0, Math.floor(x - pad));
  const top = Math.max(0, Math.floor(y - pad));
  const right = Math.min(fullWidth, Math.ceil(x + w + pad));
  const bottom = Math.min(fullHeight, Math.ceil(y + h + pad));
  return { x: left, y: top, width: right - left, height: bottom - top };
}
