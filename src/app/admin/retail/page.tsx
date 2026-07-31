import { CustomerSegmentPage } from "@/components/admin/CustomerSegmentPage";

export const metadata = { title: "Retail customers · UMAXES Ops" };

export default function RetailCustomersPage() {
  return <CustomerSegmentPage level="SHOP" />;
}
