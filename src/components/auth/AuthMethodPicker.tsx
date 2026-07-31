import type { ReactNode } from "react";
import type { AuthMethod } from "./auth-shared";

type AuthMethodPickerProps = {
  value: AuthMethod | null;
  onChange: (method: AuthMethod) => void;
  mode: "signin" | "signup";
};

function EmailIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden>
      <path
        d="M4 7.5A2.5 2.5 0 0 1 6.5 5h11A2.5 2.5 0 0 1 20 7.5v9a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 16.5v-9Z"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="m5.5 8 6.5 4.5L18.5 8"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden>
      <path
        d="M8.5 4.5h7A1.5 1.5 0 0 1 17 6v12a1.5 1.5 0 0 1-1.5 1.5h-7A1.5 1.5 0 0 1 7 18V6a1.5 1.5 0 0 1 1.5-1.5Z"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M11 17.2h2"
        stroke="currentColor"
        strokeWidth="1.6"
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
  const verb = mode === "signin" ? "Sign in" : "Sign up";

  const options: {
    id: AuthMethod;
    title: string;
    body: string;
    icon: ReactNode;
  }[] = [
    {
      id: "email",
      title: `${verb} with email`,
      body: "Work email and password",
      icon: <EmailIcon />,
    },
    {
      id: "phone",
      title: `${verb} with phone`,
      body:
        mode === "signup"
          ? "Verify with SMS, then set password"
          : "Mobile number and password",
      icon: <PhoneIcon />,
    },
  ];

  return (
    <div className="space-y-3.5">
      <p className="font-display text-[0.65rem] font-semibold tracking-[0.22em] text-black/55 uppercase">
        Continue with
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {options.map((opt) => {
          const active = value === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onChange(opt.id)}
              className={`group relative overflow-hidden rounded-[1.35rem] border px-4 py-4 text-left transition duration-200 ${
                active
                  ? "border-umx-orange/55 bg-umx-cream-bright shadow-[0_14px_34px_rgba(255,91,4,0.14),0_1px_0_rgba(255,255,255,0.95)_inset] ring-1 ring-umx-orange/15"
                  : "border-umx-cream-deep bg-umx-cream-warm/80 shadow-[0_6px_18px_rgba(61,22,5,0.05)] hover:-translate-y-0.5 hover:border-umx-orange/35 hover:bg-umx-cream-bright hover:shadow-[0_12px_28px_rgba(61,22,5,0.08)]"
              }`}
            >
              <span
                className={`mb-3 flex h-10 w-10 items-center justify-center rounded-2xl transition ${
                  active
                    ? "bg-umx-orange text-white shadow-[0_10px_20px_rgba(255,91,4,0.28)]"
                    : "bg-umx-orange/10 text-umx-orange group-hover:bg-umx-orange/15"
                }`}
              >
                {opt.icon}
              </span>
              <span className="block font-display text-sm font-bold tracking-tight text-black">
                {opt.title}
              </span>
              <span className="mt-1 block font-body text-xs leading-relaxed text-black/65">
                {opt.body}
              </span>
              {active ? (
                <span
                  aria-hidden
                  className="absolute top-3.5 right-3.5 flex h-5 w-5 items-center justify-center rounded-full bg-umx-orange text-white"
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
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
