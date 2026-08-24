"use client";

import { useMemo, useState, useTransition } from "react";
import {
  deleteCustomerUser,
  assignUserAccess,
  prepareImpersonateCustomer,
} from "@/lib/admin-actions";
import { AdminBadge, AdminCard, AdminStat } from "@/components/admin/ui";
import {
  Users,
  Store,
  Settings2,
  Trash2,
  LogIn,
  X,
  Clock,
  ExternalLink,
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
  companyId: string | null;
  companyName: string | null;
  companyLevel: CustomerLevel | null;
  createdAt: string;
  lastLoginAt: string | null;
  lastLoginIp: string | null;
  lastLoginCountry: string | null;
  lastLoginDevice: string | null;
  lastLoginUserAgent: string | null;
};

type AssignmentValue =
  | "buyer:DISTRO"
  | "buyer:WHOLESALER"
  | "buyer:SHOP"
  | "staff:SALES"
  | "staff:LOGISTICS"
  | "staff:WAREHOUSE"
  | "staff:ADMIN";

const ASSIGNMENT_OPTIONS: {
  value: AssignmentValue;
  label: string;
  group: "Buyer type" | "Staff role";
}[] = [
  { value: "buyer:DISTRO", label: "Distributor", group: "Buyer type" },
  { value: "buyer:WHOLESALER", label: "Wholesaler", group: "Buyer type" },
  { value: "buyer:SHOP", label: "Retail / Shop", group: "Buyer type" },
  { value: "staff:SALES", label: "Sales (staff)", group: "Staff role" },
  { value: "staff:LOGISTICS", label: "Logistics (staff)", group: "Staff role" },
  { value: "staff:WAREHOUSE", label: "Warehouse (staff)", group: "Staff role" },
  { value: "staff:ADMIN", label: "Admin (staff)", group: "Staff role" },
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

function levelLabel(level: CustomerLevel | null) {
  if (level === "DISTRO") return "Distributor";
  if (level === "WHOLESALER") return "Wholesaler";
  if (level === "SHOP") return "Retail";
  return level || "—";
}

type Props = {
  users: CustomerUserRow[];
  /** Super admin only — login as this customer */
  canImpersonate?: boolean;
  initialError?: string | null;
};

export default function UsersPanel({
  users,
  canImpersonate = false,
  initialError = null,
}: Props) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(initialError);
  const [message, setMessage] = useState<string | null>(null);
  const [assigning, setAssigning] = useState<CustomerUserRow | null>(null);
  const [loginAs, setLoginAs] = useState<CustomerUserRow | null>(null);
  const [assignment, setAssignment] = useState<AssignmentValue>("buyer:DISTRO");
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

  function openAssign(u: CustomerUserRow) {
    setAssigning(u);
    if (u.companyLevel === "WHOLESALER") setAssignment("buyer:WHOLESALER");
    else if (u.companyLevel === "SHOP") setAssignment("buyer:SHOP");
    else setAssignment("buyer:DISTRO");
    setError(null);
    setMessage(null);
  }

  function onAssign() {
    if (!assigning) return;
    startTransition(async () => {
      try {
        if (assignment.startsWith("buyer:")) {
          const level = assignment.slice(6) as CustomerLevel;
          await assignUserAccess({
            id: assigning.id,
            assignment: { type: "buyer", level },
          });
          setAssigning(null);
          setMessage(`Assigned as ${levelLabel(level)}.`);
        } else {
          const role = assignment.slice(6) as UserRole;
          await assignUserAccess({
            id: assigning.id,
            assignment: { type: "staff", role },
          });
          setAssigning(null);
          setMessage(`Moved to Staff as ${role}.`);
        }
        setError(null);
      } catch (e) {
        setMessage(null);
        setError(e instanceof Error ? e.message : "Assign failed");
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

  function openLoginAs(row: CustomerUserRow) {
    if (!canImpersonate) return;
    if (row.status === "DISABLED" || row.status === "REJECTED") {
      setError("Cannot open a disabled account.");
      return;
    }
    setLoginAs(row);
    setError(null);
    setMessage(null);
  }

  function confirmLoginAs() {
    if (!loginAs) return;
    startTransition(async () => {
      try {
        const { token } = await prepareImpersonateCustomer(loginAs.id);
        const url = `/auth/impersonate?token=${encodeURIComponent(token)}`;
        const win = window.open(url, "_blank", "noopener,noreferrer");
        setLoginAs(null);
        if (!win) {
          setError(
            "Pop-up blocked — allow pop-ups for this site, or try again.",
          );
          return;
        }
        setMessage(
          `Opened as ${loginAs.name || loginAs.email || "customer"} in a new tab. Use the yellow bar there to return to admin.`,
        );
      } catch (e) {
        setMessage(null);
        setError(e instanceof Error ? e.message : "Login as failed");
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
              Assign buyer type (Distributor, Wholesaler, Retail) or promote to
              staff (Sales, Logistics, Warehouse, Admin).
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
                        <p className="text-[10px] tracking-wide text-[var(--admin-muted)]">
                          {levelLabel(u.companyLevel)}
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
                        {canImpersonate ? (
                          <button
                            type="button"
                            disabled={
                              pending ||
                              u.status === "DISABLED" ||
                              u.status === "REJECTED"
                            }
                            onClick={() => openLoginAs(u)}
                            className="admin-btn admin-btn-secondary admin-btn-sm"
                            title="Open site as this customer in a new tab"
                          >
                            <LogIn className="h-3.5 w-3.5" />
                            Login as
                          </button>
                        ) : null}
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() => openAssign(u)}
                          className="admin-btn admin-btn-primary admin-btn-sm"
                        >
                          <Settings2 className="h-3.5 w-3.5" />
                          Assign
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

      {loginAs && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          onClick={() => !pending && setLoginAs(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-card)] p-5 shadow-[var(--admin-shadow-theme)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-[var(--admin-text)]">
                  Open as customer
                </h3>
                <p className="mt-1 text-sm text-[var(--admin-muted)]">
                  View the storefront and account exactly as this buyer sees
                  it.
                </p>
              </div>
              <button
                type="button"
                className="admin-btn admin-btn-ghost admin-btn-sm"
                disabled={pending}
                onClick={() => setLoginAs(null)}
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-bg)] px-4 py-3">
              <p className="font-semibold text-[var(--admin-text)]">
                {loginAs.name || "Unnamed"}
              </p>
              <p className="mt-0.5 text-sm text-[var(--admin-muted)]">
                {[loginAs.email, loginAs.phone].filter(Boolean).join(" · ") ||
                  "—"}
              </p>
              {loginAs.companyName ? (
                <p className="mt-2 text-xs text-[var(--admin-muted)]">
                  {loginAs.companyName}
                  {loginAs.companyLevel
                    ? ` · ${levelLabel(loginAs.companyLevel)}`
                    : ""}
                </p>
              ) : null}
            </div>

            <p className="mt-3 text-xs leading-relaxed text-[var(--admin-muted)]">
              Opens in a <span className="font-semibold">new tab</span>. Use
              the yellow{" "}
              <span className="font-semibold">Back to admin</span> bar in that
              tab when you are done. This Users page stays open here.
            </p>

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                className="admin-btn admin-btn-secondary"
                disabled={pending}
                onClick={() => setLoginAs(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="admin-btn admin-btn-primary"
                disabled={pending}
                onClick={confirmLoginAs}
              >
                <ExternalLink className="h-3.5 w-3.5" />
                {pending ? "Opening…" : "Open in new tab"}
              </button>
            </div>
          </div>
        </div>
      )}

      {assigning && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          onClick={() => !pending && setAssigning(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-card)] p-5 shadow-[var(--admin-shadow-theme)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-[var(--admin-text)]">
                  Assign access
                </h3>
                <p className="mt-1 text-sm text-[var(--admin-muted)]">
                  {assigning.name || assigning.email || assigning.phone}
                  {assigning.companyName
                    ? ` · ${assigning.companyName}`
                    : ""}
                </p>
              </div>
              <button
                type="button"
                className="admin-btn admin-btn-ghost admin-btn-sm"
                disabled={pending}
                onClick={() => setAssigning(null)}
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <label className="admin-label text-xs">
              Buyer type or staff role
              <select
                value={assignment}
                onChange={(e) =>
                  setAssignment(e.target.value as AssignmentValue)
                }
                className="admin-input mt-1.5 w-full"
              >
                <optgroup label="Buyer type (stays a customer)">
                  {ASSIGNMENT_OPTIONS.filter((o) => o.group === "Buyer type").map(
                    (r) => (
                      <option
                        key={r.value}
                        value={r.value}
                        disabled={
                          r.value.startsWith("buyer:") && !assigning.companyId
                        }
                      >
                        {r.label}
                      </option>
                    ),
                  )}
                </optgroup>
                <optgroup label="Staff role (moves to Staff)">
                  {ASSIGNMENT_OPTIONS.filter((o) => o.group === "Staff role").map(
                    (r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ),
                  )}
                </optgroup>
              </select>
            </label>
            {!assigning.companyId && assignment.startsWith("buyer:") ? (
              <p className="mt-2 text-xs text-[var(--admin-error-700)]">
                No company on this account — choose a staff role, or create the
                company first.
              </p>
            ) : assignment.startsWith("staff:") ? (
              <p className="mt-2 text-xs text-[var(--admin-muted)]">
                They will leave Customers and appear under Staff with admin
                access for that role.
              </p>
            ) : (
              <p className="mt-2 text-xs text-[var(--admin-muted)]">
                Keeps them as a customer and sets company pricing tier /
                directory (Distributors, Wholesalers, or Retail).
              </p>
            )}

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                className="admin-btn admin-btn-secondary"
                disabled={pending}
                onClick={() => setAssigning(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="admin-btn admin-btn-primary"
                disabled={
                  pending ||
                  (assignment.startsWith("buyer:") && !assigning.companyId)
                }
                onClick={onAssign}
              >
                {pending ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
