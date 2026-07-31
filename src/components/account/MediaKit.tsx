"use client";

import { useState } from "react";
import Image from "next/image";
import { Check, Copy, Download } from "lucide-react";
import {
  BRAND_COLORS,
  MEDIA_KIT_LOGOS,
  MEDIA_KIT_POS,
  MEDIA_KIT_TOKENS,
  type MediaKitFile,
} from "@/lib/media-kit";

const PREVIEW_BG: Record<NonNullable<MediaKitFile["previewBg"]>, string> = {
  cream: "bg-umx-cream",
  ink: "bg-umx-orange-ink",
  orange: "bg-umx-orange",
  white: "bg-white",
};

function DownloadLink({
  href,
  name,
  label = "Download",
}: {
  href: string;
  name: string;
  label?: string;
}) {
  return (
    <a
      href={href}
      download={name}
      className="inline-flex items-center gap-2 bg-black px-4 py-2.5 font-display text-sm font-semibold text-white transition hover:bg-umx-orange"
    >
      <Download className="h-4 w-4" strokeWidth={2} />
      {label}
    </a>
  );
}

function AssetCard({ asset }: { asset: MediaKitFile }) {
  return (
    <li className="flex h-full flex-col border border-black/10 bg-umx-cream-bright overflow-hidden">
      {asset.previewUrl ? (
        <div
          className={`relative aspect-[16/10] border-b border-black/8 ${
            PREVIEW_BG[asset.previewBg ?? "cream"]
          }`}
        >
          {asset.previewUrl.endsWith(".svg") ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={asset.previewUrl}
              alt={asset.title}
              className="absolute inset-0 m-auto h-full w-full object-contain p-6 sm:p-8"
            />
          ) : (
            <Image
              src={asset.previewUrl}
              alt={asset.title}
              fill
              className="object-contain p-6 sm:p-8"
              sizes="(max-width: 640px) 100vw, 40vw"
            />
          )}
        </div>
      ) : (
        <div className="flex aspect-[16/10] items-center justify-center border-b border-black/8 bg-umx-cream px-6">
          <p className="font-display text-sm font-bold tracking-wide text-umx-orange uppercase">
            {asset.format}
          </p>
        </div>
      )}
      <div className="flex flex-1 flex-col p-5">
        <p className="font-display text-[10px] font-semibold tracking-[0.14em] text-umx-orange uppercase">
          {asset.category} · {asset.format}
        </p>
        <h3 className="mt-2 font-display text-base font-bold text-black sm:text-lg">
          {asset.title}
        </h3>
        <p className="mt-1.5 flex-1 font-body text-sm text-black">
          {asset.description}
        </p>
        <div className="mt-4">
          <DownloadLink href={asset.fileUrl} name={asset.downloadName} />
        </div>
      </div>
    </li>
  );
}

function ColorSwatch({
  name,
  role,
  hex,
  css,
}: {
  name: string;
  role: string;
  hex: string;
  css: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copyHex() {
    try {
      await navigator.clipboard.writeText(hex);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      /* ignore */
    }
  }

  return (
    <li className="border border-black/10 bg-umx-cream-bright overflow-hidden">
      <button
        type="button"
        onClick={copyHex}
        className="group block w-full text-left"
        aria-label={`Copy ${name} ${hex}`}
      >
        <div
          className="h-24 w-full border-b border-black/8 sm:h-28"
          style={{ backgroundColor: hex }}
        />
        <div className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-display text-sm font-bold text-black">{name}</p>
              <p className="mt-0.5 font-body text-xs text-black">{role}</p>
            </div>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center border border-black/12 text-black transition group-hover:border-umx-orange group-hover:text-umx-orange">
              {copied ? (
                <Check className="h-3.5 w-3.5 text-umx-orange" strokeWidth={2.5} />
              ) : (
                <Copy className="h-3.5 w-3.5" strokeWidth={2} />
              )}
            </span>
          </div>
          <p className="mt-3 font-mono text-sm font-semibold text-umx-orange">
            {hex}
          </p>
          <p className="mt-0.5 font-mono text-xs text-black">{css}</p>
        </div>
      </button>
    </li>
  );
}

function Section({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-10 first:mt-0">
      <div className="mb-5 border-b border-black/8 pb-4">
        <p className="font-display text-[10px] font-semibold tracking-[0.16em] text-umx-orange uppercase">
          {eyebrow}
        </p>
        <h2 className="mt-1.5 font-display text-xl font-extrabold text-black sm:text-2xl">
          {title}
        </h2>
        <p className="mt-1.5 max-w-2xl font-body text-sm text-black">
          {description}
        </p>
      </div>
      {children}
    </section>
  );
}

export default function MediaKit() {
  return (
    <div>
      <Section
        eyebrow="01 · Logos"
        title="Logo lockups"
        description="Use approved files only. Download PNG or SVG — do not recolor or stretch."
      >
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {MEDIA_KIT_LOGOS.map((asset) => (
            <AssetCard key={asset.id} asset={asset} />
          ))}
        </ul>
      </Section>

      <Section
        eyebrow="02 · Colors"
        title="Brand colors"
        description="Orange + cream only. Tap a swatch to copy the hex. Download JSON or CSS tokens below."
      >
        <ul className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
          {BRAND_COLORS.map((c) => (
            <ColorSwatch key={c.hex} {...c} />
          ))}
        </ul>
        <ul className="mt-4 grid gap-4 sm:grid-cols-2">
          {MEDIA_KIT_TOKENS.map((asset) => (
            <AssetCard key={asset.id} asset={asset} />
          ))}
        </ul>
      </Section>

      <Section
        eyebrow="03 · POS"
        title="Product & POS imagery"
        description="Approved pack and device shots for menus, shelves, and social."
      >
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {MEDIA_KIT_POS.map((asset) => (
            <AssetCard key={asset.id} asset={asset} />
          ))}
        </ul>
      </Section>

      <section className="mt-10 border border-black/10 bg-umx-cream-bright p-5 sm:p-6">
        <p className="font-display text-[10px] font-semibold tracking-[0.16em] text-umx-orange uppercase">
          Usage
        </p>
        <h2 className="mt-1.5 font-display text-lg font-bold text-black">
          Quick rules
        </h2>
        <ul className="mt-3 space-y-2 font-body text-sm text-black">
          <li>· Do not recolor logos outside these lockups.</li>
          <li>· Keep clear space around the wordmark (about the height of the U).</li>
          <li>· No drop shadows, outlines, or effects on the logo.</li>
          <li>· Adult 21+ brand — no youth-oriented placement.</li>
        </ul>
      </section>
    </div>
  );
}
