import type { ReactNode } from "react";
import type { AuthMethod } from "./auth-shared";

type AuthMethodPickerProps = {
  value: AuthMethod | null;
  onChange: (method: AuthMethod) => void;
  mode: "signin" | "signup";
};

function EmailIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden>
      <path
        d="M4 7.5A2.5 2.5 0 0 1 6.5 5h11A2.5 2.5 0 0 1 20 7.5v9a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 16.5v-9Z"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path
        d="m5.5 8 6.5 4.5L18.5 8"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden>
      <path
        d="M8.5 4.5h7A1.5 1.5 0 0 1 17 6v12a1.5 1.5 0 0 1-1.5 1.5h-7A1.5 1.5 0 0 1 7 18V6a1.5 1.5 0 0 1 1.5-1.5Z"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path
        d="M11 17.2h2"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function AuthMethodPicker({
  value,
  onChange,
  mode,
}: AuthMethodPickerProps) {
  const options: {
    id: AuthMethod;
    label: string;
    icon: ReactNode;
  }[] = [
    {
      id: "email",
      label: "Email",
      icon: <EmailIcon />,
    },
    {
      id: "phone",
      label: "Phone",
      icon: <PhoneIcon />,
    },
  ];

  return (
    <div
      className="grid grid-cols-2 gap-1 rounded-xl bg-[#f0ebe3] p-1"
      role="tablist"
      aria-label={mode === "signin" ? "Sign in method" : "Sign up method"}
    >
      {options.map((opt) => {
        const active = value === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.id)}
            className={`inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 font-display text-sm font-semibold transition ${
              active
                ? "bg-white text-black shadow-[0_4px_12px_rgba(61,22,5,0.08)] ring-1 ring-black/5"
                : "text-black/45 hover:bg-white/50 hover:text-black"
            }`}
          >
            <span
              className={active ? "text-umx-orange" : "text-black/30"}
              aria-hidden
            >
              {opt.icon}
            </span>
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
