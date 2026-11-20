import Image from "next/image";
import { Noto_Sans_SC } from "next/font/google";
import { logos } from "@/lib/assets";
import { SITE_CONTACT_EMAIL } from "@/lib/site";

export const metadata = {
  title: "地区暂不可用 · Access unavailable · UMAXES",
  robots: { index: false, follow: false },
};

const notoSc = Noto_Sans_SC({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-noto-sc",
  display: "swap",
});

export default function UnauthorizedPage() {
  return (
    <main
      lang="zh-CN"
      className={`${notoSc.variable} flex min-h-dvh flex-col bg-umx-cream px-5 py-12 text-black sm:px-8`}
      style={{
        fontFamily: "var(--font-noto-sc), var(--font-poppins), sans-serif",
      }}
    >
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center">
        <div className="relative mb-8 h-9 w-[9.5rem]">
          <Image
            src={logos.blueWordmark}
            alt="UMAXES"
            fill
            className="object-contain object-center"
            sizes="152px"
            priority
          />
        </div>

        <div className="w-full rounded-[1.5rem] bg-white px-7 py-10 text-center shadow-[0_16px_48px_rgba(0,0,0,0.08)] ring-1 ring-black/8 sm:px-10 sm:py-12">
          <p className="font-display text-[0.68rem] font-semibold tracking-[0.22em] text-black/40 uppercase">
            地区限制 · Region
          </p>
          <h1 className="mt-4 font-display text-[1.65rem] font-extrabold leading-[1.2] tracking-[-0.03em] sm:text-[2rem]">
            抱歉，当前地区暂无法访问
          </h1>
          <p className="mt-4 font-body text-base leading-relaxed text-black/70">
            This UMAXES experience is not available in your region.
          </p>
          <p className="mt-3 font-body text-sm leading-relaxed text-black/55">
            我们的线上体验面向授权市场。若您误达此页，请从可用地区重新访问，或通过邮箱与我们联系。
          </p>
          <a
            href={`mailto:${SITE_CONTACT_EMAIL}`}
            className="mt-8 inline-flex items-center justify-center rounded-full bg-black px-5 py-3 font-display text-sm font-semibold text-umx-cream transition hover:bg-black/80"
          >
            {SITE_CONTACT_EMAIL}
          </a>
        </div>
      </div>

      <p className="mx-auto mt-10 max-w-lg text-center font-display text-[0.65rem] leading-relaxed tracking-wide text-black/40">
        仅限 21 岁及以上成人 · 尼古丁具有成瘾性
        <span className="mx-2 text-black/20">·</span>
        Adults 21+ only · Nicotine is an addictive chemical
      </p>
    </main>
  );
}
