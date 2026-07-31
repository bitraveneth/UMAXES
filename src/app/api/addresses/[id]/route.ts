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

  await prisma.address.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
