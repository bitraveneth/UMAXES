import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import sharp from "sharp";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  PAYMENT_SLIP,
  formatMaxSlipSize,
  guessSlipMime,
  isAllowedSlipMime,
} from "@/lib/payment-slip";
import { deleteOrderPaymentSlip } from "@/lib/payment-slip-ops";
import { removeStoredUpload, storeUpload } from "@/lib/upload-store";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

function safeName(name: string) {
  return name.replace(/[^\w.\-()+ ]+/g, "_").slice(0, 80) || "payment-slip";
}

async function compressSlipImage(raw: Buffer) {
  let quality = PAYMENT_SLIP.jpegQuality;
  let buf = await sharp(raw, { failOn: "none" })
    .rotate()
    .resize({
      width: PAYMENT_SLIP.maxDimension,
      height: PAYMENT_SLIP.maxDimension,
      fit: "inside",
      withoutEnlargement: true,
    })
    .jpeg({ quality, mozjpeg: true })
    .toBuffer();

  while (buf.length > PAYMENT_SLIP.maxBytes && quality > 40) {
    quality -= 8;
    buf = await sharp(raw, { failOn: "none" })
      .rotate()
      .resize({
        width: PAYMENT_SLIP.maxDimension,
        height: PAYMENT_SLIP.maxDimension,
        fit: "inside",
        withoutEnlargement: true,
      })
      .jpeg({ quality, mozjpeg: true })
      .toBuffer();
  }

  return buf;
}

async function loadOrderForSession(id: string) {
  const session = await auth();
  if (!session?.user) {
    return { error: "Unauthorized" as const, status: 401 as const };
  }

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      payments: { orderBy: { createdAt: "desc" } },
      company: { select: { id: true, name: true } },
    },
  });
  if (!order) return { error: "Not found" as const, status: 404 as const };

  const isOwner =
    session.user.role === "CUSTOMER" &&
    session.user.companyId === order.companyId;
  const isStaff = [
    "SUPER_ADMIN",
    "ADMIN",
    "SALES",
    "WAREHOUSE",
    "LOGISTICS",
  ].includes(session.user.role);
  if (!isOwner && !isStaff) {
    return { error: "Forbidden" as const, status: 403 as const };
  }

  return { session, order, isOwner, isStaff };
}

/** Buyer or staff opens the 水单. */
export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  const result = await loadOrderForSession(id);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  const payment =
    result.order.payments.find((p) => p.slipUrl) || result.order.payments[0];
  if (!payment?.slipUrl) {
    return NextResponse.json({ error: "No payment slip" }, { status: 404 });
  }

  if (payment.slipUrl.startsWith("http://") || payment.slipUrl.startsWith("https://")) {
    return NextResponse.redirect(payment.slipUrl);
  }

  const rel = payment.slipUrl.replace(/^\//, "");
  const abs = path.join(process.cwd(), "public", rel);
  try {
    const data = await readFile(abs);
    return new NextResponse(new Uint8Array(data), {
      headers: {
        "Content-Type": payment.slipMime || "image/jpeg",
        "Content-Disposition": `inline; filename="${encodeURIComponent(payment.slipFileName || "payment-slip.jpg")}"`,
        "Cache-Control": "private, max-age=0, must-revalidate",
      },
    });
  } catch {
    return NextResponse.json({ error: "File missing" }, { status: 404 });
  }
}

/** Buyer uploads 水单. Does not mark the order paid. */
export async function POST(request: Request, { params }: Params) {
  const { id } = await params;
  const result = await loadOrderForSession(id);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  if (!result.isOwner) {
    return NextResponse.json(
      { error: "Only the buyer company can upload a payment slip" },
      { status: 403 },
    );
  }

  const { order, session } = result;
  if (order.status === "CANCELLED") {
    return NextResponse.json({ error: "Order is cancelled" }, { status: 400 });
  }
  const alreadyPaid = order.payments.some((p) => p.status === "paid" && p.paidAt);
  if (alreadyPaid) {
    return NextResponse.json(
      { error: "Payment is already confirmed" },
      { status: 400 },
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = form.get("file");
  const reference = String(form.get("reference") || "").trim().slice(0, 80);
  if (!(file instanceof File) || file.size <= 0) {
    return NextResponse.json({ error: "Choose a payment slip photo" }, { status: 400 });
  }
  if (file.size > PAYMENT_SLIP.maxBytes) {
    return NextResponse.json(
      { error: `Image too large (max ${formatMaxSlipSize()})` },
      { status: 400 },
    );
  }
  const mime = guessSlipMime(file);
  if (!isAllowedSlipMime(mime)) {
    return NextResponse.json(
      { error: "Use a JPG, PNG, or WebP photo of the bank slip" },
      { status: 400 },
    );
  }

  const raw = Buffer.from(await file.arrayBuffer());
  let storedBuf: Buffer;
  try {
    storedBuf = await compressSlipImage(raw);
  } catch {
    return NextResponse.json({ error: "Could not read that image" }, { status: 400 });
  }
  if (storedBuf.length > PAYMENT_SLIP.maxBytes) {
    return NextResponse.json(
      { error: `Could not keep that image under ${formatMaxSlipSize()}` },
      { status: 400 },
    );
  }

  const storedMime = "image/jpeg";
  const filename = `slip-${order.id.slice(-8)}-${Date.now()}.jpg`;
  let stored;
  try {
    stored = await storeUpload("slips", filename, storedBuf, storedMime);
  } catch (e) {
    console.error("payment slip store failed", e);
    return NextResponse.json({ error: "Could not save the slip" }, { status: 500 });
  }

  const originalName = safeName(file.name || filename);
  const payment = order.payments[0];
  const previousUrl = payment?.slipUrl || null;
  const now = new Date();

  if (payment) {
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: payment.status === "paid" ? payment.status : "submitted",
        slipUrl: stored.url,
        slipFileName: originalName,
        slipMime: storedMime,
        slipUploadedAt: now,
        reference: reference || payment.reference,
      },
    });
  } else {
    await prisma.payment.create({
      data: {
        orderId: order.id,
        method: order.paymentMethod,
        amount: order.total,
        status: "submitted",
        slipUrl: stored.url,
        slipFileName: originalName,
        slipMime: storedMime,
        slipUploadedAt: now,
        reference: reference || order.paymentRef,
      },
    });
  }

  if (previousUrl && previousUrl !== stored.url) {
    await removeStoredUpload(previousUrl);
  }

  if (reference) {
    await prisma.order.update({
      where: { id: order.id },
      data: { paymentRef: reference },
    });
  }

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "PAYMENT_SLIP_UPLOADED",
      entity: "Order",
      entityId: order.id,
      meta: JSON.stringify({
        orderNumber: order.orderNumber,
        fileName: originalName,
        mime: storedMime,
        bytes: storedBuf.length,
        reference: reference || order.paymentRef || null,
      }),
    },
  });

  const { notifyStaff } = await import("@/lib/notify");
  await notifyStaff({
    subject: `Payment slip uploaded · ${order.orderNumber}`,
    body: `${order.company.name} uploaded a bank slip for ${order.orderNumber}. Confirm 到账 in Orders after finance verifies the funds.`,
    type: "order",
    href: "/admin/orders",
    includeSales: true,
  });

  return NextResponse.json({
    ok: true,
    slipUrl: `/api/orders/${order.id}/payment-slip`,
    fileName: originalName,
    status: "submitted",
  });
}

/** Admin / super admin delete the stored 水单 so it does not sit on disk. */
export async function DELETE(_request: Request, { params }: Params) {
  const { id } = await params;
  const result = await loadOrderForSession(id);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  const role = result.session.user.role;
  if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
    return NextResponse.json(
      { error: "Only admin or super admin can delete a payment slip" },
      { status: 403 },
    );
  }

  try {
    await deleteOrderPaymentSlip(id, result.session.user.id);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Could not delete the slip";
    const status = message === "Order not found" || message.startsWith("No payment") ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }

  return NextResponse.json({ ok: true });
}
