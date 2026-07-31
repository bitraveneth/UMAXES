import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import RmaManager from "@/components/RmaManager";
import { AccountPanel } from "@/components/account/AccountUI";
import AccountHeaderI18n from "@/components/account/AccountHeaderI18n";

export const metadata = { title: "Returns & reorder · UMAXES" };

export default async function ReturnsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/account/returns");
  if (session.user.status === "PENDING") redirect("/account/pending");

  return (
    <div>
      <AccountHeaderI18n
        eyebrowKey="returns.eyebrow"
        titleKey="returns.title"
        descriptionKey="returns.description"
      />
      <AccountPanel className="p-5 sm:p-6">
        <RmaManager />
      </AccountPanel>
    </div>
  );
}
