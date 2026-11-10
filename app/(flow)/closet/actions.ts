"use server";

import { randomUUID } from "node:crypto";

import { and, count, eq, inArray, isNotNull, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireSession } from "@/lib/auth/server";
import { fieldErrorsFrom, itemInputFromFormData, type ItemFieldErrors } from "@/lib/closet/item-input";
import { addItemTags, itemValues, setItemTags } from "@/lib/closet/mutations";
import { ITEM_STATUSES, type ItemStatus } from "@/lib/closet/options";
import {
  applyQuickTag,
  isPatchEmpty,
  itemIdsSchema,
  quickTagPatchSchema,
  tagValuesSchema,
  type QuickTagPatch,
  type TagValues,
} from "@/lib/closet/quick-tag";
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
  // Today suggests outfits from the closet.
  revalidatePath("/");
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

export type BulkResult = { ok: true } | { ok: false; error: string };

/**
 * Applies the same quick-tag changes to several items. With `finalize`, items
 * that end up with a category leave Drafts (used by the Drafts screen); the
 * bulk upload review finalizes separately with finalizeItems.
 */
export async function quickTagItems(ids: string[], patch: QuickTagPatch, finalize: boolean): Promise<BulkResult> {
  await requireSession();
  const parsedIds = itemIdsSchema.safeParse(ids);
  const parsedPatch = quickTagPatchSchema.safeParse(patch);
  if (!parsedIds.success || !parsedPatch.success) return { ok: false, error: "Those changes didn't look right. Try again." };
  if (isPatchEmpty(parsedPatch.data)) return { ok: true };

  try {
    await db.transaction(async (tx) => {
      const rows = await tx
        .select({
          id: items.id,
          category: items.category,
          colors: items.colors,
          seasons: items.seasons,
          formality: items.formality,
          warmth: items.warmth,
          isDraft: items.isDraft,
        })
        .from(items)
        .where(and(inArray(items.id, parsedIds.data), isNull(items.deletedAt)));
      for (const row of rows) {
        const next = applyQuickTag(row, parsedPatch.data);
        await tx
          .update(items)
          .set({ ...next, isDraft: finalize && next.category ? false : row.isDraft })
          .where(eq(items.id, row.id));
      }
      await addItemTags(tx, rows.map((r) => r.id), parsedPatch.data.addTags ?? []);
    });
  } catch (error) {
    console.error("quickTagItems failed", error);
    return { ok: false, error: "Couldn't tag those items. Try again." };
  }
  revalidateCloset();
  return { ok: true };
}

/** Sets one item's quick fields (One-by-one review). Other fields are untouched. */
export async function tagItem(id: string, values: TagValues): Promise<BulkResult> {
  await requireSession();
  const parsed = tagValuesSchema.safeParse(values);
  if (!isUuid(id) || !parsed.success) return { ok: false, error: "Those details didn't look right. Try again." };
  try {
    await db
      .update(items)
      .set({ ...parsed.data, colors: [...new Set(parsed.data.colors)], seasons: [...new Set(parsed.data.seasons)] })
      .where(and(eq(items.id, id), isNull(items.deletedAt)));
  } catch (error) {
    console.error("tagItem failed", error);
    return { ok: false, error: "Couldn't save that item. Try again." };
  }
  revalidateCloset(id);
  return { ok: true };
}

/** Moves the given drafts that have a category into the closet. Returns how many moved and how many stay drafts. */
export async function finalizeItems(ids: string[]): Promise<{ ok: true; added: number; drafts: number } | { ok: false; error: string }> {
  await requireSession();
  const parsed = itemIdsSchema.safeParse(ids);
  if (!parsed.success) return { ok: false, error: "Nothing to save." };
  try {
    const moved = await db
      .update(items)
      .set({ isDraft: false })
      .where(and(inArray(items.id, parsed.data), isNotNull(items.category), isNull(items.deletedAt)))
      .returning({ id: items.id });
    revalidateCloset();
    return { ok: true, added: moved.length, drafts: parsed.data.length - moved.length };
  } catch (error) {
    console.error("finalizeItems failed", error);
    return { ok: false, error: "Couldn't save the batch. Try again." };
  }
}

/** Current tag values for a batch (refreshes Review after editing an item in the full form). */
export async function getTagValues(ids: string[]): Promise<Record<string, TagValues & { name: string | null }>> {
  await requireSession();
  const parsed = itemIdsSchema.safeParse(ids);
  if (!parsed.success) return {};
  const rows = await db
    .select({
      id: items.id,
      name: items.name,
      category: items.category,
      colors: items.colors,
      seasons: items.seasons,
      formality: items.formality,
      warmth: items.warmth,
    })
    .from(items)
    .where(and(inArray(items.id, parsed.data), isNull(items.deletedAt)));
  return Object.fromEntries(rows.map(({ id, ...values }) => [id, values]));
}
