import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canOrder } from "@/lib/rbac";

export async function GET() {
  const session = await auth();
  if (!session?.user || !canOrder(session.user.status, session.user.role, session.user.companyRole)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const favorites = await prisma.favorite.findMany({
    where: { userId: session.user.id },
    include: { product: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    favorites: favorites.map((f) => ({
      id: f.id,
      productId: f.productId,
      sku: f.product.sku,
      name: f.product.name,
      image: f.product.image,
    })),
  });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user || !canOrder(session.user.status, session.user.role, session.user.companyRole)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const productId = String(body.productId || "");
  const sku = String(body.sku || "");

  const product = productId
    ? await prisma.product.findUnique({ where: { id: productId } })
    : await prisma.product.findUnique({ where: { sku } });

  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  const favorite = await prisma.favorite.upsert({
    where: {
      userId_productId: { userId: session.user.id, productId: product.id },
    },
    create: { userId: session.user.id, productId: product.id },
    update: {},
  });

  return NextResponse.json({ favorite }, { status: 201 });
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const productId = String(body.productId || "");
  const sku = String(body.sku || "");

  let resolvedId = productId;
  if (!resolvedId && sku) {
    const product = await prisma.product.findUnique({
      where: { sku },
      select: { id: true },
    });
    resolvedId = product?.id ?? "";
  }

  if (!resolvedId) {
    return NextResponse.json({ error: "Product required" }, { status: 400 });
  }

  await prisma.favorite.deleteMany({
    where: { userId: session.user.id, productId: resolvedId },
  });
  return NextResponse.json({ ok: true });
}
