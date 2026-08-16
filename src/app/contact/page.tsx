import ContactForm from "@/components/ContactForm";
import { SupportShell } from "@/components/SupportShell";
import { SITE_CONTACT_EMAIL } from "@/lib/site";

export const metadata = {
  title: "Contact us · UMAXES",
  description:
    "Contact UMAXES at info@umaxesvape.com for product questions, orders, and wholesale consultation. Adults 21+.",
};

export default function ContactPage() {
  return (
    <SupportShell
      wide
      align="center"
      eyebrow="Contact us"
      title="Get in touch."
      description="Questions about HOOKAMAX, MaxCore™, an order, or wholesale — use the form or email us directly. We reply within 1–2 business days. Adults 21+ only."
    >
      <div className="grid overflow-hidden rounded-[1.75rem] bg-white shadow-[0_20px_50px_rgba(0,0,0,0.1)] ring-1 ring-black/12 lg:grid-cols-2">
        <div className="px-6 py-8 sm:px-10 sm:py-10 lg:px-12 lg:py-12">
          <p className="font-display text-[0.7rem] font-semibold tracking-[0.2em] text-black/40 uppercase">
            Send a message
          </p>
          <div className="mt-6">
            <ContactForm embedded />
          </div>
        </div>

        <aside className="flex flex-col bg-black px-8 py-10 text-umx-cream sm:px-10 sm:py-12 lg:px-12">
          <h2 className="font-display text-[clamp(1.45rem,2.4vw,1.85rem)] font-extrabold tracking-[-0.03em]">
            Consultation &amp; inquiries
          </h2>
          <p className="mt-4 font-body text-sm leading-[1.8] text-umx-cream/75 sm:text-base">
            For product details, orders, or wholesale consultation, email the
            UMAXES team. One inbox for every adult-customer request.
          </p>
          <a
            href={`mailto:${SITE_CONTACT_EMAIL}`}
            className="mt-6 font-display text-[clamp(1.05rem,1.8vw,1.35rem)] font-bold tracking-[-0.02em] text-umx-cream underline decoration-umx-cream/30 underline-offset-4 transition hover:decoration-umx-cream"
          >
            {SITE_CONTACT_EMAIL}
          </a>
          <div className="mt-8 border-t border-white/15 pt-8">
            <p className="font-display text-[0.68rem] font-semibold tracking-[0.18em] text-umx-cream/40 uppercase">
              We can help with
            </p>
            <p className="mt-4 font-body text-sm leading-[1.8] text-umx-cream/75 sm:text-base">
              HOOKAMAX flavors and MaxCore™ technology, order status, shipping
              and returns, plus wholesale and distribution inquiries for
              approved partners.
            </p>
            <p className="mt-4 font-body text-sm leading-[1.8] text-umx-cream/65">
              We usually reply within 1–2 business days.
            </p>
          </div>
          <div className="mt-8 flex flex-1 flex-col justify-end">
            <div className="rounded-[1.25rem] bg-umx-cream px-6 py-7 text-black sm:px-7 sm:py-8">
              <p className="font-display text-[clamp(2.75rem,8vw,4rem)] font-extrabold leading-none tracking-[-0.06em]">
                21+
              </p>
              <p className="mt-3 font-display text-lg font-bold tracking-tight sm:text-xl">
                Nicotine products are for adults 21+ only.
              </p>
              <p className="mt-2 font-body text-sm leading-relaxed text-black/60">
                You must be of legal age to contact us about UMAXES products.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </SupportShell>
  );
}
