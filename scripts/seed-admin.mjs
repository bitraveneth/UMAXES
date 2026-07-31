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
    email: "super@umaxes.com",
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
  console.log("\n1 Super: super@umaxes.com / Super1234!");
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
