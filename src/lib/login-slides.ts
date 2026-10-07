import { prisma } from "@/lib/db";
import { loginImages } from "@/lib/assets";

export type LoginSlideRow = {
  id: string;
  imageUrl: string;
  sortOrder: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
};

/** Active slides in display order; falls back to bundled assets when none exist. */
export async function getLoginSlideUrls(): Promise<string[]> {
  try {
    const rows = await prisma.loginSlide.findMany({
      where: { active: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      select: { imageUrl: true },
    });
    if (rows.length > 0) return rows.map((r) => r.imageUrl);
  } catch {
    // DB not migrated yet — use static fallback
  }
  return [...loginImages];
}

export async function listAllLoginSlides(): Promise<LoginSlideRow[]> {
  return prisma.loginSlide.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
}

/** Seed bundled login images when the table is empty (first open / after migrate). */
export async function ensureDefaultLoginSlides() {
  const count = await prisma.loginSlide.count();
  if (count > 0) return;

  await prisma.loginSlide.createMany({
    data: loginImages.map((imageUrl, i) => ({
      imageUrl,
      sortOrder: i + 1,
      active: true,
    })),
  });
}
