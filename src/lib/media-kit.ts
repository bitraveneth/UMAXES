/** Dealer media kit — logos, colors, and POS files for approved buyers. */

export type MediaKitFile = {
  id: string;
  title: string;
  description: string;
  category: "logo" | "color" | "pos" | "guide";
  /** Public URL under /public */
  fileUrl: string;
  /** Suggested download filename */
  downloadName: string;
  /** Preview image (same as file for images; null for css/json) */
  previewUrl?: string | null;
  /** Preview tile background for transparent logos */
  previewBg?: "cream" | "ink" | "orange" | "white";
  format: string;
};

export const BRAND_COLORS = [
  {
    name: "Black",
    role: "Primary · CTAs & accents",
    hex: "#111111",
    css: "--umx-orange",
  },
  {
    name: "Ivory cream",
    role: "Canvas · backgrounds",
    hex: "#F7F4EE",
    css: "--umx-cream",
  },
  {
    name: "Ink",
    role: "Hover / pressed",
    hex: "#000000",
    css: "--umx-orange-deep",
  },
  {
    name: "Charcoal",
    role: "Dark surfaces",
    hex: "#000000",
    css: "--umx-orange-ink",
  },
  {
    name: "Cream bright",
    role: "Cards · light UI",
    hex: "#FBFBFB",
    css: "--umx-cream-bright",
  },
  {
    name: "Body black",
    role: "Body text",
    hex: "#000000",
    css: "--umx-black",
  },
] as const;

export const MEDIA_KIT_LOGOS: MediaKitFile[] = [
  {
    id: "logo-orange-cream",
    title: "Logo — orange on cream",
    description: "Primary lockup for light backgrounds and print.",
    category: "logo",
    fileUrl: "/images/logo/orange-on-cream.png",
    downloadName: "umaxes-logo-orange-on-cream.png",
    previewUrl: "/images/logo/orange-on-cream.png",
    previewBg: "cream",
    format: "PNG",
  },
  {
    id: "logo-cream-ink",
    title: "Logo — cream on ink",
    description: "Inverse lockup for dark / ink backgrounds.",
    category: "logo",
    fileUrl: "/images/logo/cream-on-ink.png",
    downloadName: "umaxes-logo-cream-on-ink.png",
    previewUrl: "/images/logo/cream-on-ink.png",
    previewBg: "ink",
    format: "PNG",
  },
  {
    id: "logo-cream-orange",
    title: "Logo — cream on orange",
    description: "Action lockup for orange panels and campaigns.",
    category: "logo",
    fileUrl: "/images/logo/cream-on-orange.png",
    downloadName: "umaxes-logo-cream-on-orange.png",
    previewUrl: "/images/logo/cream-on-orange.png",
    previewBg: "orange",
    format: "PNG",
  },
  {
    id: "logo-svg",
    title: "Logo — SVG (orange)",
    description: "Scalable vector for web and large format.",
    category: "logo",
    fileUrl: "/images/logo/umaxes-orange.svg",
    downloadName: "umaxes-logo-orange.svg",
    previewUrl: "/images/logo/umaxes-orange.svg",
    previewBg: "cream",
    format: "SVG",
  },
  {
    id: "logo-transparent",
    title: "Logo — transparent PNG",
    description: "Orange wordmark on transparent background.",
    category: "logo",
    fileUrl: "/images/logo/orange-transparent.png",
    downloadName: "umaxes-logo-orange-transparent.png",
    previewUrl: "/images/logo/orange-transparent.png",
    previewBg: "cream",
    format: "PNG",
  },
  {
    id: "mark-orange",
    title: "Mark — orange",
    description: "Compact mark for avatars and small placements.",
    category: "logo",
    fileUrl: "/images/logo/umaxes-mark-orange.png",
    downloadName: "umaxes-mark-orange.png",
    previewUrl: "/images/logo/umaxes-mark-orange.png",
    previewBg: "cream",
    format: "PNG",
  },
];

export const MEDIA_KIT_POS: MediaKitFile[] = [
  {
    id: "pos-pack",
    title: "HOOKAMAX pack shot",
    description: "Product pack imagery for menus and POS.",
    category: "pos",
    fileUrl: "/images/product/pack-01.webp",
    downloadName: "umaxes-pack-shot.webp",
    previewUrl: "/images/product/pack-01.webp",
    previewBg: "cream",
    format: "WEBP",
  },
  {
    id: "pos-device",
    title: "Device duo",
    description: "Lifestyle device visual for displays.",
    category: "pos",
    fileUrl: "/images/product/device-duo.webp",
    downloadName: "umaxes-device-duo.webp",
    previewUrl: "/images/product/device-duo.webp",
    previewBg: "cream",
    format: "WEBP",
  },
  {
    id: "pos-device-clear",
    title: "Device — transparent",
    description: "Product cutout for overlays and flyers.",
    category: "pos",
    fileUrl: "/images/product/device-transparent.png",
    downloadName: "umaxes-device-transparent.png",
    previewUrl: "/images/product/device-transparent.png",
    previewBg: "cream",
    format: "PNG",
  },
];

export const MEDIA_KIT_TOKENS: MediaKitFile[] = [
  {
    id: "colors-json",
    title: "Brand colors — JSON",
    description: "Hex values and CSS variable names for design tools.",
    category: "color",
    fileUrl: "/brand/umaxes-colors.json",
    downloadName: "umaxes-colors.json",
    previewUrl: null,
    format: "JSON",
  },
  {
    id: "colors-css",
    title: "Brand colors — CSS",
    description: "CSS custom properties ready to drop into a project.",
    category: "color",
    fileUrl: "/brand/umaxes-colors.css",
    downloadName: "umaxes-colors.css",
    previewUrl: null,
    format: "CSS",
  },
];
