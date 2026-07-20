export const heroImages = [
  "/images/hero/01.png",
  "/images/hero/02.png",
  "/images/hero/03.png",
  "/images/hero/04.png",
] as const;

export const productImages = [
  "/images/product/01.png",
  "/images/product/02.png",
  "/images/product/03.png",
  "/images/product/04.png",
  "/images/product/05.png",
  "/images/product/06.png",
  "/images/product/07.png",
  "/images/product/08.png",
  "/images/product/09.png",
  "/images/product/10.png",
] as const;

export const testimonialImages = [
  "/images/testimonials/01.png",
  "/images/testimonials/02.png",
  "/images/testimonials/03.png",
  "/images/testimonials/04.png",
] as const;

export const logos = {
  orangeOnCream: "/images/logo/orange-on-cream.png",
  creamOnInk: "/images/logo/cream-on-ink.png",
  creamOnOrange: "/images/logo/cream-on-orange.png",
  orangeTransparent: "/images/logo/orange-transparent.png",
} as const;

export const product = {
  name: "HOOKAMAX",
  price: 29,
  currency: "USD",
  tagline: "Premium hookah-inspired disposables.",
  deviceImage: "/images/product/device-transparent.png",
} as const;

export const productSpecs = [
  {
    id: "puffs",
    value: "40K(MTL)/20K(DL)",
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

export const flavors = [
  {
    id: "peach-mango",
    name: "Peach Mango",
    tagline: "Juicy stone fruit · Tropical",
    description: "Ripe peach meets sweet mango in a smooth, sunny draw.",
    image: "/images/product/01.png",
    price: 29,
    accent: "#e8891a",
  },
  {
    id: "watermelon-ice",
    name: "Watermelon Ice",
    tagline: "Fresh melon · Cool finish",
    description: "Crisp watermelon with a chilled, refreshing exhale.",
    image: "/images/product/02.png",
    price: 29,
    accent: "#e05a6a",
  },
  {
    id: "fcuking-fab",
    name: "Fcuking Fab",
    tagline: "Bold mix · Candy bright",
    description: "A playful peach-citrus blend with candy-sweet energy.",
    image: "/images/product/03.png",
    price: 29,
    accent: "#f06aa8",
  },
  {
    id: "strawberry-watermelon-ice",
    name: "Strawberry Watermelon Ice",
    tagline: "Berry · Melon · Ice",
    description: "Strawberry and watermelon layered with a cool kick.",
    image: "/images/product/04.png",
    price: 29,
    accent: "#d6455d",
  },
  {
    id: "miami-sunset",
    name: "Miami Sunset",
    tagline: "Tropical blend · Warm glow",
    description: "Citrus and tropical fruit in a warm sunset profile.",
    image: "/images/product/05.png",
    price: 29,
    accent: "#ff7a33",
  },
  {
    id: "cool-mint",
    name: "Cool Mint",
    tagline: "Crisp · Clean · Icy",
    description: "Pure mint clarity with a sharp, cooling finish.",
    image: "/images/product/06.png",
    price: 29,
    accent: "#2f8f7b",
  },
  {
    id: "blue-razz-ice",
    name: "Blue Razz Ice",
    tagline: "Blue raspberry · Frost",
    description: "Tangy blue raspberry wrapped in cool ice notes.",
    image: "/images/product/07.png",
    price: 29,
    accent: "#3b6fd9",
  },
  {
    id: "grape-ice",
    name: "Grape Ice",
    tagline: "Ripe grape · Chill",
    description: "Classic grape sweetness with a frosty edge.",
    image: "/images/product/08.png",
    price: 29,
    accent: "#7a3db8",
  },
  {
    id: "blueberry-ice",
    name: "Blueberry Ice",
    tagline: "Deep berry · Cool",
    description: "Lush blueberry flavor with a refreshing ice finish.",
    image: "/images/product/09.png",
    price: 29,
    accent: "#3d5aab",
  },
] as const;

export type Flavor = (typeof flavors)[number];
export type FlavorId = Flavor["id"];

export function getFlavor(id: string) {
  return flavors.find((f) => f.id === id);
}
