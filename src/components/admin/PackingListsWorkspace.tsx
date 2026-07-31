"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { OrderStatus } from "@/generated/prisma/enums";
import { AdminBadge, AdminCard } from "@/components/admin/ui";
import { useAdminI18n } from "@/components/admin/AdminI18n";
import { Download, Eye } from "lucide-react";

export type PackingListRow = {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  updatedAt: string;
  companyName: string;
  companyLevel: string;
  route: string;
  hasPacking: boolean;
  boxCount: number | null;
  cbm: number | null;
  weightKg: number | null;
  totalUnits: number;
  lineCount: number;
  packingNote: string | null;
  trackingNumber: string | null;
  carrier: string | null;
};

type Filter = "all" | "ready" | "packed" | "shipped" | "delivered";

function statusTone(status: string) {
  if (status === "COMPLETED") return "success" as const;
  if (status === "SHIPPED") return "warning" as const;
  if (status === "SENT_TO_SUPPLIER" || status === "PICKING")
    return "brand" as const;
  return "neutral" as const;
}

function matchesFilter(row: PackingListRow, filter: Filter) {
  if (filter === "all") return true;
  if (filter === "delivered") return row.status === "COMPLETED";
  if (filter === "shipped") return row.status === "SHIPPED";
  if (filter === "packed")
    return (
      row.hasPacking && row.status !== "SHIPPED" && row.status !== "COMPLETED"
    );
  if (filter === "ready") return !row.hasPacking;
  return true;
}

export default function PackingListsWorkspace({
  rows,
}: {
  rows: PackingListRow[];
}) {
  const { t } = useAdminI18n();
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>("all");
  const [q, setQ] = useState("");

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows.filter((row) => {
      if (!matchesFilter(row, filter)) return false;
      if (!needle) return true;
      return (
        row.orderNumber.toLowerCase().includes(needle) ||
        row.companyName.toLowerCase().includes(needle) ||
        row.route.toLowerCase().includes(needle) ||
        (row.trackingNumber || "").toLowerCase().includes(needle)
      );
    });
  }, [rows, filter, q]);

  function statusLabel(status: OrderStatus) {
    const key = `logistics.status${status}`;
    const label = t(key);
    return label === key ? status : label;
  }

  const filters: { key: Filter; labelKey: string }[] = [
    { key: "all", labelKey: "logistics.filterAll" },
    { key: "ready", labelKey: "packingLists.filterReady" },
    { key: "packed", labelKey: "packingLists.filterPacked" },
    { key: "shipped", labelKey: "logistics.filterTransit" },
    { key: "delivered", labelKey: "logistics.filterDelivered" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1.5">
          {filters.map((f) => {
            const count = rows.filter((r) => matchesFilter(r, f.key)).length;
            const active = filter === f.key;
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                className={`admin-btn admin-btn-sm ${
                  active ? "admin-btn-primary" : "admin-btn-secondary"
                }`}
              >
                {t(f.labelKey)}
                <span className="ml-1 tabular-nums opacity-70">{count}</span>
              </button>
            );
          })}
        </div>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t("packingLists.search")}
          className="admin-input w-full sm:max-w-xs"
        />
      </div>

      <AdminCard padded={false}>
        <div className="border-b border-[var(--admin-border)] px-5 py-4">
          <h2 className="admin-section-title mb-0">
            {t("packingLists.title")}
          </h2>
          <p className="mt-1 text-sm text-[var(--admin-muted)]">
            {t("packingLists.listHint")}
          </p>
        </div>

        {list.length === 0 ? (
          <p className="px-5 py-10 text-sm text-[var(--admin-muted)]">
            {t("packingLists.empty")}
          </p>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>{t("packingLists.colPl")}</th>
                  <th>{t("logistics.colCompany")}</th>
                  <th>{t("logistics.colRoute")}</th>
                  <th>{t("logistics.colQty")}</th>
                  <th>{t("logistics.colTracking")}</th>
                  <th>{t("logistics.colStatus")}</th>
                  <th className="text-right">{t("common.actions")}</th>
                </tr>
              </thead>
              <tbody>
                {list.map((row) => (
                  <tr
                    key={row.id}
                    className="cursor-pointer"
                    onClick={() =>
                      router.push(`/admin/logistics/packing-lists/${row.id}`)
                    }
                  >
                    <td className="font-semibold text-[var(--admin-muted)]">
                      PL-{row.orderNumber}
                    </td>
                    <td>
                      <p className="font-medium text-[var(--admin-text)]">
                        {row.companyName}
                      </p>
                      <p className="text-xs text-[var(--admin-muted)]">
                        {row.companyLevel}
                      </p>
                    </td>
                    <td className="max-w-[10rem] truncate text-sm">
                      {row.route}
                    </td>
                    <td className="tabular-nums">{row.totalUnits}</td>
                    <td className="max-w-[10rem] truncate text-sm text-[var(--admin-muted)]">
                      {row.trackingNumber
                        ? `${row.carrier || ""} ${row.trackingNumber}`.trim()
                        : "—"}
                    </td>
                    <td>
                      <AdminBadge tone={statusTone(row.status)}>
                        {row.hasPacking
                          ? statusLabel(row.status)
                          : t("packingLists.notPacked")}
                      </AdminBadge>
                    </td>
                    <td className="text-right">
                      <div className="flex flex-wrap justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(
                              `/admin/logistics/packing-lists/${row.id}`,
                            );
                          }}
                          className="admin-btn admin-btn-primary admin-btn-sm"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          {t("packingLists.view")}
                        </button>
                        <a
                          href={`/api/orders/${row.id}/docs?type=packing&download=1`}
                          onClick={(e) => e.stopPropagation()}
                          className="admin-btn admin-btn-secondary admin-btn-sm"
                        >
                          <Download className="h-3.5 w-3.5" />
                          {t("packingLists.download")}
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminCard>
    </div>
  );
}
