import "dotenv/config";
import { prisma } from "../src/lib/db";

async function main() {
  const result = await prisma.order.updateMany({
    where: { status: "PICKING" },
    data: { status: "SENT_TO_SUPPLIER" },
  });
  console.log(`Migrated ${result.count} PICKING → SENT_TO_SUPPLIER`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
