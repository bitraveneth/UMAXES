import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client.ts";
import { PrismaPg } from "@prisma/adapter-pg";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const u = await prisma.user.findUnique({ where: { email: "admin@umaxes.com" } });
console.log({
  found: Boolean(u),
  role: u?.role,
  status: u?.status,
  pwOk: u ? await bcrypt.compare("Admin1234!", u.passwordHash) : false,
  count: await prisma.user.count(),
});
await prisma.$disconnect();
