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

export const hookamaxFeatureCards = [
  {
    title: "Authentic shisha flavors",
    body: "Hookah-inspired profiles built for a fuller, longer session.",
    icon: "sparkles",
  },
  {
    title: "Large vape juice capacity",
    body: "Enough e-liquid on board for HOOKAMAX to go the distance.",
    icon: "droplets",
  },
  {
    title: "1600mAh rechargeable battery",
    body: "Integrated power for extended use — USB Type-C charging, cable not included.",
    icon: "battery",
  },
  {
    title: "ARGB color effects",
    body: "Long-press the button to turn the light on or off.",
    icon: "light",
  },
  {
    title: "About 80,000 puffs",
    body: "Rated for long sessions, from the first draw to the last.",
    icon: "target",
  },
  {
    title: "Simple battery screen",
    body: "A clear indicator so you always know where you stand.",
    icon: "gauge",
  },
  {
    title: "LIT Mesh coil",
    body: "Even heat for consistent flavor through the life of the device.",
    icon: "mesh",
  },
  {
    title: "Bottom airflow control",
    body: "Dial between MTL and DTL on HOOKAMAX 80K.",
    icon: "wind",
  },
  {
    title: "0.5% nicotine",
    body: "3.5mg/ml nicotine strength. For adults 21+ only.",
    icon: "leaf",
  },
  {
    title: "USB Type-C charging",
    body: "Recharge the 1600mAh battery. Cable not included.",
    icon: "usb",
  },
  {
    title: "Draw-activated",
    body: "No extra fire button for the vape itself — just draw.",
    icon: "cloud",
  },
] as const;

export const hookamaxPackageItems = [
  "1 × UMAXES HOOKAMAX 80K disposable kit",
] as const;

export const hookamaxFlavorStory: {
  id: FlavorId;
  character: string;
}[] = [
  { id: "love-max", character: "Main Character" },
  { id: "watermelon-ice", character: "Spotlight" },
  { id: "grape-ice", character: "Slow Burn" },
  { id: "strawberry-watermelon-ice", character: "Fire Is Back" },
  { id: "peach-mango", character: "Royal Finish" },
  { id: "cool-mint", character: "Clean Reset" },
  { id: "blue-razz-ice", character: "Sharp Focus" },
  { id: "blueberry-ice", character: "Overthinking" },
  { id: "miami-sunset", character: "Quiet Control" },
  { id: "fcuking-fab", character: "Perfect Match" },
];
