import { NextResponse } from "next/server";
import sharp from "sharp";
import { auth } from "@/lib/auth";
import { canAccessPath } from "@/lib/rbac";
import {
  PRODUCT_IMAGE,
  formatBytes,
} from "@/lib/product-image";
import { storeUpload } from "@/lib/upload-store";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const session = await auth();
  if (
    !session?.user ||
    !canAccessPath(session.user.role, "/admin/catalog")
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }

  if (file.size <= 0) {
    return NextResponse.json({ error: "Empty file" }, { status: 400 });
  }

  if (file.size > PRODUCT_IMAGE.maxUploadBytes) {
    return NextResponse.json(
      {
        error: `Image is too large (${formatBytes(file.size)}). Maximum upload is ${formatBytes(PRODUCT_IMAGE.maxUploadBytes)}. Compress or resize before uploading.`,
      },
      { status: 400 },
    );
  }

  const mime = (file.type || "").toLowerCase();
  if (
    !(PRODUCT_IMAGE.acceptMime as readonly string[]).includes(mime)
  ) {
    return NextResponse.json(
      {
        error: `Unsupported format (${mime || "unknown"}). Use JPEG, PNG, or WebP.`,
      },
      { status: 400 },
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  let optimized: Buffer;
  let width: number;
  let height: number;
  try {
    const pipeline = sharp(buffer, { failOn: "none" })
      .rotate()
      .resize({
        width: PRODUCT_IMAGE.maxDimension,
        height: PRODUCT_IMAGE.maxDimension,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: PRODUCT_IMAGE.webpQuality });

    const meta = await sharp(buffer).metadata();
    optimized = await pipeline.toBuffer();
    const outMeta = await sharp(optimized).metadata();
    width = outMeta.width || meta.width || 0;
    height = outMeta.height || meta.height || 0;
  } catch {
    return NextResponse.json(
      { error: "Could not process image. Try another JPEG, PNG, or WebP file." },
      { status: 400 },
    );
  }

  const filename = `p-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.webp`;
  let stored;
  try {
    stored = await storeUpload("products", filename, optimized);
  } catch (e) {
    console.error("product image store failed", e);
    return NextResponse.json(
      { error: "Could not save image. Check Blob token on Vercel or disk permissions locally." },
      { status: 500 },
    );
  }

  return NextResponse.json({
    url: stored.url,
    storage: stored.storage,
    width,
    height,
    bytes: optimized.length,
    originalBytes: file.size,
    message: `Saved ${width}×${height} WebP (${formatBytes(optimized.length)})`,
  });
}
