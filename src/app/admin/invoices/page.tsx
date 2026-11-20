import { redirect } from "next/navigation";

export const metadata = { title: "Payments · UMAXES Ops" };

/** Old /admin/invoices URL — payment settings now live under Payments. */
export default function InvoicesRedirectPage() {
  redirect("/admin/payments");
}
