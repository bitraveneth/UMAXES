import Image from "next/image";
import { Noto_Sans_SC } from "next/font/google";
import { heroBanner, logos } from "@/lib/assets";

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
      className={`${notoSc.variable} geo-china relative flex min-h-dvh flex-col overflow-hidden text-white`}
      style={{
        fontFamily: "var(--font-noto-sc), var(--font-poppins), sans-serif",
      }}
    >
      <div className="absolute inset-0">
        <Image
          src={heroBanner}
          alt=""
          fill
          priority
          sizes="100vw"
          className="geo-china-bg object-cover object-center"
        />
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(105deg, rgba(8,16,32,0.88) 0%, rgba(8,16,32,0.72) 42%, rgba(8,16,32,0.35) 68%, rgba(8,16,32,0.55) 100%)",
          }}
        />
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-2/5"
          style={{
            background:
              "linear-gradient(to top, rgba(6,12,24,0.9), transparent)",
          }}
        />
      </div>

      <div className="relative z-[1] flex flex-1 flex-col justify-center px-6 py-16 sm:px-10 lg:px-16">
        <div className="max-w-xl">
          <div className="geo-china-rise relative mb-8 h-10 w-[10.5rem]">
            <Image
              src={logos.blueWordmarkOnDark}
              alt="UMAXES"
              fill
              className="object-contain object-left"
              sizes="168px"
              priority
            />
          </div>

          <p className="geo-china-rise geo-china-d1 text-[0.72rem] font-semibold tracking-[0.28em] text-sky-300/90 uppercase">
            地区限制 · Region
          </p>

          <h1 className="geo-china-rise geo-china-d2 mt-4 font-display text-[2rem] font-bold leading-[1.15] tracking-[-0.03em] sm:text-[2.75rem]">
            抱歉，当前地区暂无法访问
          </h1>

          <p className="geo-china-rise geo-china-d3 mt-3 max-w-md text-[1.05rem] font-medium leading-relaxed text-white/90">
            This UMAXES experience is not available in your region.
          </p>

          <p className="geo-china-rise geo-china-d4 mt-5 max-w-md text-[0.95rem] leading-relaxed text-white/65">
            我们的线上体验面向授权市场。若您误达此页，请从可用地区重新访问，或通过下方邮箱与我们联系。
          </p>

          <div className="geo-china-rise geo-china-d5 mt-10">
            <a
              href="mailto:info@umaxesvape.com"
              className="inline-flex items-center justify-center rounded-xl bg-white px-5 py-3 text-sm font-semibold text-[#0b1220] transition duration-300 hover:bg-sky-100 hover:shadow-[0_12px_40px_rgba(56,189,248,0.25)]"
            >
              联系我们 · info@umaxesvape.com
            </a>
          </div>
        </div>
      </div>

      <footer className="relative z-[1] border-t border-white/10 px-6 py-4 sm:px-10">
        <p className="text-[0.7rem] leading-relaxed text-white/40">
          仅限 21 岁及以上成人 · 尼古丁具有成瘾性
          <span className="mx-2 text-white/20">·</span>
          Adults 21+ only · Nicotine is an addictive chemical
        </p>
      </footer>

      <style>{`
        .geo-china-bg {
          transform: scale(1.04);
          animation: geo-ken 28s ease-in-out infinite alternate;
        }
        .geo-china-rise {
          opacity: 0;
          animation: geo-rise 0.85s ease forwards;
        }
        .geo-china-d1 { animation-delay: 0.1s; }
        .geo-china-d2 { animation-delay: 0.18s; }
        .geo-china-d3 { animation-delay: 0.26s; }
        .geo-china-d4 { animation-delay: 0.34s; }
        .geo-china-d5 { animation-delay: 0.42s; }
        @keyframes geo-rise {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes geo-ken {
          from { transform: scale(1.04) translate3d(0, 0, 0); }
          to { transform: scale(1.1) translate3d(-1.5%, -1%, 0); }
        }
        @media (prefers-reduced-motion: reduce) {
          .geo-china-bg,
          .geo-china-rise {
            animation: none !important;
            opacity: 1 !important;
            transform: none !important;
          }
        }
      `}</style>
    </main>
  );
}
