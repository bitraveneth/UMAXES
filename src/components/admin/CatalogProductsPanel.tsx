"use client";

import { Fragment, useState } from "react";
import {
  updateProductPrice,
  setProductVisibility,
  updateProductDetails,
  addProductOption,
  deleteProductOption,
} from "@/lib/admin-actions";
import type { CustomerLevel } from "@/generated/prisma/enums";
import { AdminBadge, AdminCard } from "@/components/admin/ui";
import { ProductImageField } from "@/components/admin/ProductImageField";
import { Package } from "@/components/admin/icons";
import { useAdminI18n } from "@/components/admin/AdminI18n";

const levels: CustomerLevel[] = ["DISTRO", "WHOLESALER", "SHOP"];

export type CatalogProductRow = {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  image: string | null;
  active: boolean;
  visibleLevels: CustomerLevel[];
  stock: number;
  reserved: number;
  optionCount: number;
  options: { id: string; name: string; valuesLabel: string }[];
  prices: { level: CustomerLevel; unitPrice: number; moq: number }[];
};

function money(n: number) {
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  });
}

function parseOptionValues(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.map(String);
  } catch {
    /* legacy */
  }
  return raw
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

export function optionValuesLabel(raw: string) {
  return parseOptionValues(raw).join(", ");
}

function ProductEditPanel({
  product,
  onClose,
}: {
  product: CatalogProductRow;
  onClose: () => void;
}) {
  const { t } = useAdminI18n();
  return (
    <AdminCard padded={false} className="overflow-hidden border-0 shadow-none">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--admin-border)] px-5 py-4">
        <div className="flex items-start gap-3">
          <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[var(--admin-gray-100)]">
            {product.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={product.image}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <Package
                className="h-5 w-5 text-[var(--admin-muted)]"
                strokeWidth={1.75}
              />
            )}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-[var(--admin-text)]">
              {product.name}{" "}
              <span className="text-sm font-normal admin-muted">
                {product.sku}
              </span>
            </h3>
            <p className="mt-1 text-sm admin-muted">
              {t("catalog.stock")} {product.stock} · Reserved {product.reserved}
              {product.optionCount > 0
                ? ` · ${product.optionCount} ${t("catalog.options")}`
                : ""}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <AdminBadge tone={product.active ? "success" : "neutral"}>
            {product.active ? t("common.active") : t("common.inactive")}
          </AdminBadge>
          <button
            type="button"
            onClick={onClose}
            className="admin-btn admin-btn-secondary admin-btn-sm"
          >
            {t("common.close")}
          </button>
        </div>
      </div>

      <div className="space-y-4 px-5 py-4">
        <form
          action={async (fd) => {
            await updateProductDetails(product.id, {
              name: String(fd.get("name") || ""),
              description: String(fd.get("description") || ""),
              image: String(fd.get("image") || ""),
              active: fd.get("active") === "on",
            });
          }}
          className="grid gap-3 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-hover)]/40 p-4 sm:grid-cols-2"
        >
          <p className="sm:col-span-2 text-[11px] font-semibold tracking-[0.14em] text-[var(--admin-muted)] uppercase">
            {t("catalog.productDetails")}
          </p>
          <label className="admin-label text-xs">
            {t("catalog.name")}
            <input
              name="name"
              defaultValue={product.name}
              required
              className="admin-input mt-1 w-full"
            />
          </label>
          <label className="admin-label text-xs sm:col-span-2">
            {t("catalog.descriptionLabel")}
            <textarea
              name="description"
              rows={2}
              defaultValue={product.description || ""}
              className="admin-input mt-1 w-full"
            />
          </label>
          <div className="sm:col-span-2">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--admin-muted)]">
              {t("catalog.image")}
            </p>
            <ProductImageField
              name="image"
              defaultValue={product.image || ""}
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-[var(--admin-text)]">
            <input
              name="active"
              type="checkbox"
              defaultChecked={product.active}
            />{" "}
            {t("common.active")}
          </label>
          <div className="flex justify-end">
            <button
              type="submit"
              className="admin-btn admin-btn-primary admin-btn-sm"
            >
              {t("catalog.saveDetails")}
            </button>
          </div>
        </form>

        <div className="rounded-xl border border-[var(--admin-border)] p-4">
          <p className="text-[11px] font-semibold tracking-[0.14em] text-[var(--admin-muted)] uppercase">
            {t("catalog.productOptions")}
          </p>
          <p className="mt-1 text-xs admin-muted">
            {t("catalog.optionsHelp")}
          </p>
          <ul className="mt-3 space-y-2">
            {product.options.length === 0 && (
              <li className="text-sm admin-muted">{t("catalog.noOptions")}</li>
            )}
            {product.options.map((opt) => (
              <li
                key={opt.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-[var(--admin-gray-50)] px-3 py-2 text-sm"
              >
                <span>
                  <strong className="text-[var(--admin-text)]">{opt.name}</strong>
                  <span className="admin-muted"> · {opt.valuesLabel}</span>
                </span>
                <form action={deleteProductOption.bind(null, opt.id)}>
                  <button
                    type="submit"
                    className="admin-btn admin-btn-danger admin-btn-sm"
                  >
                    {t("common.remove")}
                  </button>
                </form>
              </li>
            ))}
          </ul>
          <form
            action={async (fd) => {
              await addProductOption(
                product.id,
                String(fd.get("optionName") || ""),
                String(fd.get("optionValues") || ""),
              );
            }}
            className="mt-3 flex flex-wrap gap-2"
          >
            <input
              name="optionName"
              placeholder={t("catalog.optionName")}
              required
              className="admin-input min-w-[140px]"
            />
            <input
              name="optionValues"
              placeholder={t("catalog.optionValues")}
              required
              className="admin-input min-w-[180px] flex-1"
            />
            <button
              type="submit"
              className="admin-btn admin-btn-secondary admin-btn-sm"
            >
              {t("catalog.addOption")}
            </button>
          </form>
        </div>

        <form
          action={async (fd) => {
            const selected = levels.filter((l) => fd.get(l) === "on");
            await setProductVisibility(product.id, selected);
          }}
          className="flex flex-wrap items-center gap-3 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-hover)]/40 p-4"
        >
          <span className="text-[11px] font-semibold tracking-[0.14em] text-[var(--admin-muted)] uppercase">
            {t("catalog.visibleTo")}
          </span>
          {levels.map((level) => (
            <label
              key={level}
              className="flex items-center gap-1 text-xs text-[var(--admin-text)]"
            >
              <input
                type="checkbox"
                name={level}
                defaultChecked={
                  product.visibleLevels.length === 0 ||
                  product.visibleLevels.includes(level)
                }
              />
              {level}
            </label>
          ))}
          <button
            type="submit"
            className="admin-btn admin-btn-primary admin-btn-sm"
          >
            {t("catalog.saveVisibility")}
          </button>
        </form>

        <div className="grid gap-3 lg:grid-cols-3">
          {levels.map((level) => {
            const price = product.prices.find((p) => p.level === level);
            return (
              <form
                key={level}
                action={async (fd) => {
                  await updateProductPrice(
                    product.id,
                    level,
                    Number(fd.get("unitPrice")),
                    Number(fd.get("moq")),
                  );
                }}
                className="rounded-xl border border-[var(--admin-border)] p-4"
              >
                <p className="text-[11px] font-semibold tracking-[0.14em] text-[var(--admin-muted)] uppercase">
                  {level}
                </p>
                <label className="admin-label mt-2 text-xs">
                  {t("catalog.unitPrice")}
                  <input
                    name="unitPrice"
                    type="number"
                    step="0.01"
                    min={0}
                    defaultValue={price?.unitPrice ?? 0}
                    className="admin-input mt-1 w-full"
                    required
                  />
                </label>
                <label className="admin-label mt-2 text-xs">
                  {t("catalog.moq")}
                  <input
                    name="moq"
                    type="number"
                    min={1}
                    defaultValue={price?.moq ?? 1}
                    className="admin-input mt-1 w-full"
                    required
                  />
                </label>
                <button
                  type="submit"
                  className="admin-btn admin-btn-primary admin-btn-sm mt-3"
                >
                  {t("common.save")}
                </button>
              </form>
            );
          })}
        </div>
      </div>
    </AdminCard>
  );
}

export default function CatalogProductsPanel({
  products,
}: {
  products: CatalogProductRow[];
}) {
  const { t } = useAdminI18n();
  const [editingId, setEditingId] = useState<string | null>(null);

  if (products.length === 0) {
    return (
      <AdminCard>
        <p className="text-sm text-[var(--admin-muted)]">
          {t("catalog.noProducts")}
        </p>
      </AdminCard>
    );
  }

  return (
    <div className="admin-table-wrap">
      <table className="admin-table">
        <thead>
          <tr>
            <th>{t("catalog.product")}</th>
            <th>{t("catalog.sku")}</th>
            <th>{t("common.status")}</th>
            <th>{t("catalog.stock")}</th>
            <th>{t("catalog.shopPrice")}</th>
            <th>{t("catalog.options")}</th>
            <th>{t("catalog.visibility")}</th>
            <th className="text-right">{t("common.actions")}</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => {
            const open = editingId === p.id;
            const shop = p.prices.find((x) => x.level === "SHOP");
            const visibility =
              p.visibleLevels.length === 0
                ? t("catalog.allLevels")
                : p.visibleLevels.join(", ");

            return (
              <Fragment key={p.id}>
                <tr className={open ? "bg-[var(--admin-brand-50)]/40" : undefined}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[var(--admin-gray-100)]">
                        {p.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={p.image}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <Package
                            className="h-4 w-4 text-[var(--admin-muted)]"
                            strokeWidth={1.75}
                          />
                        )}
                      </div>
                      <span className="font-semibold text-[var(--admin-gray-800)]">
                        {p.name}
                      </span>
                    </div>
                  </td>
                  <td className="font-mono text-xs text-[var(--admin-muted)]">
                    {p.sku}
                  </td>
                  <td>
                    <AdminBadge tone={p.active ? "success" : "neutral"}>
                      {p.active ? t("common.active") : t("common.inactive")}
                    </AdminBadge>
                  </td>
                  <td className="tabular-nums">
                    {p.stock}
                    <span className="text-[var(--admin-muted)]">
                      {" "}
                      / {p.reserved} res
                    </span>
                  </td>
                  <td className="tabular-nums">
                    {shop ? money(shop.unitPrice) : "—"}
                  </td>
                  <td>{p.optionCount}</td>
                  <td className="max-w-[10rem] truncate text-xs text-[var(--admin-muted)]">
                    {visibility}
                  </td>
                  <td className="text-right">
                    <button
                      type="button"
                      onClick={() => setEditingId(open ? null : p.id)}
                      className={`admin-btn admin-btn-sm ${
                        open ? "admin-btn-primary" : "admin-btn-secondary"
                      }`}
                    >
                      {open ? t("common.close") : t("common.edit")}
                    </button>
                  </td>
                </tr>

                {open ? (
                  <tr className="bg-[var(--admin-brand-50)]/25">
                    <td colSpan={8} className="!p-0 !align-top">
                      <div className="border-t border-[var(--admin-border)] bg-[var(--admin-card)]">
                        <ProductEditPanel
                          product={p}
                          onClose={() => setEditingId(null)}
                        />
                      </div>
                    </td>
                  </tr>
                ) : null}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
