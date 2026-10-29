import { beforeEach, describe, expect, it } from "vitest";

import { buyRod, equipRod, getEquippedRod, loadShop, saveShop } from "./shop";

beforeEach(() => {
  localStorage.clear();
});

describe("fishing shop", () => {
  it("starts with the wooden rod", () => {
    const shop = loadShop();

    expect(shop.equippedRodId).toBe("wooden");
    expect(shop.ownedRodIds).toContain("wooden");
  });

  it("allows buying an affordable rod", () => {
    const result = buyRod(loadShop(), 188, "reinforced");

    expect(result.success).toBe(true);
    expect(result.coins).toBe(38);
    expect(result.shop.equippedRodId).toBe("reinforced");
  });

  it("rejects an expensive rod", () => {
    const result = buyRod(loadShop(), 100, "golden");

    expect(result.success).toBe(false);
    expect(result.coins).toBe(100);
  });

  it("prevents buying the same rod twice", () => {
    const first = buyRod(loadShop(), 200, "reinforced");

    const second = buyRod(first.shop, first.coins, "reinforced");

    expect(second.success).toBe(false);
    expect(second.coins).toBe(50);
  });

  it("does not equip a locked rod", () => {
    const shop = equipRod(loadShop(), "golden");

    expect(shop.equippedRodId).toBe("wooden");
  });

  it("saves purchased rods", () => {
    const result = buyRod(loadShop(), 200, "reinforced");

    saveShop(result.shop);

    const restored = loadShop();

    expect(getEquippedRod(restored).id).toBe("reinforced");
  });
});
