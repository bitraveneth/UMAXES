/**
 * One-off local fix: auto-approve self-registered SHOP accounts
 * that were left PENDING under the old approval rule.
 */
import { config } from "dotenv";

config({ path: ".env" });
config({ path: ".env.local", override: true });

async function main() {
  const { prisma } = await import("../src/lib/db");

  const pending = await prisma.user.findMany({
    where: { status: "PENDING", role: "CUSTOMER" },
    include: { company: true },
  });

  const shopPending = pending.filter(
    (u) => !u.company || u.company.level === "SHOP",
  );

  console.log(
    "pending customers:",
    pending.map((u) => ({
      email: u.email,
      phone: u.phone,
      level: u.company?.level,
    })),
  );

  for (const u of shopPending) {
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: u.id },
        data: { status: "APPROVED" },
      });
      if (u.companyId) {
        await tx.company.update({
          where: { id: u.companyId },
          data: {
            status: "APPROVED",
            level: "SHOP",
            creditLimit: 0,
            paymentTermsDays: 0,
          },
        });
      }
    });
  }

  console.log(`auto-approved shop pending: ${shopPending.length}`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
