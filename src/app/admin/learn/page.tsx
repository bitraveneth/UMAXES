import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { canAccessPath } from "@/lib/rbac";
import { LearnHub } from "@/components/admin/learn/LearnHub";

export const metadata = { title: "Learning Hub · UMAXES Ops" };

export default async function LearnPage() {
  const session = await auth();
  if (!session?.user || !canAccessPath(session.user.role, "/admin/learn")) {
    redirect("/admin");
  }

  const role = session.user.role;
  if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
    redirect("/admin");
  }

  return <LearnHub />;
}
