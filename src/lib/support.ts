import { flavors, product, PUFF_OPTIONS, type Flavor } from "@/lib/assets";
import { SITE_CONTACT_EMAIL } from "@/lib/site";

export type SupportFaq = {
  q: string;
  a: string;
  keys: readonly string[];
};

export type FlavorGuideStep = "idle" | "ask_profile" | "ask_vibe";

export type SupportChatState = {
  guide: FlavorGuideStep;
  profileHint?: string;
};

export type SupportTurn = {
  reply: string;
  nextState: SupportChatState;
  /** Optional chips to show under the reply */
  suggestions?: string[];
};

const FLAVOR_LIST = flavors.map((f) => f.name).join(", ");

/** Topics we never answer in chat — steer to email. */
const PRIVATE_TOPIC_PATTERN =
  /\b(price|pricing|prices|cost|costs|quote|quotes|wholesale\s*price|how\s*much|\$|usd|dollar|margin|discount\s*rate|net\s*price|list\s*price|unit\s*price|per\s*case\s*price|invoice\s*amount)\b/i;

export function isPrivateSupportTopic(query: string): boolean {
  return PRIVATE_TOPIC_PATTERN.test(query);
}

export function privateTopicEmailReply(): string {
  return `For pricing and other account-private details, please email ${SITE_CONTACT_EMAIL} with your company name and what you need. This chat stays on product FAQ, flavors, and how HOOKAMAX works.`;
}

export const faqs: SupportFaq[] = [
  {
    q: "Who can buy UMAXES / HOOKAMAX?",
    a: "Only adults 21 years of age or older. Nicotine is an addictive chemical. Keep products out of reach of children and pets.",
    keys: ["age", "21", "adult", "who can", "legal", "buy"],
  },
  {
    q: "What flavors / variations are available?",
    a: `HOOKAMAX flavors: ${FLAVOR_LIST}. Same device family — pick the taste that fits your customers. Puff options: ${PUFF_OPTIONS.join(" / ")}.`,
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
    keys: [
      "coil",
      "mesh",
      "maxcore",
      "ohm",
      "0.6",
      "airflow",
      "mtl",
      "dl",
      "draw",
      "feature",
      "features",
    ],
  },
  {
    q: "What nicotine strength is HOOKAMAX?",
    a: "HOOKAMAX is listed at 0.5% nicotine (5mg/ml). Nicotine is an addictive chemical — for adults 21+ only.",
    keys: ["nicotine", "nic", "0.5", "5", "5mg", "strength", "addictive"],
  },
  {
    q: "How long does shipping take?",
    a: "About 2–7 business days after the order ships. You’ll get tracking once it leaves the warehouse.",
    keys: [
      "shipping",
      "delivery",
      "arrive",
      "transit",
      "how long ship",
      "tracking",
      "business days",
    ],
  },
  {
    q: "How do I know my device is authentic?",
    a: "Buy HOOKAMAX from official UMAXES channels. If you have questions about a device, email support with your order details.",
    keys: ["authentic", "authenticity", "verify", "fake", "real"],
  },
  {
    q: "What is your return policy?",
    a: "If there is a quality issue, send evidence (photos or video) to support. UMAXES will contact you about replacement.",
    keys: [
      "return",
      "refund",
      "exchange",
      "defective",
      "broken",
      "warranty",
      "quality",
      "replace",
    ],
  },
  {
    q: "How do I contact support?",
    a: `Email ${SITE_CONTACT_EMAIL} and include your company and order number when you have one. We usually reply within 1–2 business days.`,
    keys: ["contact", "email", "support", "help", "reach", "message"],
  },
  {
    q: "What is HOOKAMAX?",
    a: `${product.name} is UMAXES’ premium hookah-inspired disposable line — ${product.tagline} One device family with multiple flavor variations. Adults 21+ only.`,
    keys: [
      "what is hookamax",
      "hookamax",
      "product",
      "device",
      "disposable",
      "what is umaxes",
    ],
  },
  {
    q: "How is HOOKAMAX packed?",
    a: "HOOKAMAX is sold by the case. Minimum order is 1 case (95 pieces). On the product page, + / − adds one case at a time — 1 case, 2 cases, and so on.",
    keys: [
      "case",
      "pack",
      "95",
      "quantity",
      "pcs",
      "piece",
      "carton",
      "how many",
      "moq",
      "packing",
    ],
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

function matchSmallTalk(q: string): string | null {
  if (
    /^(hi|hello|hey|yo|hiya|good\s*(morning|afternoon|evening)|sup|what'?s\s*up)\b/.test(
      q,
    ) ||
    q === "hi" ||
    q === "hello"
  ) {
    return "Hey — good to see you. I can walk you through HOOKAMAX flavors, features, packing, or shipping. Want a flavor suggestion, or ask anything about the product?";
  }

  if (
    /\b(how are you|how'?s it going|how r u|hru|you good|you okay)\b/.test(q)
  ) {
    return "Doing great — thanks for asking. Ready when you are: flavors, features, shipping, or I can help pick a HOOKAMAX variation for your customers.";
  }

  if (/\b(nice|cool|awesome|great|love it|perfect|sweet)\b/.test(q) && q.length < 40) {
    return "Glad that landed well. Want to explore flavors next, or should I suggest one based on what your buyers like?";
  }

  if (/\b(thank|thanks|thx|ty|appreciate)\b/.test(q)) {
    return "Anytime. If you need anything else — packing, shipping, or a flavor pick — just ask.";
  }

  if (/\b(bye|goodbye|see you|later|gotta go)\b/.test(q)) {
    return "Take care. I’m here whenever you need HOOKAMAX help again.";
  }

  if (/\b(who are you|what are you|are you (a )?bot|are you (an )?ai|your name)\b/.test(q)) {
    return "I’m the UMAXES support desk — here for product FAQ, flavors, and how HOOKAMAX works. For private account or pricing details, email works better.";
  }

  if (/\b(what can you (do|help)|help me|i need help)\b/.test(q)) {
    return "I can cover HOOKAMAX flavors & variations, coil/airflow, packing (case of 95), shipping, authenticity, and returns. I can also ask a couple quick questions and suggest a flavor. What do you want to start with?";
  }

  if (/\b(joke|funny|bored)\b/.test(q)) {
    return "I’m better with vapor than punchlines — but here’s one: why did the mesh coil get promoted? It had great airflow. Want a real flavor rec instead?";
  }

  return null;
}

function wantsFlavorGuide(q: string): boolean {
  return (
    /\b(suggest|recommend|recommendation|which (flavor|vape|one)|help me (pick|choose)|what should i (get|stock|sell)|pick (a |for me)|guide me)\b/.test(
      q,
    ) ||
    /\b(flavor for me|best flavor|popular flavor)\b/.test(q)
  );
}

function detectProfile(q: string): string | null {
  if (/\b(tropical|fruit|peach|mango|melon|watermelon)\b/.test(q))
    return "Tropical";
  if (/\b(berry|strawberr|blueberr|grape)\b/.test(q)) return "Berry";
  if (/\b(mint|menthol|fresh)\b/.test(q)) return "Mint";
  if (/\b(candy|sweet|fab|dessert)\b/.test(q)) return "Candy";
  if (/\b(ice|cool|chill|frost|icy)\b/.test(q)) return "Ice";
  return null;
}

function detectVibe(q: string): "icy" | "smooth" | null {
  if (/\b(ice|icy|cool|chill|frost|cold|crisp)\b/.test(q)) return "icy";
  if (/\b(smooth|sweet|soft|warm|juicy|candy|mellow)\b/.test(q)) return "smooth";
  return null;
}

function pickFlavor(profile?: string, vibe?: "icy" | "smooth" | null): Flavor {
  let pool = [...flavors];
  if (profile) {
    const matched = pool.filter((f) => f.profile === profile);
    if (matched.length) pool = matched;
  }
  if (vibe === "icy") {
    const icy = pool.filter(
      (f) =>
        /ice|cool|chill|mint/i.test(f.name) ||
        /ice|cool|chill|mint/i.test(f.tagline),
    );
    if (icy.length) pool = icy;
  } else if (vibe === "smooth") {
    const smooth = pool.filter(
      (f) =>
        !/ice/i.test(f.name) ||
        f.profile === "Tropical" ||
        f.profile === "Candy",
    );
    if (smooth.length) pool = smooth;
  }
  // Prefer a stable “hero” pick in the pool
  const preferred =
    pool.find((f) => f.id === "peach-mango") ||
    pool.find((f) => f.id === "cool-mint") ||
    pool.find((f) => f.id === "fcuking-fab") ||
    pool[0];
  return preferred!;
}

function suggestFlavorReply(flavor: Flavor): SupportTurn {
  return {
    reply: `Based on what you said, I’d start with **${flavor.name}** — ${flavor.tagline.toLowerCase()}. ${flavor.description} Same HOOKAMAX device family; puff options ${PUFF_OPTIONS.join(" / ")}. Want another direction (more ice, more fruit, or candy-sweet)?`,
    nextState: { guide: "idle" },
    suggestions: [
      "More ice flavors",
      "More fruit flavors",
      "What flavors are available?",
      "What is HOOKAMAX?",
    ],
  };
}

function scoreFaq(query: string, items: SupportFaq[]): string | null {
  const q = query.toLowerCase().trim();
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

  if (best && best.score >= 3) {
    if (isPrivateSupportTopic(best.a) || /\$\s*\d/.test(best.a)) {
      return privateTopicEmailReply();
    }
    return best.a;
  }
  return null;
}

/** Conversational turn — FAQ + small talk + flavor guide. */
export function handleSupportTurn(
  query: string,
  state: SupportChatState = { guide: "idle" },
  items: SupportFaq[] = faqs,
): SupportTurn {
  const q = query.toLowerCase().trim();
  if (!q) {
    return {
      reply:
        "Ask about flavors, features, shipping, or packing — or say “suggest a flavor” and I’ll guide you.",
      nextState: state,
      suggestions: [
        "Suggest a flavor",
        "What flavors are available?",
        "What is HOOKAMAX?",
      ],
    };
  }

  if (isPrivateSupportTopic(q)) {
    return {
      reply: privateTopicEmailReply(),
      nextState: { guide: "idle" },
      suggestions: ["What flavors are available?", "How do I contact support?"],
    };
  }

  // Flavor guide state machine
  if (state.guide === "ask_profile") {
    const profile = detectProfile(q);
    if (!profile && !/\b(skip|any|surprise|don'?t know|idk)\b/.test(q)) {
      return {
        reply:
          "No worries — pick a lane: **fruit/tropical**, **berry**, **cool ice**, **mint**, or **candy-sweet**? (Or say “surprise me.”)",
        nextState: { guide: "ask_profile" },
        suggestions: ["Tropical", "Berry", "Ice", "Mint", "Candy", "Surprise me"],
      };
    }
    const hint = profile || "Ice";
    return {
      reply: `Got it — ${hint.toLowerCase()} vibes. Last one: do you want it more **chilled/icy**, or more **smooth/sweet**?`,
      nextState: { guide: "ask_vibe", profileHint: hint },
      suggestions: ["Chilled / icy", "Smooth / sweet"],
    };
  }

  if (state.guide === "ask_vibe") {
    const vibe = detectVibe(q);
    const flavor = pickFlavor(state.profileHint, vibe);
    return suggestFlavorReply(flavor);
  }

  if (wantsFlavorGuide(q) || /\bsurprise me\b/.test(q)) {
    if (/\bsurprise me\b/.test(q)) {
      return suggestFlavorReply(pickFlavor("Ice", "icy"));
    }
    const already = detectProfile(q);
    if (already) {
      return {
        reply: `Nice — leaning ${already.toLowerCase()}. More **chilled/icy**, or more **smooth/sweet**?`,
        nextState: { guide: "ask_vibe", profileHint: already },
        suggestions: ["Chilled / icy", "Smooth / sweet"],
      };
    }
    return {
      reply:
        "Happy to help pick one. What do your buyers lean toward — **fruit/tropical**, **berry**, **cool ice**, **mint**, or **candy-sweet**?",
      nextState: { guide: "ask_profile" },
      suggestions: ["Tropical", "Berry", "Ice", "Mint", "Candy"],
    };
  }

  // Follow-ups after a suggestion
  if (/\bmore ice\b/.test(q)) {
    return suggestFlavorReply(pickFlavor("Ice", "icy"));
  }
  if (/\bmore fruit\b/.test(q)) {
    return suggestFlavorReply(pickFlavor("Tropical", "smooth"));
  }

  const talk = matchSmallTalk(q);
  if (talk) {
    return {
      reply: talk,
      nextState: { guide: "idle" },
      suggestions: [
        "Suggest a flavor",
        "What flavors are available?",
        "How long does shipping take?",
      ],
    };
  }

  const faq = scoreFaq(q, items);
  if (faq) {
    return {
      reply: faq,
      nextState: { guide: "idle" },
      suggestions: [
        "Suggest a flavor",
        "What coil and airflow does it use?",
        "How is HOOKAMAX packed?",
      ],
    };
  }

  return {
    reply: `I can help with HOOKAMAX flavors, features, packing, and shipping — or walk you through a quick flavor pick. For pricing, email ${SITE_CONTACT_EMAIL}.`,
    nextState: { guide: "idle" },
    suggestions: [
      "Suggest a flavor",
      "What flavors are available?",
      "How do I contact support?",
    ],
  };
}

/** @deprecated prefer handleSupportTurn — kept for simple FAQ callers */
export function findSupportAnswer(
  query: string,
  items: SupportFaq[] = faqs,
): string {
  return handleSupportTurn(query, { guide: "idle" }, items).reply;
}
