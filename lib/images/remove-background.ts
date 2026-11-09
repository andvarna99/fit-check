/**
 * On-device background removal (IMG.LY, AGPL; see docs/PLAN.md). The photo
 * never leaves the phone; only the ~40 MB model is downloaded once from
 * IMG.LY's CDN and then cached by the browser.
 */

import { alphaBounds, expandBox } from "./bounds";
import { resizeImage, type PreparedPhoto } from "./prepare";

export const CUTOUT_MAX_PX = 1200;
const TRIM_SAMPLE_PX = 256;
const TRIM_PADDING = 0.04;

export type RemovalProgress =
  /** First run only: model download, 0–1. */
  | { phase: "download"; fraction: number }
  /** Processing on the device, 0–1 across the library's four stages. */
  | { phase: "compute"; fraction: number };

const COMPUTE_STAGES = ["compute:decode", "compute:inference", "compute:mask", "compute:encode"];

/** Removes the background and returns a transparent PNG at the input size. */
export async function removeBackgroundOnDevice(image: Blob, onProgress?: (p: RemovalProgress) => void): Promise<Blob> {
  // Loaded on demand: the library and its ONNX runtime are large and browser-only.
  const { removeBackground } = await import("@imgly/background-removal");
  const files = new Map<string, { loaded: number; total: number }>();
  return removeBackground(image, {
    model: "isnet_quint8",
    output: { format: "image/png" },
    progress: (key, current, total) => {
      if (!onProgress) return;
      if (key.startsWith("fetch:")) {
        files.set(key, { loaded: current, total });
        let loaded = 0;
        let sum = 0;
        for (const f of files.values()) {
          loaded += f.loaded;
          sum += f.total;
        }
        if (sum > 0) onProgress({ phase: "download", fraction: Math.min(1, loaded / sum) });
        return;
      }
      const stage = COMPUTE_STAGES.indexOf(key);
      if (stage >= 0) onProgress({ phase: "compute", fraction: (stage + 1) / (COMPUTE_STAGES.length + 1) });
    },
  });
}

function drawToCanvas(bitmap: ImageBitmap, box: { x: number; y: number; width: number; height: number }, scale: number) {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(box.width * scale));
  canvas.height = Math.max(1, Math.round(box.height * scale));
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Canvas is not available");
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, box.x, box.y, box.width, box.height, 0, 0, canvas.width, canvas.height);
  return { canvas, ctx };
}

/**
 * Crops a transparent cutout to the garment's edges (plus a little padding) and
 * scales it to fit `maxPx`. Falls back to a plain resize if nothing is opaque.
 */
export async function trimCutout(cutout: Blob, maxPx = CUTOUT_MAX_PX): Promise<PreparedPhoto> {
  const bitmap = await createImageBitmap(cutout);
  try {
    const full = { x: 0, y: 0, width: bitmap.width, height: bitmap.height };
    const sampleScale = Math.min(1, TRIM_SAMPLE_PX / Math.max(bitmap.width, bitmap.height));
    const sample = drawToCanvas(bitmap, full, sampleScale);
    const pixels = sample.ctx.getImageData(0, 0, sample.canvas.width, sample.canvas.height);
    const found = alphaBounds(pixels.data, pixels.width, pixels.height);
    if (!found) return resizeImage(cutout, maxPx, true);

    const box = expandBox(found, sampleScale, TRIM_PADDING, bitmap.width, bitmap.height);
    const scale = Math.min(1, maxPx / Math.max(box.width, box.height));
    const { canvas } = drawToCanvas(bitmap, box, scale);
    const blob = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Couldn't encode cutout"))), "image/png"),
    );
    return { blob, width: canvas.width, height: canvas.height };
  } finally {
    bitmap.close();
  }
}
