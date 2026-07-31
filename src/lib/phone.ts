/** Normalize to E.164 when possible. Accepts already-E.164 or digits + country code. */
export function toE164(
  phone: string,
  defaultCountryCode = "1",
): string | null {
  const raw = phone.trim();
  if (!raw) return null;

  if (raw.startsWith("+")) {
    const digits = raw.slice(1).replace(/\D/g, "");
    if (digits.length < 8 || digits.length > 15) return null;
    return `+${digits}`;
  }

  const digits = raw.replace(/\D/g, "");
  if (!digits) return null;

  if (digits.length >= 11 && digits.length <= 15) {
    return `+${digits}`;
  }

  const cc = defaultCountryCode.replace(/\D/g, "") || "1";
  const local = digits.replace(/^0+/, "");
  if (local.length < 7 || local.length > 12) return null;
  return `+${cc}${local}`;
}
