// Catch data is kept separate from the UI, so it can be tested independently.
export type CatchKind = "fish" | "junk";
export type Rarity = "common" | "uncommon" | "rare" | "legendary" | "junk";

export interface CatchDefinition {
  id: string;
  name: string;
  kind: CatchKind;
  rarity: Rarity;
  minWeight: number;
  maxWeight: number;
  value: number;
  chance: number;
  resistance: number;
  image: string;
  description: string;
}

export interface CatchResult {
  item: CatchDefinition;
  weightKg: number;
}

export const CATCHES: readonly CatchDefinition[] = [
  {
    id: "perch",
    name: "European Perch",
    kind: "fish",
    rarity: "common",
    minWeight: 0.2,
    maxWeight: 1.8,
    value: 12,
    chance: 29,
    resistance: 0.85,
    image: new URL("../assets/catches/perch.png", import.meta.url).href,
    description: "A striped hunter hiding among the reeds.",
  },
  {
    id: "carp",
    name: "Common Carp",
    kind: "fish",
    rarity: "common",
    minWeight: 1.0,
    maxWeight: 7.5,
    value: 18,
    chance: 20,
    resistance: 1.1,
    image: new URL("../assets/catches/carp.png", import.meta.url).href,
    description: "A peaceful heavyweight of the lake.",
  },
  {
    id: "trout",
    name: "Rainbow Trout",
    kind: "fish",
    rarity: "uncommon",
    minWeight: 0.5,
    maxWeight: 4.2,
    value: 28,
    chance: 18,
    resistance: 1.05,
    image: new URL("../assets/catches/trout.png", import.meta.url).href,
    description: "Shimmering scales and a beautiful pink stripe.",
  },
  {
    id: "pike",
    name: "Northern Pike",
    kind: "fish",
    rarity: "rare",
    minWeight: 1.5,
    maxWeight: 11.5,
    value: 52,
    chance: 10,
    resistance: 1.45,
    image: new URL("../assets/catches/pike.png", import.meta.url).href,
    description: "A powerful predator from deep water.",
  },
  {
    id: "golden-fish",
    name: "Golden Fish",
    kind: "fish",
    rarity: "legendary",
    minWeight: 0.3,
    maxWeight: 2.0,
    value: 250,
    chance: 3,
    resistance: 1.65,
    image: new URL("../assets/catches/golden-fish.png", import.meta.url).href,
    description: "A glittering legend of Willow Lake.",
  },
  {
    id: "old-boot",
    name: "Old Boot",
    kind: "junk",
    rarity: "junk",
    minWeight: 0.4,
    maxWeight: 1.3,
    value: 0,
    chance: 6,
    resistance: 0.75,
    image: new URL("../assets/catches/old-boot.png", import.meta.url).href,
    description: "Someone lost their boots a long time ago.",
  },
  {
    id: "tin-can",
    name: "Tin Can",
    kind: "junk",
    rarity: "junk",
    minWeight: 0.1,
    maxWeight: 0.4,
    value: 0,
    chance: 8,
    resistance: 0.65,
    image: new URL("../assets/catches/tin-can.png", import.meta.url).href,
    description: "Not a fish. At least the lake is cleaner now!",
  },
  {
    id: "stone",
    name: "Lake Stone",
    kind: "junk",
    rarity: "junk",
    minWeight: 0.3,
    maxWeight: 3.5,
    value: 0,
    chance: 6,
    resistance: 0.95,
    image: new URL("../assets/catches/stone.png", import.meta.url).href,
    description: "A smooth stone from the bottom of the lake.",
  },
];

// A random function can be injected for deterministic unit tests.
export function generateCatch(random: () => number = Math.random): CatchResult {
  const totalChance = CATCHES.reduce((total, item) => total + item.chance, 0);
  const roll = Math.max(0, Math.min(0.999999999, random())) * totalChance;
  let threshold = 0;
  let chosen = CATCHES[CATCHES.length - 1];

  for (const item of CATCHES) {
    threshold += item.chance;
    if (roll < threshold) {
      chosen = item;
      break;
    }
  }

  const weightRoll = Math.max(0, Math.min(1, random()));
  const weight =
    chosen.minWeight + (chosen.maxWeight - chosen.minWeight) * weightRoll;
  return { item: chosen, weightKg: Math.round(weight * 100) / 100 };
}

export function getCatchResistance(result: CatchResult): number {
  const baseResistance = result.item.resistance;

  // Heavier catches are slightly more difficult.
  const weightBonus = result.weightKg * 0.02;

  return baseResistance + weightBonus;
}
