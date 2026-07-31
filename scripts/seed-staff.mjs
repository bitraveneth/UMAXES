import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client.ts";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

/** 5 Sales · 6 Logistics (warehouse kept for legacy scripts, not on demo login strip) */
const staff = [
  { email: "sales@umaxes.com", role: "SALES", name: "Sales User" },
  { email: "logistics@umaxes.com", role: "LOGISTICS", name: "Logistics User" },
  { email: "warehouse@umaxes.com", role: "WAREHOUSE", name: "Warehouse User" },
];

async function main() {
  const password = "Staff1234!";
  const passwordHash = await bcrypt.hash(password, 12);

  for (const s of staff) {
    await prisma.user.upsert({
      where: { email: s.email },
      create: {
        email: s.email,
        name: s.name,
        passwordHash,
        role: s.role,
        status: "APPROVED",
      },
      update: {
        passwordHash,
        role: s.role,
        status: "APPROVED",
        name: s.name,
      },
    });
    console.log("Staff ready:", s.email, s.role);
  }

  console.log("Shared password:", password);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
