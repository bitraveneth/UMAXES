"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { AUTH_FIELD_CLASS, COUNTRY_CODES } from "./auth-shared";

type PhoneFieldsProps = {
  countryCode: string;
  phone: string;
  onCountryCodeChange: (code: string) => void;
  onPhoneChange: (phone: string) => void;
  required?: boolean;
  /** Optional control on the same row (e.g. Send code) */
  endAction?: ReactNode;
};

export default function PhoneFields({
  countryCode,
  phone,
  onCountryCodeChange,
  onPhoneChange,
  required = true,
  endAction,
}: PhoneFieldsProps) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(
    () => COUNTRY_CODES.find((c) => c.code === countryCode)?.id ?? "us",
  );

  const selected =
    COUNTRY_CODES.find((c) => c.id === selectedId) || COUNTRY_CODES[0];

  useEffect(() => {
    const current = COUNTRY_CODES.find((c) => c.id === selectedId);
    if (current?.code === countryCode) return;
    const next = COUNTRY_CODES.find((c) => c.code === countryCode);
    if (next) setSelectedId(next.id);
  }, [countryCode, selectedId]);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div>
      <label
        htmlFor="phone"
        className="mb-1.5 block font-display text-sm font-semibold text-black"
      >
        Mobile phone
      </label>
      <div className="flex gap-2">
        <div
          ref={rootRef}
          className="relative w-[7.25rem] shrink-0 sm:w-[8.5rem]"
        >
          <button
            type="button"
            aria-label="Country code"
            aria-haspopup="listbox"
            aria-expanded={open}
            aria-controls={listId}
            onClick={() => setOpen((v) => !v)}
            className="flex h-full w-full items-center justify-between gap-1 rounded-xl border border-black/10 bg-[#f8f6f2] px-2.5 py-2.5 font-body text-left text-sm text-black outline-none focus:border-umx-orange focus:ring-[3px] focus:ring-umx-orange/15"
          >
            <span className="truncate">+{selected.code}</span>
            <ChevronDown
              className={`h-4 w-4 shrink-0 text-black/50 transition ${
                open ? "rotate-180" : ""
              }`}
              strokeWidth={2}
            />
          </button>

          {open ? (
            <ul
              id={listId}
              role="listbox"
              className="absolute top-full left-0 z-50 mt-1 max-h-60 w-[16rem] overflow-y-auto rounded-xl border border-black/12 bg-white py-1 shadow-[0_12px_32px_rgba(0,0,0,0.18)]"
            >
              {COUNTRY_CODES.map((c) => {
                const active = c.id === selectedId;
                return (
                  <li key={c.id} role="option" aria-selected={active}>
                    <button
                      type="button"
                      className={`flex w-full px-3 py-2 text-left font-body text-sm transition hover:bg-umx-orange/10 ${
                        active
                          ? "bg-umx-orange/12 font-semibold text-umx-orange-ink"
                          : "text-black"
                      }`}
                      onClick={() => {
                        setSelectedId(c.id);
                        onCountryCodeChange(c.code);
                        setOpen(false);
                      }}
                    >
                      {c.label}
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : null}
        </div>

        <input
          id="phone"
          name="phone"
          type="tel"
          autoComplete="tel-national"
          required={required}
          value={phone}
          onChange={(e) => onPhoneChange(e.target.value)}
          placeholder="555 000 0000"
          className={`min-w-0 flex-1 ${AUTH_FIELD_CLASS}`}
        />

        {endAction}
      </div>
    </div>
  );
}
