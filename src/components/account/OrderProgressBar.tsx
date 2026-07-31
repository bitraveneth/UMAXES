import { Check } from "lucide-react";
import {
  BUYER_ORDER_STEPS,
  buyerTimelineIndex,
} from "@/lib/buyer-order";
import type { OrderStatus } from "@/generated/prisma/enums";

/** Order progress — mobile-first: current status + fill bar, not a cramped 6-step strip. */
export default function OrderProgressBar({
  status,
  variant = "compact",
}: {
  status: OrderStatus;
  /** compact = order list cards; full = order detail with step list */
  variant?: "compact" | "full";
}) {
  if (status === "CANCELLED") {
    return (
      <p className="font-display text-sm font-semibold text-red-600">
        Cancelled
      </p>
    );
  }

  const stepIndex = Math.max(0, buyerTimelineIndex(status));
  const total = BUYER_ORDER_STEPS.length;
  const current = BUYER_ORDER_STEPS[stepIndex];
  const next =
    stepIndex < total - 1 ? BUYER_ORDER_STEPS[stepIndex + 1] : null;
  const done = stepIndex >= total - 1;
  const progressPct = Math.round(((stepIndex + (done ? 1 : 0.5)) / total) * 100);
  const fillPct = done
    ? 100
    : Math.round(((stepIndex + 0.5) / total) * 100);

  return (
    <div className={variant === "full" ? "space-y-6" : "space-y-3"}>
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div className="min-w-0">
          <p className="font-display text-[10px] font-semibold tracking-[0.14em] text-black uppercase">
            {done ? "Complete" : "Current status"}
          </p>
          <p className="mt-0.5 font-display text-base font-extrabold text-umx-orange sm:text-lg">
            {current.label}
          </p>
        </div>
        <p className="font-display text-xs font-semibold tabular-nums text-black">
          Step {Math.min(stepIndex + 1, total)} of {total}
        </p>
      </div>

      <div>
        <div
          className="h-2 w-full overflow-hidden bg-black/10"
          role="progressbar"
          aria-valuenow={progressPct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Order ${Math.round((stepIndex / (total - 1)) * 100)}% through fulfillment`}
        >
          <div
            className="h-full bg-umx-orange transition-[width] duration-500"
            style={{ width: `${fillPct}%` }}
          />
        </div>
        {!done && next ? (
          <p className="mt-2 font-body text-sm text-black">
            Next:{" "}
            <span className="font-display font-semibold">{next.label}</span>
          </p>
        ) : done ? (
          <p className="mt-2 font-body text-sm text-black">
            Delivered — thank you for your order.
          </p>
        ) : null}
      </div>

      {variant === "full" ? (
        <ol className="space-y-0">
          {BUYER_ORDER_STEPS.map((step, i) => {
            const isDone = stepIndex > i || done;
            const isCurrent = !done && stepIndex === i;
            const isLast = i === total - 1;
            return (
              <li key={step.id} className="relative flex gap-3 pb-5 last:pb-0">
                {!isLast ? (
                  <span
                    aria-hidden
                    className={`absolute top-7 bottom-0 left-[11px] w-0.5 ${
                      isDone ? "bg-umx-orange" : "bg-black/15"
                    }`}
                  />
                ) : null}
                <span
                  className={`relative z-[1] flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-display text-[10px] font-bold ${
                    isCurrent || isDone
                      ? "bg-umx-orange text-white"
                      : "border-2 border-black/25 bg-umx-cream-bright text-black"
                  }`}
                >
                  {isDone && !isCurrent ? (
                    <Check className="h-3.5 w-3.5" strokeWidth={2.75} />
                  ) : (
                    i + 1
                  )}
                </span>
                <div className="min-w-0 pt-0.5">
                  <p
                    className={`font-display text-sm font-bold ${
                      isCurrent ? "text-umx-orange" : "text-black"
                    }`}
                  >
                    {step.label}
                    {isCurrent ? (
                      <span className="ml-2 font-display text-[10px] font-semibold tracking-wide uppercase">
                        Now
                      </span>
                    ) : null}
                  </p>
                  <p className="mt-0.5 font-body text-xs text-black">
                    {isDone && !isCurrent
                      ? "Completed"
                      : isCurrent
                        ? "In progress"
                        : "Upcoming"}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      ) : null}
    </div>
  );
}
