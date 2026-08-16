export type BlogPost = {
  slug: string;
  category: "News" | "Events";
  title: string;
  excerpt: string;
  date: string;
  dateLabel: string;
  image: string;
  body: string[];
};

export const blogPosts: BlogPost[] = [
  {
    slug: "hookamax-flavor-drop",
    category: "News",
    title: "HOOKAMAX: 80K puffs, 10 flavors",
    excerpt:
      "Stellar vapor. Diamond glow. Ten profiles on one HOOKAMAX device — Peach Mango to Exotic Kiwi.",
    date: "2026-08-15",
    dateLabel: "Aug 15, 2026",
    image: "/images/hero/01.webp",
    body: [
      "UMAXES HOOKAMAX is built for long sessions: up to 80K puffs, stellar vapor, and diamond glow — crafted exclusively for the HOOKAMAX line.",
      "The lineup is ten flavors: Peach Mango, Watermelon Ice, Fantasy Tea, Strawberry Watermelon Ice, Mixed Berries, Cool Mint, Blue Razz Ice, Grape Ice, Blueberry Ice, and Exotic Kiwi.",
      "Shop HOOKAMAX online. For adults 21+ only. Nicotine is an addictive chemical.",
    ],
  },
  {
    slug: "summer-session-nights",
    category: "Events",
    title: "Dual airflow. Double the experience.",
    excerpt:
      "DTL at 50K puffs or MTL at 80K — plus ARGB 7-color light. HOOKAMAX lets you pick the draw and light up every moment.",
    date: "2026-08-12",
    dateLabel: "Aug 12, 2026",
    image: "/images/hero/02.webp",
    body: [
      "HOOKAMAX dual airflow gives two ways to draw: DTL (direct to lung) rated about 50K puffs, or MTL (mouth to lung) rated about 80K puffs — double the experience on one device.",
      "ARGB 7-color light and dynamic glow sit at the base so every session can light up. Power comes from a 1600mAh rechargeable battery with Type-C charging and stable output.",
      "Adults 21+ only. Nicotine is an addictive chemical. Bring ID wherever HOOKAMAX is shown in person.",
    ],
  },
  {
    slug: "why-mesh-matters",
    category: "News",
    title: "MaxCore™ — the vaporization system inside HOOKAMAX",
    excerpt:
      "A full-stack vaporization control system: consistent heat, richer flavor, and dense vapor from first puff to last.",
    date: "2026-08-08",
    dateLabel: "Aug 8, 2026",
    image: "/images/hero/03.webp",
    body: [
      "At the heart of HOOKAMAX is MaxCore™ — our proprietary mesh coil technology and full-stack vaporization control system.",
      "Unlike conventional coils, MaxCore™ uses a mesh heating structure for more even heat across the coil surface. The result is a balanced mix of flavor, vapor, and consistency.",
      "Read the full MaxCore™ story on the technology page, or open any HOOKAMAX product for adults 21+. Nicotine is an addictive chemical.",
    ],
  },
];

export function getPost(slug: string) {
  return blogPosts.find((p) => p.slug === slug);
}
