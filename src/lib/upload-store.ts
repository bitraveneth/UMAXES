import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import { del, put } from "@vercel/blob";

export type UploadFolder = "products" | "avatars" | "staff" | "slips";

export type StoredUpload = {
  /** Public URL — absolute Blob URL or site-relative `/uploads/...` */
  url: string;
  /** Where the file was stored */
  storage: "blob" | "local";
};

function useBlob() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

/**
 * Persist an optimized image for CMS / avatars.
 * - Vercel (BLOB_READ_WRITE_TOKEN set): @vercel/blob (survives serverless)
 * - Local / VPS: public/uploads/... on disk
 */
export async function storeUpload(
  folder: UploadFolder,
  filename: string,
  data: Buffer,
  contentType = "image/webp",
): Promise<StoredUpload> {
  if (useBlob()) {
    const blob = await put(`uploads/${folder}/${filename}`, data, {
      access: "public",
      contentType,
      addRandomSuffix: false,
    });
    return { url: blob.url, storage: "blob" };
  }

  const dir = path.join(process.cwd(), "public", "uploads", folder);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, filename), data);
  return { url: `/uploads/${folder}/${filename}`, storage: "local" };
}

/**
 * Remove a file written by storeUpload. Missing files are ignored so
 * Info can still clear the order's slip metadata.
 */
export async function removeStoredUpload(url: string | null | undefined) {
  if (!url) return;
  try {
    if (/^https?:\/\//i.test(url)) {
      await del(url);
      return;
    }
    const rel = url.replace(/^\/+/, "");
    if (!rel.startsWith("uploads/")) return;
    const abs = path.resolve(process.cwd(), "public", rel);
    const root = path.resolve(process.cwd(), "public", "uploads");
    if (abs !== root && !abs.startsWith(root + path.sep)) return;
    await unlink(abs);
  } catch {
    // Blob gone / file already deleted — metadata can still be cleared.
  }
}
