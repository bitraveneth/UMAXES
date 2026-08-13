import { NextResponse } from "next/server";
import type { PaymentMethod } from "@/generated/prisma/enums";
import { auth } from "@/lib/auth";
import { getCatalogForLevel } from "@/lib/catalog";
import { createOrder } from "@/lib/create-order";
import { prisma } from "@/lib/db";
import { assertStaffOwnsCompany } from "@/lib/sales-scope";

async function requireOrderDesk() {
  const session = await auth();
  if (!session?.user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  if (
    session.user.role !== "ADMIN" &&
    session.user.role !== "SUPER_ADMIN" &&
    session.user.role !== "SALES"
  ) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { session };
}

/** Load company context for staff order desk: addresses + level catalog + credit. */
export async function GET(request: Request) {
  const gate = await requireOrderDesk();
  if ("error" in gate && gate.error) return gate.error;
  const { session } = gate;

  const companyId = new URL(request.url).searchParams.get("companyId");
  if (!companyId) {
    return NextResponse.json({ error: "companyId required" }, { status: 400 });
  }

  const company = await prisma.company.findUnique({
    where: { id: companyId },
    include: {
      addresses: {
        orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
      },
      users: {
        where: { role: "CUSTOMER", status: "APPROVED" },
        orderBy: [{ companyRole: "asc" }, { createdAt: "asc" }],
        take: 5,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          companyRole: true,
        },
      },
    },
  });

  if (!company) {
    return NextResponse.json({ error: "Company not found" }, { status: 404 });
  }

  const owned = await assertStaffOwnsCompany(
    session.user.role,
    session.user.id,
    company.salesRepId,
  );
  if (!owned.ok) {
    return NextResponse.json({ error: owned.error }, { status: owned.status });
  }

  if (company.status !== "APPROVED") {
    return NextResponse.json(
      { error: "Company is not approved" },
      { status: 400 },
    );
  }

  const catalog = await getCatalogForLevel(company.level);
  const creditAvailable = Math.max(
    0,
    company.creditLimit - company.creditUsed,
  );
  const creditAllowed =
    company.level !== "SHOP" &&
    company.paymentTermsDays >= 1 &&
    company.creditLimit > 0;

  return NextResponse.json({
    company: {
      id: company.id,
      name: company.name,
      level: company.level,
      creditLimit: company.creditLimit,
      creditUsed: company.creditUsed,
      creditAvailable,
      paymentTermsDays: company.paymentTermsDays,
      creditAllowed,
    },
    addresses: company.addresses,
    contacts: company.users,
    catalog,
  });
}

/** Staff places order on behalf of a customer company. */
export async function POST(request: Request) {
  const gate = await requireOrderDesk();
  if ("error" in gate && gate.error) return gate.error;
  const { session } = gate;

  const body = await request.json();
  const companyId = String(body.companyId ?? "");
  if (!companyId) {
    return NextResponse.json({ error: "companyId required" }, { status: 400 });
  }

  const company = await prisma.company.findUnique({
    where: { id: companyId },
    include: {
      users: {
        where: { role: "CUSTOMER", status: "APPROVED" },
        orderBy: [{ companyRole: "asc" }, { createdAt: "asc" }],
        take: 5,
      },
    },
  });
  if (!company || company.status !== "APPROVED") {
    return NextResponse.json(
      { error: "Approved company required" },
      { status: 400 },
    );
  }

  const owned = await assertStaffOwnsCompany(
    session.user.role,
    session.user.id,
    company.salesRepId,
  );
  if (!owned.ok) {
    return NextResponse.json({ error: owned.error }, { status: owned.status });
  }

  const contact =
    company.users.find((u) => u.companyRole === "OWNER") || company.users[0];

  if (!contact) {
    return NextResponse.json(
      { error: "Company has no approved contact user" },
      { status: 400 },
    );
  }

  const result = await createOrder({
    companyId: company.id,
    customerUserId: contact.id,
    customerEmail: contact.email,
    customerPhone: contact.phone,
    addressId: String(body.addressId ?? ""),
    paymentMethod: String(
      body.paymentMethod ?? "",
    ).toUpperCase() as PaymentMethod,
    items: Array.isArray(body.items) ? body.items : [],
    couponCode: body.couponCode ? String(body.couponCode) : undefined,
    paymentRef: body.paymentRef ? String(body.paymentRef) : undefined,
    notes: body.notes ? String(body.notes) : undefined,
    placedByStaffId: session.user.id,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ order: result.order }, { status: 201 });
}
