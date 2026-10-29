const STORAGE_KEY = "cozy-world-builder-v1";

export type BuildingType = "cottage" | "tree" | "tower";

export interface SavedBuilding {
  tool: BuildingType;
  x: number;
  z: number;
}

function isSavedBuilding(value: unknown): value is SavedBuilding {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const building = value as Record<string, unknown>;

  const validType =
    building.tool === "cottage" ||
    building.tool === "tree" ||
    building.tool === "tower";

  return (
    validType &&
    typeof building.x === "number" &&
    Number.isFinite(building.x) &&
    typeof building.z === "number" &&
    Number.isFinite(building.z)
  );
}

export function loadWorld(): SavedBuilding[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (!saved) return [];

    const data: unknown = JSON.parse(saved);

    if (!Array.isArray(data)) return [];

    return data.filter(isSavedBuilding).slice(0, 500);
  } catch {
    return [];
  }
}

export function saveWorld(buildings: SavedBuilding[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(buildings));
  } catch (error) {
    console.warn("Failed to save world:", error);
  }
}
