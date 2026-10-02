"use client";

import Image from "next/image";
import {
  ArrowUp,
  Headset,
  Layers,
  Mail,
  Package,
  Sparkles,
  Truck,
  X,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import FloatingShopBadge from "@/components/FloatingShopBadge";
import { logos } from "@/lib/assets";
import { SITE_CONTACT_EMAIL } from "@/lib/site";
import { faqs as DEFAULT_FAQS, findSupportAnswer, type SupportFaq } from "@/lib/support";

type ChatMessage = {
  id: string;
  role: "bot" | "user";
  text: string;
};

const QUICK_ACTIONS = [
  {
    id: "flavors",
    label: "Flavors",
    icon: Layers,
    prompt: "What flavors / variations are available?",
  },
  {
    id: "features",
    label: "Features",
    icon: Sparkles,
    prompt: "What coil and airflow does it use?",
  },
  {
    id: "product",
    label: "Product",
    icon: Package,
    prompt: "What is HOOKAMAX?",
  },
  {
    id: "shipping",
    label: "Shipping",
    icon: Truck,
    prompt: "How long does shipping take?",
  },
  {
    id: "contact",
    label: "Email us",
    icon: Mail,
    prompt: "How do I contact support?",
  },
] as const;

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default function SupportAssistant() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [faqItems, setFaqItems] = useState<SupportFaq[]>(DEFAULT_FAQS);
  const listRef = useRef<HTMLDivElement>(null);
  const hello = useMemo(() => greeting(), []);
  const chatting = messages.length > 0;

  const loggedIn = status === "authenticated" && Boolean(session?.user);

  useEffect(() => {
    if (!loggedIn) return;
    let cancelled = false;
    fetch("/api/faqs")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data?.faqs?.length) return;
        setFaqItems(data.faqs);
      })
      .catch(() => {
        /* keep defaults */
      });
    return () => {
      cancelled = true;
    };
  }, [loggedIn]);

  useEffect(() => {
    if (!open) return;
    listRef.current?.scrollTo({
      top: listRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, open]);

  if (!loggedIn) return null;

  if (
    pathname.startsWith("/checkout") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/maintenance")
  ) {
    return null;
  }

  function pushBot(text: string) {
    setMessages((prev) => [
      ...prev,
      { id: `b-${Date.now()}-${prev.length}`, role: "bot", text },
    ]);
  }

  function ask(prompt: string) {
    const trimmed = prompt.trim();
    if (!trimmed) return;
    setMessages((prev) => [
      ...prev,
      { id: `u-${Date.now()}-${prev.length}`, role: "user", text: trimmed },
    ]);
    window.setTimeout(() => pushBot(findSupportAnswer(trimmed, faqItems)), 280);
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;
    const value = input.trim();
    setInput("");
    ask(value);
  }

  return (
    <div className="pointer-events-none fixed right-3 bottom-[calc(4.25rem+env(safe-area-inset-bottom))] z-[60] flex flex-col items-end gap-2.5 sm:right-6 lg:bottom-6 sm:gap-3">
      {!open && <FloatingShopBadge />}

      {open && (
        <div className="pointer-events-auto flex max-h-[min(78dvh,34rem)] w-[min(calc(100vw-1.25rem),26rem)] origin-bottom-right animate-[float-badge-in_0.45s_cubic-bezier(0.22,1,0.36,1)_both] flex-col overflow-hidden rounded-2xl bg-[#f4f7fb] shadow-[0_28px_70px_rgba(15,23,42,0.22)] ring-1 ring-slate-900/10 sm:max-h-[min(68vh,34rem)]">
          {/* Header — blue brand */}
          <div className="relative flex items-center justify-between gap-3 bg-[#0b3d91] px-4 py-3.5 text-white">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_100%_0%,rgba(96,165,250,0.35),transparent_55%)]"
            />
            <div className="relative flex min-w-0 items-center gap-3">
              <span className="relative h-7 w-[7.25rem] shrink-0">
                <Image
                  src={logos.blueWordmarkOnDark}
                  alt="UMAXES"
                  fill
                  className="object-contain object-left"
                  sizes="116px"
                />
              </span>
              <div className="min-w-0 border-l border-white/25 pl-3">
                <p className="truncate font-display text-sm font-bold tracking-tight">
                  Support desk
                </p>
                <p className="font-display text-[0.65rem] font-medium tracking-wide text-sky-100/90">
                  FAQ · Members only
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close support"
              className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/25"
            >
              <X className="h-4 w-4" strokeWidth={2.3} aria-hidden />
            </button>
          </div>

          {/* Body */}
          <div
            ref={listRef}
            className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4"
          >
            {!chatting && (
              <div className="relative overflow-hidden rounded-2xl bg-white px-5 pt-5 pb-6 shadow-sm ring-1 ring-slate-900/6">
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-sky-50 to-transparent"
                />
                <div className="relative">
                  <span className="inline-flex items-center gap-1.5 rounded-md bg-sky-50 px-2.5 py-1 font-display text-[0.6rem] font-bold tracking-[0.14em] text-[#0b3d91] uppercase ring-1 ring-sky-200/80">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#0b3d91]" />
                    Support desk
                  </span>

                  <div className="mx-auto mt-6 flex h-[4.25rem] w-[4.25rem] items-center justify-center rounded-2xl bg-[#0b3d91] shadow-[0_12px_28px_rgba(11,61,145,0.35)] ring-[5px] ring-sky-100">
                    <span className="relative h-8 w-[3.25rem]">
                      <Image
                        src={logos.blueWordmarkOnDark}
                        alt=""
                        fill
                        className="object-contain"
                        sizes="52px"
                      />
                    </span>
                  </div>

                  <h2 className="mt-5 text-center font-display text-[1.55rem] leading-[1.2] font-extrabold tracking-tight text-slate-900">
                    {hello},
                    <br />
                    How can we help?
                  </h2>
                  <p className="mx-auto mt-2.5 max-w-[19rem] text-center font-body text-sm leading-relaxed text-slate-500">
                    Flavors, features, packing, shipping, and FAQ. For pricing,
                    email{" "}
                    <a
                      href={`mailto:${SITE_CONTACT_EMAIL}`}
                      className="font-semibold text-[#0b3d91] underline-offset-2 hover:underline"
                    >
                      {SITE_CONTACT_EMAIL}
                    </a>
                    .
                  </p>
                </div>
              </div>
            )}

            {chatting && (
              <ul className="space-y-3">
                {messages.map((msg) => (
                  <li
                    key={msg.id}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {msg.role === "bot" && (
                      <span className="relative mr-2 mt-1 flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[#0b3d91] ring-2 ring-sky-100">
                        <span className="relative h-3 w-5">
                          <Image
                            src={logos.blueWordmarkOnDark}
                            alt=""
                            fill
                            className="object-contain"
                            sizes="20px"
                          />
                        </span>
                      </span>
                    )}
                    <p
                      className={`max-w-[82%] px-3.5 py-2.5 font-body text-[0.9rem] leading-relaxed ${
                        msg.role === "user"
                          ? "rounded-2xl rounded-br-md bg-[#0b3d91] text-white"
                          : "rounded-2xl rounded-bl-md bg-white text-slate-800 shadow-sm ring-1 ring-slate-900/6"
                      }`}
                    >
                      {msg.text}
                    </p>
                  </li>
                ))}
              </ul>
            )}

            <div className="flex gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {QUICK_ACTIONS.map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.id}
                    type="button"
                    onClick={() => ask(action.prompt)}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-2.5 font-display text-xs font-semibold text-slate-800 shadow-sm transition hover:border-sky-300 hover:text-[#0b3d91]"
                  >
                    <Icon
                      className="h-3.5 w-3.5 text-[#0b3d91]"
                      strokeWidth={2.2}
                      aria-hidden
                    />
                    {action.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Composer */}
          <form
            onSubmit={onSubmit}
            className="border-t border-slate-200/80 bg-white/95 px-3 py-3 backdrop-blur-md"
          >
            <div className="flex items-center gap-2 rounded-full bg-slate-50 px-2 py-1.5 ring-1 ring-slate-200 focus-within:ring-2 focus-within:ring-sky-300/60">
              <label htmlFor="umx-support-input" className="sr-only">
                Ask UMAXES support
              </label>
              <input
                id="umx-support-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about flavors, features, shipping…"
                className="min-w-0 flex-1 bg-transparent px-3 py-2 font-body text-sm text-slate-900 outline-none placeholder:text-slate-400"
              />
              <button
                type="submit"
                disabled={!input.trim()}
                aria-label="Send message"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#0b3d91] text-white transition hover:bg-[#0a347c] disabled:cursor-not-allowed disabled:opacity-35"
              >
                <ArrowUp className="h-4 w-4" strokeWidth={2.5} aria-hidden />
              </button>
            </div>
          </form>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={open ? "Close UMAXES support" : "Open UMAXES help desk"}
        className="pointer-events-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#0b3d91] text-white shadow-[0_16px_40px_rgba(11,61,145,0.45)] transition duration-300 hover:scale-105 hover:bg-[#0a347c] sm:h-14 sm:w-14"
      >
        {open ? (
          <X className="h-6 w-6" strokeWidth={2.3} aria-hidden />
        ) : (
          <Headset className="h-6 w-6" strokeWidth={2.2} aria-hidden />
        )}
      </button>
    </div>
  );
}
