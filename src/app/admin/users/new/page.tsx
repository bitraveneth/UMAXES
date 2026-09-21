import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { canAccessPath } from "@/lib/rbac";
import { AdminPageHeaderI18n } from "@/components/admin/AdminPageHeaderI18n";
import { AdminLinkBtn } from "@/components/admin/AdminI18nBits";
import AddUserForm from "@/components/admin/AddUserForm";

export const metadata = { title: "Add user · UMAXES Ops" };

export default async function AdminAddUserPage() {
  const session = await auth();
  if (
    !session?.user ||
    !canAccessPath(session.user.role, "/admin/users") ||
    (session.user.role !== "SUPER_ADMIN" && session.user.role !== "ADMIN")
  ) {
    redirect("/admin");
  }

  return (
    <div className="space-y-6">
      <AdminPageHeaderI18n
        titleKey="users.addTitle"
        descriptionKey="users.addDescription"
        actions={
          <AdminLinkBtn href="/admin/users" labelKey="users.backToUsers" />
        }
      />
      <AddUserForm />
    </div>
  );
}
