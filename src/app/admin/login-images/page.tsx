import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { canAccessPath } from "@/lib/rbac";
import {
  ensureDefaultLoginSlides,
  listAllLoginSlides,
} from "@/lib/login-slides";
import { AdminPageHeaderI18n } from "@/components/admin/AdminPageHeaderI18n";
import LoginSlidesPanel from "@/components/admin/LoginSlidesPanel";

export const metadata = { title: "Login images · UMAXES Ops" };

export default async function AdminLoginImagesPage() {
  const session = await auth();
  if (
    !session?.user ||
    !canAccessPath(session.user.role, "/admin/login-images")
  ) {
    redirect("/admin");
  }

  await ensureDefaultLoginSlides();
  const items = await listAllLoginSlides();

  return (
    <div>
      <AdminPageHeaderI18n titleKey="loginImages.title" />
      <LoginSlidesPanel
        items={items.map((row) => ({
          id: row.id,
          imageUrl: row.imageUrl,
          sortOrder: row.sortOrder,
          active: row.active,
        }))}
      />
    </div>
  );
}
