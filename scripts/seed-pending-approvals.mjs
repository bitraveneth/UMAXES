/**
 * Seed pending buyer applications for Approvals UI preview.
 * Run: npx tsx scripts/seed-pending-approvals.mjs
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client.ts";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const PREFIX = "UMX-APPR-";
const PW = "Demo1234!";

const APPLICANTS = [
  {
    key: "neon",
    company: "Neon Vapor Co",
    level: "WHOLESALER",
    taxId: "82-4412901",
    name: "Mia Chen",
    email: "mia@neonvapor.demo",
    phone: "+1 213 555 2201",
    address: {
      recipientName: "Mia Chen",
      phone: "+1 213 555 2201",
      line1: "410 Spring St",
      city: "Los Angeles",
      region: "CA",
      postalCode: "90013",
      country: "US",
    },
  },
  {
    key: "harbor",
    company: "Harbor Distro Group",
    level: "DISTRO",
    taxId: "91-8823410",
    name: "James Ortiz",
    email: "james@harbordistro.demo",
    phone: "+1 562 555 3344",
    address: {
      recipientName: "James Ortiz",
      phone: "+1 562 555 3344",
      line1: "900 Pier Ave",
      city: "Long Beach",
      region: "CA",
      postalCode: "90813",
      country: "US",
    },
  },
  {
    key: "corner",
    company: "Corner Cloud Shop",
    level: "SHOP",
    taxId: null,
    name: "Sam Rivera",
    email: "sam@cornercloud.demo",
    phone: "+1 415 555 7788",
    address: {
      recipientName: "Sam Rivera",
      phone: "+1 415 555 7788",
      line1: "88 Market St",
      city: "San Francisco",
      region: "CA",
      postalCode: "94105",
      country: "US",
    },
  },
  {
    key: "desert",
    company: "Desert Peak Wholesale",
    level: "WHOLESALER",
    taxId: "45-1199220",
    name: "Ava Brooks",
    email: "ava@desertpeak.demo",
    phone: "+1 702 555 9012",
    address: {
      recipientName: "Ava Brooks",
      phone: "+1 702 555 9012",
      line1: "220 Las Vegas Blvd",
      city: "Las Vegas",
      region: "NV",
      postalCode: "89101",
      country: "US",
    },
  },
];

async function upsertPending(app) {
  const email = app.email.toLowerCase();
  const passwordHash = await bcrypt.hash(PW, 12);

  let company = await prisma.company.findFirst({
    where: { name: app.company },
  });
  if (!company) {
    company = await prisma.company.create({
      data: {
        name: app.company,
        status: "PENDING",
        level: app.level,
        taxId: app.taxId,
        creditLimit: 0,
        creditUsed: 0,
        paymentTermsDays: 0,
      },
    });
  } else {
    company = await prisma.company.update({
      where: { id: company.id },
      data: {
        status: "PENDING",
        level: app.level,
        taxId: app.taxId,
      },
    });
  }

  const user = await prisma.user.upsert({
    where: { email },
    create: {
      email,
      name: app.name,
      phone: app.phone,
      passwordHash,
      role: "CUSTOMER",
      companyRole: "OWNER",
      status: "PENDING",
      companyId: company.id,
    },
    update: {
      name: app.name,
      phone: app.phone,
      passwordHash,
      role: "CUSTOMER",
      companyRole: "OWNER",
      status: "PENDING",
      companyId: company.id,
    },
  });

  const existingAddr = await prisma.address.findFirst({
    where: { companyId: company.id },
  });
  if (!existingAddr) {
    await prisma.address.create({
      data: {
        companyId: company.id,
        label: "HQ",
        isDefault: true,
        ...app.address,
      },
    });
  }

  return { company: company.name, email: user.email, level: app.level };
}

async function main() {
  const results = [];
  for (const app of APPLICANTS) {
    results.push(await upsertPending(app));
  }

  // Keep classic demo pending too
  const passwordHash = await bcrypt.hash(PW, 12);
  let pendingCo = await prisma.company.findFirst({
    where: { name: "Pending Smoke Shop LLC" },
  });
  if (!pendingCo) {
    pendingCo = await prisma.company.create({
      data: {
        name: "Pending Smoke Shop LLC",
        status: "PENDING",
        level: "SHOP",
      },
    });
  } else {
    await prisma.company.update({
      where: { id: pendingCo.id },
      data: { status: "PENDING", level: "SHOP" },
    });
  }
  await prisma.user.upsert({
    where: { email: "pending@demo.umaxes.com" },
    create: {
      email: "pending@demo.umaxes.com",
      name: "Awaiting Approval",
      phone: "+1 310 555 0199",
      passwordHash,
      role: "CUSTOMER",
      companyRole: "OWNER",
      status: "PENDING",
      companyId: pendingCo.id,
    },
    update: {
      passwordHash,
      status: "PENDING",
      companyId: pendingCo.id,
      name: "Awaiting Approval",
      phone: "+1 310 555 0199",
    },
  });

  const pendingCount = await prisma.user.count({
    where: { status: "PENDING", role: "CUSTOMER" },
  });

  console.log(`Pending approvals seeded (${PREFIX}):`);
  for (const r of results) {
    console.log(`  ${r.company} · ${r.email} · ${r.level}`);
  }
  console.log(`  Pending Smoke Shop LLC · pending@demo.umaxes.com · SHOP`);
  console.log(`Total pending CUSTOMER users: ${pendingCount}`);
  console.log(`Login password for demo applicants: ${PW}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
