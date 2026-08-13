"use client";

import {
  Check,
  Link2,
  Mail,
  Share2,
  Smartphone,
  X,
} from "lucide-react";
import { useEffect, useId, useRef, type ReactNode } from "react";

type BrandFilmShareSheetProps = {
  open: boolean;
  onClose: () => void;
  url: string;
  title?: string;
  text?: string;
  copied: boolean;
  onCopied: () => void;
};

function brandIcon(bg: string, children: ReactNode) {
  return (
    <span
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white ${bg}`}
    >
      {children}
    </span>
  );
}

export default function BrandFilmShareSheet({
  open,
  onClose,
  url,
  title = "UMAXES — In motion",
  text = "Watch the draw — UMAXES brand film",
  copied,
  onCopied,
}: BrandFilmShareSheetProps) {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const encodedUrl = encodeURIComponent(url);
  const encodedText = encodeURIComponent(`${text} ${url}`);
  const encodedTitle = encodeURIComponent(title);
  const mailBody = encodeURIComponent(`${text}\n\n${url}`);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      onCopied();
    } catch {
      /* ignore */
    }
  };

  const shareNative = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title, text, url });
        onClose();
        return;
      }
      await copyLink();
    } catch {
      /* user cancelled or unsupported */
    }
  };

  const openShare = (href: string) => {
    window.open(href, "_blank", "noopener,noreferrer");
  };

  const copyThenHint = async () => {
    await copyLink();
  };

  const channels: {
    id: string;
    label: string;
    onClick: () => void;
    icon: ReactNode;
    highlight?: boolean;
  }[] = [
    {
      id: "whatsapp",
      label: "WhatsApp",
      onClick: () => openShare(`https://wa.me/?text=${encodedText}`),
      icon: brandIcon(
        "bg-[#25D366]",
        <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden>
          <path d="M17.47 14.38c-.28-.14-1.65-.81-1.9-.9-.26-.1-.44-.14-.63.14-.18.27-.72.89-.88 1.07-.16.18-.33.2-.6.07-.28-.14-1.17-.43-2.23-1.37-.82-.73-1.38-1.64-1.54-1.91-.16-.28-.02-.42.12-.56.13-.13.28-.33.42-.5.14-.16.18-.28.28-.46.09-.19.05-.35-.02-.49-.07-.14-.63-1.51-.86-2.07-.23-.55-.46-.47-.63-.48h-.54c-.18 0-.48.07-.73.35-.25.28-.96.94-.96 2.28s.98 2.64 1.12 2.82c.14.19 1.93 2.95 4.68 4.13.65.28 1.16.45 1.56.57.65.21 1.25.18 1.72.11.52-.08 1.65-.67 1.88-1.32.23-.65.23-1.2.16-1.32-.07-.11-.25-.18-.53-.32z" />
          <path d="M12.04 2C6.5 2 2 6.48 2 12c0 1.77.46 3.43 1.27 4.87L2.05 22l5.27-1.38A9.94 9.94 0 0 0 12.04 22C17.56 22 22 17.52 22 12S17.56 2 12.04 2zm0 18.13c-1.64 0-3.17-.45-4.48-1.23l-.32-.19-3.13.82.84-3.05-.21-.33A8.08 8.08 0 0 1 3.9 12c0-4.48 3.66-8.12 8.14-8.12 4.48 0 8.12 3.64 8.12 8.12 0 4.48-3.64 8.13-8.12 8.13z" />
        </svg>,
      ),
    },
    {
      id: "facebook",
      label: "Facebook",
      onClick: () =>
        openShare(
          `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
        ),
      icon: brandIcon(
        "bg-[#1877F2]",
        <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden>
          <path d="M14.5 8.5V6.8c0-.7.1-1.1 1.2-1.1H17V3h-2.4C11.8 3 11 4.7 11 6.6v1.9H9v2.8h2V21h3.5v-9.7h2.4l.3-2.8h-2.7z" />
        </svg>,
      ),
    },
    {
      id: "telegram",
      label: "Telegram",
      onClick: () =>
        openShare(
          `https://t.me/share/url?url=${encodedUrl}&text=${encodeURIComponent(text)}`,
        ),
      icon: brandIcon(
        "bg-[#229ED9]",
        <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden>
          <path d="M9.78 14.65 9.6 18.2c.3 0 .43-.13.59-.28l1.41-1.35 2.93 2.15c.54.3.92.14 1.07-.5l1.94-9.11c.18-.82-.3-1.14-.83-.94L5.3 11.1c-.79.3-.78.74-.14.94l3.24 1.01 7.52-4.74c.35-.23.68-.1.41.13l-6.55 5.91z" />
        </svg>,
      ),
    },
    {
      id: "x",
      label: "X",
      onClick: () =>
        openShare(
          `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodeURIComponent(text)}`,
        ),
      icon: brandIcon(
        "bg-black ring-1 ring-white/20",
        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden>
          <path d="M18.9 2H22l-6.8 7.78L23.2 22h-6.3l-4.93-6.44L6.2 22H3.1l7.28-8.32L.8 2h6.46l4.46 5.9L18.9 2zm-1.1 18h1.72L6.3 3.9H4.45L17.8 20z" />
        </svg>,
      ),
    },
    {
      id: "linkedin",
      label: "LinkedIn",
      onClick: () =>
        openShare(
          `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
        ),
      icon: brandIcon(
        "bg-[#0A66C2]",
        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden>
          <path d="M6.5 9.5H3.7V20h2.8V9.5zM5.1 4a1.7 1.7 0 1 0 0 3.4 1.7 1.7 0 0 0 0-3.4zM20.3 20h-2.8v-5.6c0-1.34-.02-3.06-1.86-3.06-1.87 0-2.15 1.46-2.15 2.96V20H10.7V9.5h2.68v1.44h.04c.37-.7 1.28-1.44 2.64-1.44 2.82 0 3.34 1.86 3.34 4.28V20z" />
        </svg>,
      ),
    },
    {
      id: "messenger",
      label: "Messenger",
      onClick: () => {
        if (/iPhone|iPad|Android/i.test(navigator.userAgent)) {
          window.location.href = `fb-messenger://share/?link=${encodedUrl}`;
          return;
        }
        void copyThenHint();
      },
      icon: brandIcon(
        "bg-[#006AFF]",
        <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden>
          <path d="M12 2C6.5 2 2.1 6.1 2.1 11.2c0 2.9 1.4 5.4 3.7 7.1V22l3.4-1.9c.9.2 1.8.4 2.8.4 5.5 0 9.9-4.1 9.9-9.3S17.5 2 12 2zm1 12.5-2.5-2.7-4.9 2.7 5.4-5.7 2.6 2.7 4.8-2.7-5.4 5.7z" />
        </svg>,
      ),
    },
    {
      id: "email",
      label: "Email",
      onClick: () =>
        openShare(`mailto:?subject=${encodedTitle}&body=${mailBody}`),
      icon: brandIcon(
        "bg-white/15 ring-1 ring-white/15",
        <Mail className="h-4 w-4" strokeWidth={2} aria-hidden />,
      ),
    },
    {
      id: "instagram",
      label: "Instagram",
      onClick: () => void copyThenHint(),
      icon: brandIcon(
        "bg-gradient-to-br from-[#F58529] via-[#DD2A7B] to-[#8134AF]",
        <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden>
          <path d="M12 7.2A4.8 4.8 0 1 0 12 16.8 4.8 4.8 0 0 0 12 7.2zm0 7.9a3.1 3.1 0 1 1 0-6.2 3.1 3.1 0 0 1 0 6.2z" />
          <circle cx="17.5" cy="6.6" r="1.15" />
          <path d="M16.7 2H7.3A5.3 5.3 0 0 0 2 7.3v9.4A5.3 5.3 0 0 0 7.3 22h9.4a5.3 5.3 0 0 0 5.3-5.3V7.3A5.3 5.3 0 0 0 16.7 2zm3.6 14.7a3.6 3.6 0 0 1-3.6 3.6H7.3a3.6 3.6 0 0 1-3.6-3.6V7.3A3.6 3.6 0 0 1 7.3 3.7h9.4a3.6 3.6 0 0 1 3.6 3.6v9.4z" />
        </svg>,
      ),
    },
    {
      id: "tiktok",
      label: "TikTok",
      onClick: () => void copyThenHint(),
      icon: brandIcon(
        "bg-black ring-1 ring-white/20",
        <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden>
          <path d="M19.6 8.3a5.8 5.8 0 0 1-3.4-1.1v7.1a5.5 5.5 0 1 1-5.5-5.5c.3 0 .6 0 .9.1v2.7a2.8 2.8 0 1 0 2 2.7V2.5h2.6c.2 1.5 1.1 2.9 2.4 3.8a5.7 5.7 0 0 0 3.1 1v2z" />
        </svg>,
      ),
    },
    {
      id: "copy",
      label: "Copy link",
      highlight: true,
      onClick: () => void copyLink(),
      icon: (
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-umx-orange text-white">
          {copied ? (
            <Check className="h-4 w-4" strokeWidth={2.4} aria-hidden />
          ) : (
            <Link2 className="h-4 w-4" strokeWidth={2.2} aria-hidden />
          )}
        </span>
      ),
    },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="absolute right-0 bottom-[calc(100%+0.7rem)] z-30 w-[min(calc(100vw-1.5rem),19rem)] overflow-hidden rounded-2xl border border-white/15 bg-black/88 shadow-[0_18px_44px_rgba(0,0,0,0.5)] backdrop-blur-md"
    >
      {/* Caret pointing down toward the share control */}
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-1.5 right-[4.25rem] h-3 w-3 rotate-45 border-r border-b border-white/15 bg-black/88 sm:right-[4.5rem]"
      />

      <div className="relative flex items-center justify-between gap-2 border-b border-white/10 px-3.5 py-3">
        <div className="flex items-center gap-2">
          <Share2 className="h-4 w-4 text-umx-orange" strokeWidth={2.2} />
          <h2
            id={titleId}
            className="font-display text-xs font-bold tracking-[0.12em] text-white uppercase"
          >
            Share video
          </h2>
        </div>
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/18"
          aria-label="Close"
        >
          <X className="h-4 w-4" strokeWidth={2.2} />
        </button>
      </div>

      <div className="relative space-y-3 p-3.5">
        <button
          type="button"
          onClick={() => void shareNative()}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-umx-orange/50 bg-umx-orange/10 px-3 py-2.5 font-display text-xs font-semibold text-white transition hover:border-umx-orange hover:bg-umx-orange/18"
        >
          <Smartphone className="h-4 w-4 text-umx-orange" strokeWidth={2.1} />
          Share via device…
        </button>

        <div className="grid grid-cols-2 gap-1.5">
          {channels.map((channel) => (
            <button
              key={channel.id}
              type="button"
              onClick={channel.onClick}
              className="flex items-center gap-2.5 rounded-xl px-2 py-2 text-left transition hover:bg-white/10"
            >
              {channel.icon}
              <span
                className={`min-w-0 truncate font-display text-[11px] font-semibold tracking-wide ${
                  channel.highlight ? "text-umx-orange" : "text-white/85"
                }`}
              >
                {channel.id === "copy" && copied ? "Copied" : channel.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
