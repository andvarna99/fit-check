/**
 * Browser-side photo preparation. Runs before anything is uploaded, which keeps
 * uploads small (Server Action limit) and fixes phone EXIF rotation.
 */

export const MAIN_MAX_PX = 1600;
export const THUMB_MAX_PX = 480;

export type PreparedPhoto = {
  /** Upright, resized photo. */
  blob: Blob;
  width: number;
  height: number;
};

async function decode(source: Blob): Promise<ImageBitmap> {
  // `from-image` applies EXIF orientation so portrait phone photos stay upright.
  return createImageBitmap(source, { imageOrientation: "from-image" });
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Couldn't encode image"))), type, quality);
  });
}

/**
 * Scales an image to fit within `maxPx` on its longest side.
 * `transparent` keeps the alpha channel (PNG, for background-removed cutouts);
 * otherwise encodes JPEG.
 */
export async function resizeImage(source: Blob, maxPx: number, transparent = false): Promise<PreparedPhoto> {
  const bitmap = await decode(source);
  try {
    const scale = Math.min(1, maxPx / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas is not available");
    if (!transparent) {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, width, height);
    }
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(bitmap, 0, 0, width, height);
    const blob = await canvasToBlob(canvas, transparent ? "image/png" : "image/jpeg", 0.85);
    return { blob, width, height };
  } finally {
    bitmap.close();
  }
}

/** Main (≤1600px) and thumbnail (≤480px) versions of a picked photo. */
export async function preparePhoto(file: File): Promise<{ main: PreparedPhoto; thumb: PreparedPhoto }> {
  const main = await resizeImage(file, MAIN_MAX_PX);
  const thumb = await resizeImage(main.blob, THUMB_MAX_PX);
  return { main, thumb };
}
