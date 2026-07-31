import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canManageCompanyAddresses } from "@/lib/rbac";

const MAX_ADDRESSES = 10;

async function requireCustomerCompany(opts?: { write?: boolean }) {
  const session = await auth();
  if (!session?.user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  if (session.user.role !== "CUSTOMER" || !session.user.companyId) {
    return {
      error: NextResponse.json({ error: "Customer company required" }, { status: 403 }),
    };
  }
  if (session.user.status !== "APPROVED") {
    return {
      error: NextResponse.json(
        { error: "Account pending approval" },
        { status: 403 },
      ),
    };
  }
  if (
    opts?.write &&
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
  return { session, companyId: session.user.companyId };
}

export async function GET() {
  const gate = await requireCustomerCompany();
  if ("error" in gate && gate.error) return gate.error;

  const addresses = await prisma.address.findMany({
    where: { companyId: gate.companyId },
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
  });

  return NextResponse.json({ addresses, max: MAX_ADDRESSES });
}

export async function POST(request: Request) {
  const gate = await requireCustomerCompany({ write: true });
  if ("error" in gate && gate.error) return gate.error;

  const count = await prisma.address.count({ where: { companyId: gate.companyId } });
  if (count >= MAX_ADDRESSES) {
    return NextResponse.json(
      { error: `Maximum ${MAX_ADDRESSES} addresses per company` },
      { status: 400 },
    );
  }

  const body = await request.json();
  const line1 = String(body.line1 ?? "").trim();
  const city = String(body.city ?? "").trim();
  const postalCode = String(body.postalCode ?? "").trim();
  const country = String(body.country ?? "").trim();

  if (!line1 || !city || !postalCode || !country) {
    return NextResponse.json(
      { error: "Address, city, postal code, and country are required" },
      { status: 400 },
    );
  }

  if (country.toLowerCase().includes("china") || country.toUpperCase() === "CN") {
    return NextResponse.json(
      { error: "Shipping to China is not available" },
      { status: 400 },
    );
  }

  const isDefault = Boolean(body.isDefault) || count === 0;

  if (isDefault) {
    await prisma.address.updateMany({
      where: { companyId: gate.companyId },
      data: { isDefault: false },
    });
  }

  const address = await prisma.address.create({
    data: {
      companyId: gate.companyId,
      label: body.label ? String(body.label).trim() : null,
      line1,
      line2: body.line2 ? String(body.line2).trim() : null,
      city,
      region: body.region ? String(body.region).trim() : null,
      postalCode,
      country,
      isDefault,
    },
  });

  return NextResponse.json({ address }, { status: 201 });
}
