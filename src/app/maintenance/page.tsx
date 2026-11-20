import Link from "next/link";
import Image from "next/image";
import { logos } from "@/lib/assets";
import { getSiteSettings } from "@/lib/site-settings";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Maintenance · UMAXES",
  description: "UMAXES is temporarily unavailable for maintenance.",
};

export default async function MaintenancePage() {
  const settings = await getSiteSettings();
  if (!settings.maintenanceMode) {
    redirect("/");
  }

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#0b1220] px-6 py-16 text-center text-white">
      <div
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(59,130,246,0.35), transparent 55%), radial-gradient(ellipse 60% 40% at 80% 100%, rgba(14,165,233,0.12), transparent 50%)",
        }}
      />
      <div className="relative z-10 mx-auto max-w-lg">
        <div className="mx-auto mb-8 h-10 w-44">
          <Image
            src={logos.blueWordmarkOnDark}
            alt="UMAXES"
            width={176}
            height={40}
            className="h-10 w-auto object-contain"
            priority
          />
        </div>
        <p className="text-xs font-semibold tracking-[0.2em] text-sky-300/90 uppercase">
          Maintenance
        </p>
        <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          We’ll be right back
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-white/65 sm:text-base">
          The storefront is briefly offline while we update the site. Staff can
          still sign in to ops.
        </p>
        <Link
          href="/login"
          className="mt-8 inline-flex items-center justify-center rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-[#0b1220] transition hover:bg-sky-100"
        >
          Staff sign in
        </Link>
      </div>
    </main>
  );
}
