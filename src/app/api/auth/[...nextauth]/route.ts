import type { NextRequest } from "next/server";

/**
 * Dynamic import keeps Turbopack from dropping this catch-all when
 * `@/lib/auth` (Prisma / bcrypt) is evaluated at module load time.
 * Same pattern as `/api/altcha/challenge`.
 */
export async function GET(request: NextRequest) {
  const { handlers } = await import("@/lib/auth");
  return handlers.GET(request);
}

export async function POST(request: NextRequest) {
  const { handlers } = await import("@/lib/auth");
  return handlers.POST(request);
}
