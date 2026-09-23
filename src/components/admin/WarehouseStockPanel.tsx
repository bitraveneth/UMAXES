"use client";

import { useMemo, useState, useTransition } from "react";
import { Box, Minus, Package, Plus } from "lucide-react";
import {
  addTestStationProduct,
  adjustInventory,
} from "@/lib/admin-actions";
import { AdminBadge, AdminCard, AdminStat, AdminTable } from "@/components/admin/ui";
import { useAdminI18n } from "@/components/admin/AdminI18n";
import { useAdminToast } from "@/components/admin/AdminToast";
import {
  TEST_STATION_SKU,
  casesFromPcs,
  formatPack,
  isCasePackedSku,
  pcsFromCases,
} from "@/lib/pack";

export type WarehouseStockRow = {
  id: string;
  sku: string;
  name: string;
  image: string | null;
  quantity: number;
  reserved: number;
};

export type WarehouseActivityRow = {
  id: string;
  when: string;
  who: string;
  sku: string;
  product: string;
  previousQuantity: number | null;
  quantity: number | null;
};

function changeLabel(row: WarehouseActivityRow) {
  if (row.previousQuantity == null || row.quantity == null) return "—";
  if (!isCasePackedSku(row.sku)) {
    return `${row.previousQuantity.toLocaleString()} → ${row.quantity.toLocaleString()} pcs`;
  }
  return `${formatPack(row.previousQuantity)} → ${formatPack(row.quantity)}`;
}

function changeDelta(row: WarehouseActivityRow) {
  if (row.previousQuantity == null || row.quantity == null) return 0;
  return row.quantity - row.previousQuantity;
}

function ProductThumb({
  image,
  bonus,
  size = "md",
}: {
  image: string | null;
  bonus?: boolean;
  size?: "md" | "lg";
}) {
  const box = size === "lg" ? "h-16 w-16 rounded-2xl" : "h-11 w-11 rounded-xl";
  return (
    <span
      className={`relative flex shrink-0 items-center justify-center overflow-hidden bg-[var(--admin-gray-100)] ${box}`}
    >
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image} alt="" className="h-full w-full object-cover" />
      ) : bonus ? (
        <Box className="h-4 w-4 text-[var(--admin-muted)]" />
      ) : (
        <Package className="h-4 w-4 text-[var(--admin-muted)]" />
      )}
    </span>
  );
}

export default function WarehouseStockPanel({
  products,
  hasTestStation,
  logs,
}: {
  products: WarehouseStockRow[];
  hasTestStation: boolean;
  logs: WarehouseActivityRow[];
}) {
  const { t } = useAdminI18n();
  const [pending, startTransition] = useTransition();
  const { showToast } = useAdminToast();
  const flavors = useMemo(
    () => products.filter((p) => isCasePackedSku(p.sku)),
    [products],
  );
  const bonus = useMemo(
    () => products.find((p) => p.sku === TEST_STATION_SKU) ?? null,
    [products],
  );

  const [selectedId, setSelectedId] = useState(
    () => flavors[0]?.id ?? bonus?.id ?? "",
  );
  const [mode, setMode] = useState<"add" | "set">("add");
  const [qty, setQty] = useState("1");

  const selected =
    products.find((p) => p.id === selectedId) ?? flavors[0] ?? bonus;
  const packed = selected ? isCasePackedSku(selected.sku) : true;

  const totalCases = flavors.reduce((sum, p) => sum + casesFromPcs(p.quantity), 0);
  const totalPcs = flavors.reduce((sum, p) => sum + p.quantity, 0);

  function qtyFor(row: WarehouseStockRow, nextMode: "add" | "set") {
    if (nextMode === "add") return "1";
    return String(
      isCasePackedSku(row.sku) ? casesFromPcs(row.quantity) : row.quantity,
    );
  }

  function pick(row: WarehouseStockRow) {
    setSelectedId(row.id);
    setQty(qtyFor(row, mode));
  }

  function switchMode(next: "add" | "set") {
    setMode(next);
    if (selected) setQty(qtyFor(selected, next));
  }

  function bump(delta: number) {
    const n = Math.max(0, Math.floor(Number(qty) || 0) + delta);
    setQty(String(n));
  }

  const entered = Math.max(0, Math.floor(Number(qty) || 0));
  const enteredPcs = packed ? pcsFromCases(entered) : entered;
  const nextPcs = selected
    ? mode === "add"
      ? selected.quantity + enteredPcs
      : enteredPcs
    : 0;

  function save() {
    if (!selected) return;
    startTransition(async () => {
      try {
        await adjustInventory(selected.id, Math.max(0, nextPcs));
        showToast(t("common.saved"), "success", t("warehouse.packHint"));
        if (mode === "add") setQty("1");
      } catch (e) {
        showToast(
          e instanceof Error ? e.message : t("common.saveFailed"),
          "error",
        );
      }
    });
  }

  function addStation() {
    startTransition(async () => {
      try {
        await addTestStationProduct();
        showToast(t("common.saved"), "success", t("warehouse.stationTitle"));
      } catch (e) {
        showToast(
          e instanceof Error ? e.message : t("common.saveFailed"),
          "error",
        );
      }
    });
  }

  const qtyLabel = packed
    ? mode === "add"
      ? t("warehouse.qtyCasesAdd")
      : t("warehouse.qtyCasesSet")
    : mode === "add"
      ? t("warehouse.qtyPcsAdd")
      : t("warehouse.qtyPcsSet");

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-3">
        <AdminStat
          label={
            <>
              {t("warehouse.statCases")}
              <span className="mt-1 block text-xs font-normal text-[var(--admin-muted)]">
                {t("warehouse.packHint")}
              </span>
            </>
          }
          value={totalCases}
          icon={Package}
        />
        <AdminStat
          label={t("warehouse.statPcs")}
          value={totalPcs.toLocaleString()}
          icon={Box}
        />
        <AdminStat
          label={
            <>
              {t("warehouse.statStations")}
              <span className="mt-1 block text-xs font-normal text-[var(--admin-muted)]">
                {t("warehouse.testStationHint")}
              </span>
            </>
          }
          value={bonus?.quantity ?? 0}
          icon={Box}
        />
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <AdminCard padded={false} className="overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--admin-border)] px-5 py-4">
            <div>
              <h2 className="admin-section-title mb-0">
                {t("warehouse.flavorsTitle")}
              </h2>
              <p className="mt-1 text-sm admin-muted">
                {t("warehouse.receiveHint")}
              </p>
            </div>
            <span className="wh-pack-pill">{t("warehouse.packHint")}</span>
          </div>
          {flavors.length === 0 ? (
            <p className="px-5 py-8 text-sm admin-muted">
              {t("warehouse.emptyFlavors")}
            </p>
          ) : (
            <div>
              {flavors.map((p) => {
                const on = p.id === selected?.id;
                const available = Math.max(0, p.quantity - p.reserved);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => pick(p)}
                    className={`wh-flavor ${on ? "wh-flavor-on" : ""}`}
                  >
                    <ProductThumb image={p.image} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-[var(--admin-text)]">
                        {p.name}
                      </span>
                      <span className="mt-0.5 block text-xs tabular-nums admin-muted">
                        {p.sku}
                        {p.reserved > 0
                          ? ` · ${t("warehouse.reserved")} ${p.reserved.toLocaleString()}`
                          : ""}
                      </span>
                    </span>
                    <span className="shrink-0 text-right">
                      <span className="block text-lg font-bold tabular-nums leading-none text-[var(--admin-text)]">
                        {casesFromPcs(p.quantity)}
                      </span>
                      <span className="mt-1 block text-[11px] font-medium uppercase tracking-wide admin-muted">
                        {t("warehouse.cases")}
                      </span>
                      <span className="mt-0.5 block text-xs tabular-nums admin-muted">
                        {available.toLocaleString()} {t("warehouse.pieces")}
                      </span>
                    </span>
                  </button>
                );
              })}
              {bonus ? (
                <button
                  type="button"
                  onClick={() => pick(bonus)}
                  className={`wh-flavor wh-flavor-bonus ${
                    bonus.id === selected?.id ? "wh-flavor-on" : ""
                  }`}
                >
                  <ProductThumb image={bonus.image} bonus />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="truncate text-sm font-semibold">
                        {bonus.name}
                      </span>
                      <AdminBadge tone="brand">{t("warehouse.bonus")}</AdminBadge>
                    </span>
                    <span className="mt-0.5 block text-xs admin-muted">
                      {t("warehouse.testStationHint")}
                    </span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="block text-lg font-bold tabular-nums leading-none">
                      {bonus.quantity.toLocaleString()}
                    </span>
                    <span className="mt-1 block text-[11px] font-medium uppercase tracking-wide admin-muted">
                      {t("warehouse.pieces")}
                    </span>
                  </span>
                </button>
              ) : null}
            </div>
          )}
        </AdminCard>

        <div className="space-y-6">
          <AdminCard>
            {selected ? (
              <form
                className="space-y-5"
                onSubmit={(e) => {
                  e.preventDefault();
                  save();
                }}
              >
                <div className="flex items-start gap-3">
                  <ProductThumb
                    image={selected.image}
                    bonus={!packed}
                    size="lg"
                  />
                  <div className="min-w-0">
                    <h2 className="admin-section-title mb-0">{selected.name}</h2>
                    <p className="mt-1 font-mono text-xs admin-muted">
                      {selected.sku}
                    </p>
                    {!packed ? (
                      <span className="mt-2 inline-block">
                        <AdminBadge tone="brand">{t("warehouse.bonus")}</AdminBadge>
                      </span>
                    ) : (
                      <span className="wh-pack-pill mt-2">
                        {t("warehouse.packHint")}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium">{t("warehouse.updateTitle")}</p>
                  <div className="wh-mode" role="group">
                    <button
                      type="button"
                      aria-pressed={mode === "add"}
                      onClick={() => switchMode("add")}
                    >
                      {t("warehouse.modeAdd")}
                    </button>
                    <button
                      type="button"
                      aria-pressed={mode === "set"}
                      onClick={() => switchMode("set")}
                    >
                      {t("warehouse.modeSet")}
                    </button>
                  </div>
                </div>

                <label className="block">
                  <span className="admin-label">{qtyLabel}</span>
                  <div className="wh-stepper mt-1.5">
                    <button
                      type="button"
                      aria-label="Decrease"
                      disabled={entered <= 0}
                      onClick={() => bump(-1)}
                    >
                      <Minus className="h-5 w-5" strokeWidth={2.2} />
                    </button>
                    <input
                      type="number"
                      min={0}
                      value={qty}
                      onChange={(e) => setQty(e.target.value)}
                    />
                    <button
                      type="button"
                      aria-label="Increase"
                      onClick={() => bump(1)}
                    >
                      <Plus className="h-5 w-5" strokeWidth={2.2} />
                    </button>
                  </div>
                </label>

                {packed ? (
                  <p className="text-center text-sm font-semibold tabular-nums text-[var(--admin-brand-700)]">
                    {entered === 1
                      ? t("warehouse.convertingOne", {
                          pcs: enteredPcs.toLocaleString(),
                        })
                      : t("warehouse.converting", {
                          cases: entered,
                          pcs: enteredPcs.toLocaleString(),
                        })}
                  </p>
                ) : null}

                <div className="grid grid-cols-2 gap-3 rounded-2xl bg-[var(--admin-hover)] px-4 py-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] admin-muted">
                      {t("warehouse.onHand")}
                    </p>
                    <p className="mt-1 text-sm font-semibold tabular-nums">
                      {packed
                        ? formatPack(selected.quantity)
                        : `${selected.quantity.toLocaleString()} pcs`}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] admin-muted">
                      {t("warehouse.afterUpdate")}
                    </p>
                    <p className="mt-1 text-sm font-semibold tabular-nums text-[var(--admin-brand-700)]">
                      {packed
                        ? formatPack(nextPcs)
                        : `${nextPcs.toLocaleString()} pcs`}
                    </p>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={pending || (mode === "add" && entered === 0)}
                  className="admin-btn admin-btn-primary w-full disabled:opacity-50"
                >
                  {pending
                    ? t("common.saving")
                    : mode === "add"
                      ? t("warehouse.addStock")
                      : t("warehouse.setStock")}
                </button>
              </form>
            ) : (
              <p className="text-sm admin-muted">{t("warehouse.emptyFlavors")}</p>
            )}
          </AdminCard>

          {!hasTestStation ? (
            <AdminCard className="border-dashed">
              <div className="flex items-start gap-3">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--admin-brand-50)] text-[var(--admin-brand-500)]">
                  <Box className="h-6 w-6" strokeWidth={1.75} />
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="admin-section-title mb-0">
                    {t("warehouse.stationTitle")}
                  </h2>
                  <p className="mt-2 text-sm admin-muted">
                    {t("warehouse.stationMissing")}
                  </p>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={addStation}
                    className="admin-btn admin-btn-primary admin-btn-sm mt-4 disabled:opacity-50"
                  >
                    <Plus className="h-4 w-4" strokeWidth={2} />
                    {t("warehouse.addTestStation")}
                  </button>
                </div>
              </div>
            </AdminCard>
          ) : null}
        </div>
      </div>

      <AdminCard padded={false}>
        <div className="border-b border-[var(--admin-border)] px-5 py-4">
          <h2 className="admin-section-title mb-0">
            {t("warehouse.activityTitle")}
          </h2>
        </div>
        {logs.length === 0 ? (
          <p className="px-5 py-6 text-sm admin-muted">
            {t("warehouse.emptyActivity")}
          </p>
        ) : (
          <AdminTable
            headers={[
              t("warehouse.colWhen"),
              t("warehouse.colWho"),
              t("warehouse.colProduct"),
              t("warehouse.colChange"),
            ]}
          >
            {logs.map((row) => {
              const delta = changeDelta(row);
              return (
                <tr key={row.id}>
                  <td className="whitespace-nowrap text-sm">{row.when}</td>
                  <td className="text-sm">{row.who}</td>
                  <td className="text-sm">{row.product}</td>
                  <td className="tabular-nums text-sm font-semibold">
                    {changeLabel(row)}
                    {delta !== 0 ? (
                      <span
                        className={`ml-2 text-xs font-semibold ${
                          delta > 0
                            ? "text-[var(--admin-success-700)]"
                            : "text-[var(--admin-error-700)]"
                        }`}
                      >
                        {delta > 0 ? "+" : "−"}
                        {isCasePackedSku(row.sku)
                          ? formatPack(Math.abs(delta))
                          : `${Math.abs(delta)} pcs`}
                      </span>
                    ) : null}
                  </td>
                </tr>
              );
            })}
          </AdminTable>
        )}
      </AdminCard>
    </div>
  );
}
