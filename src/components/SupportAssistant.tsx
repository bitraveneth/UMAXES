"use client";

import Image from "next/image";
import {
  ArrowUp,
  DollarSign,
  Headset,
  Layers,
  Mail,
  Package,
  Sparkles,
  Truck,
  X,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import FloatingShopBadge from "@/components/FloatingShopBadge";
import { logos } from "@/lib/assets";
import { findSupportAnswer } from "@/lib/support";

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
    prompt: "How many flavors do you have?",
  },
  {
    id: "features",
    label: "Features",
    icon: Sparkles,
    prompt: "What are the main HOOKAMAX specs / features?",
  },
  {
    id: "pricing",
    label: "Pricing",
    icon: DollarSign,
    prompt: "How much does HOOKAMAX cost?",
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
    label: "Contact",
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
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const listRef = useRef<HTMLDivElement>(null);
  const hello = useMemo(() => greeting(), []);
  const chatting = messages.length > 0;

  useEffect(() => {
    if (!open) return;
    listRef.current?.scrollTo({
      top: listRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, open]);

  if (
    pathname.startsWith("/checkout") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/register")
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
    window.setTimeout(() => pushBot(findSupportAnswer(trimmed)), 280);
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
        <div className="pointer-events-auto flex max-h-[min(78dvh,34rem)] w-[min(calc(100vw-1.25rem),26rem)] origin-bottom-right animate-[float-badge-in_0.45s_cubic-bezier(0.22,1,0.36,1)_both] flex-col overflow-hidden rounded-[1.5rem] bg-[#fffaf0] shadow-[0_30px_80px_rgba(61,22,5,0.28)] ring-1 ring-black/8 sm:max-h-[min(68vh,34rem)] sm:rounded-[1.85rem]">
          {/* Header */}
          <div className="relative flex items-center justify-between gap-3 bg-gradient-to-br from-umx-orange via-umx-orange to-umx-orange-deep px-4 py-3.5 text-white">
            <div
              aria-hidden
              className="pointer-events-none absolute -top-8 -right-6 h-24 w-24 rounded-full bg-white/15 blur-2xl"
            />
            <div className="relative flex min-w-0 items-center gap-3">
              <span className="relative hidden h-7 w-[7.5rem] shrink-0 sm:block">
                <Image
                  src={logos.creamTransparent}
                  alt="UMAXES"
                  fill
                  className="object-contain object-left"
                  sizes="120px"
                />
              </span>
              <span className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/15 ring-1 ring-white/25 sm:hidden">
                <span className="relative h-5 w-5">
                  <Image
                    src={logos.markCream}
                    alt=""
                    fill
                    className="object-contain"
                    sizes="20px"
                  />
                </span>
              </span>
              <div className="min-w-0 sm:border-l sm:border-white/25 sm:pl-3">
                <p className="truncate font-display text-sm font-bold tracking-tight">
                  Support
                </p>
                <p className="font-display text-[0.65rem] font-medium tracking-wide text-white/80">
                  Online · Adults 21+
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
              <div className="relative overflow-hidden rounded-[1.4rem] bg-white px-5 pt-5 pb-6 shadow-[0_12px_36px_rgba(61,22,5,0.07)] ring-1 ring-black/5">
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-umx-orange-wash/80 to-transparent"
                />
                <div className="relative">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-umx-cream px-2.5 py-1 font-display text-[0.6rem] font-bold tracking-[0.16em] text-umx-orange-deep uppercase ring-1 ring-umx-orange/15">
                    <span className="h-1.5 w-1.5 rounded-full bg-umx-orange" />
                    Support desk
                  </span>

                  <div className="mx-auto mt-6 flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-full bg-gradient-to-br from-umx-orange to-umx-orange-deep shadow-[0_14px_32px_rgba(255,91,4,0.4)] ring-[6px] ring-umx-orange/10">
                    <span className="relative h-8 w-8">
                      <Image
                        src={logos.markCream}
                        alt=""
                        fill
                        className="object-contain"
                        sizes="32px"
                      />
                    </span>
                  </div>

                  <h2 className="mt-5 text-center font-display text-[1.65rem] leading-[1.15] font-extrabold tracking-tight text-black">
                    {hello},
                    <br />
                    How can{" "}
                    <em className="font-body text-[1.05em] font-semibold not-italic text-umx-orange sm:italic">
                      we help
                    </em>{" "}
                    you today?
                  </h2>
                  <p className="mx-auto mt-2.5 max-w-[18rem] text-center font-body text-sm leading-relaxed text-black/60">
                    Flavors, features, pricing, shipping, authenticity — ask
                    anything.
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
                      <span className="relative mr-2 mt-1 flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-umx-orange ring-2 ring-umx-orange/15">
                        <span className="relative h-3.5 w-3.5">
                          <Image
                            src={logos.markCream}
                            alt=""
                            fill
                            className="object-contain"
                            sizes="14px"
                          />
                        </span>
                      </span>
                    )}
                    <p
                      className={`max-w-[82%] px-3.5 py-2.5 font-body text-[0.9rem] leading-relaxed ${
                        msg.role === "user"
                          ? "rounded-[1.15rem] rounded-br-md bg-umx-orange text-white"
                          : "rounded-[1.15rem] rounded-bl-md bg-white text-black shadow-[0_4px_16px_rgba(61,22,5,0.06)] ring-1 ring-black/5"
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
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-black/8 bg-white px-3.5 py-2.5 font-display text-xs font-semibold text-black shadow-[0_2px_8px_rgba(61,22,5,0.04)] transition hover:border-umx-orange/40 hover:text-umx-orange"
                  >
                    <Icon
                      className="h-3.5 w-3.5 text-umx-orange"
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
            className="border-t border-black/6 bg-white/90 px-3 py-3 backdrop-blur-md"
          >
            <div className="flex items-center gap-2 rounded-full bg-umx-cream px-2 py-1.5 ring-1 ring-black/8 focus-within:ring-2 focus-within:ring-umx-orange/30">
              <label htmlFor="umx-support-input" className="sr-only">
                Ask UMAXES support
              </label>
              <input
                id="umx-support-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about pricing, product…"
                className="min-w-0 flex-1 bg-transparent px-3 py-2 font-body text-sm text-black outline-none placeholder:text-black/40"
              />
              <button
                type="submit"
                disabled={!input.trim()}
                aria-label="Send message"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-umx-orange text-white transition hover:bg-umx-orange-mid disabled:cursor-not-allowed disabled:opacity-35"
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
        className="pointer-events-auto flex h-12 w-12 items-center justify-center rounded-full bg-umx-orange text-white shadow-[0_16px_40px_rgba(255,91,4,0.42)] transition duration-300 hover:scale-105 hover:bg-umx-orange-mid hover:shadow-[0_18px_44px_rgba(255,91,4,0.5)] sm:h-14 sm:w-14"
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
