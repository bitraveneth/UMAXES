"use client";

import Image from "next/image";
import { useCompactMobileStoreChrome } from "@/hooks/useStoreChrome";
import { productStoryImages } from "@/lib/assets";

/**
 * One complete artwork per section, full width, native aspect — no crop.
 * Cream page chrome meets the first panel flush so a black bar never shows.
 */
export default function ProductStoryImages() {
  const compact = useCompactMobileStoreChrome();

  return (
    <section
      id="product-story"
      className={`relative w-full bg-umx-cream ${
        compact ? "pt-0 lg:pt-[6.8rem]" : "pt-[6.75rem] sm:pt-[6.8rem]"
      }`}
      aria-label="HOOKAMAX product story"
    >
      {productStoryImages.map((src, i) => (
        <div key={src} className="relative w-full leading-none">
          <Image
            src={src}
            alt=""
            width={1920}
            height={i === 0 ? 1011 : 1080}
            className="h-auto w-full"
            sizes="100vw"
            quality={88}
            priority={i === 0}
          />
        </div>
      ))}
    </section>
  );
}
