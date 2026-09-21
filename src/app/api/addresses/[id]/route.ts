import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canManageCompanyAddresses } from "@/lib/rbac";

type Params = { params: Promise<{ id: string }> };

async function requireOwner(addressId: string, write = false) {
  const session = await auth();
  if (!session?.user?.companyId || session.user.role !== "CUSTOMER") {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  if (session.user.status !== "APPROVED") {
    return {
      error: NextResponse.json({ error: "Account pending approval" }, { status: 403 }),
    };
  }
  if (
    write &&
    !canManageCompanyAddresses(
      session.user.status,
      session.user.role,
      session.user.companyRole,
    )
  ) {
    return {
      error: NextResponse.json(
        { error: "Finance users can view addresses but cannot change them" },
        { status: 403 },
      ),
    };
  }

  const address = await prisma.address.findFirst({
    where: { id: addressId, companyId: session.user.companyId },
  });
  if (!address) {
    return { error: NextResponse.json({ error: "Not found" }, { status: 404 }) };
  }

  return { session, address };
}

export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params;
  const gate = await requireOwner(id, true);
  if ("error" in gate && gate.error) return gate.error;

  const body = await request.json();
  const data: Record<string, unknown> = {};

  for (const key of ["label", "line1", "line2", "city", "region", "postalCode", "country"] as const) {
    if (body[key] !== undefined) {
      data[key] = body[key] === null ? null : String(body[key]).trim();
    }
  }

  const line1 = data.line1 as string | undefined;
  const city = data.city as string | undefined;
  const postalCode = data.postalCode as string | undefined;
  const country = data.country as string | undefined;

  if (
    (line1 !== undefined && !line1) ||
    (city !== undefined && !city) ||
    (postalCode !== undefined && !postalCode) ||
    (country !== undefined && !country)
  ) {
    return NextResponse.json(
      { error: "Address, city, postal code, and country are required" },
      { status: 400 },
    );
  }

  if (
    typeof country === "string" &&
    (country.toLowerCase().includes("china") || country.toUpperCase() === "CN")
  ) {
    return NextResponse.json(
      { error: "Shipping to China is not available" },
      { status: 400 },
    );
  }

  if (typeof body.isDefault === "boolean" && body.isDefault) {
    await prisma.address.updateMany({
      where: { companyId: gate.session.user.companyId! },
      data: { isDefault: false },
    });
    data.isDefault = true;
  }

  const address = await prisma.address.update({
    where: { id },
    data,
  });

  return NextResponse.json({ address });
}

export async function DELETE(_request: Request, { params }: Params) {
  const { id } = await params;
  const gate = await requireOwner(id, true);
  if ("error" in gate && gate.error) return gate.error;

  const companyId = gate.session.user.companyId!;
  const wasDefault = gate.address.isDefault;

  await prisma.address.delete({ where: { id } });

  if (wasDefault) {
    const next = await prisma.address.findFirst({
      where: { companyId },
      orderBy: { createdAt: "asc" },
    });
    if (next) {
      await prisma.address.update({
        where: { id: next.id },
        data: { isDefault: true },
      });
    }
  }

  return NextResponse.json({ ok: true });
}
