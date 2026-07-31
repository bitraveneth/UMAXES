import { AUTH_FIELD_CLASS, COUNTRY_CODES } from "./auth-shared";

type PhoneFieldsProps = {
  countryCode: string;
  phone: string;
  onCountryCodeChange: (code: string) => void;
  onPhoneChange: (phone: string) => void;
  required?: boolean;
};

export default function PhoneFields({
  countryCode,
  phone,
  onCountryCodeChange,
  onPhoneChange,
  required = true,
}: PhoneFieldsProps) {
  return (
    <div>
      <label
        htmlFor="phone"
        className="mb-2 block font-display text-sm font-semibold text-black"
      >
        Mobile phone
      </label>
      <div className="flex gap-2">
        <select
          aria-label="Country code"
          value={countryCode}
          onChange={(e) => onCountryCodeChange(e.target.value)}
          className="w-[8.5rem] shrink-0 rounded-xl border border-black/12 bg-white/90 px-2 py-3.5 font-body text-sm text-black outline-none focus:border-umx-orange focus:ring-2 focus:ring-umx-orange/20"
        >
          {COUNTRY_CODES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.label}
            </option>
          ))}
        </select>
        <input
          id="phone"
          name="phone"
          type="tel"
          autoComplete="tel-national"
          required={required}
          value={phone}
          onChange={(e) => onPhoneChange(e.target.value)}
          placeholder="555 000 0000"
          className={AUTH_FIELD_CLASS}
        />
      </div>
    </div>
  );
}
