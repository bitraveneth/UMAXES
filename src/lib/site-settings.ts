import { prisma } from "@/lib/db";

export const SITE_SETTING_KEYS = {
  homepageAsLogin: "homepageAsLogin",
  publicSignInEnabled: "publicSignInEnabled",
} as const;

export type SiteSettings = {
  /** When true, `/` redirects to `/login`. */
  homepageAsLogin: boolean;
  /** When false, shop/public users cannot sign in or register. Staff can still sign in. */
  publicSignInEnabled: boolean;
};

const DEFAULTS: SiteSettings = {
  homepageAsLogin: false,
  publicSignInEnabled: true,
};

function parseBool(raw: string | undefined | null, fallback: boolean) {
  if (raw == null || raw === "") return fallback;
  return raw === "1" || raw.toLowerCase() === "true";
}

export async function getSiteSettings(): Promise<SiteSettings> {
  try {
    const rows = await prisma.siteSetting.findMany({
      where: {
        key: {
          in: [
            SITE_SETTING_KEYS.homepageAsLogin,
            SITE_SETTING_KEYS.publicSignInEnabled,
          ],
        },
      },
    });
    const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
    return {
      homepageAsLogin: parseBool(
        map[SITE_SETTING_KEYS.homepageAsLogin],
        DEFAULTS.homepageAsLogin,
      ),
      publicSignInEnabled: parseBool(
        map[SITE_SETTING_KEYS.publicSignInEnabled],
        DEFAULTS.publicSignInEnabled,
      ),
    };
  } catch {
    return { ...DEFAULTS };
  }
}

export async function setSiteSettings(
  patch: Partial<SiteSettings>,
): Promise<SiteSettings> {
  const ops: Promise<unknown>[] = [];
  if (typeof patch.homepageAsLogin === "boolean") {
    ops.push(
      prisma.siteSetting.upsert({
        where: { key: SITE_SETTING_KEYS.homepageAsLogin },
        create: {
          key: SITE_SETTING_KEYS.homepageAsLogin,
          value: patch.homepageAsLogin ? "true" : "false",
        },
        update: { value: patch.homepageAsLogin ? "true" : "false" },
      }),
    );
  }
  if (typeof patch.publicSignInEnabled === "boolean") {
    ops.push(
      prisma.siteSetting.upsert({
        where: { key: SITE_SETTING_KEYS.publicSignInEnabled },
        create: {
          key: SITE_SETTING_KEYS.publicSignInEnabled,
          value: patch.publicSignInEnabled ? "true" : "false",
        },
        update: { value: patch.publicSignInEnabled ? "true" : "false" },
      }),
    );
  }
  await Promise.all(ops);
  return getSiteSettings();
}

const STAFF_ROLES = new Set([
  "SUPER_ADMIN",
  "ADMIN",
  "SALES",
  "WAREHOUSE",
  "LOGISTICS",
]);

export function isStaffRole(role: string | null | undefined) {
  return Boolean(role && STAFF_ROLES.has(role));
}
