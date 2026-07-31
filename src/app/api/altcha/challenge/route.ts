import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    // Dynamic import avoids Turbopack failing to register this route when
    // altcha-lib is evaluated at module load time during cold compile.
    const { altchaChallengeHandler } = await import("@/lib/altcha");
    return altchaChallengeHandler(request);
  } catch (error) {
    console.error("[altcha/challenge]", error);
    return NextResponse.json(
      {
        error: "Challenge generation failed",
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
