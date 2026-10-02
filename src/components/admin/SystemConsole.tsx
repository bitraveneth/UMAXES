"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AdminBadge, AdminCard, AdminStat } from "@/components/admin/ui";
import type { BackupScope, DbBackup } from "@/lib/system-db";
import type { SiteSettings } from "@/lib/site-settings";
import {
  Database,
  Download,
  Upload,
  Trash2,
  AlertTriangle,
  Shield,
  Globe2,
  LogIn,
  Wrench,
  RefreshCw,
  Activity,
  HardDrive,
  Package,
  Users,
  ShoppingBag,
  CheckCircle2,
  XCircle,
  FileJson,
} from "lucide-react";

export type SystemActivityRow = {
  id: string;
  action: string;
  createdAt: string;
  meta: string | null;
  userName: string | null;
  userEmail: string | null;
};

const SCOPES: {
  id: BackupScope;
  label: string;
  hint: string;
  tone: "brand" | "success" | "warning" | "neutral";
}[] = [
  {
    id: "ops",
    label: "Orders & shipping",
    hint: "Day-to-day safety copy — orders, payments, shipments, credit, RMA",
    tone: "brand",
  },
  {
    id: "catalog",
    label: "Catalog",
    hint: "Products, prices, stock, warehouses, coupons, FAQ",
    tone: "success",
  },
  {
    id: "accounts",
    label: "Accounts",
    hint: "Companies, buyers, staff (non–super-admin), addresses, suppliers",
    tone: "neutral",
  },
  {
    id: "full",
    label: "Full website",
    hint: "Complete JSON snapshot — use before major changes or VPS migrate",
    tone: "warning",
  },
];

function formatWhen(iso: string | null | undefined) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

function actionLabel(action: string) {
  if (action === "SYSTEM_BACKUP_EXPORT") return "Backup downloaded";
  if (action === "SYSTEM_BACKUP_IMPORT") return "Backup imported";
  if (action === "SYSTEM_DB_RESET") return "Database reset";
  if (action === "SITE_ACCESS_UPDATED") return "Site settings updated";
  if (action === "SYSTEM_CACHE_REVALIDATED") return "Cache refreshed";
  return action.replace(/_/g, " ").toLowerCase();
}

export default function SystemConsole({
  stats,
  siteSettings,
  recentActivity,
  envLabel,
}: {
  stats: Record<string, number>;
  siteSettings: SiteSettings;
  recentActivity: SystemActivityRow[];
  envLabel: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [homepageAsLogin, setHomepageAsLogin] = useState(
    siteSettings.homepageAsLogin,
  );
  const [publicSignInEnabled, setPublicSignInEnabled] = useState(
    siteSettings.publicSignInEnabled,
  );
  const [maintenanceMode, setMaintenanceMode] = useState(
    siteSettings.maintenanceMode,
  );
  const [savedSettings, setSavedSettings] = useState(siteSettings);

  const [scope, setScope] = useState<BackupScope>("ops");
  const [resetMode, setResetMode] = useState<"ops" | "accounts">("ops");
  const [resetConfirm, setResetConfirm] = useState("");
  const [importConfirm, setImportConfirm] = useState("");
  const [importReplace, setImportReplace] = useState(true);
  const [importPreview, setImportPreview] = useState<DbBackup | null>(null);
  const [dangerOpen, setDangerOpen] = useState(false);

  const settingsDirty =
    homepageAsLogin !== savedSettings.homepageAsLogin ||
    publicSignInEnabled !== savedSettings.publicSignInEnabled ||
    maintenanceMode !== savedSettings.maintenanceMode;

  const lastBackup = useMemo(
    () =>
      recentActivity.find((a) => a.action === "SYSTEM_BACKUP_EXPORT") || null,
    [recentActivity],
  );

  function clearFlash() {
    setMessage(null);
    setError(null);
  }

  function saveSettings() {
    clearFlash();
    startTransition(async () => {
      try {
        const res = await fetch("/api/admin/system/site-settings", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            homepageAsLogin,
            publicSignInEnabled,
            maintenanceMode,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || "Save failed");
        const next = data.settings as SiteSettings;
        setSavedSettings(next);
        setHomepageAsLogin(next.homepageAsLogin);
        setPublicSignInEnabled(next.publicSignInEnabled);
        setMaintenanceMode(next.maintenanceMode);
        setMessage("Site controls saved.");
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Save failed");
      }
    });
  }

  function downloadBackup(chosen: BackupScope = scope) {
    clearFlash();
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/system/export?scope=${chosen}`);
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          throw new Error(j.error || "Export failed");
        }
        const blob = await res.blob();
        const cd = res.headers.get("Content-Disposition") || "";
        const match = cd.match(/filename="([^"]+)"/);
        const name = match?.[1] || `umaxes-backup-${chosen}.json`;
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = name;
        a.click();
        URL.revokeObjectURL(url);
        setMessage(`Downloaded ${name}`);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Export failed");
      }
    });
  }

  function downloadSettingsJson() {
    const payload = {
      exportedAt: new Date().toISOString(),
      kind: "umaxes-site-settings",
      settings: savedSettings,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `umaxes-site-settings-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setMessage("Downloaded site settings JSON.");
  }

  function onPickFile(file: File | null) {
    clearFlash();
    setImportPreview(null);
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as DbBackup;
        if (!parsed?.version || !parsed?.data || !parsed?.scope) {
          throw new Error("Not a valid UMAXES backup file");
        }
        setImportPreview(parsed);
        setMessage(
          `Ready to restore · ${parsed.scope} · exported ${formatWhen(parsed.exportedAt)}`,
        );
      } catch (e) {
        setError(e instanceof Error ? e.message : "Invalid file");
      }
    };
    reader.readAsText(file);
  }

  function runImport() {
    clearFlash();
    if (!importPreview) {
      setError("Choose a backup file first");
      return;
    }
    startTransition(async () => {
      try {
        const res = await fetch("/api/admin/system/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            backup: importPreview,
            replace: importReplace,
            confirm: importConfirm,
          }),
        });
        const j = await res.json();
        if (!res.ok) throw new Error(j.error || "Import failed");
        setMessage("Import complete. Refreshing counts…");
        setImportConfirm("");
        setImportPreview(null);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Import failed");
      }
    });
  }

  function runReset() {
    clearFlash();
    startTransition(async () => {
      try {
        const res = await fetch("/api/admin/system/reset", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mode: resetMode, confirm: resetConfirm }),
        });
        const j = await res.json();
        if (!res.ok) throw new Error(j.error || "Reset failed");
        setMessage(`Reset (${resetMode}) complete.`);
        setResetConfirm("");
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Reset failed");
      }
    });
  }

  function revalidateCache() {
    clearFlash();
    startTransition(async () => {
      try {
        const res = await fetch("/api/admin/system/revalidate", {
          method: "POST",
        });
        const j = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(j.error || "Refresh failed");
        setMessage("Storefront & ops caches refreshed.");
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Refresh failed");
      }
    });
  }

  const toggleClass =
    "flex cursor-pointer items-start gap-3 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-bg)] px-4 py-3.5 transition has-[:checked]:border-[var(--admin-brand-500)]/50 has-[:checked]:bg-[var(--admin-brand-50)]/50";

  return (
    <div className="space-y-6">
      {(message || error) && (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${
            error
              ? "border-[var(--admin-error-500)]/35 bg-[var(--admin-error-50)] text-[var(--admin-error-700)]"
              : "border-[var(--admin-success-500)]/35 bg-[var(--admin-success-50)] text-[var(--admin-success-700)]"
          }`}
        >
          {error || message}
        </div>
      )}

      {/* Purpose strip */}
      <AdminCard className="overflow-hidden !p-0">
        <div className="relative border-b border-[var(--admin-border)] bg-[linear-gradient(135deg,var(--admin-brand-50)_0%,var(--admin-bg)_55%,transparent_100%)] px-5 py-5 sm:px-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-2xl">
              <p className="text-[11px] font-semibold tracking-[0.14em] text-[var(--admin-brand-600)] uppercase">
                Website backup & controls
              </p>
              <h2 className="mt-1 text-xl font-semibold tracking-tight text-[var(--admin-text)]">
                Keep a safe copy of the site, then restore when you need it
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-[var(--admin-muted)]">
                Export JSON backups of orders, catalog, accounts, or the full
                database. Toggle public access and maintenance while you work.
                Super admin only.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <AdminBadge tone={maintenanceMode ? "warning" : "success"}>
                {maintenanceMode ? "Maintenance on" : "Storefront live"}
              </AdminBadge>
              <AdminBadge tone={publicSignInEnabled ? "brand" : "warning"}>
                {publicSignInEnabled ? "Public sign-in on" : "Public sign-in off"}
              </AdminBadge>
              <AdminBadge tone="neutral">{envLabel}</AdminBadge>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={pending}
              onClick={() => downloadBackup("ops")}
              className="admin-btn admin-btn-primary admin-btn-sm"
            >
              <Download className="h-3.5 w-3.5" />
              Quick backup · orders
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => downloadBackup("full")}
              className="admin-btn admin-btn-secondary admin-btn-sm"
            >
              <HardDrive className="h-3.5 w-3.5" />
              Full website backup
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={revalidateCache}
              className="admin-btn admin-btn-ghost admin-btn-sm"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh site cache
            </button>
            <button
              type="button"
              onClick={downloadSettingsJson}
              className="admin-btn admin-btn-ghost admin-btn-sm"
            >
              <FileJson className="h-3.5 w-3.5" />
              Export settings
            </button>
          </div>
          {lastBackup ? (
            <p className="mt-3 text-xs text-[var(--admin-muted)]">
              Last backup download: {formatWhen(lastBackup.createdAt)}
              {lastBackup.userName || lastBackup.userEmail
                ? ` · ${lastBackup.userName || lastBackup.userEmail}`
                : ""}
            </p>
          ) : (
            <p className="mt-3 text-xs text-[var(--admin-muted)]">
              No backup downloads logged yet — run a quick backup before any
              reset or import.
            </p>
          )}
        </div>
      </AdminCard>

      {/* Snapshot */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStat
          label="Orders"
          value={stats.orders ?? 0}
          icon={ShoppingBag}
        />
        <AdminStat label="Users" value={stats.users ?? 0} icon={Users} />
        <AdminStat
          label="Products"
          value={stats.products ?? 0}
          icon={Package}
        />
        <AdminStat
          label="Audit events"
          value={stats.auditLogs ?? 0}
          icon={Activity}
        />
      </div>

      <AdminCard padded={false}>
        <div className="flex items-center justify-between gap-3 border-b border-[var(--admin-border)] px-5 py-4">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-[var(--admin-brand-500)]" />
            <h3 className="admin-section-title mb-0">Database snapshot</h3>
          </div>
          <button
            type="button"
            className="admin-btn admin-btn-ghost admin-btn-sm"
            onClick={() => router.refresh()}
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh counts
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2 p-4 sm:grid-cols-3 lg:grid-cols-5">
          {Object.entries(stats).map(([k, v]) => (
            <div
              key={k}
              className="rounded-lg border border-[var(--admin-border)] px-3 py-2"
            >
              <p className="text-[10px] font-semibold tracking-wide text-[var(--admin-muted)] uppercase">
                {k}
              </p>
              <p className="mt-0.5 text-lg font-semibold tabular-nums text-[var(--admin-text)]">
                {v < 0 ? "—" : v.toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      </AdminCard>

      {/* Site controls */}
      <AdminCard>
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--admin-brand-50)] text-[var(--admin-brand-500)]">
            <Shield className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="admin-section-title mb-1">Site controls</h3>
            <p className="text-sm text-[var(--admin-muted)]">
              What the public sees while you back up or restore.
            </p>

            <div className="mt-5 grid gap-3 lg:grid-cols-3">
              <div className="space-y-2">
                <p className="text-xs font-semibold tracking-wide text-[var(--admin-muted)] uppercase">
                  Homepage
                </p>
                <label className={toggleClass}>
                  <input
                    type="radio"
                    name="home-mode"
                    className="mt-1 accent-[var(--admin-brand-500)]"
                    checked={!homepageAsLogin}
                    disabled={pending}
                    onChange={() => setHomepageAsLogin(false)}
                  />
                  <span>
                    <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--admin-text)]">
                      <Globe2 className="h-3.5 w-3.5 text-[var(--admin-brand-500)]" />
                      Marketing home
                    </span>
                    <span className="mt-0.5 block text-xs text-[var(--admin-muted)]">
                      Guests see /
                    </span>
                  </span>
                </label>
                <label className={toggleClass}>
                  <input
                    type="radio"
                    name="home-mode"
                    className="mt-1 accent-[var(--admin-brand-500)]"
                    checked={homepageAsLogin}
                    disabled={pending}
                    onChange={() => setHomepageAsLogin(true)}
                  />
                  <span>
                    <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--admin-text)]">
                      <LogIn className="h-3.5 w-3.5 text-[var(--admin-brand-500)]" />
                      Sign-in first
                    </span>
                    <span className="mt-0.5 block text-xs text-[var(--admin-muted)]">
                      Guests go to /login
                    </span>
                  </span>
                </label>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold tracking-wide text-[var(--admin-muted)] uppercase">
                  Public accounts
                </p>
                <label className={toggleClass}>
                  <input
                    type="radio"
                    name="public-signin"
                    className="mt-1 accent-[var(--admin-brand-500)]"
                    checked={publicSignInEnabled}
                    disabled={pending}
                    onChange={() => setPublicSignInEnabled(true)}
                  />
                  <span>
                    <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--admin-text)]">
                      <CheckCircle2 className="h-3.5 w-3.5 text-[var(--admin-success-500)]" />
                      Sign-in & register open
                    </span>
                    <span className="mt-0.5 block text-xs text-[var(--admin-muted)]">
                      Buyers can create accounts
                    </span>
                  </span>
                </label>
                <label className={toggleClass}>
                  <input
                    type="radio"
                    name="public-signin"
                    className="mt-1 accent-[var(--admin-brand-500)]"
                    checked={!publicSignInEnabled}
                    disabled={pending}
                    onChange={() => setPublicSignInEnabled(false)}
                  />
                  <span>
                    <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--admin-text)]">
                      <XCircle className="h-3.5 w-3.5 text-[var(--admin-warning-500)]" />
                      Close public sign-in
                    </span>
                    <span className="mt-0.5 block text-xs text-[var(--admin-muted)]">
                      Staff can still sign in
                    </span>
                  </span>
                </label>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold tracking-wide text-[var(--admin-muted)] uppercase">
                  Maintenance
                </p>
                <label className={toggleClass}>
                  <input
                    type="radio"
                    name="maintenance"
                    className="mt-1 accent-[var(--admin-brand-500)]"
                    checked={!maintenanceMode}
                    disabled={pending}
                    onChange={() => setMaintenanceMode(false)}
                  />
                  <span>
                    <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--admin-text)]">
                      Storefront open
                    </span>
                    <span className="mt-0.5 block text-xs text-[var(--admin-muted)]">
                      Normal shopping experience
                    </span>
                  </span>
                </label>
                <label className={toggleClass}>
                  <input
                    type="radio"
                    name="maintenance"
                    className="mt-1 accent-[var(--admin-error-500)]"
                    checked={maintenanceMode}
                    disabled={pending}
                    onChange={() => setMaintenanceMode(true)}
                  />
                  <span>
                    <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--admin-text)]">
                      <Wrench className="h-3.5 w-3.5 text-[var(--admin-warning-500)]" />
                      Maintenance page
                    </span>
                    <span className="mt-0.5 block text-xs text-[var(--admin-muted)]">
                      Public sees /maintenance; ops stays available
                    </span>
                  </span>
                </label>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={saveSettings}
                disabled={pending || !settingsDirty}
                className="admin-btn admin-btn-primary"
              >
                {pending ? "Saving…" : "Save site controls"}
              </button>
              {maintenanceMode ? (
                <Link
                  href="/maintenance"
                  target="_blank"
                  className="text-sm font-medium text-[var(--admin-brand-600)] underline-offset-2 hover:underline"
                >
                  Preview maintenance page
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      </AdminCard>

      {/* Backup + restore */}
      <div className="grid gap-6 xl:grid-cols-2">
        <AdminCard>
          <div className="flex items-center gap-2">
            <Download className="h-4 w-4 text-[var(--admin-brand-500)]" />
            <h3 className="admin-section-title mb-0">Backup / export</h3>
          </div>
          <p className="mt-2 text-sm text-[var(--admin-muted)]">
            Download an offline JSON copy. Prefer{" "}
            <strong className="text-[var(--admin-text)]">Orders & shipping</strong>{" "}
            daily; use <strong className="text-[var(--admin-text)]">Full website</strong>{" "}
            before big changes.
          </p>
          <div className="mt-4 space-y-2">
            {SCOPES.map((s) => (
              <label
                key={s.id}
                className="flex cursor-pointer gap-3 rounded-xl border border-[var(--admin-border)] px-3 py-3 transition has-[:checked]:border-[var(--admin-brand-500)] has-[:checked]:bg-[var(--admin-brand-50)]/45"
              >
                <input
                  type="radio"
                  name="scope"
                  checked={scope === s.id}
                  onChange={() => setScope(s.id)}
                  className="mt-1 accent-[var(--admin-brand-500)]"
                />
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-[var(--admin-text)]">
                      {s.label}
                    </span>
                    <AdminBadge tone={s.tone}>{s.id}</AdminBadge>
                  </span>
                  <span className="mt-0.5 block text-xs text-[var(--admin-muted)]">
                    {s.hint}
                  </span>
                </span>
              </label>
            ))}
          </div>
          <button
            type="button"
            disabled={pending}
            onClick={() => downloadBackup(scope)}
            className="admin-btn admin-btn-primary mt-4 w-full sm:w-auto"
          >
            <Download className="h-4 w-4" />
            Download {SCOPES.find((s) => s.id === scope)?.label} backup
          </button>
        </AdminCard>

        <AdminCard>
          <div className="flex items-center gap-2">
            <Upload className="h-4 w-4 text-[var(--admin-brand-500)]" />
            <h3 className="admin-section-title mb-0">Restore / import</h3>
          </div>
          <p className="mt-2 text-sm text-[var(--admin-muted)]">
            Restore from a previous export. Super admin users are never deleted.
            Turn on maintenance first if buyers might hit the site mid-import.
          </p>
          <label className="admin-label mt-4 block">
            Backup file (.json)
            <input
              type="file"
              accept="application/json,.json"
              className="admin-input mt-1.5 w-full"
              onChange={(e) => onPickFile(e.target.files?.[0] || null)}
            />
          </label>
          {importPreview ? (
            <div className="mt-3 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-bg)] px-3 py-3 text-xs text-[var(--admin-muted)]">
              <p>
                Scope:{" "}
                <strong className="text-[var(--admin-text)]">
                  {importPreview.scope}
                </strong>{" "}
                · Exported {formatWhen(importPreview.exportedAt)} · v
                {importPreview.version}
              </p>
              <p className="mt-2 font-medium text-[var(--admin-text)]">
                Tables in file
              </p>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {Object.entries(importPreview.counts || {}).map(([k, n]) => (
                  <span
                    key={k}
                    className="rounded-md border border-[var(--admin-border)] bg-[var(--admin-card)] px-2 py-0.5 tabular-nums"
                  >
                    {k}: {n}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
          <label className="mt-3 flex items-center gap-2 text-sm text-[var(--admin-text)]">
            <input
              type="checkbox"
              checked={importReplace}
              onChange={(e) => setImportReplace(e.target.checked)}
            />
            Replace existing data for this scope before import
          </label>
          <label className="admin-label mt-3 block">
            Type <span className="font-mono">IMPORT</span> to confirm
            <input
              value={importConfirm}
              onChange={(e) => setImportConfirm(e.target.value)}
              className="admin-input mt-1.5 w-full font-mono"
              placeholder="IMPORT"
              autoComplete="off"
            />
          </label>
          <button
            type="button"
            disabled={pending || !importPreview || importConfirm !== "IMPORT"}
            onClick={runImport}
            className="admin-btn admin-btn-secondary mt-4 w-full sm:w-auto"
          >
            <Upload className="h-4 w-4" />
            Import now
          </button>
        </AdminCard>
      </div>

      {/* Recent system activity */}
      <AdminCard padded={false}>
        <div className="flex items-center justify-between gap-3 border-b border-[var(--admin-border)] px-5 py-4">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-[var(--admin-brand-500)]" />
            <h3 className="admin-section-title mb-0">Recent system activity</h3>
          </div>
          <Link
            href="/admin/activity?cat=system"
            className="text-sm font-medium text-[var(--admin-brand-600)] hover:underline"
          >
            View all
          </Link>
        </div>
        {recentActivity.length === 0 ? (
          <p className="px-5 py-8 text-sm text-[var(--admin-muted)]">
            No system actions yet.
          </p>
        ) : (
          <ul className="divide-y divide-[var(--admin-border)]">
            {recentActivity.map((row) => (
              <li
                key={row.id}
                className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 text-sm"
              >
                <div>
                  <p className="font-medium text-[var(--admin-text)]">
                    {actionLabel(row.action)}
                  </p>
                  <p className="text-xs text-[var(--admin-muted)]">
                    {row.userName || row.userEmail || "System"}
                  </p>
                </div>
                <p className="text-xs tabular-nums text-[var(--admin-muted)]">
                  {formatWhen(row.createdAt)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </AdminCard>

      {/* Danger zone */}
      <AdminCard>
        <button
          type="button"
          className="flex w-full items-center justify-between gap-3 text-left"
          onClick={() => setDangerOpen((v) => !v)}
        >
          <span className="flex items-center gap-2">
            <Trash2 className="h-4 w-4 text-[var(--admin-error-500)]" />
            <span className="admin-section-title mb-0">Danger zone · reset</span>
          </span>
          <span className="text-xs font-semibold text-[var(--admin-muted)]">
            {dangerOpen ? "Hide" : "Show"}
          </span>
        </button>
        {dangerOpen ? (
          <div className="mt-4 space-y-4">
            <div className="flex items-start gap-2 rounded-lg border border-[var(--admin-warning-500)]/35 bg-[var(--admin-warning-50)] px-3 py-2 text-sm text-[var(--admin-warning-700)]">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>
                Destructive. Download a backup first. Catalog images stay unless
                you import a catalog/full backup that replaces them.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex cursor-pointer gap-3 rounded-xl border border-[var(--admin-border)] px-3 py-2.5 has-[:checked]:border-[var(--admin-error-500)] has-[:checked]:bg-[var(--admin-error-50)]">
                <input
                  type="radio"
                  name="resetMode"
                  checked={resetMode === "ops"}
                  onChange={() => setResetMode("ops")}
                  className="mt-1 accent-[var(--admin-error-500)]"
                />
                <span>
                  <span className="block text-sm font-semibold text-[var(--admin-text)]">
                    Reset ops only
                  </span>
                  <span className="block text-xs text-[var(--admin-muted)]">
                    Clears orders, shipments, credit, RMA, notifications, audit.
                    Keeps products + companies.
                  </span>
                </span>
              </label>
              <label className="flex cursor-pointer gap-3 rounded-xl border border-[var(--admin-border)] px-3 py-2.5 has-[:checked]:border-[var(--admin-error-500)] has-[:checked]:bg-[var(--admin-error-50)]">
                <input
                  type="radio"
                  name="resetMode"
                  checked={resetMode === "accounts"}
                  onChange={() => setResetMode("accounts")}
                  className="mt-1 accent-[var(--admin-error-500)]"
                />
                <span>
                  <span className="block text-sm font-semibold text-[var(--admin-text)]">
                    Reset ops + customers
                  </span>
                  <span className="block text-xs text-[var(--admin-muted)]">
                    Also deletes buyer companies/users. Keeps staff + catalog.
                  </span>
                </span>
              </label>
            </div>
            <label className="admin-label block">
              Type{" "}
              <span className="font-mono">
                {resetMode === "ops" ? "RESET OPS" : "RESET ACCOUNTS"}
              </span>{" "}
              to confirm
              <input
                value={resetConfirm}
                onChange={(e) => setResetConfirm(e.target.value)}
                className="admin-input mt-1.5 w-full font-mono"
                autoComplete="off"
              />
            </label>
            <button
              type="button"
              disabled={
                pending ||
                resetConfirm !==
                  (resetMode === "ops" ? "RESET OPS" : "RESET ACCOUNTS")
              }
              onClick={runReset}
              className="admin-btn border border-red-300 bg-red-50 text-red-800 hover:bg-red-100"
            >
              Run reset
            </button>
          </div>
        ) : (
          <p className="mt-2 text-sm text-[var(--admin-muted)]">
            Clear transactional data after you have a verified backup.
          </p>
        )}
      </AdminCard>
    </div>
  );
}
