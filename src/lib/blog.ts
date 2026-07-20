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
    title: "HOOKAMAX flavor drop: nine profiles, one ritual",
    excerpt:
      "From Peach Mango to Blue Razz Ice — the full lineup is live, built for adults who want hookah depth in a disposable.",
    date: "2026-06-18",
    dateLabel: "Jun 18, 2026",
    image: "/images/hero/01.png",
    body: [
      "HOOKAMAX arrives with nine flavor profiles tuned for long sessions — juicy stone fruit, iced classics, and night-out mixes that stay rich from first draw to last.",
      "Each device pairs a 40ML tank with LIT MESH and dual MTL/DL airflow, so you get the ritual without the hookah setup.",
      "Shop the full lineup online. For adults 21+ only. Nicotine is an addictive chemical.",
    ],
  },
  {
    slug: "summer-session-nights",
    category: "Events",
    title: "Summer Session Nights — city pop-ups",
    excerpt:
      "Limited adult-only tasting evenings across select cities. RSVP for flavor flights and early access drops.",
    date: "2026-07-02",
    dateLabel: "Jul 2, 2026",
    image: "/images/hero/02.png",
    body: [
      "This summer we’re hosting intimate Session Nights — adult-only (21+) pop-ups with flavor flights, merch, and early access to seasonal drops.",
      "Expect a lounge atmosphere, not a trade-show floor. Bring ID. Spaces are limited.",
      "Follow UMAXES for city dates and RSVP links as they go live.",
    ],
  },
  {
    slug: "why-mesh-matters",
    category: "News",
    title: "Why LIT MESH matters for every puff",
    excerpt:
      "Even heat, cleaner taste, and consistency that holds across 40K MTL puffs — a closer look at the coil.",
    date: "2026-05-28",
    dateLabel: "May 28, 2026",
    image: "/images/hero/03.png",
    body: [
      "LIT MESH is built for even heat and a smoother draw — the difference you feel when flavor doesn’t fade halfway through the device.",
      "Paired with 0.6Ω resistance and a 1300mAh rechargeable battery, HOOKAMAX is tuned for adults who notice the details.",
      "Explore Key Features on any product page for the full spec stack.",
    ],
  },
];

export function getPost(slug: string) {
  return blogPosts.find((p) => p.slug === slug);
}
