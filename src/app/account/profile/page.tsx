import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { updateBuyerProfile } from "@/lib/buyer-actions";
import AccountHeaderI18n from "@/components/account/AccountHeaderI18n";
import BuyerProfileForm from "@/components/account/BuyerProfileForm";

export const metadata = { title: "Profile · UMAXES" };

function levelLabel(level?: string | null) {
  switch (level) {
    case "DISTRO":
      return "Distributor";
    case "WHOLESALER":
      return "Wholesaler";
    case "SHOP":
      return "Retail";
    default:
      return "Buyer";
  }
}

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/account/profile");
  if (session.user.status === "PENDING") redirect("/account/pending");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      email: true,
      phone: true,
      image: true,
      jobTitle: true,
      company: { select: { name: true, level: true } },
    },
  });

  if (!user) redirect("/account");

  return (
    <div>
      <AccountHeaderI18n
        eyebrowKey="profile.eyebrow"
        titleKey="profile.title"
        descriptionKey="profile.description"
      />
      <BuyerProfileForm
        saveAction={updateBuyerProfile}
        initial={{
          name: user.name || "",
          email: user.email || "",
          phone: user.phone || "",
          jobTitle: user.jobTitle || "",
          image: user.image,
          companyName: user.company?.name ?? null,
          companyLevelLabel: levelLabel(
            user.company?.level ?? session.user.companyLevel,
          ),
        }}
      />
    </div>
  );
}
