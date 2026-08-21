"use client";

import { useMemo, useState, useTransition } from "react";
import {
  createStaffUser,
  deleteStaffUser,
  updateStaffUser,
} from "@/lib/admin-actions";
import { AdminBadge, AdminCard, AdminStat } from "@/components/admin/ui";
import {
  Pencil,
  Trash2,
  UserPlus,
  Users,
  X,
  Shield,
  Warehouse,
  Truck,
  Briefcase,
} from "lucide-react";
import type { UserRole, UserStatus } from "@/generated/prisma/enums";

export type StaffRow = {
  id: string;
  name: string | null;
  email: string | null;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
};

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: "SALES", label: "Sales" },
  { value: "WAREHOUSE", label: "Warehouse" },
  { value: "LOGISTICS", label: "Logistics" },
  { value: "ADMIN", label: "Admin" },
];

function roleIcon(role: UserRole) {
  switch (role) {
    case "SUPER_ADMIN":
    case "ADMIN":
      return Shield;
    case "WAREHOUSE":
      return Warehouse;
    case "LOGISTICS":
      return Truck;
    default:
      return Briefcase;
  }
}

function roleLabel(role: UserRole) {
  if (role === "SUPER_ADMIN") return "Super admin";
  return ROLE_OPTIONS.find((r) => r.value === role)?.label || role;
}

function initials(name: string | null, email: string | null) {
  const src = (name || email || "?").trim();
  const parts = src.split(/[\s@._-]+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return src.slice(0, 2).toUpperCase();
}

type Props = {
  staff: StaffRow[];
  currentUserId: string;
};

export default function StaffPanel({ staff, currentUserId }: Props) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [editing, setEditing] = useState<StaffRow | null>(null);
  const [creating, setCreating] = useState(false);

  const counts = useMemo(() => {
    const active = staff.filter((s) => s.status === "APPROVED").length;
    const disabled = staff.filter((s) => s.status === "DISABLED").length;
    return { total: staff.length, active, disabled };
  }, [staff]);

  function flashOk(text: string) {
    setMessage(text);
    setError(null);
  }

  function flashErr(e: unknown) {
    setMessage(null);
    setError(e instanceof Error ? e.message : "Something went wrong");
  }

  function onCreate(fd: FormData) {
    startTransition(async () => {
      try {
        await createStaffUser({
          name: String(fd.get("name") || ""),
          email: String(fd.get("email") || ""),
          password: String(fd.get("password") || ""),
          role: String(fd.get("role")) as UserRole,
        });
        setCreating(false);
        flashOk("Staff account created.");
      } catch (e) {
        flashErr(e);
      }
    });
  }

  function onUpdate(fd: FormData) {
    if (!editing) return;
    startTransition(async () => {
      try {
        const password = String(fd.get("password") || "").trim();
        await updateStaffUser({
          id: editing.id,
          name: String(fd.get("name") || ""),
          email: String(fd.get("email") || ""),
          role: String(fd.get("role")) as UserRole,
          status: String(fd.get("status")) as "APPROVED" | "DISABLED",
          password: password || undefined,
        });
        setEditing(null);
        flashOk("Staff account updated.");
      } catch (e) {
        flashErr(e);
      }
    });
  }

  function onDelete(row: StaffRow) {
    if (row.id === currentUserId) {
      flashErr(new Error("You cannot delete your own account"));
      return;
    }
    if (row.role === "SUPER_ADMIN") {
      flashErr(new Error("Super admin accounts cannot be deleted"));
      return;
    }
    const ok = window.confirm(
      `Delete ${row.name || row.email}? This cannot be undone. If the account is linked to orders, it will be disabled instead.`,
    );
    if (!ok) return;
    startTransition(async () => {
      try {
        const result = await deleteStaffUser(row.id);
        if ("disabled" in result && result.disabled) {
          flashOk("Account has linked records — disabled instead of deleted.");
        } else {
          flashOk("Staff account deleted.");
        }
      } catch (e) {
        flashErr(e);
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
        <AdminStat label="Total staff" value={counts.total} icon={Users} />
        <AdminStat
          label="Active"
          value={counts.active}
          icon={Shield}
          trendUp={counts.active > 0}
        />
        <AdminStat label="Disabled" value={counts.disabled} icon={Users} />
      </div>

      <AdminCard padded={false}>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--admin-border)] px-5 py-4">
          <div>
            <h2 className="admin-section-title mb-0">Team directory</h2>
            <p className="mt-1 text-sm text-[var(--admin-muted)]">
              {counts.total} internal ops account{counts.total === 1 ? "" : "s"}
            </p>
          </div>
          <button
            type="button"
            className="admin-btn admin-btn-primary admin-btn-sm"
            onClick={() => {
              setCreating(true);
              setEditing(null);
              setError(null);
              setMessage(null);
            }}
          >
            <UserPlus className="h-4 w-4" />
            Add staff
          </button>
        </div>

        {staff.length === 0 ? (
          <p className="px-5 py-10 text-sm text-[var(--admin-muted)]">
            No staff accounts yet. Add your first teammate.
          </p>
        ) : (
          <ul className="divide-y divide-[var(--admin-border)]">
            {staff.map((u) => {
              const Icon = roleIcon(u.role);
              const locked = u.role === "SUPER_ADMIN";
              const isYou = u.id === currentUserId;
              return (
                <li
                  key={u.id}
                  className="flex flex-wrap items-center justify-between gap-4 px-5 py-4"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--admin-brand-50)] text-sm font-bold text-[var(--admin-brand-500)]">
                      {initials(u.name, u.email)}
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate font-semibold text-[var(--admin-text)]">
                          {u.name || "Unnamed"}
                        </p>
                        {isYou ? (
                          <AdminBadge tone="brand">You</AdminBadge>
                        ) : null}
                        <AdminBadge
                          tone={u.status === "APPROVED" ? "success" : "warning"}
                        >
                          {u.status === "APPROVED" ? "Active" : u.status}
                        </AdminBadge>
                      </div>
                      <p className="mt-0.5 truncate text-sm text-[var(--admin-muted)]">
                        {u.email || "—"}
                      </p>
                      <p className="mt-1 inline-flex items-center gap-1.5 text-xs font-medium text-[var(--admin-muted)]">
                        <Icon className="h-3.5 w-3.5 text-[var(--admin-brand-500)]" />
                        {roleLabel(u.role)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={pending || locked}
                      title={
                        locked
                          ? "Super admin is managed separately"
                          : "Edit staff"
                      }
                      onClick={() => {
                        setEditing(u);
                        setCreating(false);
                        setError(null);
                        setMessage(null);
                      }}
                      className="admin-btn admin-btn-secondary admin-btn-sm"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Edit
                    </button>
                    <button
                      type="button"
                      disabled={pending || locked || isYou}
                      title={
                        locked
                          ? "Super admin cannot be deleted"
                          : isYou
                            ? "Cannot delete yourself"
                            : "Delete staff"
                      }
                      onClick={() => onDelete(u)}
                      className="admin-btn admin-btn-sm border border-[var(--admin-error-500)]/30 bg-[var(--admin-error-50)] text-[var(--admin-error-700)] hover:brightness-95"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </AdminCard>

      {(creating || editing) && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          onClick={() => {
            if (!pending) {
              setCreating(false);
              setEditing(null);
            }
          }}
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-card)] p-5 shadow-[var(--admin-shadow-theme)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-[var(--admin-text)]">
                  {editing ? "Edit staff" : "Add staff"}
                </h3>
                <p className="mt-1 text-sm text-[var(--admin-muted)]">
                  {editing
                    ? "Update name, role, status, or set a new password."
                    : "Create an approved ops account."}
                </p>
              </div>
              <button
                type="button"
                className="admin-btn admin-btn-ghost admin-btn-sm"
                disabled={pending}
                onClick={() => {
                  setCreating(false);
                  setEditing(null);
                }}
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form
              action={editing ? onUpdate : onCreate}
              className="grid gap-3 sm:grid-cols-2"
            >
              <label className="admin-label text-xs sm:col-span-2">
                Name
                <input
                  name="name"
                  required
                  defaultValue={editing?.name || ""}
                  className="admin-input mt-1.5 w-full"
                />
              </label>
              <label className="admin-label text-xs sm:col-span-2">
                Email
                <input
                  name="email"
                  type="email"
                  required
                  defaultValue={editing?.email || ""}
                  className="admin-input mt-1.5 w-full"
                />
              </label>
              <label className="admin-label text-xs">
                Role
                <select
                  name="role"
                  defaultValue={editing?.role || "SALES"}
                  className="admin-input mt-1.5 w-full"
                >
                  {ROLE_OPTIONS.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </label>
              {editing ? (
                <label className="admin-label text-xs">
                  Status
                  <select
                    name="status"
                    defaultValue={
                      editing.status === "DISABLED" ? "DISABLED" : "APPROVED"
                    }
                    className="admin-input mt-1.5 w-full"
                  >
                    <option value="APPROVED">Active</option>
                    <option value="DISABLED">Disabled</option>
                  </select>
                </label>
              ) : null}
              <label
                className={`admin-label text-xs ${editing ? "sm:col-span-2" : "sm:col-span-2"}`}
              >
                {editing ? "New password (optional)" : "Password"}
                <input
                  name="password"
                  type="password"
                  minLength={editing ? undefined : 8}
                  required={!editing}
                  placeholder={editing ? "Leave blank to keep current" : ""}
                  className="admin-input mt-1.5 w-full"
                  autoComplete="new-password"
                />
              </label>
              <div className="flex justify-end gap-2 sm:col-span-2">
                <button
                  type="button"
                  className="admin-btn admin-btn-secondary"
                  disabled={pending}
                  onClick={() => {
                    setCreating(false);
                    setEditing(null);
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="admin-btn admin-btn-primary"
                  disabled={pending}
                >
                  {pending ? "Saving…" : editing ? "Save changes" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
