"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { updateStaffProfile } from "@/lib/admin-actions";
import { AdminCard } from "@/components/admin/ui";
import { useAdminI18n } from "@/components/admin/AdminI18n";
import { Building2, Camera, MapPin, User } from "lucide-react";

export type StaffProfileFormData = {
  name: string;
  email: string;
  phone: string;
  role: string;
  status: string;
  avatarUrl: string | null;
  jobTitle: string;
  department: string;
  companyName: string;
  companyLogoUrl: string | null;
  line1: string;
  line2: string;
  city: string;
  region: string;
  postalCode: string;
  country: string;
};

export default function AdminProfileForm({
  initial,
  signOutAction,
}: {
  initial: StaffProfileFormData;
  signOutAction: () => Promise<void>;
}) {
  const { t } = useAdminI18n();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [form, setForm] = useState(initial);
  const [uploading, setUploading] = useState<"avatar" | "logo" | null>(null);
  const avatarRef = useRef<HTMLInputElement>(null);
  const logoRef = useRef<HTMLInputElement>(null);

  function setField<K extends keyof StaffProfileFormData>(
    key: K,
    value: StaffProfileFormData[K],
  ) {
    setForm((f) => ({ ...f, [key]: value }));
    setOk(false);
  }

  async function uploadImage(kind: "avatar" | "logo", file: File) {
    setUploading(kind);
    setError(null);
    try {
      const fd = new FormData();
      fd.set("kind", kind);
      fd.set("file", file);
      const res = await fetch("/api/admin/upload/profile-image", {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      if (kind === "avatar") setField("avatarUrl", data.url);
      else setField("companyLogoUrl", data.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("profile.saveError"));
    } finally {
      setUploading(null);
    }
  }

  function onSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setOk(false);
    startTransition(async () => {
      try {
        await updateStaffProfile({
          name: form.name,
          email: form.email,
          phone: form.phone,
          jobTitle: form.jobTitle,
          department: form.department,
          companyName: form.companyName,
          companyLogoUrl: form.companyLogoUrl,
          avatarUrl: form.avatarUrl,
          line1: form.line1,
          line2: form.line2,
          city: form.city,
          region: form.region,
          postalCode: form.postalCode,
          country: form.country,
        });
        setOk(true);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : t("profile.saveError"));
      }
    });
  }

  const fieldClass = "admin-input mt-1.5 w-full";
  const labelClass = "block text-xs font-medium text-[var(--admin-muted)]";

  return (
    <form onSubmit={onSave} className="space-y-6">
      {/* Hero identity */}
      <AdminCard>
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="relative shrink-0">
            <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl bg-[var(--admin-brand-50)] ring-1 ring-[var(--admin-border)]">
              {form.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={form.avatarUrl}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <User className="h-10 w-10 text-[var(--admin-brand-500)]" />
              )}
            </div>
            <button
              type="button"
              disabled={!!uploading}
              onClick={() => avatarRef.current?.click()}
              className="absolute -right-1 -bottom-1 flex h-9 w-9 items-center justify-center rounded-full bg-[var(--admin-brand-500)] text-white shadow"
              title={t("profile.changeAvatar")}
            >
              <Camera className="h-4 w-4" />
            </button>
            <input
              ref={avatarRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void uploadImage("avatar", f);
                e.target.value = "";
              }}
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xl font-semibold text-[var(--admin-text)]">
              {form.name || t("profile.yourName")}
            </p>
            <p className="mt-0.5 text-sm text-[var(--admin-muted)]">
              {t(`role.${form.role}`)}
              {form.jobTitle ? ` · ${form.jobTitle}` : ""}
            </p>
            <p className="mt-2 text-sm text-[var(--admin-text)]">
              {form.companyName || "UMAXES"}
            </p>
            {uploading === "avatar" ? (
              <p className="mt-2 text-xs text-[var(--admin-muted)]">
                {t("common.loading")}
              </p>
            ) : null}
          </div>
        </div>
      </AdminCard>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Personal */}
        <AdminCard>
          <div className="mb-4 flex items-center gap-2">
            <User className="h-4 w-4 text-[var(--admin-brand-500)]" />
            <p className="text-[11px] font-semibold tracking-[0.14em] text-[var(--admin-muted)] uppercase">
              {t("profile.personalInfo")}
            </p>
          </div>
          <div className="space-y-3">
            <label className={labelClass}>
              {t("profile.fullName")}
              <input
                required
                className={fieldClass}
                value={form.name}
                onChange={(e) => setField("name", e.target.value)}
              />
            </label>
            <label className={labelClass}>
              {t("profile.email")}
              <input
                type="email"
                className={fieldClass}
                value={form.email}
                onChange={(e) => setField("email", e.target.value)}
              />
            </label>
            <label className={labelClass}>
              {t("profile.phone")}
              <input
                className={fieldClass}
                value={form.phone}
                onChange={(e) => setField("phone", e.target.value)}
              />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className={labelClass}>
                {t("profile.jobTitle")}
                <input
                  className={fieldClass}
                  value={form.jobTitle}
                  onChange={(e) => setField("jobTitle", e.target.value)}
                  placeholder={t("profile.jobTitlePlaceholder")}
                />
              </label>
              <label className={labelClass}>
                {t("profile.department")}
                <input
                  className={fieldClass}
                  value={form.department}
                  onChange={(e) => setField("department", e.target.value)}
                  placeholder={t("profile.departmentPlaceholder")}
                />
              </label>
            </div>
          </div>
        </AdminCard>

        {/* Company */}
        <AdminCard>
          <div className="mb-4 flex items-center gap-2">
            <Building2 className="h-4 w-4 text-[var(--admin-brand-500)]" />
            <p className="text-[11px] font-semibold tracking-[0.14em] text-[var(--admin-muted)] uppercase">
              {t("profile.companyInfo")}
            </p>
          </div>
          <div className="mb-4 flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl border border-[var(--admin-border)] bg-[var(--admin-hover)]/40">
              {form.companyLogoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={form.companyLogoUrl}
                  alt=""
                  className="h-full w-full object-contain p-1"
                />
              ) : (
                <Building2 className="h-6 w-6 text-[var(--admin-muted)]" />
              )}
            </div>
            <div>
              <button
                type="button"
                disabled={!!uploading}
                onClick={() => logoRef.current?.click()}
                className="admin-btn admin-btn-secondary admin-btn-sm"
              >
                {uploading === "logo"
                  ? t("common.loading")
                  : t("profile.changeLogo")}
              </button>
              <input
                ref={logoRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void uploadImage("logo", f);
                  e.target.value = "";
                }}
              />
              <p className="mt-1.5 text-xs text-[var(--admin-muted)]">
                {t("profile.logoHint")}
              </p>
            </div>
          </div>
          <label className={labelClass}>
            {t("profile.companyName")}
            <input
              className={fieldClass}
              value={form.companyName}
              onChange={(e) => setField("companyName", e.target.value)}
            />
          </label>
        </AdminCard>
      </div>

      {/* Address */}
      <AdminCard>
        <div className="mb-4 flex items-center gap-2">
          <MapPin className="h-4 w-4 text-[var(--admin-brand-500)]" />
          <p className="text-[11px] font-semibold tracking-[0.14em] text-[var(--admin-muted)] uppercase">
            {t("profile.addressInfo")}
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className={`${labelClass} sm:col-span-2`}>
            {t("profile.line1")}
            <input
              className={fieldClass}
              value={form.line1}
              onChange={(e) => setField("line1", e.target.value)}
            />
          </label>
          <label className={`${labelClass} sm:col-span-2`}>
            {t("profile.line2")}
            <input
              className={fieldClass}
              value={form.line2}
              onChange={(e) => setField("line2", e.target.value)}
            />
          </label>
          <label className={labelClass}>
            {t("profile.city")}
            <input
              className={fieldClass}
              value={form.city}
              onChange={(e) => setField("city", e.target.value)}
            />
          </label>
          <label className={labelClass}>
            {t("profile.region")}
            <input
              className={fieldClass}
              value={form.region}
              onChange={(e) => setField("region", e.target.value)}
            />
          </label>
          <label className={labelClass}>
            {t("profile.postalCode")}
            <input
              className={fieldClass}
              value={form.postalCode}
              onChange={(e) => setField("postalCode", e.target.value)}
            />
          </label>
          <label className={labelClass}>
            {t("profile.country")}
            <input
              className={fieldClass}
              value={form.country}
              onChange={(e) => setField("country", e.target.value)}
            />
          </label>
        </div>
      </AdminCard>

      {error ? (
        <p className="text-sm text-[var(--admin-danger)]">{error}</p>
      ) : null}
      {ok ? (
        <p className="text-sm text-[var(--admin-success-500)]">
          {t("profile.saveSuccess")}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => void signOutAction()}
          className="admin-btn admin-btn-secondary admin-btn-sm"
        >
          {t("header.signOut")}
        </button>
        <button
          type="submit"
          disabled={pending || !!uploading}
          className="admin-btn admin-btn-primary admin-btn-sm"
        >
          {pending ? t("common.loading") : t("profile.save")}
        </button>
      </div>
    </form>
  );
}
