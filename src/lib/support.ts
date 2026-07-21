import { flavors, flavorProfiles, product, productSpecs } from "@/lib/assets";

export const faqs = [
  {
    q: "Who can buy UMAXES / HOOKAMAX?",
    a: "Only adults 21 years of age or older. Nicotine is an addictive chemical. Keep products out of reach of children and pets.",
    keys: ["age", "21", "adult", "who can", "legal", "buy"],
  },
  {
    q: "How many flavors do you have?",
    a: `HOOKAMAX currently has ${flavors.length} flavors: ${flavors.map((f) => f.name).join(", ")}. Profiles include ${flavorProfiles.join(", ")}.`,
    keys: ["how many flavor", "flavors", "flavour", "how many", "variety", "options"],
  },
  {
    q: "What flavors are available?",
    a: `Available HOOKAMAX flavors: ${flavors.map((f) => `${f.name} ($${f.price})`).join("; ")}. Open the UMAXES Shop to filter by Tropical, Ice, Berry, Mint, or Candy.`,
    keys: ["what flavor", "list flavor", "available flavor", "which flavor", "menu"],
  },
  {
    q: "What are the main HOOKAMAX specs / features?",
    a: `${product.name} key features: ${productSpecs.map((s) => `${s.label} ${s.value}`).join("; ")}. One device line, many flavors — adults 21+ only.`,
    keys: ["spec", "feature", "puff", "battery", "coil", "airflow", "eliquid", "e-liquid", "mesh", "capacity", "what does it"],
  },
  {
    q: "How many puffs does HOOKAMAX have?",
    a: "HOOKAMAX is rated about 40K puffs in MTL mode and about 20K puffs in DL mode, depending on draw style and settings.",
    keys: ["puff", "hits", "how long last", "lasting"],
  },
  {
    q: "What is the battery and e-liquid capacity?",
    a: "HOOKAMAX includes a 1300mAh rechargeable battery and about 40ML of e-liquid, with battery and liquid capacity indicators on the device.",
    keys: ["battery", "1300", "40ml", "e-liquid", "eliquid", "recharge", "charge", "indicator"],
  },
  {
    q: "What coil and airflow does it use?",
    a: "HOOKAMAX uses a LIT MESH coil at 0.6Ω with dual MTL/DL airflow, so you can switch between tighter and more open draws.",
    keys: ["coil", "mesh", "ohm", "0.6", "airflow", "mtl", "dl", "draw"],
  },
  {
    q: "What nicotine strength is HOOKAMAX?",
    a: "HOOKAMAX is listed at 0.35% nicotine. Nicotine is an addictive chemical — for adults 21+ only.",
    keys: ["nicotine", "nic", "0.35", "strength", "addictive"],
  },
  {
    q: "How much does HOOKAMAX cost?",
    a: (() => {
      const min = Math.min(...flavors.map((f) => f.price));
      const max = Math.max(...flavors.map((f) => f.price));
      return `HOOKAMAX flavors start at $${min} and go up to $${max}, depending on the flavor. Browse UMAXES Shop for current prices.`;
    })(),
    keys: ["price", "pricing", "cost", "how much", "expensive", "cheap", "dollar"],
  },
  {
    q: "Is there free shipping?",
    a: "Standard shipping is free on orders $75+. Express shipping is available at checkout for faster delivery.",
    keys: ["free shipping", "shipping cost", "delivery fee", "$75", "express"],
  },
  {
    q: "How long does shipping take?",
    a: "Most domestic orders ship within 1–3 business days. Standard delivery is about 5–7 business days; express is about 2–3 business days. You’ll get tracking once the order ships.",
    keys: ["shipping", "delivery", "arrive", "transit", "how long ship", "tracking"],
  },
  {
    q: "Do you offer coupon codes?",
    a: "Yes — try demo codes UMAXES10 (10% off), WELCOME5 ($5 off), or SAVE15 (15% off) at checkout. Offers may change.",
    keys: ["coupon", "discount", "promo", "code", "umaxes10", "welcome5", "save15", "sale"],
  },
  {
    q: "How do I know my device is authentic?",
    a: "Use Product Verification with the code on your packaging or device. Enter it on the verify page (/support/verify) to confirm it came through official UMAXES channels.",
    keys: ["authentic", " authenticity", "verify", "fake", "real", "code", "scratch"],
  },
  {
    q: "What is your return policy?",
    a: "Unopened products in original packaging may be eligible for return within 14 days of delivery. Defective devices should be reported to support with your order number and verification code.",
    keys: ["return", "refund", "exchange", "defective", "broken", "warranty"],
  },
  {
    q: "How do I contact support?",
    a: "Email support@umaxes.com or use the Contact Us form. Include your order number and, if relevant, your product verification code so we can help faster. We usually reply within 1–2 business days.",
    keys: ["contact", "email", "support", "help", "reach", "message"],
  },
  {
    q: "What is HOOKAMAX?",
    a: `${product.name} is UMAXES’ premium hookah-inspired disposable line — ${product.tagline} One device family with ${flavors.length} flavor options. Adults 21+ only.`,
    keys: ["what is hookamax", "hookamax", "product", "device", "disposable", "what is umaxes"],
  },
  {
    q: "Where can I shop?",
    a: "Shop all HOOKAMAX flavors on the UMAXES Shop page (/shop). You can filter by profile and price, then checkout when ready. Adults 21+ only.",
    keys: ["shop", "store", "order", "purchase", "buy online", "catalog"],
  },
  {
    q: "Is nicotine addictive / is this safe for everyone?",
    a: "Nicotine is an addictive chemical. UMAXES products are only for adults 21+. Keep out of reach of children and pets. If you have health concerns, talk with a medical professional.",
    keys: ["safe", "health", "addictive", "kids", "children", "pet", "warning"],
  },
] as const;

export type SupportFaq = (typeof faqs)[number];

/** Score a user question against FAQ keys / question text. */
export function findSupportAnswer(query: string): string {
  const q = query.toLowerCase().trim();
  if (!q) {
    return "Ask about flavors, features, pricing, shipping, authenticity, or contact — or tap a quick topic below.";
  }

  let best: { score: number; a: string } | null = null;

  for (const item of faqs) {
    let score = 0;
    const qText = item.q.toLowerCase();
    if (qText === q || q.includes(qText) || qText.includes(q)) score += 8;

    for (const key of item.keys) {
      if (q.includes(key)) score += key.length > 6 ? 4 : 3;
    }

    // light word overlap on the answer/question
    for (const word of q.split(/\s+/)) {
      if (word.length < 4) continue;
      if (qText.includes(word)) score += 1;
      if (item.a.toLowerCase().includes(word)) score += 0.5;
    }

    if (!best || score > best.score) best = { score, a: item.a };
  }

  if (best && best.score >= 3) return best.a;

  return `I can help with how many flavors we have (${flavors.length}), HOOKAMAX features, pricing, shipping, coupons, authenticity checks, returns, and contact info. Try asking “How many flavors?” or tap a topic below — or email support@umaxes.com.`;
}
