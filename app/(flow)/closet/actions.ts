"use server";

import { randomUUID } from "node:crypto";

import { and, count, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireSession } from "@/lib/auth/server";
import { fieldErrorsFrom, itemInputFromFormData, type ItemFieldErrors } from "@/lib/closet/item-input";
import { itemValues, setItemTags } from "@/lib/closet/mutations";
import { ITEM_STATUSES, type ItemStatus } from "@/lib/closet/options";
import { db } from "@/lib/db";
import { items, outfitItems } from "@/lib/db/schema";
import { IMAGE_EXTENSION, sniffImageType } from "@/lib/images/sniff";
import { deleteObjects, putObject } from "@/lib/storage";

export type SaveItemResult =
  | { ok: true; id: string; isDraft: boolean; name: string | null; itemNumber: number }
  | { ok: false; errors: ItemFieldErrors };

const MAX_PHOTO_BYTES = 3 * 1024 * 1024;
const PHOTO_FIELDS = ["photo", "original", "thumb"] as const;
type PhotoField = (typeof PHOTO_FIELDS)[number];

function isUuid(id: string): boolean {
  return /^[0-9a-f-]{36}$/i.test(id);
}

/** Validates the uploaded photo variants by content (not declared type) and stores them. */
async function storePhotos(itemId: string, formData: FormData): Promise<Partial<Record<PhotoField, string>> | "invalid"> {
  const stored: Partial<Record<PhotoField, string>> = {};
  const batch = randomUUID().slice(0, 8);
  for (const field of PHOTO_FIELDS) {
    const file = formData.get(field);
    if (!(file instanceof File) || file.size === 0) continue;
    if (file.size > MAX_PHOTO_BYTES) return "invalid";
    const bytes = new Uint8Array(await file.arrayBuffer());
    const type = sniffImageType(bytes);
    if (!type) return "invalid";
    const key = `items/${itemId}/${batch}-${field}.${IMAGE_EXTENSION[type]}`;
    await putObject(key, bytes, type);
    stored[field] = key;
  }
  return stored;
}

function revalidateCloset(id?: string) {
  revalidatePath("/closet");
  revalidatePath("/closet/drafts");
  if (id) revalidatePath(`/closet/${id}`);
}

export async function createItem(formData: FormData): Promise<SaveItemResult> {
  await requireSession();

  const parsed = itemInputFromFormData(formData);
  if (!parsed.success) return { ok: false, errors: fieldErrorsFrom(parsed.error) };

  const id = randomUUID();
  const photos = await storePhotos(id, formData);
  if (photos === "invalid" || !photos.photo) {
    if (photos !== "invalid") await deleteObjects(Object.values(photos));
    return { ok: false, errors: { form: "That photo didn't upload. Try a JPEG or PNG under 3 MB." } };
  }

  try {
    await db.transaction(async (tx) => {
      await tx.insert(items).values({
        id,
        ...itemValues(parsed.data),
        imageUrl: photos.photo,
        originalImageUrl: photos.original ?? photos.photo,
        thumbUrl: photos.thumb ?? photos.photo,
      });
      await setItemTags(tx, id, parsed.data.tags);
    });
  } catch (error) {
    console.error("createItem failed", error);
    await deleteObjects(Object.values(photos));
    return { ok: false, errors: { form: "Couldn't save that item. Try again." } };
  }

  const [{ n }] = await db.select({ n: count() }).from(items).where(isNull(items.deletedAt));
  revalidateCloset(id);
  return { ok: true, id, isDraft: parsed.data.isDraft, name: parsed.data.name, itemNumber: Number(n) };
}

export async function updateItem(id: string, formData: FormData): Promise<SaveItemResult> {
  await requireSession();
  if (!isUuid(id)) return { ok: false, errors: { form: "That item doesn't exist." } };

  const parsed = itemInputFromFormData(formData);
  if (!parsed.success) return { ok: false, errors: fieldErrorsFrom(parsed.error) };

  try {
    const updated = await db.transaction(async (tx) => {
      const rows = await tx
        .update(items)
        .set(itemValues(parsed.data))
        .where(and(eq(items.id, id), isNull(items.deletedAt)))
        .returning({ id: items.id });
      if (rows.length === 0) return false;
      await setItemTags(tx, id, parsed.data.tags);
      return true;
    });
    if (!updated) return { ok: false, errors: { form: "That item doesn't exist anymore." } };
  } catch (error) {
    console.error("updateItem failed", error);
    return { ok: false, errors: { form: "Couldn't save your changes. Try again." } };
  }

  revalidateCloset(id);
  return { ok: true, id, isDraft: parsed.data.isDraft, name: parsed.data.name, itemNumber: 0 };
}

export async function setItemStatus(id: string, status: ItemStatus): Promise<void> {
  await requireSession();
  if (!isUuid(id) || !ITEM_STATUSES.includes(status)) return;
  await db.update(items).set({ status }).where(and(eq(items.id, id), isNull(items.deletedAt)));
  revalidateCloset(id);
}

/**
 * Soft delete: the item leaves the closet and every saved outfit, but its row
 * and photos stay so wear history can still show it.
 */
export async function deleteItem(id: string): Promise<void> {
  await requireSession();
  if (!isUuid(id)) return;
  await db.transaction(async (tx) => {
    await tx
      .update(items)
      .set({ deletedAt: new Date() })
      .where(and(eq(items.id, id), isNull(items.deletedAt)));
    await tx.delete(outfitItems).where(eq(outfitItems.itemId, id));
  });
  revalidateCloset(id);
  revalidatePath("/outfits");
  redirect("/closet");
}
