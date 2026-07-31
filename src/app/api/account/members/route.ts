import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import type { CompanyMemberRole } from "@/generated/prisma/enums";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

async function requireOwner() {
  const session = await auth();
  if (!session?.user?.companyId || session.user.role !== "CUSTOMER") {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  if (session.user.status !== "APPROVED") {
    return { error: NextResponse.json({ error: "Pending approval" }, { status: 403 }) };
  }

  const me = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!me || (me.companyRole && me.companyRole !== "OWNER")) {
    // Legacy users without companyRole treated as owner if they registered the company
    if (me && !me.companyRole) {
      return { session, companyId: session.user.companyId, me };
    }
    return {
      error: NextResponse.json(
        { error: "Only company owners can manage sub-accounts" },
        { status: 403 },
      ),
    };
  }
  return { session, companyId: session.user.companyId, me };
}

export async function GET() {
  const gate = await requireOwner();
  if ("error" in gate && gate.error) return gate.error;

  const members = await prisma.user.findMany({
    where: { companyId: gate.companyId, role: "CUSTOMER" },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      companyRole: true,
      status: true,
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ members });
}

export async function POST(request: Request) {
  const gate = await requireOwner();
  if ("error" in gate && gate.error) return gate.error;

  const body = await request.json();
  const name = String(body.name ?? "").trim();
  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");
  const companyRole = String(body.companyRole ?? "BUYER").toUpperCase() as CompanyMemberRole;

  if (!name || !email || password.length < 8) {
    return NextResponse.json(
      { error: "Name, email, and password (8+) are required" },
      { status: 400 },
    );
  }
  if (!["BUYER", "FINANCE"].includes(companyRole)) {
    return NextResponse.json(
      { error: "companyRole must be BUYER or FINANCE" },
      { status: 400 },
    );
  }

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) {
    return NextResponse.json({ error: "Email already in use" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const member = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role: "CUSTOMER",
      companyRole,
      status: "APPROVED",
      companyId: gate.companyId,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: gate.session.user.id,
      action: "SUBACCOUNT_CREATED",
      entity: "User",
      entityId: member.id,
      meta: JSON.stringify({ companyRole }),
    },
  });

  return NextResponse.json({
    member: {
      id: member.id,
      name: member.name,
      email: member.email,
      companyRole: member.companyRole,
    },
  }, { status: 201 });
}
