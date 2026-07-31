import { cookies } from "next/headers";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AccountShell from "@/components/account/AccountShell";
import { BuyerI18nProvider } from "@/components/account/BuyerI18n";
import { auth, signOut } from "@/lib/auth";
import { isStaff } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import {
  BUYER_LOCALE_COOKIE,
  isBuyerLocale,
  type BuyerLocale,
} from "@/lib/buyer-i18n";

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // Unauthenticated / staff / pending / rejected: child pages own their chrome
  if (
    !session?.user ||
    isStaff(session.user.role) ||
    session.user.status === "PENDING" ||
    session.user.status === "REJECTED" ||
    session.user.status === "DISABLED"
  ) {
    return children;
  }

  let companyName: string | null = null;
  let image: string | null = null;
  if (session.user.companyId || session.user.id) {
    const row = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        image: true,
        company: { select: { name: true } },
      },
    });
    companyName = row?.company?.name ?? null;
    image = row?.image ?? null;
  }

  const cookieStore = await cookies();
  const rawLocale = cookieStore.get(BUYER_LOCALE_COOKIE)?.value;
  const initialLocale: BuyerLocale = isBuyerLocale(rawLocale) ? rawLocale : "en";

  async function signOutAction() {
    "use server";
    await signOut({ redirectTo: "/" });
  }

  return (
    <>
      <Header />
      <BuyerI18nProvider initialLocale={initialLocale}>
        <AccountShell
          user={{
            name: session.user.name,
            email: session.user.email,
            companyLevel: session.user.companyLevel,
            companyName,
            image,
          }}
          signOutAction={signOutAction}
        >
          {children}
        </AccountShell>
      </BuyerI18nProvider>
      <Footer />
    </>
  );
}
