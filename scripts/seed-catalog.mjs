import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client.ts";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const flavors = [
  { id: "peach-mango", name: "Peach Mango", price: 29, image: "/images/product/01.webp" },
  { id: "watermelon-ice", name: "Watermelon Ice", price: 29, image: "/images/product/02.webp" },
  { id: "fcuking-fab", name: "Fcuking Fab", price: 32, image: "/images/product/03.webp" },
  { id: "strawberry-watermelon-ice", name: "Strawberry Watermelon Ice", price: 32, image: "/images/product/04.webp" },
  { id: "miami-sunset", name: "Miami Sunset", price: 29, image: "/images/product/05.webp" },
  { id: "cool-mint", name: "Cool Mint", price: 27, image: "/images/product/06.webp" },
  { id: "blue-razz-ice", name: "Blue Razz Ice", price: 32, image: "/images/product/07.webp" },
  { id: "grape-ice", name: "Grape Ice", price: 29, image: "/images/product/08.webp" },
  { id: "blueberry-ice", name: "Blueberry Ice", price: 35, image: "/images/product/09.webp" },
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
            { level: "WHOLESALER", unitPrice: money(f.price * 0.85), moq: 20 },
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

    for (const [level, mult, moq] of [
      ["DISTRO", 0.7, 50],
      ["WHOLESALER", 0.85, 20],
      ["SHOP", 1, 5],
    ]) {
      await prisma.priceByLevel.upsert({
        where: {
          productId_level: { productId: product.id, level },
        },
        create: {
          productId: product.id,
          level,
          unitPrice: money(f.price * mult),
          moq,
        },
        update: {
          unitPrice: money(f.price * mult),
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

  console.log("Catalog seeded:", flavors.length, "products + coupons");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
