import { Download, Eye, Printer } from "lucide-react";

const DOCS = [
  { type: "pi", label: "PI", title: "Proforma invoice" },
  { type: "packing", label: "Packing list", title: "Packing list" },
  { type: "invoice", label: "Invoice", title: "Commercial invoice" },
] as const;

export function AccountDocLinks({
  orderId,
  types = ["pi", "invoice"],
  compact = false,
}: {
  orderId: string;
  types?: Array<(typeof DOCS)[number]["type"]>;
  compact?: boolean;
}) {
  const links = DOCS.filter((d) => types.includes(d.type));

  return (
    <div className={`flex flex-wrap items-center ${compact ? "gap-1.5" : "gap-2"}`}>
      {links.map((doc) => (
        <a
          key={doc.type}
          href={`/api/orders/${orderId}/docs?type=${doc.type}`}
          target="_blank"
          rel="noopener noreferrer"
          title={`View ${doc.title} — then print or download`}
          className={`inline-flex items-center gap-1.5 rounded-lg border border-black/12 bg-white font-display font-semibold transition hover:border-umx-orange hover:bg-umx-orange-wash/50 hover:text-umx-orange ${
            compact
              ? "px-2.5 py-1.5 text-[11px]"
              : "px-3 py-2 text-xs"
          }`}
        >
          <Eye className={compact ? "h-3 w-3" : "h-3.5 w-3.5"} strokeWidth={2} />
          {doc.label}
        </a>
      ))}
    </div>
  );
}

/** Hint under document buttons */
export function AccountDocHint() {
  return (
    <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 font-body text-[11px] text-black">
      <span className="inline-flex items-center gap-1">
        <Eye className="h-3 w-3" /> View
      </span>
      <span className="inline-flex items-center gap-1">
        <Printer className="h-3 w-3" /> Print
      </span>
      <span className="inline-flex items-center gap-1">
        <Download className="h-3 w-3" /> Download
      </span>
    </p>
  );
}
