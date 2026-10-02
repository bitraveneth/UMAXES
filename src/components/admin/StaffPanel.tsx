"use client";

import { useMemo, useState, useTransition } from "react";
import {
  createStaffUser,
  deleteStaffUser,
  setStaffModuleAccess,
  setUserRole,
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
  ArrowUpCircle,
  LayoutGrid,
} from "lucide-react";
import type { UserRole, UserStatus } from "@/generated/prisma/enums";
import { useAppFeedback } from "@/components/ui/AppFeedback";
import {
  ADMIN_MODULES,
  assignableSubmodulesFor,
  effectiveSubmodules,
  type AdminModuleDef,
} from "@/lib/admin-modules";

export type StaffRow = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  lastLoginAt: string | null;
  lastLoginIp: string | null;
  lastLoginCountry: string | null;
  lastLoginDevice: string | null;
  /** null = role defaults */
  moduleAccess: string[] | null;
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

function formatWhen(iso: string | null) {
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

type Props = {
  staff: StaffRow[];
  currentUserId: string;
  /** SUPER_ADMIN or ADMIN — can edit module toggles */
  canManageModules?: boolean;
  actorRole?: UserRole;
};

export default function StaffPanel({
  staff,
  currentUserId,
  canManageModules = false,
  actorRole = "ADMIN",
}: Props) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [editing, setEditing] = useState<StaffRow | null>(null);
  const [creating, setCreating] = useState(false);
  const [roleEdit, setRoleEdit] = useState<StaffRow | null>(null);
  const [modulesEdit, setModulesEdit] = useState<StaffRow | null>(null);
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [nextRole, setNextRole] = useState<UserRole>("SALES");
  const [query, setQuery] = useState("");
  const { confirm, showToast, ui } = useAppFeedback();

  const counts = useMemo(() => {
    const active = staff.filter((s) => s.status === "APPROVED").length;
    return { total: staff.length, active };
  }, [staff]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return staff;
    return staff.filter(
      (u) =>
        (u.name || "").toLowerCase().includes(q) ||
        (u.email || "").toLowerCase().includes(q) ||
        (u.phone || "").toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q),
    );
  }, [staff, query]);

  function flashOk(text: string) {
    setMessage(text);
    setError(null);
  }
  function flashErr(e: unknown) {
    setMessage(null);
    setError(e instanceof Error ? e.message : "Something went wrong");
  }

  function canManage(row: StaffRow) {
    return row.role !== "SUPER_ADMIN";
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
        showToast("Staff account created", "success");
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
        flashOk("Staff updated.");
        showToast("Staff updated successfully", "success");
      } catch (e) {
        flashErr(e);
      }
    });
  }

  function onSaveRole() {
    if (!roleEdit) return;
    startTransition(async () => {
      try {
        await setUserRole({ id: roleEdit.id, role: nextRole });
        setRoleEdit(null);
        flashOk(`Role set to ${roleLabel(nextRole)}.`);
      } catch (e) {
        flashErr(e);
      }
    });
  }

  async function onDelete(row: StaffRow) {
    if (!canManage(row) || row.id === currentUserId) return;
    const ok = await confirm({
      title: "Delete staff?",
      message: `Delete ${row.name || row.email}?`,
      confirmLabel: "Delete",
      tone: "danger",
    });
    if (!ok) return;
    startTransition(async () => {
      try {
        const result = await deleteStaffUser(row.id);
        flashOk(
          "disabled" in result && result.disabled
            ? "Disabled (linked records)."
            : "Staff deleted.",
        );
        showToast(
          "disabled" in result && result.disabled
            ? "Staff disabled"
            : "Staff deleted",
          "danger",
        );
      } catch (e) {
        flashErr(e);
      }
    });
  }

  async function onDemote(row: StaffRow) {
    if (!canManage(row) || row.id === currentUserId) return;
    const ok = await confirm({
      title: "Move to customers?",
      message: `Move ${row.name || row.email} back to Customers? They will lose admin access.`,
      confirmLabel: "Move",
      tone: "danger",
    });
    if (!ok) return;
    startTransition(async () => {
      try {
        await setUserRole({ id: row.id, role: "CUSTOMER" });
        flashOk("Moved to Customers.");
      } catch (e) {
        flashErr(e);
      }
    });
  }

  function canEditModules(row: StaffRow) {
    if (!canManageModules) return false;
    if (!canManage(row)) return false;
    return (
      row.role === "ADMIN" ||
      row.role === "SALES" ||
      row.role === "WAREHOUSE" ||
      row.role === "LOGISTICS"
    );
  }

  function openModules(row: StaffRow) {
    if (!canEditModules(row)) return;
    const assignable = assignableSubmodulesFor(actorRole, row.role);
    const effective = effectiveSubmodules(row.role, row.moduleAccess);
    setSelectedModules(effective.filter((id) => assignable.includes(id)));
    setModulesEdit(row);
    setError(null);
    setMessage(null);
  }

  function modulesForRole(role: UserRole): AdminModuleDef[] {
    const assignable = new Set(assignableSubmodulesFor(actorRole, role));
    return ADMIN_MODULES.map((mod) => ({
      ...mod,
      submodules: mod.submodules.filter((s) => assignable.has(s.id)),
    })).filter((mod) => mod.submodules.length > 0);
  }

  function toggleModule(id: string) {
    setSelectedModules((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function toggleModuleGroup(mod: AdminModuleDef, on: boolean) {
    const ids = mod.submodules.map((s) => s.id);
    setSelectedModules((prev) => {
      if (on) return [...new Set([...prev, ...ids])];
      return prev.filter((id) => !ids.includes(id));
    });
  }

  function saveModules() {
    if (!modulesEdit) return;
    startTransition(async () => {
      try {
        const res = await setStaffModuleAccess({
          id: modulesEdit.id,
          modules: selectedModules,
        });
        setModulesEdit(null);
        flashOk(
          res.mode === "role_defaults"
            ? "Module access reset to role defaults."
            : `Saved ${res.modules.length} modules for ${modulesEdit.name || modulesEdit.email}.`,
        );
        showToast("Module access updated", "success");
      } catch (e) {
        flashErr(e);
      }
    });
  }

  function resetModulesToDefaults() {
    if (!modulesEdit) return;
    const defaults = effectiveSubmodules(modulesEdit.role, null);
    const assignable = assignableSubmodulesFor(actorRole, modulesEdit.role);
    setSelectedModules(defaults.filter((id) => assignable.includes(id)));
  }

  return (
    <div className="space-y-6">
      {ui}
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

      <div className="grid gap-4 sm:grid-cols-2">
        <AdminStat label="Staff accounts" value={counts.total} icon={Users} />
        <AdminStat label="Active" value={counts.active} icon={Shield} trendUp />
      </div>

      <AdminCard padded={false}>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--admin-border)] px-5 py-4">
          <div>
            <h2 className="admin-section-title mb-0">Staff team</h2>
            <p className="mt-1 text-sm text-[var(--admin-muted)]">
              Internal ops only (Admin, Sales, Warehouse, Logistics). Use
              Modules to control which pages each account can see.
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

        <div className="border-b border-[var(--admin-border)] px-5 py-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search staff…"
            className="admin-input w-full sm:max-w-xs"
          />
        </div>

        {filtered.length === 0 ? (
          <p className="px-5 py-10 text-sm text-[var(--admin-muted)]">
            No staff accounts yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="admin-table min-w-[52rem]">
              <thead>
                <tr>
                  <th>Staff</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Last login</th>
                  <th>IP / Region / Device</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => {
                  const Icon = roleIcon(u.role);
                  const locked = !canManage(u);
                  const isYou = u.id === currentUserId;
                  return (
                    <tr key={u.id}>
                      <td>
                        <p className="font-semibold text-[var(--admin-text)]">
                          {u.name || "Unnamed"}
                          {isYou ? (
                            <span className="ml-2 text-[10px] font-bold text-[var(--admin-brand-500)] uppercase">
                              You
                            </span>
                          ) : null}
                        </p>
                        <p className="text-xs text-[var(--admin-muted)]">
                          {[u.email, u.phone].filter(Boolean).join(" · ") || "—"}
                        </p>
                      </td>
                      <td>
                        <span className="inline-flex items-center gap-1.5 text-sm font-medium">
                          <Icon className="h-3.5 w-3.5 text-[var(--admin-brand-500)]" />
                          {roleLabel(u.role)}
                        </span>
                      </td>
                      <td>
                        <AdminBadge
                          tone={u.status === "APPROVED" ? "success" : "warning"}
                        >
                          {u.status === "APPROVED" ? "Active" : u.status}
                        </AdminBadge>
                      </td>
                      <td className="whitespace-nowrap text-sm text-[var(--admin-muted)]">
                        {formatWhen(u.lastLoginAt)}
                      </td>
                      <td className="text-xs text-[var(--admin-muted)]">
                        <p className="font-mono text-[var(--admin-text)]">
                          {u.lastLoginIp || "—"}
                        </p>
                        <p>
                          {[u.lastLoginCountry, u.lastLoginDevice]
                            .filter(Boolean)
                            .join(" · ") || "—"}
                        </p>
                      </td>
                      <td>
                        <div className="flex flex-wrap justify-end gap-1.5">
                          {canEditModules(u) ? (
                            <button
                              type="button"
                              disabled={pending}
                              onClick={() => openModules(u)}
                              className="admin-btn admin-btn-secondary admin-btn-sm"
                              title="Choose which modules this staff can see"
                            >
                              <LayoutGrid className="h-3.5 w-3.5" />
                              Modules
                              {u.moduleAccess != null ? (
                                <span className="ml-0.5 text-[10px] font-bold uppercase text-[var(--admin-brand-500)]">
                                  custom
                                </span>
                              ) : null}
                            </button>
                          ) : null}
                          <button
                            type="button"
                            disabled={pending || locked}
                            onClick={() => {
                              setRoleEdit(u);
                              setNextRole(
                                u.role === "SUPER_ADMIN" ? "SALES" : u.role,
                              );
                            }}
                            className="admin-btn admin-btn-primary admin-btn-sm"
                          >
                            <ArrowUpCircle className="h-3.5 w-3.5" />
                            Role
                          </button>
                          <button
                            type="button"
                            disabled={pending || locked}
                            onClick={() => setEditing(u)}
                            className="admin-btn admin-btn-secondary admin-btn-sm"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={pending || locked || isYou}
                            onClick={() => onDemote(u)}
                            className="admin-btn admin-btn-secondary admin-btn-sm"
                            title="Move to Customers"
                          >
                            To users
                          </button>
                          <button
                            type="button"
                            disabled={pending || locked || isYou}
                            onClick={() => onDelete(u)}
                            className="admin-btn admin-btn-sm border border-[var(--admin-error-500)]/30 bg-[var(--admin-error-50)] text-[var(--admin-error-700)]"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </AdminCard>

      {modulesEdit && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          onClick={() => !pending && setModulesEdit(null)}
        >
          <div
            className="flex max-h-[90vh] w-full max-w-xl flex-col rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-card)] shadow-[var(--admin-shadow-theme)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 border-b border-[var(--admin-border)] px-5 py-4">
              <div>
                <h3 className="text-base font-semibold text-[var(--admin-text)]">
                  Module access
                </h3>
                <p className="mt-1 text-sm text-[var(--admin-muted)]">
                  {modulesEdit.name || modulesEdit.email} ·{" "}
                  {roleLabel(modulesEdit.role)}
                </p>
                <p className="mt-1 text-xs text-[var(--admin-muted)]">
                  Dashboard, Profile, and Notifications stay available. Changes
                  are written to Activity.
                </p>
              </div>
              <button
                type="button"
                className="admin-btn admin-btn-ghost admin-btn-sm"
                disabled={pending}
                onClick={() => setModulesEdit(null)}
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 overflow-y-auto px-5 py-4">
              {modulesForRole(modulesEdit.role).map((mod) => {
                const ids = mod.submodules.map((s) => s.id);
                const allOn = ids.every((id) => selectedModules.includes(id));
                const someOn =
                  !allOn && ids.some((id) => selectedModules.includes(id));
                return (
                  <div key={mod.id}>
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-[var(--admin-text)]">
                        {mod.label}
                      </p>
                      <button
                        type="button"
                        className="text-xs font-medium text-[var(--admin-brand-500)]"
                        onClick={() => toggleModuleGroup(mod, !allOn)}
                      >
                        {allOn ? "Clear" : someOn ? "Select all" : "Select all"}
                      </button>
                    </div>
                    <div className="grid gap-1.5 sm:grid-cols-2">
                      {mod.submodules.map((sub) => {
                        const checked = selectedModules.includes(sub.id);
                        return (
                          <label
                            key={sub.id}
                            className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
                              checked
                                ? "border-[var(--admin-brand-500)]/40 bg-[var(--admin-brand-50)] text-[var(--admin-text)]"
                                : "border-[var(--admin-border)] bg-[var(--admin-bg)] text-[var(--admin-muted)]"
                            }`}
                          >
                            <input
                              type="checkbox"
                              className="rounded border-[var(--admin-border)]"
                              checked={checked}
                              onChange={() => toggleModule(sub.id)}
                            />
                            <span className="font-medium text-[var(--admin-text)]">
                              {sub.label}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--admin-border)] px-5 py-4">
              <button
                type="button"
                className="admin-btn admin-btn-ghost admin-btn-sm"
                disabled={pending}
                onClick={resetModulesToDefaults}
              >
                Role defaults
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="admin-btn admin-btn-secondary"
                  disabled={pending}
                  onClick={() => setModulesEdit(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="admin-btn admin-btn-primary"
                  disabled={pending}
                  onClick={saveModules}
                >
                  {pending ? "Saving…" : "Save modules"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {roleEdit && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-4 sm:items-center"
          onClick={() => !pending && setRoleEdit(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-card)] p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-semibold text-[var(--admin-text)]">
              Change staff role
            </h3>
            <label className="admin-label mt-4 text-xs">
              Role
              <select
                value={nextRole}
                onChange={(e) => setNextRole(e.target.value as UserRole)}
                className="admin-input mt-1.5 w-full"
              >
                {ROLE_OPTIONS.map((r) => (
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
                onClick={() => setRoleEdit(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="admin-btn admin-btn-primary"
                disabled={pending}
                onClick={onSaveRole}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {(creating || editing) && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-4 sm:items-center"
          onClick={() => {
            if (!pending) {
              setCreating(false);
              setEditing(null);
            }
          }}
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-card)] p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex justify-between">
              <h3 className="text-base font-semibold text-[var(--admin-text)]">
                {editing ? "Edit staff" : "Add staff"}
              </h3>
              <button
                type="button"
                className="admin-btn admin-btn-ghost admin-btn-sm"
                onClick={() => {
                  setCreating(false);
                  setEditing(null);
                }}
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
                  defaultValue={
                    editing?.role && editing.role !== "SUPER_ADMIN"
                      ? editing.role
                      : "SALES"
                  }
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
              <label className="admin-label text-xs sm:col-span-2">
                {editing ? "New password (optional)" : "Password"}
                <input
                  name="password"
                  type="password"
                  minLength={editing ? undefined : 8}
                  required={!editing}
                  className="admin-input mt-1.5 w-full"
                  autoComplete="new-password"
                />
              </label>
              <div className="flex justify-end gap-2 sm:col-span-2">
                <button
                  type="button"
                  className="admin-btn admin-btn-secondary"
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
                  {pending ? "Saving…" : editing ? "Save" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
