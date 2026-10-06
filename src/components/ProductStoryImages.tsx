"use client";

import Image from "next/image";
import { useCompactMobileStoreChrome } from "@/hooks/useStoreChrome";
import { productStoryImages } from "@/lib/assets";

/**
 * Full-width artworks stacked flush — no crop, no card chrome.
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
            height={1080}
            className="h-auto w-full"
            sizes="100vw"
            quality={75}
            priority={i === 0}
          />
        </div>
      ))}
    </section>
  );
}
