import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { canAccessPath } from "@/lib/rbac";
import { isLearnSlug } from "@/lib/admin-learn";
import { LearnLesson } from "@/components/admin/learn/LearnLesson";

export const metadata = { title: "Learning Hub · UMAXES Ops" };

export default async function LearnLessonPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const session = await auth();
  if (!session?.user || !canAccessPath(session.user.role, "/admin/learn")) {
    redirect("/admin");
  }

  const role = session.user.role;
  if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
    redirect("/admin");
  }

  const { slug } = await params;
  if (!isLearnSlug(slug)) {
    redirect("/admin/learn");
  }

  return <LearnLesson slug={slug} />;
}
