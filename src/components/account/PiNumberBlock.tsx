import { parseDocNumber } from "@/lib/doc-number";

export default function PiNumberBlock({
  value,
  compact = false,
}: {
  value: string;
  compact?: boolean;
}) {
  const parts = parseDocNumber(value);
  const facts = [
    parts.state ? { label: "State", value: parts.state } : null,
    parts.company ? { label: "Company", value: parts.company } : null,
    parts.dateLabel ? { label: "Date", value: parts.dateLabel } : null,
    parts.systemId ? { label: "ID", value: parts.systemId } : null,
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <div
      className={`overflow-hidden border border-black/10 bg-white ${
        compact ? "px-4 py-3" : "px-5 py-4 sm:px-6 sm:py-5"
      }`}
    >
      <p className="font-display text-[10px] font-semibold tracking-[0.16em] text-black/50 uppercase">
        Proforma invoice
      </p>
      <p
        className={`mt-1.5 break-all font-display font-extrabold tracking-tight text-[#1b4f72] ${
          compact ? "text-base" : "text-xl sm:text-2xl"
        }`}
      >
        {value}
      </p>
      {facts.length ? (
        <dl
          className={`mt-4 grid gap-3 ${
            facts.length > 2 ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-2"
          }`}
        >
          {facts.map((fact) => (
            <div key={fact.label}>
              <dt className="font-display text-[10px] font-semibold tracking-[0.14em] text-black/45 uppercase">
                {fact.label}
              </dt>
              <dd className="mt-0.5 break-all font-display text-sm font-bold text-black">
                {fact.value}
              </dd>
            </div>
          ))}
        </dl>
      ) : null}
    </div>
  );
}
