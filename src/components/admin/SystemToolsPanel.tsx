"use client";

import { useState, useTransition } from "react";
import { AdminCard } from "@/components/admin/ui";
import type { BackupScope, DbBackup } from "@/lib/system-db";
import {
  Database,
  Download,
  Upload,
  Trash2,
  AlertTriangle,
  Lightbulb,
} from "lucide-react";

const SCOPES: { id: BackupScope; label: string; hint: string }[] = [
  {
    id: "ops",
    label: "Orders & shipping",
    hint: "Orders, payments, shipments, credit ledger, RMA, notifications",
  },
  {
    id: "catalog",
    label: "Catalog only",
    hint: "Products, prices, inventory, options, warehouses, coupons",
  },
  {
    id: "accounts",
    label: "Accounts",
    hint: "Companies, buyers, staff (non–super-admin), addresses, suppliers",
  },
  {
    id: "full",
    label: "Full database",
    hint: "Everything (large file — prefer scoped backups on Vercel)",
  },
];

export default function SystemToolsPanel({
  stats,
}: {
  stats: Record<string, number>;
}) {
  const [pending, startTransition] = useTransition();
  const [scope, setScope] = useState<BackupScope>("ops");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resetMode, setResetMode] = useState<"ops" | "accounts">("ops");
  const [resetConfirm, setResetConfirm] = useState("");
  const [importConfirm, setImportConfirm] = useState("");
  const [importReplace, setImportReplace] = useState(true);
  const [importPreview, setImportPreview] = useState<DbBackup | null>(null);

  function clearFlash() {
    setMessage(null);
    setError(null);
  }

  function downloadBackup() {
    clearFlash();
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/system/export?scope=${scope}`);
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          throw new Error(j.error || "Export failed");
        }
        const blob = await res.blob();
        const cd = res.headers.get("Content-Disposition") || "";
        const match = cd.match(/filename="([^"]+)"/);
        const name = match?.[1] || `umaxes-backup-${scope}.json`;
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = name;
        a.click();
        URL.revokeObjectURL(url);
        setMessage(`Downloaded ${name}`);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Export failed");
      }
    });
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
          `Ready to import · scope ${parsed.scope} · exported ${parsed.exportedAt}`,
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
        setMessage(`Import OK · ${JSON.stringify(j.imported)}`);
        setImportConfirm("");
        setImportPreview(null);
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
        setMessage(`Reset (${resetMode}) complete · ${JSON.stringify(j.result)}`);
        setResetConfirm("");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Reset failed");
      }
    });
  }

  return (
    <div className="space-y-6">
      {(message || error) && (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${
            error
              ? "border-red-200 bg-red-50 text-red-800"
              : "border-emerald-200 bg-emerald-50 text-emerald-900"
          }`}
        >
          {error || message}
        </div>
      )}

      <AdminCard>
        <div className="flex items-start gap-3">
          <Database className="mt-0.5 h-5 w-5 text-[var(--admin-brand-500)]" />
          <div className="min-w-0 flex-1">
            <h2 className="admin-section-title mb-1">Database snapshot</h2>
            <p className="text-sm text-[var(--admin-muted)]">
              Live row counts. Refresh the page after reset/import.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
              {Object.entries(stats).map(([k, v]) => (
                <div
                  key={k}
                  className="rounded-lg border border-[var(--admin-border)] bg-[var(--admin-hover)]/40 px-3 py-2"
                >
                  <p className="text-[10px] font-semibold tracking-wide text-[var(--admin-muted)] uppercase">
                    {k}
                  </p>
                  <p className="mt-0.5 font-semibold tabular-nums">{v}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </AdminCard>

      <div className="grid gap-6 lg:grid-cols-2">
        <AdminCard>
          <div className="flex items-center gap-2">
            <Download className="h-4 w-4 text-[var(--admin-brand-500)]" />
            <h2 className="admin-section-title mb-0">Backup / export</h2>
          </div>
          <p className="mt-2 text-sm text-[var(--admin-muted)]">
            Download a JSON backup you can keep offline or import later. Prefer
            scoped exports (ops) for day-to-day safety.
          </p>
          <div className="mt-4 space-y-2">
            {SCOPES.map((s) => (
              <label
                key={s.id}
                className="flex cursor-pointer gap-3 rounded-lg border border-[var(--admin-border)] px-3 py-2.5 has-[:checked]:border-[var(--admin-brand-500)] has-[:checked]:bg-[var(--admin-brand-50)]/40"
              >
                <input
                  type="radio"
                  name="scope"
                  checked={scope === s.id}
                  onChange={() => setScope(s.id)}
                  className="mt-1"
                />
                <span>
                  <span className="block text-sm font-semibold">{s.label}</span>
                  <span className="block text-xs text-[var(--admin-muted)]">
                    {s.hint}
                  </span>
                </span>
              </label>
            ))}
          </div>
          <button
            type="button"
            disabled={pending}
            onClick={downloadBackup}
            className="admin-btn admin-btn-primary mt-4"
          >
            Download JSON backup
          </button>
        </AdminCard>

        <AdminCard>
          <div className="flex items-center gap-2">
            <Upload className="h-4 w-4 text-[var(--admin-brand-500)]" />
            <h2 className="admin-section-title mb-0">Import backup</h2>
          </div>
          <p className="mt-2 text-sm text-[var(--admin-muted)]">
            Restore from a previous export. Replace mode clears matching data
            first. Super admin users are never deleted.
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
            <p className="mt-2 text-xs text-[var(--admin-muted)]">
              Scope: <strong>{importPreview.scope}</strong> · Tables:{" "}
              {Object.keys(importPreview.data || {}).join(", ")}
            </p>
          ) : null}
          <label className="mt-3 flex items-center gap-2 text-sm">
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
            disabled={pending || !importPreview}
            onClick={runImport}
            className="admin-btn admin-btn-secondary mt-4"
          >
            Import now
          </button>
        </AdminCard>
      </div>

      <AdminCard>
        <div className="flex items-center gap-2">
          <Trash2 className="h-4 w-4 text-red-500" />
          <h2 className="admin-section-title mb-0">Reset database</h2>
        </div>
        <div className="mt-2 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            Destructive. Download a backup first. Catalog / product images are
            kept unless you use a full import that replaces catalog.
          </p>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="flex cursor-pointer gap-3 rounded-lg border border-[var(--admin-border)] px-3 py-2.5 has-[:checked]:border-red-400">
            <input
              type="radio"
              name="resetMode"
              checked={resetMode === "ops"}
              onChange={() => setResetMode("ops")}
              className="mt-1"
            />
            <span>
              <span className="block text-sm font-semibold">
                Reset ops only
              </span>
              <span className="block text-xs text-[var(--admin-muted)]">
                Clears orders, shipments, credit ledger, RMA, notifications,
                audit. Keeps products + companies.
              </span>
            </span>
          </label>
          <label className="flex cursor-pointer gap-3 rounded-lg border border-[var(--admin-border)] px-3 py-2.5 has-[:checked]:border-red-400">
            <input
              type="radio"
              name="resetMode"
              checked={resetMode === "accounts"}
              onChange={() => setResetMode("accounts")}
              className="mt-1"
            />
            <span>
              <span className="block text-sm font-semibold">
                Reset ops + customers
              </span>
              <span className="block text-xs text-[var(--admin-muted)]">
                Also deletes buyer companies/users. Keeps staff + catalog.
              </span>
            </span>
          </label>
        </div>
        <label className="admin-label mt-4 block">
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
          disabled={pending}
          onClick={runReset}
          className="admin-btn mt-4 border border-red-300 bg-red-50 text-red-800 hover:bg-red-100"
        >
          Run reset
        </button>
      </AdminCard>

      <AdminCard>
        <div className="flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-[var(--admin-brand-500)]" />
          <h2 className="admin-section-title mb-0">Suggested next tools</h2>
        </div>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-[var(--admin-muted)]">
          <li>
            <strong className="text-[var(--admin-text)]">Maintenance mode</strong>{" "}
            — one toggle to show a “we’ll be back” page on the storefront while
            you import.
          </li>
          <li>
            <strong className="text-[var(--admin-text)]">Demo reseed button</strong>{" "}
            — refill sample orders/shipping after a reset (no SSH).
          </li>
          <li>
            <strong className="text-[var(--admin-text)]">Feature flags</strong>{" "}
            — credit checkout, registration open/closed, language defaults.
          </li>
          <li>
            <strong className="text-[var(--admin-text)]">Scheduled backups</strong>{" "}
            — auto-export JSON to Blob storage daily.
          </li>
          <li>
            <strong className="text-[var(--admin-text)]">Staff impersonation</strong>{" "}
            — view account as a buyer for support (audit-logged).
          </li>
        </ul>
      </AdminCard>
    </div>
  );
}
