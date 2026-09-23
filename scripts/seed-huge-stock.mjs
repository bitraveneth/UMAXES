import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client.ts";
import { PrismaPg } from "@prisma/adapter-pg";

const QTY = 999_999;

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const products = await prisma.product.findMany({
    select: { id: true, sku: true, name: true },
    orderBy: { sku: "asc" },
  });

  for (const p of products) {
    await prisma.inventory.upsert({
      where: { productId: p.id },
      create: { productId: p.id, quantity: QTY, reserved: 0 },
      update: { quantity: QTY, reserved: 0 },
    });
  }

  const wh = await prisma.warehouseStock.updateMany({
    data: { quantity: QTY },
  });

  const rows = await prisma.inventory.findMany({
    include: { product: { select: { sku: true, name: true } } },
    orderBy: { product: { sku: "asc" } },
  });

  console.log(`Stock seeded: ${rows.length} products @ ${QTY.toLocaleString()} pcs each (reserved cleared)`);
  console.log(`Warehouse stock rows updated: ${wh.count}`);
  for (const r of rows) {
    console.log(`  ${r.product.sku.padEnd(22)} ${r.quantity.toLocaleString()} pcs`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
