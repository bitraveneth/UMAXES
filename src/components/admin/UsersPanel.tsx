"use client";

import { useMemo, useState, useTransition } from "react";
import { deleteCustomerUser, setUserRole } from "@/lib/admin-actions";
import { AdminBadge, AdminCard, AdminStat } from "@/components/admin/ui";
import {
  Users,
  Store,
  ArrowUpCircle,
  Trash2,
  X,
  Clock,
} from "lucide-react";
import type {
  CustomerLevel,
  UserRole,
  UserStatus,
} from "@/generated/prisma/enums";

export type CustomerUserRow = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  role: UserRole;
  status: UserStatus;
  companyName: string | null;
  companyLevel: CustomerLevel | null;
  createdAt: string;
  lastLoginAt: string | null;
  lastLoginIp: string | null;
  lastLoginCountry: string | null;
  lastLoginDevice: string | null;
  lastLoginUserAgent: string | null;
};

const PROMOTE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: "SALES", label: "Sales" },
  { value: "WAREHOUSE", label: "Warehouse" },
  { value: "LOGISTICS", label: "Logistics" },
  { value: "ADMIN", label: "Admin" },
];

function formatWhen(iso: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

type Props = {
  users: CustomerUserRow[];
};

export default function UsersPanel({ users }: Props) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [promoting, setPromoting] = useState<CustomerUserRow | null>(null);
  const [promoteRole, setPromoteRole] = useState<UserRole>("SALES");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | UserStatus>("all");

  const counts = useMemo(() => {
    const active = users.filter((u) => u.status === "APPROVED").length;
    const pendingUsers = users.filter((u) => u.status === "PENDING").length;
    return { total: users.length, active, pendingUsers };
  }, [users]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users.filter((u) => {
      if (statusFilter !== "all" && u.status !== statusFilter) return false;
      if (!q) return true;
      return (
        (u.name || "").toLowerCase().includes(q) ||
        (u.email || "").toLowerCase().includes(q) ||
        (u.phone || "").toLowerCase().includes(q) ||
        (u.companyName || "").toLowerCase().includes(q) ||
        (u.lastLoginIp || "").toLowerCase().includes(q) ||
        (u.lastLoginCountry || "").toLowerCase().includes(q) ||
        (u.lastLoginDevice || "").toLowerCase().includes(q)
      );
    });
  }, [users, query, statusFilter]);

  function onPromote() {
    if (!promoting) return;
    startTransition(async () => {
      try {
        await setUserRole({ id: promoting.id, role: promoteRole });
        setPromoting(null);
        setMessage(`Moved to Staff as ${promoteRole}.`);
        setError(null);
      } catch (e) {
        setMessage(null);
        setError(e instanceof Error ? e.message : "Promote failed");
      }
    });
  }

  function onDelete(row: CustomerUserRow) {
    const label = row.name || row.email || row.phone || "this user";
    if (
      !window.confirm(
        `Delete ${label}? If they have orders or RMA history, the account will be disabled instead.`,
      )
    ) {
      return;
    }
    startTransition(async () => {
      try {
        const result = await deleteCustomerUser(row.id);
        setError(null);
        setMessage(
          "disabled" in result && result.disabled
            ? "Disabled (linked orders/RMA)."
            : "Customer deleted.",
        );
      } catch (e) {
        setMessage(null);
        setError(e instanceof Error ? e.message : "Delete failed");
      }
    });
  }

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

      <div className="grid gap-4 sm:grid-cols-3">
        <AdminStat label="Customers" value={counts.total} icon={Users} />
        <AdminStat label="Active" value={counts.active} icon={Store} trendUp />
        <AdminStat label="Pending" value={counts.pendingUsers} icon={Clock} />
      </div>

      <AdminCard padded={false}>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--admin-border)] px-5 py-4">
          <div>
            <h2 className="admin-section-title mb-0">Customer users</h2>
            <p className="mt-1 text-sm text-[var(--admin-muted)]">
              Buyers / dealers only. Promote someone to Staff when they should
              work in the admin backend.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-b border-[var(--admin-border)] px-5 py-3">
          {(
            [
              ["all", "All"],
              ["APPROVED", "Active"],
              ["PENDING", "Pending"],
              ["DISABLED", "Disabled"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setStatusFilter(id)}
              className={`admin-btn admin-btn-sm ${
                statusFilter === id ? "admin-btn-primary" : "admin-btn-secondary"
              }`}
            >
              {label}
            </button>
          ))}
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, email, IP, country…"
            className="admin-input ml-auto min-w-[12rem] flex-1 sm:max-w-xs"
          />
        </div>

        {filtered.length === 0 ? (
          <p className="px-5 py-10 text-sm text-[var(--admin-muted)]">
            No customer users match.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="admin-table min-w-[60rem]">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Status</th>
                  <th>Company</th>
                  <th>Last login</th>
                  <th>IP</th>
                  <th>Region</th>
                  <th>Device</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <p className="font-semibold text-[var(--admin-text)]">
                        {u.name || "Unnamed"}
                      </p>
                      <p className="mt-0.5 text-xs text-[var(--admin-muted)]">
                        {[u.email, u.phone].filter(Boolean).join(" · ") || "—"}
                      </p>
                      <p className="mt-0.5 text-[10px] text-[var(--admin-muted)]">
                        Joined {formatWhen(u.createdAt)}
                      </p>
                    </td>
                    <td>
                      <AdminBadge
                        tone={u.status === "APPROVED" ? "success" : "warning"}
                      >
                        {u.status === "APPROVED" ? "Active" : u.status}
                      </AdminBadge>
                    </td>
                    <td>
                      <p className="text-sm text-[var(--admin-text)]">
                        {u.companyName || "—"}
                      </p>
                      {u.companyLevel ? (
                        <p className="text-[10px] tracking-wide text-[var(--admin-muted)] uppercase">
                          {u.companyLevel}
                        </p>
                      ) : null}
                    </td>
                    <td className="whitespace-nowrap text-sm text-[var(--admin-muted)]">
                      {formatWhen(u.lastLoginAt)}
                    </td>
                    <td className="font-mono text-xs text-[var(--admin-text)]">
                      {u.lastLoginIp || "—"}
                    </td>
                    <td className="text-sm text-[var(--admin-text)]">
                      {u.lastLoginCountry || "—"}
                    </td>
                    <td>
                      <p className="text-sm text-[var(--admin-text)]">
                        {u.lastLoginDevice || "—"}
                      </p>
                      {u.lastLoginUserAgent ? (
                        <p
                          className="mt-0.5 max-w-[10rem] truncate text-[10px] text-[var(--admin-muted)]"
                          title={u.lastLoginUserAgent}
                        >
                          {u.lastLoginUserAgent}
                        </p>
                      ) : null}
                    </td>
                    <td>
                      <div className="flex justify-end gap-1.5">
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() => {
                            setPromoting(u);
                            setPromoteRole("SALES");
                            setError(null);
                            setMessage(null);
                          }}
                          className="admin-btn admin-btn-primary admin-btn-sm"
                        >
                          <ArrowUpCircle className="h-3.5 w-3.5" />
                          Make staff
                        </button>
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() => onDelete(u)}
                          className="admin-btn admin-btn-sm border border-[var(--admin-error-500)]/30 bg-[var(--admin-error-50)] text-[var(--admin-error-700)]"
                          title="Delete customer"
                          aria-label={`Delete ${u.name || u.email || "customer"}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminCard>

      {promoting && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          onClick={() => !pending && setPromoting(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-card)] p-5 shadow-[var(--admin-shadow-theme)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-[var(--admin-text)]">
                  Make staff
                </h3>
                <p className="mt-1 text-sm text-[var(--admin-muted)]">
                  {promoting.name || promoting.email || promoting.phone} will
                  leave Customers and appear under Staff.
                </p>
              </div>
              <button
                type="button"
                className="admin-btn admin-btn-ghost admin-btn-sm"
                disabled={pending}
                onClick={() => setPromoting(null)}
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <label className="admin-label text-xs">
              Staff role
              <select
                value={promoteRole}
                onChange={(e) => setPromoteRole(e.target.value as UserRole)}
                className="admin-input mt-1.5 w-full"
              >
                {PROMOTE_OPTIONS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </label>

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                className="admin-btn admin-btn-secondary"
                disabled={pending}
                onClick={() => setPromoting(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="admin-btn admin-btn-primary"
                disabled={pending}
                onClick={onPromote}
              >
                {pending ? "Saving…" : "Promote"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
