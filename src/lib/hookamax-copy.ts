import { type FlavorId } from "@/lib/assets";

export const hookamaxIntro = {
  eyebrow: "Introduction",
  title: "UMAXES HOOKAMAX",
  titleAccent: " Disposable Vape",
  kicker: "HOOKAMAX 80K disposable hookah",
  paragraphs: [
    "UMAXES HOOKAMAX 80K is a disposable vape with up to 80K puffs and a 1600mAh internal battery. The HOOKAMAX hookah vape is, so far, the best vape UMAXES offers. It features a built-in 1600mAh battery for extended use.",
    "UMAXES packs enough vape juice for HOOKAMAX to satisfy up to 80K puffs. You can turn on the ARGB light for full-spectrum light effects, and enjoy both MTL and DTL on HOOKAMAX 80K.",
  ],
} as const;

export const hookamaxFeatureItems = [
  "Authentic shisha flavors",
  "Large vape juice capacity",
  "Integrated 1600mAh rechargeable battery",
  "ARGB color effects — long-press the button to turn it on/off",
  "Puff count: approximately 80,000 puffs",
  "Simple screen with battery indicator",
  "LIT Mesh coil",
  "Bottom airflow control",
  "0.5% nicotine strength (3.5mg/ml)",
  "USB Type-C charging (cable not included)",
  "Draw-activated",
] as const;

export const hookamaxPackageItems = [
  "1 × UMAXES HOOKAMAX 80K disposable kit",
] as const;

export const hookamaxFlavorStory: {
  id: FlavorId;
  character: string;
  emoji: string;
}[] = [
  { id: "love-max", character: "Main Character", emoji: "❤️" },
  { id: "watermelon-ice", character: "Spotlight", emoji: "🍉" },
  { id: "grape-ice", character: "Slow Burn", emoji: "🍇" },
  { id: "strawberry-watermelon-ice", character: "Fire Is Back", emoji: "🍓🍉" },
  { id: "peach-mango", character: "Royal Finish", emoji: "🍑🥭" },
  { id: "cool-mint", character: "Clean Reset", emoji: "🧊" },
  { id: "blue-razz-ice", character: "Sharp Focus", emoji: "🔵" },
  { id: "blueberry-ice", character: "Overthinking", emoji: "🫐" },
  { id: "miami-sunset", character: "Quiet Control", emoji: "🌅" },
  { id: "fcuking-fab", character: "Perfect Match", emoji: "🍓" },
];
