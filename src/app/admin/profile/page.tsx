import { redirect } from "next/navigation";
import { auth, signOut } from "@/lib/auth";
import { canAccessPath } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import { AdminPageHeaderI18n } from "@/components/admin/AdminPageHeaderI18n";
import AdminProfileForm from "@/components/admin/AdminProfileForm";

export const metadata = { title: "Profile · UMAXES Ops" };

export default async function AdminProfilePage() {
  const session = await auth();
  if (!session?.user || !canAccessPath(session.user.role, "/admin/profile")) {
    redirect("/admin");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { staffProfile: true },
  });

  if (!user) redirect("/login");

  const p = user.staffProfile;

  async function signOutAction() {
    "use server";
    await signOut({ redirectTo: "/" });
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <AdminPageHeaderI18n
        titleKey="profile.title"
        descriptionKey="profile.description"
      />
      <AdminProfileForm
        signOutAction={signOutAction}
        initial={{
          name: user.name || "",
          email: user.email || "",
          phone: user.phone || "",
          role: user.role,
          status: user.status,
          avatarUrl: p?.avatarUrl || null,
          jobTitle: p?.jobTitle || "",
          department: p?.department || "",
          companyName: p?.companyName || "UMAXES",
          companyLogoUrl: p?.companyLogoUrl || null,
          line1: p?.line1 || "",
          line2: p?.line2 || "",
          city: p?.city || "",
          region: p?.region || "",
          postalCode: p?.postalCode || "",
          country: p?.country || "",
        }}
      />
    </div>
  );
}
