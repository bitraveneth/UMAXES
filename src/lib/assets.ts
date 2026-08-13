export const heroImages = [
  "/images/hero/01.webp",
  "/images/hero/02.webp",
  "/images/hero/03.webp",
  "/images/hero/04.webp",
] as const;

export const productImages = [
  "/images/product/01.webp",
  "/images/product/02.webp",
  "/images/product/03.webp",
  "/images/product/04.webp",
  "/images/product/05.webp",
  "/images/product/06.webp",
  "/images/product/07.webp",
  "/images/product/08.webp",
  "/images/product/09.webp",
  "/images/product/10.webp",
] as const;

export const productPackImages = [
  "/images/product/pack-01.webp",
  "/images/product/pack-02.webp",
  "/images/product/pack-03.webp",
  "/images/product/pack-04.webp",
  "/images/product/pack-05.webp",
  "/images/product/pack-06.webp",
  "/images/product/pack-07.webp",
  "/images/product/pack-08.webp",
  "/images/product/pack-09.webp",
  "/images/product/pack-10.webp",
] as const;

export const testimonialImages = [
  "/images/testimonials/01.webp",
  "/images/testimonials/02.webp",
  "/images/testimonials/03.webp",
  "/images/testimonials/04.webp",
  "/images/testimonials/05.webp",
  "/images/testimonials/06.webp",
  "/images/testimonials/07.webp",
  "/images/testimonials/08.webp",
] as const;

export const logos = {
  orangeOnCream: "/images/logo/orange-on-cream.png",
  creamOnInk: "/images/logo/cream-on-ink.png",
  creamOnOrange: "/images/logo/cream-on-orange.png",
  orangeTransparent: "/images/logo/orange-transparent.png",
  creamTransparent: "/images/logo/cream-transparent.png",
  markOrange: "/images/logo/umaxes-mark-orange.png",
  markCream: "/images/logo/umaxes-mark-cream.png",
} as const;

export const product = {
  name: "HOOKAMAX",
  price: 29,
  currency: "USD",
  tagline: "Premium hookah-inspired disposables.",
  deviceImage: "/images/product/device-transparent.png",
  deviceDuoImage: "/images/product/device-duo.webp",
  featuresHero: "/images/product/features-hero.webp",
} as const;

/** Full-bleed detail panels after Specs (shared on every flavor page) */
export const productStoryImages = [
  "/images/product/story/01.webp",
  "/images/product/story/02.webp",
  "/images/product/story/03.webp",
  "/images/product/story/04.webp",
  "/images/product/story/05.webp",
  "/images/product/story/06.webp",
] as const;

/** Puff count options available on every flavor when ordering */
export const PUFF_OPTIONS = ["80K", "50K"] as const;
export type PuffOption = (typeof PUFF_OPTIONS)[number];
export const DEFAULT_PUFF_OPTION: PuffOption = "80K";

export function isPuffOption(value: unknown): value is PuffOption {
  return PUFF_OPTIONS.includes(value as PuffOption);
}

export const productSpecs = [
  {
    id: "puffs",
    value: "50K / 80K",
    label: "Puffs",
    icon: "puffs",
  },
  {
    id: "eliquid",
    value: "40ML",
    label: "E-liquid",
    icon: "drop",
  },
  {
    id: "coil",
    value: "LIT MESH",
    label: "Coil",
    icon: "mesh",
  },
  {
    id: "indicator",
    value: "BATTERY & LIQUID",
    label: "Capacity Indicator",
    icon: "indicator",
  },
  {
    id: "nicotine",
    value: "0.35%",
    label: "Nicotine",
    icon: "nicotine",
  },
  {
    id: "resistance",
    value: "0.6Ω",
    label: "Resistance",
    icon: "coil",
  },
  {
    id: "airflow",
    value: "MTL/DL",
    label: "Airflow",
    icon: "airflow",
  },
  {
    id: "battery",
    value: "1300mAh",
    label: "Rechargeable",
    icon: "battery",
  },
] as const;

export const flavorProfiles = [
  "Tropical",
  "Ice",
  "Berry",
  "Mint",
  "Candy",
] as const;

export type FlavorProfile = (typeof flavorProfiles)[number];

export const flavors = [
  {
    id: "peach-mango",
    name: "Peach Mango",
    tagline: "Juicy stone fruit · Tropical",
    description: "Ripe peach meets sweet mango in a smooth, sunny draw.",
    image: "/images/product/01.webp",
    price: 29,
    profile: "Tropical",
    accent: "#e8891a",
  },
  {
    id: "watermelon-ice",
    name: "Watermelon Ice",
    tagline: "Fresh melon · Cool finish",
    description: "Crisp watermelon with a chilled, refreshing exhale.",
    image: "/images/product/02.webp",
    price: 29,
    profile: "Ice",
    accent: "#e05a6a",
  },
  {
    id: "fcuking-fab",
    name: "Fcuking Fab",
    tagline: "Bold mix · Candy bright",
    description: "A playful peach-citrus blend with candy-sweet energy.",
    image: "/images/product/03.webp",
    price: 32,
    profile: "Candy",
    accent: "#f06aa8",
  },
  {
    id: "strawberry-watermelon-ice",
    name: "Strawberry Watermelon Ice",
    tagline: "Berry · Melon · Ice",
    description: "Strawberry and watermelon layered with a cool kick.",
    image: "/images/product/04.webp",
    price: 32,
    profile: "Berry",
    accent: "#d6455d",
  },
  {
    id: "miami-sunset",
    name: "Miami Sunset",
    tagline: "Tropical blend · Warm glow",
    description: "Citrus and tropical fruit in a warm sunset profile.",
    image: "/images/product/05.webp",
    price: 29,
    profile: "Tropical",
    accent: "#ff7a33",
  },
  {
    id: "cool-mint",
    name: "Cool Mint",
    tagline: "Crisp · Clean · Icy",
    description: "Pure mint clarity with a sharp, cooling finish.",
    image: "/images/product/06.webp",
    price: 27,
    profile: "Mint",
    accent: "#2f8f7b",
  },
  {
    id: "blue-razz-ice",
    name: "Blue Razz Ice",
    tagline: "Blue raspberry · Frost",
    description: "Tangy blue raspberry wrapped in cool ice notes.",
    image: "/images/product/07.webp",
    price: 32,
    profile: "Ice",
    accent: "#3b6fd9",
  },
  {
    id: "grape-ice",
    name: "Grape Ice",
    tagline: "Ripe grape · Chill",
    description: "Classic grape sweetness with a frosty edge.",
    image: "/images/product/08.webp",
    price: 29,
    profile: "Ice",
    accent: "#7a3db8",
  },
  {
    id: "blueberry-ice",
    name: "Blueberry Ice",
    tagline: "Deep berry · Cool",
    description: "Lush blueberry flavor with a refreshing ice finish.",
    image: "/images/product/09.webp",
    price: 35,
    profile: "Berry",
    accent: "#3d5aab",
  },
] as const;

export type Flavor = (typeof flavors)[number];
export type FlavorId = Flavor["id"];

export function getFlavor(id: string) {
  return flavors.find((f) => f.id === id);
}
