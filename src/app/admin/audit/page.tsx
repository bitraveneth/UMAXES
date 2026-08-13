import { redirect } from "next/navigation";

/** Legacy URL — Activity is the primary operations log. */
export default function AuditRedirectPage() {
  redirect("/admin/activity");
}
