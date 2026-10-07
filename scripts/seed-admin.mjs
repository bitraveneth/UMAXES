import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client.ts";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function upsertStaff({ email, name, password, role }) {
  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.upsert({
    where: { email },
    create: {
      email,
      name,
      passwordHash,
      role,
      status: "APPROVED",
    },
    update: {
      passwordHash,
      role,
      status: "APPROVED",
      name,
    },
  });
  console.log("Ready:", email, role);
}

async function main() {
  await upsertStaff({
    email: "info@umaxesvape.com",
    name: "UMAXES Super Admin",
    password: "Super1234!",
    role: "SUPER_ADMIN",
  });
  await upsertStaff({
    email: "admin@umaxes.com",
    name: "UMAXES Admin",
    password: "Admin1234!",
    role: "ADMIN",
  });
  // Remove legacy demo super email if present
  await prisma.user.deleteMany({
    where: { email: "super@umaxes.com" },
  });
  console.log("\n1 Super: info@umaxesvape.com / Super1234!");
  console.log("2 Admin:  admin@umaxes.com / Admin1234!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
