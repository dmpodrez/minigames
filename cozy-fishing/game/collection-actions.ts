import { CATCHES } from "./catches";
import type { SavedCatch } from "./inventory";

const junkIds = new Set(
  CATCHES.filter((item) => item.kind === "junk").map((item) => item.id),
);

export function isJunkCatch(id: string): boolean {
  return junkIds.has(id);
}

/** Mutates inventory, discarding only junk. Returns removed-item count. */
export function discardJunk(inventory: SavedCatch[]): number {
  const initialLength = inventory.length;
  const kept = inventory.filter((entry) => !isJunkCatch(entry.id));
  inventory.splice(0, inventory.length, ...kept);
  return initialLength - inventory.length;
}

/** Mutates inventory; catches history and economy are managed separately. */
export function clearCollection(inventory: SavedCatch[]): number {
  const removed = inventory.length;
  inventory.splice(0, inventory.length);
  return removed;
}
