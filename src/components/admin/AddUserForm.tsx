"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createCustomerOnBehalf } from "@/lib/admin-actions";
import type { CustomerLevel } from "@/generated/prisma/enums";
import { creditDefaultsByLevel } from "@/lib/customer-segments";
import { AdminCard } from "@/components/admin/ui";
import { useAdminI18n } from "@/components/admin/AdminI18n";
import { useAdminToast } from "@/components/admin/AdminToast";
import { MapPin, ShoppingBag, UserRound } from "lucide-react";

const LEVELS: { value: CustomerLevel; labelKey: string }[] = [
  { value: "WHOLESALER", labelKey: "customers.levelWHOLESALER" },
  { value: "DISTRO", labelKey: "customers.levelDISTRO" },
  { value: "SHOP", labelKey: "customers.levelSHOP" },
];

function readAddress(fd: FormData) {
  return {
    line1: String(fd.get("line1") || "").trim(),
    line2: String(fd.get("line2") || "").trim() || undefined,
    city: String(fd.get("city") || "").trim(),
    region: String(fd.get("region") || "").trim() || undefined,
    postalCode: String(fd.get("postalCode") || "").trim(),
    country: String(fd.get("country") || "").trim(),
    label: String(fd.get("addressLabel") || "").trim() || undefined,
  };
}

export default function AddUserForm({
  fixedLevel,
  canSeeCreditAmounts = true,
  titleKey = "users.addTitle",
  hintKey = "users.addHint",
  onCreated,
}: {
  /** When set, lock account type (segment directory). */
  fixedLevel?: CustomerLevel;
  canSeeCreditAmounts?: boolean;
  titleKey?: string;
  hintKey?: string;
  onCreated?: (company: {
    id: string;
    companyId: string;
    name: string;
    level: CustomerLevel;
  }) => void;
}) {
  const { t } = useAdminI18n();
  const router = useRouter();
  const { showToast } = useAdminToast();
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const [level, setLevel] = useState<CustomerLevel>(fixedLevel || "WHOLESALER");
  const [created, setCreated] = useState<{
    companyId: string;
    name: string;
  } | null>(null);

  const defaults = creditDefaultsByLevel[level];
  const isRetail = level === "SHOP";

  function submit(fd: FormData) {
    setFormError(null);
    const password = String(fd.get("password") || "");
    const confirmPassword = String(fd.get("confirmPassword") || "");
    if (password !== confirmPassword) {
      setFormError(t("users.passwordMismatch"));
      return;
    }

    const chosenLevel = (fixedLevel ||
      (String(fd.get("level") || level) as CustomerLevel)) as CustomerLevel;

    startTransition(async () => {
      try {
        const result = await createCustomerOnBehalf({
          level: chosenLevel,
          companyName: String(fd.get("companyName") || ""),
          taxId: String(fd.get("taxId") || ""),
          contactName: String(fd.get("contactName") || ""),
          email: String(fd.get("email") || ""),
          phone: String(fd.get("phone") || ""),
          password,
          confirmPassword,
          creditLimit: Number(fd.get("creditLimit") || defaults.creditLimit),
          paymentTermsDays: Number(
            fd.get("paymentTermsDays") || defaults.paymentTermsDays,
          ),
          address: readAddress(fd),
        });
        formRef.current?.reset();
        if (!fixedLevel) setLevel("WHOLESALER");
        setCreated({ companyId: result.companyId, name: result.name });
        onCreated?.({
          id: result.companyId,
          companyId: result.companyId,
          name: result.name,
          level: chosenLevel,
        });
        showToast(
          t("users.addSuccess"),
          "success",
          t("users.addSuccessDetail", { name: result.name }),
        );
        router.refresh();
      } catch (e) {
        setFormError(
          e instanceof Error ? e.message : t("users.addError"),
        );
      }
    });
  }

  return (
    <AdminCard>
      <div className="mb-4 flex items-start gap-3" id="add-user">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--admin-brand-50)] text-[var(--admin-brand-500)]">
          <UserRound className="h-5 w-5" strokeWidth={1.75} />
        </div>
        <div>
          <h2 className="text-base font-semibold text-[var(--admin-text)]">
            {t(titleKey)}
          </h2>
          <p className="mt-1 text-sm text-[var(--admin-muted)]">{t(hintKey)}</p>
        </div>
      </div>

      {created ? (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--admin-success-500)]/35 bg-[var(--admin-success-50)] px-4 py-3">
          <p className="text-sm text-[var(--admin-success-700)]">
            {t("users.addSuccessDetail", { name: created.name })}
          </p>
          <Link
            href={`/admin/orders/new?company=${encodeURIComponent(created.companyId)}`}
            className="admin-btn admin-btn-primary admin-btn-sm"
          >
            <ShoppingBag className="h-3.5 w-3.5" strokeWidth={1.75} />
            {t("users.createOrderNow")}
          </Link>
        </div>
      ) : null}

      <form
        ref={formRef}
        onSubmit={(e) => {
          e.preventDefault();
          submit(new FormData(e.currentTarget));
        }}
        className="space-y-4"
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {!fixedLevel ? (
            <label className="block text-xs font-medium text-[var(--admin-muted)]">
              {t("users.accountType")}
              <select
                name="level"
                required
                value={level}
                onChange={(e) => setLevel(e.target.value as CustomerLevel)}
                className="admin-input mt-1.5 w-full"
              >
                {LEVELS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {t(opt.labelKey)}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <label className="block text-xs font-medium text-[var(--admin-muted)]">
            {t("customers.company")}
            <input
              name="companyName"
              required
              className="admin-input mt-1.5 w-full"
            />
          </label>
          <label className="block text-xs font-medium text-[var(--admin-muted)]">
            {t("customers.contactName")}
            <input
              name="contactName"
              required
              className="admin-input mt-1.5 w-full"
            />
          </label>
          <label className="block text-xs font-medium text-[var(--admin-muted)]">
            {t("customers.email")}
            <input
              name="email"
              type="email"
              required
              autoComplete="off"
              className="admin-input mt-1.5 w-full"
            />
          </label>
          <label className="block text-xs font-medium text-[var(--admin-muted)]">
            {t("customers.phone")}
            <input
              name="phone"
              autoComplete="off"
              className="admin-input mt-1.5 w-full"
            />
          </label>
          <label className="block text-xs font-medium text-[var(--admin-muted)]">
            {t("customers.taxId")}
            <input name="taxId" className="admin-input mt-1.5 w-full" />
          </label>
          <label className="block text-xs font-medium text-[var(--admin-muted)]">
            {t("users.password")}
            <input
              name="password"
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              className="admin-input mt-1.5 w-full"
            />
            <span className="mt-1 block text-[11px] font-normal text-[var(--admin-muted)]">
              {t("users.passwordHint")}
            </span>
          </label>
          <label className="block text-xs font-medium text-[var(--admin-muted)]">
            {t("users.confirmPassword")}
            <input
              name="confirmPassword"
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              className="admin-input mt-1.5 w-full"
            />
          </label>
          {!isRetail && canSeeCreditAmounts ? (
            <>
              <label className="block text-xs font-medium text-[var(--admin-muted)]">
                {t("customers.creditLimit")}
                <input
                  key={`credit-${level}`}
                  name="creditLimit"
                  type="number"
                  min={0}
                  step={100}
                  defaultValue={defaults.creditLimit}
                  className="admin-input mt-1.5 w-full"
                />
              </label>
              <label className="block text-xs font-medium text-[var(--admin-muted)]">
                {t("customers.terms")}
                <input
                  key={`terms-${level}`}
                  name="paymentTermsDays"
                  type="number"
                  min={0}
                  defaultValue={defaults.paymentTermsDays}
                  className="admin-input mt-1.5 w-full"
                />
              </label>
            </>
          ) : null}
        </div>

        <div className="rounded-xl border border-[var(--admin-border)] p-4">
          <p className="mb-3 flex items-center gap-2 text-xs font-semibold tracking-wide text-[var(--admin-muted)] uppercase">
            <MapPin className="h-3.5 w-3.5" />
            {t("users.shipAddress")}
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <label className="block text-xs font-medium text-[var(--admin-muted)] sm:col-span-2">
              {t("customers.line1")}
              <input
                name="line1"
                required
                className="admin-input mt-1.5 w-full"
              />
            </label>
            <label className="block text-xs font-medium text-[var(--admin-muted)]">
              {t("customers.line2")}
              <input name="line2" className="admin-input mt-1.5 w-full" />
            </label>
            <label className="block text-xs font-medium text-[var(--admin-muted)]">
              {t("customers.city")}
              <input
                name="city"
                required
                className="admin-input mt-1.5 w-full"
              />
            </label>
            <label className="block text-xs font-medium text-[var(--admin-muted)]">
              {t("customers.region")}
              <input name="region" className="admin-input mt-1.5 w-full" />
            </label>
            <label className="block text-xs font-medium text-[var(--admin-muted)]">
              {t("customers.postalCode")}
              <input
                name="postalCode"
                required
                className="admin-input mt-1.5 w-full"
              />
            </label>
            <label className="block text-xs font-medium text-[var(--admin-muted)]">
              {t("customers.country")}
              <input
                name="country"
                required
                defaultValue="US"
                className="admin-input mt-1.5 w-full"
              />
            </label>
          </div>
        </div>

        {formError ? (
          <p className="text-sm text-[var(--admin-error-500)]">{formError}</p>
        ) : null}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={pending}
            className="admin-btn admin-btn-primary"
          >
            {pending ? t("common.saving") : t("users.addSubmit")}
          </button>
        </div>
      </form>
    </AdminCard>
  );
}
