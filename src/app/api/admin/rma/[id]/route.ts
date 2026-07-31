import { NextResponse } from "next/server";
import type { RmaStatus } from "@/generated/prisma/enums";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user || !["SUPER_ADMIN", "ADMIN", "SALES"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const status = String(body.status ?? "").toUpperCase() as RmaStatus;
  const adminNote = body.adminNote ? String(body.adminNote) : undefined;
  const creditAmount =
    body.creditAmount !== undefined ? Number(body.creditAmount) : undefined;

  const allowed: RmaStatus[] = [
    "APPROVED",
    "REJECTED",
    "RECEIVED",
    "CREDITED",
    "CLOSED",
  ];
  if (!allowed.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const rma = await prisma.rma.findUnique({ where: { id } });
  if (!rma) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updated = await prisma.$transaction(async (tx) => {
    const row = await tx.rma.update({
      where: { id },
      data: {
        status,
        adminNote,
        creditAmount: creditAmount ?? rma.creditAmount,
      },
      include: { items: true, company: true },
    });

    if (status === "CREDITED" && creditAmount && creditAmount > 0) {
      await tx.company.update({
        where: { id: rma.companyId },
        data: { creditUsed: { decrement: creditAmount } },
      });
      await tx.creditLedger.create({
        data: {
          companyId: rma.companyId,
          orderId: rma.orderId,
          type: "rma_credit",
          amount: -creditAmount,
          note: `RMA ${rma.rmaNumber}`,
        },
      });
    }

    await tx.auditLog.create({
      data: {
        userId: session.user.id,
        action: "RMA_STATUS",
        entity: "Rma",
        entityId: id,
        meta: JSON.stringify({ status, creditAmount, adminNote }),
      },
    });

    return row;
  });

  return NextResponse.json({ rma: updated });
}
