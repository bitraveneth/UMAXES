import { flavors, product, PUFF_OPTIONS } from "@/lib/assets";
import { SITE_CONTACT_EMAIL } from "@/lib/site";

export type SupportFaq = {
  q: string;
  a: string;
  keys: readonly string[];
};

const FLAVOR_LIST = flavors.map((f) => f.name).join(", ");

/** Topics we never answer in chat — steer to email. */
const PRIVATE_TOPIC_PATTERN =
  /\b(price|pricing|prices|cost|costs|quote|quotes|wholesale\s*price|how\s*much|\$|usd|dollar|margin|discount\s*rate|net\s*price|list\s*price|unit\s*price|per\s*case\s*price|invoice\s*amount)\b/i;

export function isPrivateSupportTopic(query: string): boolean {
  return PRIVATE_TOPIC_PATTERN.test(query);
}

export function privateTopicEmailReply(): string {
  return `For pricing and other account-private details, please email ${SITE_CONTACT_EMAIL} with your company name and what you need. We’ll reply from there — this chat stays on product FAQ and how HOOKAMAX works.`;
}

export const faqs: SupportFaq[] = [
  {
    q: "Who can buy UMAXES / HOOKAMAX?",
    a: "Only adults 21 years of age or older. Nicotine is an addictive chemical. Keep products out of reach of children and pets.",
    keys: ["age", "21", "adult", "who can", "legal", "buy"],
  },
  {
    q: "What flavors / variations are available?",
    a: `HOOKAMAX flavors: ${FLAVOR_LIST}. Each flavor is the same device family — pick the taste that fits your customers. Puff options: ${PUFF_OPTIONS.join(" / ")}.`,
    keys: [
      "flavor",
      "flavors",
      "variation",
      "variations",
      "options",
      "taste",
      "sku",
      "lineup",
      "which flavors",
      "puff",
      "80k",
      "50k",
    ],
  },
  {
    q: "What coil and airflow does it use?",
    a: "HOOKAMAX uses a MaxCore™ mesh coil with bottom airflow control, so you can switch between MTL and DTL.",
    keys: ["coil", "mesh", "maxcore", "ohm", "0.6", "airflow", "mtl", "dl", "draw", "feature", "features"],
  },
  {
    q: "What nicotine strength is HOOKAMAX?",
    a: "HOOKAMAX is listed at 0.5% nicotine (5mg/ml). Nicotine is an addictive chemical — for adults 21+ only.",
    keys: ["nicotine", "nic", "0.5", "5", "5mg", "strength", "addictive"],
  },
  {
    q: "How long does shipping take?",
    a: "About 2–7 business days after the order ships. You’ll get tracking once it leaves the warehouse.",
    keys: ["shipping", "delivery", "arrive", "transit", "how long ship", "tracking", "business days"],
  },
  {
    q: "How do I know my device is authentic?",
    a: "Buy HOOKAMAX from official UMAXES channels. If you have questions about a device, email support with your order details.",
    keys: ["authentic", "authenticity", "verify", "fake", "real"],
  },
  {
    q: "What is your return policy?",
    a: "If there is a quality issue, send evidence (photos or video) to support. UMAXES will contact you about replacement.",
    keys: ["return", "refund", "exchange", "defective", "broken", "warranty", "quality", "replace"],
  },
  {
    q: "How do I contact support?",
    a: `Email ${SITE_CONTACT_EMAIL} and include your company and order number when you have one. We usually reply within 1–2 business days.`,
    keys: ["contact", "email", "support", "help", "reach", "message"],
  },
  {
    q: "What is HOOKAMAX?",
    a: `${product.name} is UMAXES’ premium hookah-inspired disposable line — ${product.tagline} One device family with multiple flavor variations. Adults 21+ only.`,
    keys: ["what is hookamax", "hookamax", "product", "device", "disposable", "what is umaxes"],
  },
  {
    q: "How is HOOKAMAX packed?",
    a: "HOOKAMAX is sold by the case. Minimum order is 1 case (95 pieces). On the product page, + / − adds one case at a time — 1 case, 2 cases, and so on.",
    keys: ["case", "pack", "95", "quantity", "pcs", "piece", "carton", "how many", "moq", "packing"],
  },
  {
    q: "Where can I shop?",
    a: "After you sign in, open Shop (/shop) to browse HOOKAMAX flavors and place B2B orders. Adults 21+ only.",
    keys: ["shop", "store", "order", "purchase", "buy online", "catalog"],
  },
  {
    q: "Is nicotine addictive / is this safe for everyone?",
    a: "Nicotine is an addictive chemical. UMAXES products are only for adults 21+. Keep out of reach of children and pets. If you have health concerns, talk with a medical professional.",
    keys: ["safe", "health", "addictive", "kids", "children", "pet", "warning"],
  },
];

/** Score a user question against FAQ keys / question text. */
export function findSupportAnswer(
  query: string,
  items: SupportFaq[] = faqs,
): string {
  const q = query.toLowerCase().trim();
  if (!q) {
    return "Ask about flavors, product features, shipping, or packing — or tap a topic below.";
  }

  if (isPrivateSupportTopic(q)) {
    return privateTopicEmailReply();
  }

  let best: { score: number; a: string } | null = null;

  for (const item of items) {
    let score = 0;
    const qText = item.q.toLowerCase();
    if (qText === q || q.includes(qText) || qText.includes(q)) score += 8;

    for (const key of item.keys) {
      if (q.includes(key)) score += key.length > 6 ? 4 : 3;
    }

    for (const word of q.split(/\s+/)) {
      if (word.length < 4) continue;
      if (qText.includes(word)) score += 1;
      if (item.a.toLowerCase().includes(word)) score += 0.5;
    }

    if (!best || score > best.score) best = { score, a: item.a };
  }

  // Never surface an FAQ answer that looks like it quotes prices
  if (best && best.score >= 3) {
    if (isPrivateSupportTopic(best.a) || /\$\s*\d/.test(best.a)) {
      return privateTopicEmailReply();
    }
    return best.a;
  }

  return `I can help with HOOKAMAX flavors, features, packing, shipping, and FAQ. For pricing or account-private details, email ${SITE_CONTACT_EMAIL}.`;
}
