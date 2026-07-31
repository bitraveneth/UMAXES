import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import FavoritesManager from "@/components/FavoritesManager";
import AccountHeaderI18n from "@/components/account/AccountHeaderI18n";
import { ContinueShoppingButton } from "@/components/account/ContinueShoppingButton";

export const metadata = { title: "Wishlist · UMAXES" };

export default async function FavoritesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/account/favorites");
  if (session.user.status === "PENDING") redirect("/account/pending");

  return (
    <div>
      <AccountHeaderI18n
        eyebrowKey="favorites.eyebrow"
        titleKey="favorites.title"
        descriptionKey="favorites.description"
        action={<ContinueShoppingButton variant="outline" />}
      />
      <FavoritesManager />
    </div>
  );
}
