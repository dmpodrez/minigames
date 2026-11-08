import { CATCHES } from "./catches";

const STORAGE_KEY = "cozy-fishing-inventory-v1";
const MAX_ITEMS = 500;

export interface SavedCatch {
  id: string;
  weightKg: number;
  caughtAt: number;
}

function isSavedCatch(value: unknown): value is SavedCatch {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const entry = value as Record<string, unknown>;

  const item = CATCHES.find((catchItem) => catchItem.id === entry.id);

  return (
    item !== undefined &&
    typeof entry.weightKg === "number" &&
    Number.isFinite(entry.weightKg) &&
    entry.weightKg >= item.minWeight &&
    entry.weightKg <= item.maxWeight &&
    typeof entry.caughtAt === "number" &&
    Number.isFinite(entry.caughtAt)
  );
}

export function loadInventory(): SavedCatch[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);

    if (!stored) return [];

    const data: unknown = JSON.parse(stored);

    if (!Array.isArray(data)) return [];

    return data.filter(isSavedCatch).slice(0, MAX_ITEMS);
  } catch {
    return [];
  }
}

export function saveInventory(catches: readonly SavedCatch[]): void {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(catches.slice(0, MAX_ITEMS)),
    );
  } catch (error) {
    console.warn("Could not save inventory:", error);
  }
}

export function countFish(catches: readonly SavedCatch[]): number {
  return catches.filter((entry) =>
    CATCHES.some((item) => item.id === entry.id && item.kind === "fish"),
  ).length;
}
