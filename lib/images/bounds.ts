export type Box = { x: number; y: number; width: number; height: number };

/**
 * Bounding box of pixels whose alpha exceeds `threshold`, in an RGBA buffer.
 * Returns null when the image is fully transparent.
 */
export function alphaBounds(rgba: Uint8ClampedArray, width: number, height: number, threshold = 16): Box | null {
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < height; y++) {
    const row = y * width * 4;
    for (let x = 0; x < width; x++) {
      if (rgba[row + x * 4 + 3] > threshold) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) return null;
  return { x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1 };
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
