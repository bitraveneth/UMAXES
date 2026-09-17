import CheckoutShell from "@/components/CheckoutShell";
import { requireMember } from "@/lib/require-member";

export const metadata = {
  title: "Checkout · UMAXES",
  description:
    "Checkout for UMAXES HOOKAMAX. Adults 21+ only. Nicotine is an addictive chemical.",
};

export default async function CheckoutPage() {
  await requireMember("/checkout");
  return <CheckoutShell />;
}
