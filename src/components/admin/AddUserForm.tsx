"use client";

import { useRef, useState, useTransition, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createCustomerOnBehalf } from "@/lib/admin-actions";
import type { CustomerLevel } from "@/generated/prisma/enums";
import { creditDefaultsByLevel } from "@/lib/customer-segments";
import { AdminCard } from "@/components/admin/ui";
import { useAdminI18n } from "@/components/admin/AdminI18n";
import { useAdminToast } from "@/components/admin/AdminToast";
import {
  Building2,
  CircleAlert,
  CreditCard,
  Hash,
  IdCard,
  Lock,
  Mail,
  MapPin,
  Phone,
  ShoppingBag,
  UserPlus,
  UserRound,
} from "lucide-react";

const LEVELS: { value: CustomerLevel; labelKey: string }[] = [
  { value: "WHOLESALER", labelKey: "customers.levelWHOLESALER" },
  { value: "DISTRO", labelKey: "customers.levelDISTRO" },
  { value: "SHOP", labelKey: "customers.levelSHOP" },
];

type FieldKey =
  | "companyName"
  | "contactName"
  | "email"
  | "phone"
  | "password"
  | "confirmPassword"
  | "line1"
  | "city"
  | "postalCode"
  | "country";

function isCustomerLevel(value: string): value is CustomerLevel {
  return value === "WHOLESALER" || value === "DISTRO" || value === "SHOP";
}

function readAddress(fd: FormData) {
  return {
    recipientName: String(fd.get("recipientName") || "").trim() || undefined,
    phone: String(fd.get("shipPhone") || "").trim() || undefined,
    line1: String(fd.get("line1") || "").trim(),
    line2: String(fd.get("line2") || "").trim() || undefined,
    city: String(fd.get("city") || "").trim(),
    region: String(fd.get("region") || "").trim() || undefined,
    postalCode: String(fd.get("postalCode") || "").trim(),
    country: String(fd.get("country") || "").trim(),
    label: String(fd.get("addressLabel") || "").trim() || undefined,
  };
}

function validEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 7 && digits.length <= 15;
}

function Field({
  icon,
  label,
  required,
  optionalLabel,
  error,
  hint,
  className,
  children,
}: {
  icon: ReactNode;
  label: string;
  required?: boolean;
  optionalLabel?: string;
  error?: string;
  hint?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <label className={`block ${className || ""}`}>
      <span className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-[var(--admin-muted)]">
        <span className="text-[var(--admin-brand-500)]">{icon}</span>
        <span>{label}</span>
        {required ? (
          <span className="admin-req" title="Required">
            *
          </span>
        ) : (
          <span className="text-[11px] font-normal text-[var(--admin-muted)]">
            {optionalLabel}
          </span>
        )}
      </span>
      {children}
      {error ? (
        <p className="admin-field-error" role="alert">
          <CircleAlert className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
          {error}
        </p>
      ) : hint ? (
        <span className="mt-1 block text-[11px] font-normal text-[var(--admin-muted)]">
          {hint}
        </span>
      ) : null}
    </label>
  );
}

export default function AddUserForm({
  initialLevel = "WHOLESALER",
  canSeeCreditAmounts = true,
}: {
  initialLevel?: CustomerLevel;
  canSeeCreditAmounts?: boolean;
}) {
  const { t } = useAdminI18n();
  const router = useRouter();
  const { showToast } = useAdminToast();
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<FieldKey, string>>>(
    {},
  );
  const [level, setLevel] = useState<CustomerLevel>(
    isCustomerLevel(initialLevel) ? initialLevel : "WHOLESALER",
  );
  const [created, setCreated] = useState<{
    companyId: string;
    name: string;
  } | null>(null);

  const defaults = creditDefaultsByLevel[level];
  const isRetail = level === "SHOP";

  function clearField(key: FieldKey) {
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  function validate(fd: FormData) {
    const errors: Partial<Record<FieldKey, string>> = {};
    const companyName = String(fd.get("companyName") || "").trim();
    const contactName = String(fd.get("contactName") || "").trim();
    const email = String(fd.get("email") || "").trim();
    const phone = String(fd.get("phone") || "").trim();
    const password = String(fd.get("password") || "");
    const confirmPassword = String(fd.get("confirmPassword") || "");
    const address = readAddress(fd);

    if (!companyName) errors.companyName = t("users.errCompany");
    if (!contactName) errors.contactName = t("users.errContact");
    if (!email) errors.email = t("users.errEmail");
    else if (!validEmail(email)) errors.email = t("users.errEmailInvalid");
    if (!phone) errors.phone = t("users.errPhone");
    else if (!validPhone(phone)) errors.phone = t("users.errPhoneInvalid");
    if (!password) errors.password = t("users.errPassword");
    else if (password.length < 6) errors.password = t("users.passwordHint");
    if (!confirmPassword) errors.confirmPassword = t("users.errConfirm");
    else if (password !== confirmPassword) {
      errors.confirmPassword = t("users.passwordMismatch");
    }
    if (!address.line1) errors.line1 = t("users.errLine1");
    if (!address.city) errors.city = t("users.errCity");
    if (!address.postalCode) errors.postalCode = t("users.errPostal");
    if (!address.country) errors.country = t("users.errCountry");

    return errors;
  }

  function submit(fd: FormData) {
    setFormError(null);
    const errors = validate(fd);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      setFormError(t("users.errMissing"));
      requestAnimationFrame(() => {
        formRef.current
          ?.querySelector<HTMLElement>("[aria-invalid='true']")
          ?.focus();
      });
      return;
    }

    const chosenLevel = isCustomerLevel(String(fd.get("level") || level))
      ? (String(fd.get("level") || level) as CustomerLevel)
      : level;

    startTransition(async () => {
      try {
        const result = await createCustomerOnBehalf({
          level: chosenLevel,
          companyName: String(fd.get("companyName") || ""),
          taxId: String(fd.get("taxId") || ""),
          contactName: String(fd.get("contactName") || ""),
          email: String(fd.get("email") || ""),
          phone: String(fd.get("phone") || ""),
          password: String(fd.get("password") || ""),
          confirmPassword: String(fd.get("confirmPassword") || ""),
          creditLimit: Number(fd.get("creditLimit") || defaults.creditLimit),
          paymentTermsDays: Number(
            fd.get("paymentTermsDays") || defaults.paymentTermsDays,
          ),
          address: readAddress(fd),
        });
        formRef.current?.reset();
        setLevel(initialLevel);
        setFieldErrors({});
        setCreated({ companyId: result.companyId, name: result.name });
        showToast(
          t("users.addSuccess"),
          "success",
          t("users.addSuccessDetail", { name: result.name }),
        );
        router.refresh();
      } catch (e) {
        setFormError(e instanceof Error ? e.message : t("users.addError"));
      }
    });
  }

  function inputClass(key: FieldKey) {
    return `admin-input mt-0 w-full ${fieldErrors[key] ? "admin-input-invalid" : ""}`;
  }

  return (
    <AdminCard>
      <div className="mb-4 flex items-start gap-3" id="add-user">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--admin-brand-50)] text-[var(--admin-brand-500)]">
          <UserPlus className="h-5 w-5" strokeWidth={1.75} />
        </div>
        <div>
          <h2 className="text-base font-semibold text-[var(--admin-text)]">
            {t("users.addTitle")}
          </h2>
          <p className="mt-1 text-sm text-[var(--admin-muted)]">
            {t("users.addHint")}
          </p>
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
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          submit(new FormData(e.currentTarget));
        }}
        className="space-y-4"
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Field
            icon={<IdCard className="h-3.5 w-3.5" strokeWidth={1.9} />}
            label={t("users.accountType")}
            required
          >
            <select
              name="level"
              required
              value={level}
              onChange={(e) => setLevel(e.target.value as CustomerLevel)}
              className="admin-input mt-0 w-full"
            >
              {LEVELS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {t(opt.labelKey)}
                </option>
              ))}
            </select>
          </Field>
          <Field
            icon={<Building2 className="h-3.5 w-3.5" strokeWidth={1.9} />}
            label={t("customers.company")}
            required
            error={fieldErrors.companyName}
          >
            <input
              name="companyName"
              required
              aria-invalid={Boolean(fieldErrors.companyName)}
              onChange={() => clearField("companyName")}
              placeholder={t("users.phCompany")}
              className={inputClass("companyName")}
            />
          </Field>
          <Field
            icon={<UserRound className="h-3.5 w-3.5" strokeWidth={1.9} />}
            label={t("customers.contactName")}
            required
            error={fieldErrors.contactName}
          >
            <input
              name="contactName"
              required
              aria-invalid={Boolean(fieldErrors.contactName)}
              onChange={() => clearField("contactName")}
              placeholder={t("users.phContact")}
              className={inputClass("contactName")}
            />
          </Field>
          <Field
            icon={<Mail className="h-3.5 w-3.5" strokeWidth={1.9} />}
            label={t("customers.email")}
            required
            error={fieldErrors.email}
          >
            <input
              name="email"
              type="email"
              required
              autoComplete="off"
              aria-invalid={Boolean(fieldErrors.email)}
              onChange={() => clearField("email")}
              placeholder={t("users.phEmail")}
              className={inputClass("email")}
            />
          </Field>
          <Field
            icon={<Phone className="h-3.5 w-3.5" strokeWidth={1.9} />}
            label={t("customers.phone")}
            required
            error={fieldErrors.phone}
          >
            <input
              name="phone"
              type="tel"
              required
              autoComplete="off"
              aria-invalid={Boolean(fieldErrors.phone)}
              onChange={() => clearField("phone")}
              placeholder={t("users.phPhone")}
              className={inputClass("phone")}
            />
          </Field>
          <Field
            icon={<Hash className="h-3.5 w-3.5" strokeWidth={1.9} />}
            label={t("customers.taxId")}
            optionalLabel={t("users.optional")}
          >
            <input
              name="taxId"
              placeholder={t("users.phTax")}
              className="admin-input mt-0 w-full"
            />
          </Field>
          <Field
            icon={<Lock className="h-3.5 w-3.5" strokeWidth={1.9} />}
            label={t("users.password")}
            required
            error={fieldErrors.password}
            hint={fieldErrors.password ? undefined : t("users.passwordHint")}
          >
            <input
              name="password"
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              aria-invalid={Boolean(fieldErrors.password)}
              onChange={() => clearField("password")}
              className={inputClass("password")}
            />
          </Field>
          <Field
            icon={<Lock className="h-3.5 w-3.5" strokeWidth={1.9} />}
            label={t("users.confirmPassword")}
            required
            error={fieldErrors.confirmPassword}
          >
            <input
              name="confirmPassword"
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              aria-invalid={Boolean(fieldErrors.confirmPassword)}
              onChange={() => clearField("confirmPassword")}
              className={inputClass("confirmPassword")}
            />
          </Field>
          {!isRetail && canSeeCreditAmounts ? (
            <>
              <Field
                icon={<CreditCard className="h-3.5 w-3.5" strokeWidth={1.9} />}
                label={t("customers.creditLimit")}
                optionalLabel={t("users.optional")}
              >
                <input
                  key={`credit-${level}`}
                  name="creditLimit"
                  type="number"
                  min={0}
                  step={100}
                  defaultValue={defaults.creditLimit}
                  className="admin-input mt-0 w-full"
                />
              </Field>
              <Field
                icon={<CreditCard className="h-3.5 w-3.5" strokeWidth={1.9} />}
                label={t("customers.terms")}
                optionalLabel={t("users.optional")}
              >
                <input
                  key={`terms-${level}`}
                  name="paymentTermsDays"
                  type="number"
                  min={0}
                  defaultValue={defaults.paymentTermsDays}
                  className="admin-input mt-0 w-full"
                />
              </Field>
            </>
          ) : null}
        </div>

        <div className="rounded-xl border border-[var(--admin-border)] p-4">
          <p className="mb-3 flex items-center gap-2 text-xs font-semibold tracking-wide text-[var(--admin-muted)] uppercase">
            <MapPin className="h-3.5 w-3.5 text-[var(--admin-brand-500)]" />
            {t("users.shipAddress")}
            <span className="admin-req" title="Required">
              *
            </span>
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Field
              icon={<UserRound className="h-3.5 w-3.5" strokeWidth={1.9} />}
              label={t("customers.fullName")}
              required
              className="sm:col-span-1"
            >
              <input
                name="recipientName"
                autoComplete="shipping name"
                required
                className="admin-input mt-0 w-full"
              />
            </Field>
            <Field
              icon={<Phone className="h-3.5 w-3.5" strokeWidth={1.9} />}
              label={t("customers.phoneNumber")}
              required
            >
              <input
                name="shipPhone"
                type="tel"
                autoComplete="shipping tel"
                required
                className="admin-input mt-0 w-full"
              />
            </Field>
            <Field
              icon={<MapPin className="h-3.5 w-3.5" strokeWidth={1.9} />}
              label={t("customers.line1")}
              required
              error={fieldErrors.line1}
              className="sm:col-span-2"
            >
              <input
                name="line1"
                required
                aria-invalid={Boolean(fieldErrors.line1)}
                onChange={() => clearField("line1")}
                placeholder={t("users.phLine1")}
                className={inputClass("line1")}
              />
            </Field>
            <Field
              icon={<MapPin className="h-3.5 w-3.5" strokeWidth={1.9} />}
              label={t("customers.line2")}
              optionalLabel={t("users.optional")}
            >
              <input
                name="line2"
                placeholder={t("users.phLine2")}
                className="admin-input mt-0 w-full"
              />
            </Field>
            <Field
              icon={<MapPin className="h-3.5 w-3.5" strokeWidth={1.9} />}
              label={t("customers.city")}
              required
              error={fieldErrors.city}
            >
              <input
                name="city"
                required
                aria-invalid={Boolean(fieldErrors.city)}
                onChange={() => clearField("city")}
                placeholder={t("users.phCity")}
                className={inputClass("city")}
              />
            </Field>
            <Field
              icon={<MapPin className="h-3.5 w-3.5" strokeWidth={1.9} />}
              label={t("customers.region")}
              optionalLabel={t("users.optional")}
            >
              <input
                name="region"
                placeholder={t("users.phRegion")}
                className="admin-input mt-0 w-full"
              />
            </Field>
            <Field
              icon={<MapPin className="h-3.5 w-3.5" strokeWidth={1.9} />}
              label={t("customers.postalCode")}
              required
              error={fieldErrors.postalCode}
            >
              <input
                name="postalCode"
                required
                aria-invalid={Boolean(fieldErrors.postalCode)}
                onChange={() => clearField("postalCode")}
                placeholder={t("users.phPostal")}
                className={inputClass("postalCode")}
              />
            </Field>
            <Field
              icon={<MapPin className="h-3.5 w-3.5" strokeWidth={1.9} />}
              label={t("customers.country")}
              required
              error={fieldErrors.country}
            >
              <input
                name="country"
                required
                defaultValue="United States"
                aria-invalid={Boolean(fieldErrors.country)}
                onChange={() => clearField("country")}
                className={inputClass("country")}
              />
            </Field>
          </div>
        </div>

        {formError ? (
          <p
            className="flex items-start gap-2 rounded-xl border border-[var(--admin-error-500)]/30 bg-[var(--admin-error-50,rgba(220,38,38,0.06))] px-3 py-2.5 text-sm text-[var(--admin-error-500)]"
            role="alert"
          >
            <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2} />
            {formError}
          </p>
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
