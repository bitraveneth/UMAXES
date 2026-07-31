import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client.ts";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const warehouses = [
    { code: "US-EAST", name: "East Coast DC" },
    { code: "US-WEST", name: "West Coast DC" },
  ];

  for (const wh of warehouses) {
    await prisma.warehouse.upsert({
      where: { code: wh.code },
      create: { ...wh, active: true },
      update: { name: wh.name, active: true },
    });
  }

  const products = await prisma.product.findMany();
  const whRows = await prisma.warehouse.findMany();

  for (const wh of whRows) {
    for (const p of products) {
      await prisma.warehouseStock.upsert({
        where: {
          warehouseId_productId: { warehouseId: wh.id, productId: p.id },
        },
        create: {
          warehouseId: wh.id,
          productId: p.id,
          quantity: 200,
          reserved: 0,
        },
        update: {},
      });
    }
  }

  console.log("Warehouses seeded:", warehouses.length);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
