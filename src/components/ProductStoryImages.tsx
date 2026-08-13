import Image from "next/image";
import { productStoryImages } from "@/lib/assets";

/** Full-bleed marketing panels after Specs — designed as images, no CSS recreation */
export default function ProductStoryImages() {
  return (
    <section
      id="product-story"
      className="w-full bg-black"
      aria-label="HOOKAMAX product story"
    >
      {productStoryImages.map((src, i) => (
        <div key={src} className="relative w-full leading-none">
          <Image
            src={src}
            alt={`HOOKAMAX product details ${i + 1}`}
            width={1920}
            height={2400}
            className="h-auto w-full"
            sizes="100vw"
            quality={75}
            loading={i === 0 ? "eager" : "lazy"}
          />
        </div>
      ))}
    </section>
  );
}
