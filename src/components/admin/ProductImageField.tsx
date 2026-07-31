"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import {
  PRODUCT_IMAGE,
  PRODUCT_IMAGE_HELP,
  formatBytes,
} from "@/lib/product-image";

export function ProductImageField({
  name = "image",
  defaultValue = "",
}: {
  name?: string;
  defaultValue?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState(defaultValue);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function onFile(file: File | null) {
    if (!file) return;
    setError(null);
    setInfo(null);

    if (file.size > PRODUCT_IMAGE.maxUploadBytes) {
      setError(
        `File is ${formatBytes(file.size)} — max upload is ${formatBytes(PRODUCT_IMAGE.maxUploadBytes)}.`,
      );
      return;
    }

    setBusy(true);
    try {
      const body = new FormData();
      body.set("file", file);
      const res = await fetch("/api/admin/upload/product-image", {
        method: "POST",
        body,
      });
      const data = (await res.json()) as {
        error?: string;
        url?: string;
        message?: string;
      };
      if (!res.ok) {
        setError(data.error || "Upload failed");
        return;
      }
      if (data.url) {
        setUrl(data.url);
        setInfo(data.message || "Uploaded");
      }
    } catch {
      setError("Upload failed. Check your connection and try again.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-3">
      <input type="hidden" name={name} value={url} />

      <div className="flex flex-wrap gap-4">
        <div className="relative flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[var(--admin-border)] bg-[var(--admin-gray-50)]">
          {url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt="Product" className="h-full w-full object-cover" />
          ) : (
            <ImagePlus
              className="h-8 w-8 text-[var(--admin-muted)]"
              strokeWidth={1.5}
            />
          )}
          {url && (
            <button
              type="button"
              onClick={() => {
                setUrl("");
                setInfo(null);
              }}
              className="absolute top-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white"
              aria-label="Remove image"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <label className="admin-btn admin-btn-secondary admin-btn-sm inline-flex cursor-pointer">
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ImagePlus className="h-4 w-4" strokeWidth={1.75} />
            )}
            {busy ? "Uploading…" : "Upload image"}
            <input
              ref={inputRef}
              type="file"
              accept={PRODUCT_IMAGE.acceptAttr}
              className="sr-only"
              disabled={busy}
              onChange={(e) => onFile(e.target.files?.[0] || null)}
            />
          </label>

          <ul className="space-y-0.5 text-xs text-[var(--admin-muted)]">
            <li>· Formats: {PRODUCT_IMAGE_HELP.formats}</li>
            <li>· {PRODUCT_IMAGE_HELP.maxUpload} — larger files are rejected</li>
            <li>· {PRODUCT_IMAGE_HELP.output}</li>
            <li>· {PRODUCT_IMAGE_HELP.recommended}</li>
          </ul>

          {error && (
            <p className="text-xs font-medium text-[var(--admin-error-700)]">{error}</p>
          )}
          {info && !error && (
            <p className="text-xs font-medium text-[var(--admin-success-700)]">{info}</p>
          )}
          {url && (
            <p className="truncate text-[0.65rem] text-[var(--admin-muted)]">{url}</p>
          )}
        </div>
      </div>
    </div>
  );
}
