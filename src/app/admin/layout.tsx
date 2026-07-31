import { cookies } from "next/headers";
import { Outfit, Noto_Sans_SC } from "next/font/google";
import { auth, signOut } from "@/lib/auth";
import { canAccessAdmin, navForRole } from "@/lib/rbac";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import {
  ADMIN_LOCALE_COOKIE,
  isAdminLocale,
  type AdminLocale,
} from "@/lib/admin-i18n";
import { AdminSidebarProvider } from "@/components/admin/AdminSidebarContext";
import { AdminI18nProvider } from "@/components/admin/AdminI18n";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { AdminMain } from "@/components/admin/AdminMain";
import "./admin.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  weight: ["400", "500", "600", "700"],
});

const notoSc = Noto_Sans_SC({
  subsets: ["latin"],
  variable: "--font-admin-zh",
  weight: ["400", "500", "600", "700"],
});

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/admin");
  if (!canAccessAdmin(session.user.role)) redirect("/account");

  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get(ADMIN_LOCALE_COOKIE)?.value;
  const initialLocale: AdminLocale = isAdminLocale(cookieLocale)
    ? cookieLocale
    : "zh";

  const items = navForRole(session.user.role);
  const email = session.user.email || session.user.name || "Staff";
  const role = session.user.role;

  const unreadCount = await prisma.notification.count({
    where: { userId: session.user.id, readAt: null },
  });

  async function signOutAction() {
    "use server";
    await signOut({ redirectTo: "/" });
  }

  return (
    <div
      lang={initialLocale === "zh" ? "zh-CN" : "en"}
      className={`admin-shell ${outfit.variable} ${notoSc.variable} ${outfit.className} ${
        initialLocale === "zh" ? "admin-locale-zh" : ""
      }`}
    >
      <AdminSidebarProvider>
        <AdminI18nProvider initialLocale={initialLocale}>
          <AdminSidebar items={items} signOutAction={signOutAction} />
          <AdminMain>
            <AdminHeader
              email={email}
              name={session.user.name}
              role={role}
              unreadCount={unreadCount}
              signOutAction={signOutAction}
            />
            <main className="w-full px-3 py-5 sm:px-4 md:px-5 md:py-6 xl:px-6">
              {children}
            </main>
          </AdminMain>
        </AdminI18nProvider>
      </AdminSidebarProvider>
    </div>
  );
}
