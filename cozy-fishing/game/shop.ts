const STORAGE_KEY = "cozy-fishing-shop-v1";

export const RODS = [
  {
    id: "wooden",
    name: "Wooden Rod",
    price: 0,
    tensionMultiplier: 1,
    description: "A simple beginner fishing rod.",
  },
  {
    id: "reinforced",
    name: "Reinforced Rod",
    price: 150,
    tensionMultiplier: 0.85,
    description: "Reduces tension by 15%.",
  },
  {
    id: "golden",
    name: "Golden Rod",
    price: 450,
    tensionMultiplier: 0.7,
    description: "Reduces tension by 30%.",
  },
] as const;

export type RodId = (typeof RODS)[number]["id"];

export interface ShopState {
  ownedRodIds: RodId[];
  equippedRodId: RodId;
}

const DEFAULT_SHOP: ShopState = {
  ownedRodIds: ["wooden"],
  equippedRodId: "wooden",
};

function isRodId(value: unknown): value is RodId {
  return RODS.some((rod) => rod.id === value);
}

export function loadShop(): ShopState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);

    if (!stored) {
      return {
        ownedRodIds: [...DEFAULT_SHOP.ownedRodIds],
        equippedRodId: "wooden",
      };
    }

    const data: unknown = JSON.parse(stored);

    if (typeof data !== "object" || data === null) {
      return { ...DEFAULT_SHOP, ownedRodIds: ["wooden"] };
    }

    const parsed = data as Record<string, unknown>;

    const owned: RodId[] = ["wooden"];

    if (Array.isArray(parsed.ownedRodIds)) {
      for (const id of parsed.ownedRodIds) {
        if (isRodId(id) && !owned.includes(id)) {
          owned.push(id);
        }
      }
    }

    const equipped =
      isRodId(parsed.equippedRodId) && owned.includes(parsed.equippedRodId)
        ? parsed.equippedRodId
        : "wooden";

    return {
      ownedRodIds: owned,
      equippedRodId: equipped,
    };
  } catch {
    return { ...DEFAULT_SHOP, ownedRodIds: ["wooden"] };
  }
}

export function saveShop(shop: ShopState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(shop));
  } catch (error) {
    console.warn("Could not save shop:", error);
  }
}

export function buyRod(
  shop: ShopState,
  coins: number,
  rodId: RodId,
): {
  success: boolean;
  shop: ShopState;
  coins: number;
} {
  const rod = RODS.find((item) => item.id === rodId);

  if (!rod || shop.ownedRodIds.includes(rodId) || coins < rod.price) {
    return {
      success: false,
      shop,
      coins,
    };
  }

  return {
    success: true,
    coins: coins - rod.price,
    shop: {
      ownedRodIds: [...shop.ownedRodIds, rodId],
      equippedRodId: rodId,
    },
  };
}

export function equipRod(shop: ShopState, rodId: RodId): ShopState {
  if (!shop.ownedRodIds.includes(rodId)) {
    return shop;
  }

  return {
    ...shop,
    equippedRodId: rodId,
  };
}

export function getEquippedRod(shop: ShopState) {
  return RODS.find((rod) => rod.id === shop.equippedRodId) ?? RODS[0];
}
