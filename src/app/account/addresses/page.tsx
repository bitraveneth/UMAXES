import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import AddressManager from "@/components/AddressManager";
import AccountHeaderI18n from "@/components/account/AccountHeaderI18n";

export const metadata = { title: "Ship-to addresses · UMAXES" };

export default async function AddressesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/account/addresses");
  if (session.user.status === "PENDING") redirect("/account/pending");

  return (
    <div>
      <AccountHeaderI18n
        eyebrowKey="addresses.eyebrow"
        titleKey="addresses.title"
        descriptionKey="addresses.description"
      />
      <AddressManager />
    </div>
  );
}
