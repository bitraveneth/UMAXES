"use client";

import { signIn, useSession } from "next-auth/react";
import { useTransition } from "react";
import { prepareExitImpersonation } from "@/lib/admin-actions";
import { LogOut } from "lucide-react";

/** Sticky bar while a super admin is viewing the site as a customer. */
export default function ImpersonationBanner() {
  const { data } = useSession();
  const [pending, startTransition] = useTransition();

  // Only while actually acting as a customer (avoids stale session flash)
  const active =
    Boolean(data?.user?.impersonatedBy) && data?.user?.role === "CUSTOMER";
  if (!active || !data?.user) return null;

  const label = data.user.name || data.user.email || "customer";

  return (
    <>
      <div className="fixed inset-x-0 top-0 z-[200] border-b border-amber-700/40 bg-amber-500 px-3 py-2 text-black shadow-md">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 text-sm">
          <p className="font-medium">
            Viewing as <span className="font-bold">{label}</span>
            <span className="opacity-80"> — super admin support mode</span>
          </p>
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              startTransition(async () => {
                try {
                  const { token } = await prepareExitImpersonation();
                  const res = await signIn("impersonate", {
                    token,
                    redirect: false,
                  });
                  if (res?.error) {
                    console.error("[exitImpersonation]", res.error);
                    return;
                  }
                  // Full reload so SessionProvider cannot keep the old customer session
                  window.location.assign("/admin/users");
                } catch (e) {
                  console.error("[exitImpersonation]", e);
                }
              });
            }}
            className="inline-flex items-center gap-1.5 rounded-md bg-black px-3 py-1.5 text-xs font-semibold text-white hover:bg-black/85 disabled:opacity-60"
          >
            <LogOut className="h-3.5 w-3.5" />
            {pending ? "Exiting…" : "Back to admin"}
          </button>
        </div>
      </div>
      <div className="h-11 shrink-0" aria-hidden />
    </>
  );
}
