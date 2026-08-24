import { createHmac, timingSafeEqual } from "crypto";

export type ImpersonationTokenPayload = {
  v: 1;
  /** Start viewing as customer, or restore the super-admin session */
  typ: "start" | "restore";
  adminId: string;
  targetId: string;
  exp: number;
};

function secret() {
  const s = process.env.AUTH_SECRET;
  if (!s) throw new Error("AUTH_SECRET is not set");
  return s;
}

function sign(body: string) {
  return createHmac("sha256", secret()).update(body).digest("base64url");
}

export function createImpersonationToken(
  input: Omit<ImpersonationTokenPayload, "v" | "exp"> & { ttlSec?: number },
): string {
  const payload: ImpersonationTokenPayload = {
    v: 1,
    typ: input.typ,
    adminId: input.adminId,
    targetId: input.targetId,
    exp: Math.floor(Date.now() / 1000) + (input.ttlSec ?? 120),
  };
  const body = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  return `${body}.${sign(body)}`;
}

export function verifyImpersonationToken(
  token: string,
): ImpersonationTokenPayload | null {
  try {
    const [body, sig] = token.split(".");
    if (!body || !sig) return null;
    const expected = sign(body);
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
    const payload = JSON.parse(
      Buffer.from(body, "base64url").toString("utf8"),
    ) as ImpersonationTokenPayload;
    if (payload.v !== 1) return null;
    if (payload.typ !== "start" && payload.typ !== "restore") return null;
    if (!payload.adminId || !payload.targetId) return null;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}
