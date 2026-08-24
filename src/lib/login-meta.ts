/** Parse a short device label from User-Agent for the admin Users table. */
export function deviceFromUserAgent(ua: string | null | undefined): string {
  if (!ua) return "—";
  const s = ua.toLowerCase();
  if (/ipad|tablet/.test(s)) return "Tablet";
  if (/mobi|iphone|android/.test(s)) return "Mobile";
  if (/macintosh|mac os/.test(s)) return "Mac";
  if (/windows/.test(s)) return "Windows";
  if (/linux/.test(s)) return "Linux";
  return "Desktop";
}

export function clientIpFromHeaders(h: Headers): string | null {
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first.slice(0, 64);
  }
  const real = h.get("x-real-ip")?.trim();
  if (real) return real.slice(0, 64);
  return null;
}

export function countryFromHeaders(h: Headers): string | null {
  const code =
    h.get("cf-ipcountry") ||
    h.get("x-vercel-ip-country") ||
    h.get("x-country-code");
  if (!code || code === "XX" || code === "T1") return null;
  return code.trim().toUpperCase().slice(0, 8);
}

export async function recordUserLogin(userId: string) {
  try {
    const { headers } = await import("next/headers");
    const h = await headers();
    const ua = h.get("user-agent")?.slice(0, 400) || null;
    await (
      await import("@/lib/db")
    ).prisma.user.update({
      where: { id: userId },
      data: {
        lastLoginAt: new Date(),
        lastLoginIp: clientIpFromHeaders(h),
        lastLoginCountry: countryFromHeaders(h),
        lastLoginUserAgent: ua,
        lastLoginDevice: deviceFromUserAgent(ua),
      },
    });
  } catch (err) {
    console.error("[recordUserLogin]", err);
  }
}
