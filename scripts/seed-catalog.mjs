import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client.ts";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const flavors = [
  { id: "peach-mango", name: "Peach Mango", price: 34.5, image: "/images/product/01.webp" },
  { id: "watermelon-ice", name: "Watermelon Ice", price: 34.5, image: "/images/product/02.webp" },
  { id: "fcuking-fab", name: "Fcuking Fab", price: 34.5, image: "/images/product/03.webp" },
  { id: "strawberry-watermelon-ice", name: "Strawberry Watermelon Ice", price: 34.5, image: "/images/product/04.webp" },
  { id: "miami-sunset", name: "Miami Sunset", price: 34.5, image: "/images/product/05.webp" },
  { id: "cool-mint", name: "Cool Mint", price: 34.5, image: "/images/product/06.webp" },
  { id: "blue-razz-ice", name: "Blue Razz Ice", price: 34.5, image: "/images/product/07.webp" },
  { id: "grape-ice", name: "Grape Ice", price: 34.5, image: "/images/product/08.webp" },
  { id: "blueberry-ice", name: "Blueberry Ice", price: 34.5, image: "/images/product/09.webp" },
  { id: "love-max", name: "Love Max", price: 34.5, image: "/images/product/10.webp" },
];

function money(n) {
  return Math.round(n * 100) / 100;
}

async function main() {
  for (const f of flavors) {
    const product = await prisma.product.upsert({
      where: { sku: f.id },
      create: {
        sku: f.id,
        name: f.name,
        description: `HOOKAMAX ${f.name}`,
        image: f.image,
        active: true,
        inventory: { create: { quantity: 500, reserved: 0 } },
        prices: {
          create: [
            { level: "DISTRO", unitPrice: money(f.price * 0.7), moq: 50 },
            { level: "WHOLESALER", unitPrice: 8.9, moq: 20 },
            { level: "SHOP", unitPrice: money(f.price), moq: 5 },
          ],
        },
      },
      update: {
        name: f.name,
        image: f.image,
        active: true,
      },
    });

    for (const [level, price, moq] of [
      ["DISTRO", money(f.price * 0.7), 50],
      ["WHOLESALER", 8.9, 20],
      ["SHOP", money(f.price), 5],
    ]) {
      await prisma.priceByLevel.upsert({
        where: {
          productId_level: { productId: product.id, level },
        },
        create: {
          productId: product.id,
          level,
          unitPrice: price,
          moq,
        },
        update: {
          unitPrice: price,
          moq,
        },
      });
    }

    await prisma.inventory.upsert({
      where: { productId: product.id },
      create: { productId: product.id, quantity: 500, reserved: 0 },
      update: {},
    });
  }

  await prisma.coupon.upsert({
    where: { code: "UMAXES10" },
    create: {
      code: "UMAXES10",
      type: "percent",
      value: 10,
      minOrder: 100,
      allowedLevels: ["DISTRO", "WHOLESALER", "SHOP"],
      active: true,
    },
    update: { active: true, value: 10 },
  });

  await prisma.coupon.upsert({
    where: { code: "WELCOME5" },
    create: {
      code: "WELCOME5",
      type: "fixed",
      value: 5,
      minOrder: 50,
      allowedLevels: ["DISTRO", "WHOLESALER", "SHOP"],
      active: true,
    },
    update: { active: true },
  });

  const station = await prisma.product.upsert({
    where: { sku: "test-station" },
    create: {
      sku: "test-station",
      name: "Test Station (incl. 1 device)",
      description: "Free test station kit. Includes 1 HOOKAMAX device.",
      active: true,
      visibleLevels: ["WHOLESALER", "DISTRO"],
      inventory: { create: { quantity: 100000, reserved: 0 } },
      prices: {
        create: [
          { level: "WHOLESALER", unitPrice: 0, moq: 1 },
          { level: "DISTRO", unitPrice: 0, moq: 1 },
          { level: "SHOP", unitPrice: 0, moq: 1 },
        ],
      },
    },
    update: {
      name: "Test Station (incl. 1 device)",
      active: true,
    },
  });
  await prisma.inventory.upsert({
    where: { productId: station.id },
    create: { productId: station.id, quantity: 100000, reserved: 0 },
    update: {},
  });

  await prisma.rebatePolicy.upsert({
    where: { level: "WHOLESALER" },
    create: {
      level: "WHOLESALER",
      active: true,
      unitPrice: 8.9,
      pcsPerCase: 95,
      testStationsPerCase: 1,
      firstOrderCases: 5,
      firstOrderUnpaidPcs: 20,
      timezone: "America/Los_Angeles",
      tiers: [
        { minQty: 5000, rateUsd: 0.2 },
        { minQty: 10000, rateUsd: 0.4 },
        { minQty: 20000, rateUsd: 0.6 },
      ],
    },
    update: {},
  });
  await prisma.rebatePolicy.upsert({
    where: { level: "DISTRO" },
    create: {
      level: "DISTRO",
      active: false,
      unitPrice: null,
      pcsPerCase: 95,
      testStationsPerCase: 1,
      firstOrderCases: 5,
      firstOrderUnpaidPcs: 20,
      timezone: "America/Los_Angeles",
      tiers: [],
    },
    update: {},
  });

  console.log("Catalog seeded:", flavors.length, "products + coupons + rebate SOP");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
