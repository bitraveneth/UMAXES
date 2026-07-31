import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client.ts";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

/** Keep DB assets in sync with the public media kit files. */
const assets = [
  {
    title: "UMAXES logo — orange on cream",
    description: "Primary logo for light backgrounds.",
    fileUrl: "/images/logo/orange-on-cream.png",
    category: "logo",
  },
  {
    title: "UMAXES logo — cream on ink",
    description: "Logo for dark backgrounds.",
    fileUrl: "/images/logo/cream-on-ink.png",
    category: "logo",
  },
  {
    title: "UMAXES logo — cream on orange",
    description: "Logo for orange campaign panels.",
    fileUrl: "/images/logo/cream-on-orange.png",
    category: "logo",
  },
  {
    title: "UMAXES logo — SVG",
    description: "Scalable orange wordmark.",
    fileUrl: "/images/logo/umaxes-orange.svg",
    category: "logo",
  },
  {
    title: "Brand colors — JSON",
    description: "Hex + CSS tokens for design tools.",
    fileUrl: "/brand/umaxes-colors.json",
    category: "color",
  },
  {
    title: "Brand colors — CSS",
    description: "CSS custom properties file.",
    fileUrl: "/brand/umaxes-colors.css",
    category: "color",
  },
  {
    title: "HOOKAMAX pack shot set",
    description: "Product pack imagery for POS and menus.",
    fileUrl: "/images/product/pack-01.webp",
    category: "pos",
  },
  {
    title: "Device duo",
    description: "Lifestyle device visual.",
    fileUrl: "/images/product/device-duo.webp",
    category: "pos",
  },
  {
    title: "Device — transparent",
    description: "Product cutout for flyers.",
    fileUrl: "/images/product/device-transparent.png",
    category: "pos",
  },
];

async function main() {
  for (const a of assets) {
    const existing = await prisma.brandAsset.findFirst({
      where: { title: a.title },
    });
    if (existing) {
      await prisma.brandAsset.update({
        where: { id: existing.id },
        data: { ...a, active: true },
      });
    } else {
      await prisma.brandAsset.create({ data: { ...a, active: true } });
    }
  }
  console.log("Brand assets seeded:", assets.length);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
