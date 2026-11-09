import "server-only";

import { mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";

import { del, get, put } from "@vercel/blob";

/**
 * Private photo storage.
 * - Vercel Blob (private access) when the project has a Blob store connected
 *   (BLOB_READ_WRITE_TOKEN, or BLOB_STORE_ID with OIDC).
 * - Otherwise a local folder, ./.data/uploads, for development.
 * Keys look like "items/<itemId>/<random>-main.jpg" and are never public URLs;
 * the app serves them through /api/images/[...key] behind the login.
 */

const LOCAL_ROOT = path.resolve(process.cwd(), ".data/uploads");
const KEY_PATTERN = /^[a-z0-9-]+(\/[a-z0-9-]+)*\/[a-z0-9-]+\.(jpg|png|webp)$/;

export type StoredObject = {
  body: ReadableStream<Uint8Array> | Uint8Array;
  contentType: string;
  size: number | null;
  etag: string | null;
};

function blobEnabled(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID);
}

export function isValidKey(key: string): boolean {
  return KEY_PATTERN.test(key) && !key.includes("..");
}

function assertKey(key: string): void {
  if (!isValidKey(key)) throw new Error(`Invalid storage key: ${key}`);
}

function localPath(key: string): string {
  const full = path.resolve(LOCAL_ROOT, key);
  if (!full.startsWith(LOCAL_ROOT + path.sep)) throw new Error("Invalid storage key");
  return full;
}

const CONTENT_TYPE_BY_EXT: Record<string, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

export async function putObject(key: string, bytes: Uint8Array, contentType: string): Promise<void> {
  assertKey(key);
  if (blobEnabled()) {
    await put(key, Buffer.from(bytes), {
      access: "private",
      contentType,
      addRandomSuffix: false,
      allowOverwrite: false,
    });
    return;
  }
  const file = localPath(key);
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, bytes, { flag: "wx" });
}

export async function getObject(key: string): Promise<StoredObject | null> {
  if (!isValidKey(key)) return null;
  if (blobEnabled()) {
    const result = await get(key, { access: "private" });
    if (!result || result.statusCode !== 200) return null;
    return {
      body: result.stream,
      contentType: result.blob.contentType,
      size: result.blob.size,
      etag: result.blob.etag,
    };
  }
  const file = localPath(key);
  try {
    const [bytes, info] = await Promise.all([readFile(file), stat(file)]);
    return {
      body: new Uint8Array(bytes),
      contentType: CONTENT_TYPE_BY_EXT[key.split(".").pop() ?? ""] ?? "application/octet-stream",
      size: info.size,
      etag: `"${info.size}-${info.mtimeMs}"`,
    };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}

export async function deleteObjects(keys: Array<string | null | undefined>): Promise<void> {
  const valid = keys.filter((k): k is string => typeof k === "string" && isValidKey(k));
  if (valid.length === 0) return;
  if (blobEnabled()) {
    await del(valid);
    return;
  }
  await Promise.all(valid.map((k) => rm(localPath(k), { force: true })));
}
