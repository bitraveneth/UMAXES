"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { Camera, User } from "lucide-react";

export type BuyerProfileFormData = {
  name: string;
  email: string;
  phone: string;
  jobTitle: string;
  image: string | null;
  companyName: string | null;
  companyLevelLabel: string;
};

export type BuyerProfileSaveInput = {
  name: string;
  email: string;
  phone: string;
  jobTitle: string;
  image: string | null;
};

const fieldClass =
  "mt-1.5 w-full border border-black/15 bg-white px-3.5 py-3 font-body text-sm text-black outline-none transition focus:border-umx-orange focus:ring-2 focus:ring-umx-orange/20";
const labelClass =
  "block font-display text-xs font-semibold tracking-wide text-black uppercase";

export default function BuyerProfileForm({
  initial,
  saveAction,
}: {
  initial: BuyerProfileFormData;
  saveAction: (input: BuyerProfileSaveInput) => Promise<void>;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [form, setForm] = useState(initial);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function setField<K extends keyof BuyerProfileFormData>(
    key: K,
    value: BuyerProfileFormData[K],
  ) {
    setForm((f) => ({ ...f, [key]: value }));
    setOk(false);
  }

  async function uploadAvatar(file: File) {
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.set("file", file);
      const res = await fetch("/api/account/upload/avatar", {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setField("image", data.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  function onSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setOk(false);
    startTransition(async () => {
      try {
        await saveAction({
          name: form.name,
          email: form.email,
          phone: form.phone,
          jobTitle: form.jobTitle,
          image: form.image,
        });
        setOk(true);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not save");
      }
    });
  }

  return (
    <form onSubmit={onSave} className="space-y-6">
      <div className="border border-black/10 bg-umx-cream-bright p-5 sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="relative shrink-0">
            <div className="flex h-24 w-24 items-center justify-center overflow-hidden bg-umx-orange-wash ring-1 ring-black/10">
              {form.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={form.image}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <User className="h-10 w-10 text-umx-orange" strokeWidth={1.75} />
              )}
            </div>
            <button
              type="button"
              disabled={uploading || pending}
              onClick={() => fileRef.current?.click()}
              className="absolute -right-1 -bottom-1 flex h-9 w-9 items-center justify-center bg-umx-orange text-white"
              title="Change photo"
            >
              <Camera className="h-4 w-4" />
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void uploadAvatar(f);
                e.target.value = "";
              }}
            />
          </div>
          <div className="min-w-0">
            <p className="font-display text-xl font-bold text-black">
              {form.name || "Your name"}
            </p>
            <p className="mt-0.5 font-body text-sm text-black">
              {form.companyName || "Company"} · {form.companyLevelLabel}
            </p>
            {uploading ? (
              <p className="mt-2 font-body text-xs text-black">Uploading…</p>
            ) : (
              <p className="mt-2 font-body text-xs text-black">
                JPEG, PNG, or WebP · max 5MB
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="border border-black/10 bg-umx-cream-bright p-5 sm:p-6">
        <p className="font-display text-[10px] font-semibold tracking-[0.14em] text-umx-orange uppercase">
          Personal
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className={labelClass}>
            Full name
            <input
              className={fieldClass}
              value={form.name}
              onChange={(e) => setField("name", e.target.value)}
              required
            />
          </label>
          <label className={labelClass}>
            Job title
            <input
              className={fieldClass}
              value={form.jobTitle}
              onChange={(e) => setField("jobTitle", e.target.value)}
              placeholder="Buyer, owner…"
            />
          </label>
          <label className={labelClass}>
            Email
            <input
              type="email"
              className={fieldClass}
              value={form.email}
              onChange={(e) => setField("email", e.target.value)}
            />
          </label>
          <label className={labelClass}>
            Phone
            <input
              type="tel"
              className={fieldClass}
              value={form.phone}
              onChange={(e) => setField("phone", e.target.value)}
              placeholder="+1…"
            />
          </label>
        </div>
      </div>

      <div className="border border-black/10 bg-umx-cream-bright p-5 sm:p-6">
        <p className="font-display text-[10px] font-semibold tracking-[0.14em] text-umx-orange uppercase">
          Company
        </p>
        <p className="mt-3 font-display text-base font-bold text-black">
          {form.companyName || "—"}
        </p>
        <p className="mt-1 font-body text-sm text-black">
          {form.companyLevelLabel} · managed by UMAXES sales. Contact support to
          change company details.
        </p>
      </div>

      {error ? (
        <p className="border border-red-200 bg-red-50 px-4 py-3 font-body text-sm text-red-800">
          {error}
        </p>
      ) : null}
      {ok ? (
        <p className="border border-emerald-200 bg-emerald-50 px-4 py-3 font-body text-sm text-emerald-900">
          Profile saved.
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending || uploading}
        className="bg-umx-orange px-6 py-3 font-display text-sm font-semibold text-white transition hover:bg-umx-orange-deep disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save profile"}
      </button>
    </form>
  );
}
