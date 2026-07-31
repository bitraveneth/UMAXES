import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import AccountHeaderI18n from "@/components/account/AccountHeaderI18n";
import MediaKit from "@/components/account/MediaKit";

export const metadata = { title: "Media kit · UMAXES" };

export default async function AssetsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/account/assets");
  if (session.user.status === "PENDING") redirect("/account/pending");

  return (
    <div>
      <AccountHeaderI18n
        eyebrowKey="assets.eyebrow"
        titleKey="assets.title"
        descriptionKey="assets.description"
      />
      <MediaKit />
    </div>
  );
}
