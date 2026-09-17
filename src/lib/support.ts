import { flavors, product } from "@/lib/assets";

export const faqs = [
  {
    q: "Who can buy UMAXES / HOOKAMAX?",
    a: "Only adults 21 years of age or older. Nicotine is an addictive chemical. Keep products out of reach of children and pets.",
    keys: ["age", "21", "adult", "who can", "legal", "buy"],
  },
  {
    q: "What coil and airflow does it use?",
    a: "HOOKAMAX uses a MaxCore™ mesh coil with bottom airflow control, so you can switch between MTL and DTL.",
    keys: ["coil", "mesh", "maxcore", "ohm", "0.6", "airflow", "mtl", "dl", "draw"],
  },
  {
    q: "What nicotine strength is HOOKAMAX?",
    a: "HOOKAMAX is listed at 0.5% nicotine (3.5mg/ml). Nicotine is an addictive chemical — for adults 21+ only.",
    keys: ["nicotine", "nic", "0.5", "3.5", "strength", "addictive"],
  },
  {
    q: "How long does shipping take?",
    a: "About 2–7 business days. You’ll get tracking once the order ships.",
    keys: ["shipping", "delivery", "arrive", "transit", "how long ship", "tracking", "business days"],
  },
  {
    q: "Do you offer coupon codes?",
    a: "Yes. Larger order quantities can qualify for a coupon.",
    keys: ["coupon", "discount", "promo", "code", "sale", "quantity"],
  },
  {
    q: "How do I know my device is authentic?",
    a: "Buy HOOKAMAX from official UMAXES channels. If you have questions about a device, use the Contact Us form with your order details.",
    keys: ["authentic", "authenticity", "verify", "fake", "real"],
  },
  {
    q: "What is your return policy?",
    a: "If there is a quality issue, send evidence (photos or video). UMAXES will contact you to replace it.",
    keys: ["return", "refund", "exchange", "defective", "broken", "warranty", "quality", "replace"],
  },
  {
    q: "How do I contact support?",
    a: "Use the Contact Us form and include your order number so we can help faster. We usually reply within 1–2 business days.",
    keys: ["contact", "email", "support", "help", "reach", "message"],
  },
  {
    q: "What is HOOKAMAX?",
    a: `${product.name} is UMAXES’ premium hookah-inspired disposable line — ${product.tagline} One device family with ${flavors.length} flavor options. Adults 21+ only.`,
    keys: ["what is hookamax", "hookamax", "product", "device", "disposable", "what is umaxes"],
  },
  {
    q: "Where can I shop?",
    a: "Shop HOOKAMAX on the UMAXES Shop page (/shop). Adults 21+ only.",
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
    return "Ask about HOOKAMAX, shipping, returns, or contact — or tap a quick topic below.";
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

  return "I can help with HOOKAMAX, shipping, coupons, returns, and contact. Try asking “What is HOOKAMAX?” or tap a topic below.";
}
