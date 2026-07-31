import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

export function AccountPageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col items-center gap-5 border-b border-black/8 pb-8 text-center sm:flex-row sm:items-end sm:justify-between sm:text-left">
      <div className="min-w-0 max-w-2xl">
        {eyebrow ? (
          <p className="font-display text-[11px] font-semibold tracking-[0.16em] text-umx-orange uppercase">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-black sm:text-[2.25rem] sm:leading-tight">
          {title}
        </h1>
        {description ? (
          <p className="mx-auto mt-2 max-w-xl font-body text-sm leading-relaxed text-black sm:mx-0">
            {description}
          </p>
        ) : null}
      </div>
      {action ? (
        <div className="flex w-full justify-center sm:w-auto sm:justify-end">
          {action}
        </div>
      ) : null}
    </div>
  );
}

export function AccountPanel({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`border border-black/10 bg-white shadow-[0_10px_28px_rgba(61,22,5,0.05)] ${className}`}
    >
      {children}
    </div>
  );
}

/** Shared metric cards — white cards on cream canvas for clear separation. */
export function AccountStatGrid({
  children,
  cols = 3,
}: {
  children: ReactNode;
  cols?: 3 | 4;
}) {
  return (
    <div
      className={`grid gap-2.5 sm:gap-3 ${
        cols === 4
          ? "grid-cols-2 xl:grid-cols-4"
          : "grid-cols-1 min-[420px]:grid-cols-3"
      }`}
    >
      {children}
    </div>
  );
}

export function AccountStat({
  label,
  value,
  hint,
  icon: Icon,
  tone = "cream",
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon?: LucideIcon;
  /** orange = emphasize the value in brand orange (no full orange fill) */
  tone?: "cream" | "orange";
}) {
  const emphasize = tone === "orange";

  return (
    <div
      className={`relative overflow-hidden border border-black/10 bg-white px-3 py-3.5 text-center shadow-[0_8px_20px_rgba(61,22,5,0.045)] sm:px-4 sm:py-4 ${
        emphasize ? "ring-1 ring-umx-orange/25" : ""
      }`}
    >
      <span
        aria-hidden
        className="absolute inset-y-0 left-0 w-1 bg-umx-orange"
      />

      <div className="flex flex-col items-center px-1">
        {Icon ? (
          <span className="mb-2 flex h-7 w-7 items-center justify-center bg-umx-orange-wash text-umx-orange">
            <Icon className="h-3.5 w-3.5" strokeWidth={2} />
          </span>
        ) : null}

        <p className="font-display text-[9px] font-semibold tracking-[0.14em] text-black uppercase sm:text-[10px]">
          {label}
        </p>

        <p
          className={`mt-1.5 font-display text-2xl font-extrabold tabular-nums tracking-tight sm:text-[1.75rem] ${
            emphasize ? "text-umx-orange" : "text-black"
          }`}
        >
          {value}
        </p>

        {hint ? (
          <p className="mt-1 max-w-[14rem] font-body text-[11px] leading-snug text-black sm:text-xs">
            {hint}
          </p>
        ) : null}
      </div>
    </div>
  );
}
