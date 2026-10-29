import { CATCHES, type CatchDefinition } from "./catches";
import { countFish, type SavedCatch } from "./inventory";

const STORAGE_KEY = "cozy-fishing-economy-v1";

export interface Economy {
  coins: number;
  totalFishCaught: number;
  discoveredFishIds: string[];
}

// Calculate the price using fish weight.
export function getSalePrice(item: CatchDefinition, weightKg: number): number {
  if (item.kind !== "fish" || !Number.isFinite(weightKg)) {
    return 0;
  }

  return Math.max(1, Math.round(item.value * weightKg));
}

export function loadEconomy(inventory: readonly SavedCatch[]): Economy {
  const fishIds = new Set(
    CATCHES.filter((item) => item.kind === "fish").map((item) => item.id),
  );

  // Preserve catches made before the economy update.
  const initialState: Economy = {
    coins: 0,
    totalFishCaught: countFish(inventory),
    discoveredFishIds: [
      ...new Set(
        inventory.map((entry) => entry.id).filter((id) => fishIds.has(id)),
      ),
    ],
  };

  try {
    const stored = localStorage.getItem(STORAGE_KEY);

    if (!stored) return initialState;

    const parsed: unknown = JSON.parse(stored);

    if (typeof parsed !== "object" || parsed === null) {
      return initialState;
    }

    const data = parsed as Record<string, unknown>;

    const coins =
      typeof data.coins === "number" &&
      Number.isSafeInteger(data.coins) &&
      data.coins >= 0
        ? data.coins
        : 0;

    const totalFishCaught =
      typeof data.totalFishCaught === "number" &&
      Number.isSafeInteger(data.totalFishCaught)
        ? Math.max(initialState.totalFishCaught, data.totalFishCaught)
        : initialState.totalFishCaught;

    const discovered = Array.isArray(data.discoveredFishIds)
      ? data.discoveredFishIds.filter(
          (id): id is string => typeof id === "string" && fishIds.has(id),
        )
      : [];

    return {
      coins,
      totalFishCaught,
      discoveredFishIds: [
        ...new Set([...initialState.discoveredFishIds, ...discovered]),
      ],
    };
  } catch {
    return initialState;
  }
}

export function saveEconomy(economy: Economy): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(economy));
  } catch (error) {
    console.warn("Could not save economy:", error);
  }
}
