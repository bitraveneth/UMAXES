import { NextResponse } from "next/server";
import sharp from "sharp";
import { auth } from "@/lib/auth";
import { canAccessPath } from "@/lib/rbac";
import { storeUpload } from "@/lib/upload-store";

export const runtime = "nodejs";

const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPT = ["image/jpeg", "image/png", "image/webp"] as const;

export async function POST(req: Request) {
  const session = await auth();
  if (
    !session?.user ||
    !canAccessPath(session.user.role, "/admin/profile")
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const kind = String(form.get("kind") || "avatar");
  if (kind !== "avatar" && kind !== "logo") {
    return NextResponse.json({ error: "Invalid kind" }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File) || file.size <= 0) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Image too large (max 5MB)" }, { status: 400 });
  }

  const mime = (file.type || "").toLowerCase();
  if (!(ACCEPT as readonly string[]).includes(mime)) {
    return NextResponse.json(
      { error: "Use JPEG, PNG, or WebP" },
      { status: 400 },
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const size = kind === "avatar" ? 256 : 512;

  let optimized: Buffer;
  try {
    optimized = await sharp(buffer, { failOn: "none" })
      .rotate()
      .resize({
        width: size,
        height: size,
        fit: kind === "avatar" ? "cover" : "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: 85 })
      .toBuffer();
  } catch {
    return NextResponse.json({ error: "Could not process image" }, { status: 400 });
  }

  const filename = `${kind}-${session.user.id.slice(-6)}-${Date.now()}.webp`;
  try {
    const stored = await storeUpload("staff", filename, optimized);
    return NextResponse.json({
      url: stored.url,
      storage: stored.storage,
    });
  } catch (e) {
    console.error("staff image store failed", e);
    return NextResponse.json(
      { error: "Could not save image. Check Blob token on Vercel or disk permissions locally." },
      { status: 500 },
    );
  }
}
