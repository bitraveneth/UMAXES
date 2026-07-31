type AuthMessageTone = "error" | "success" | "info";

type AuthMessageProps = {
  tone?: AuthMessageTone;
  children: React.ReactNode;
  className?: string;
};

const TONE_CLASS: Record<AuthMessageTone, string> = {
  error:
    "border-red-200/80 bg-red-50 text-red-800 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]",
  success:
    "border-emerald-200/80 bg-emerald-50 text-emerald-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]",
  info: "border-umx-cream-deep bg-umx-cream-warm/80 text-black/75 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]",
};

function ToneIcon({ tone }: { tone: AuthMessageTone }) {
  if (tone === "success") {
    return (
      <span
        aria-hidden
        className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-600/15 text-emerald-700"
      >
        <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none">
          <path
            d="M2.5 6.2 4.8 8.5 9.5 3.5"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    );
  }

  if (tone === "error") {
    return (
      <span
        aria-hidden
        className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-600/15 text-red-700"
      >
        <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none">
          <path
            d="M6 3.2v3.4M6 8.7h.01"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.4" />
        </svg>
      </span>
    );
  }

  return (
    <span
      aria-hidden
      className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-umx-orange/15 text-umx-orange"
    >
      <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none">
        <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.4" />
        <path
          d="M6 5.2v3M6 3.8h.01"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}

export default function AuthMessage({
  tone = "error",
  children,
  className = "",
}: AuthMessageProps) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={`flex items-start gap-2.5 rounded-2xl border px-3.5 py-3 font-body text-sm leading-relaxed ${TONE_CLASS[tone]} ${className}`}
    >
      <ToneIcon tone={tone} />
      <p className="min-w-0 flex-1">{children}</p>
    </div>
  );
}
