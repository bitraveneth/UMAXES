import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import type {
  CompanyMemberRole,
  CustomerLevel,
  UserRole,
  UserStatus,
} from "@/generated/prisma/enums";

declare module "next-auth" {
  interface User {
    role: UserRole;
    status: UserStatus;
    companyId: string | null;
    companyLevel: CustomerLevel | null;
    companyRole: CompanyMemberRole | null;
    /** Super-admin id when this session is an impersonation */
    impersonatedBy?: string | null;
  }

  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      role: UserRole;
      status: UserStatus;
      companyId: string | null;
      companyLevel: CustomerLevel | null;
      companyRole: CompanyMemberRole | null;
      impersonatedBy?: string | null;
    };
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    role?: UserRole;
    status?: UserStatus;
    companyId?: string | null;
    companyLevel?: CustomerLevel | null;
    companyRole?: CompanyMemberRole | null;
    impersonatedBy?: string | null;
  }
}

function sessionUserFromDb(user: {
  id: string;
  name: string | null;
  email: string | null;
  role: UserRole;
  status: UserStatus;
  companyId: string | null;
  companyRole: CompanyMemberRole | null;
  company: { level: CustomerLevel } | null;
}, impersonatedBy?: string | null) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    companyId: user.companyId,
    companyLevel: user.company?.level ?? null,
    companyRole: user.companyRole,
    impersonatedBy: impersonatedBy ?? null,
  };
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      id: "credentials",
      name: "credentials",
      credentials: {
        identifier: { label: "Email or phone", type: "text" },
        password: { label: "Password", type: "password" },
        altcha: { label: "Captcha", type: "text" },
      },
      async authorize(credentials) {
        try {
          const { verifyAltchaPayload } = await import("@/lib/altcha");
          const captcha = await verifyAltchaPayload(credentials?.altcha);
          if (!captcha.ok) return null;

          const raw = String(credentials?.identifier ?? "").trim();
          const password = String(credentials?.password ?? "");
          if (!raw || !password) return null;

          const { toE164 } = await import("@/lib/twilio");
          const asPhone = toE164(raw);
          const identifier = raw.includes("@")
            ? raw.toLowerCase()
            : (asPhone ?? raw.toLowerCase());

          const user = await prisma.user.findFirst({
            where: {
              OR: [
                { email: identifier },
                { phone: identifier },
                ...(asPhone && asPhone !== identifier ? [{ phone: asPhone }] : []),
              ],
            },
            include: { company: true },
          });

          if (!user || user.status === "DISABLED" || user.status === "REJECTED") {
            return null;
          }

          const { getSiteSettings, isStaffRole } = await import(
            "@/lib/site-settings"
          );
          const settings = await getSiteSettings();
          if (!settings.publicSignInEnabled && !isStaffRole(user.role)) {
            return null;
          }

          const valid = await bcrypt.compare(password, user.passwordHash);
          if (!valid) return null;

          const { recordUserLogin } = await import("@/lib/login-meta");
          void recordUserLogin(user.id);

          return sessionUserFromDb(user);
        } catch (err) {
          console.error("[auth.authorize]", err);
          return null;
        }
      },
    }),
    Credentials({
      id: "impersonate",
      name: "Impersonate",
      credentials: {
        token: { label: "Token", type: "text" },
      },
      async authorize(credentials) {
        try {
          const { verifyImpersonationToken } = await import(
            "@/lib/impersonation"
          );
          const payload = verifyImpersonationToken(
            String(credentials?.token ?? ""),
          );
          if (!payload) return null;

          const admin = await prisma.user.findUnique({
            where: { id: payload.adminId },
            select: { id: true, role: true, status: true },
          });
          if (
            !admin ||
            admin.role !== "SUPER_ADMIN" ||
            admin.status === "DISABLED"
          ) {
            return null;
          }

          if (payload.typ === "start") {
            const target = await prisma.user.findUnique({
              where: { id: payload.targetId },
              include: { company: true },
            });
            if (!target || target.role !== "CUSTOMER") return null;
            if (target.status === "DISABLED" || target.status === "REJECTED") {
              return null;
            }
            return sessionUserFromDb(target, admin.id);
          }

          // restore → back to super admin
          if (payload.targetId !== payload.adminId) return null;
          const restored = await prisma.user.findUnique({
            where: { id: payload.adminId },
            include: { company: true },
          });
          if (!restored || restored.role !== "SUPER_ADMIN") return null;
          return sessionUserFromDb(restored, null);
        } catch (err) {
          console.error("[auth.impersonate]", err);
          return null;
        }
      },
    }),
  ],
  session: { strategy: "jwt" },
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.status = user.status;
        token.companyId = user.companyId;
        token.companyLevel = user.companyLevel;
        token.companyRole = user.companyRole;
        token.sub = user.id;
        // Must delete (not only null) so restore clears the banner claim
        if (user.impersonatedBy) {
          token.impersonatedBy = user.impersonatedBy;
        } else {
          delete token.impersonatedBy;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.role = (token.role as UserRole) ?? "CUSTOMER";
        session.user.status = (token.status as UserStatus) ?? "PENDING";
        session.user.companyId = (token.companyId as string | null) ?? null;
        session.user.companyLevel =
          (token.companyLevel as CustomerLevel | null) ?? null;
        session.user.companyRole =
          (token.companyRole as CompanyMemberRole | null) ?? null;
        session.user.impersonatedBy = token.impersonatedBy ?? null;
      }
      return session;
    },
  },
});
