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
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
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

          const valid = await bcrypt.compare(password, user.passwordHash);
          if (!valid) return null;

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            status: user.status,
            companyId: user.companyId,
            companyLevel: user.company?.level ?? null,
            companyRole: user.companyRole,
          };
        } catch (err) {
          console.error("[auth.authorize]", err);
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
      }
      return session;
    },
  },
});
