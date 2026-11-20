import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { canAccessPath } from "@/lib/rbac";
import { listAllFaqs } from "@/lib/faqs";
import { AdminPageHeaderI18n } from "@/components/admin/AdminPageHeaderI18n";
import FaqManager from "@/components/admin/FaqManager";

export const metadata = { title: "FAQ · UMAXES Ops" };

export default async function AdminFaqPage() {
  const session = await auth();
  if (!session?.user || !canAccessPath(session.user.role, "/admin/faq")) {
    redirect("/admin");
  }

  const items = await listAllFaqs();

  return (
    <div>
      <AdminPageHeaderI18n
        titleKey="faq.title"
        descriptionKey="faq.description"
      />
      <FaqManager
        items={items.map((row) => ({
          id: row.id,
          question: row.question,
          answer: row.answer,
          keywords: row.keywords,
          sortOrder: row.sortOrder,
          published: row.published,
        }))}
      />
    </div>
  );
}
