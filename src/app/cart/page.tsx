import CartPage from "@/components/CartPage";
import { requireMember } from "@/lib/require-member";

export const metadata = {
  title: "Cart · UMAXES",
  description:
    "Review your HOOKAMAX cart before checkout. Adults 21+ only. Nicotine is an addictive chemical.",
};

export default async function CartRoute() {
  await requireMember("/cart");
  return <CartPage />;
}
