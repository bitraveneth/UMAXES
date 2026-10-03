import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { isChannelBuyerLevel } from "@/lib/channel-level";
import { getBuyerRebateStatus } from "@/lib/rebate";
import RebateProgramView from "@/components/account/RebateProgramView";

export const metadata = { title: "Rebate · UMAXES" };

export default async function AccountRebatePage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/account/rebate");
  if (session.user.status === "PENDING") redirect("/account/pending");
  if (!session.user.companyId || !isChannelBuyerLevel(session.user.companyLevel)) {
    redirect("/account");
  }

  const status = await getBuyerRebateStatus(session.user.companyId);
  if (!status) redirect("/account");

  return <RebateProgramView status={status} />;
}
