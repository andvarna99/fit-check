import { preparePhoto, resizeImage, THUMB_MAX_PX, type PreparedPhoto } from "./prepare";
import { removeBackgroundOnDevice, trimCutout, type RemovalProgress } from "./remove-background";

export type PhotoVersion = { photo: PreparedPhoto; thumb: PreparedPhoto };
export type ProcessedPhoto = {
  original: PhotoVersion;
  /** Null when background removal failed; the original is used instead. */
  cutout: PhotoVersion | null;
};

/**
 * Full on-device pipeline for one photo: resize, remove the background, crop to
 * the garment, and make thumbnails. Throws only if the photo can't be opened.
 */
export async function processPhoto(file: File, onProgress?: (p: RemovalProgress) => void): Promise<ProcessedPhoto> {
  const { main, thumb } = await preparePhoto(file);
  const original = { photo: main, thumb };
  try {
    const raw = await removeBackgroundOnDevice(main.blob, onProgress);
    const cut = await trimCutout(raw);
    const cutThumb = await resizeImage(cut.blob, THUMB_MAX_PX, true);
    return { original, cutout: { photo: cut, thumb: cutThumb } };
  } catch (error) {
    console.warn("Background removal failed; keeping the original", error);
    return { original, cutout: null };
  }
}

/** Adds a processed photo's files to an item FormData (cutout preferred). */
export function appendPhotoFiles(formData: FormData, processed: ProcessedPhoto): void {
  const chosen = processed.cutout ?? processed.original;
  formData.set("photo", chosen.photo.blob, "photo");
  formData.set("thumb", chosen.thumb.blob, "thumb");
  formData.set("original", processed.original.photo.blob, "original");
}
