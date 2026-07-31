import { CustomerSegmentPage } from "@/components/admin/CustomerSegmentPage";

export const metadata = { title: "Distributors · UMAXES Ops" };

export default function DistributorsPage() {
  return <CustomerSegmentPage level="DISTRO" />;
}
