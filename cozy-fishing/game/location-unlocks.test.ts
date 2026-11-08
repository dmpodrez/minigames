import { beforeEach, describe, expect, it } from "vitest";
import { buyLocation, loadShop, saveShop } from "./shop";

beforeEach(() => localStorage.clear());

describe("purchasable locations", () => {
  it("starts with Sunset Cove only", () => {
    expect(loadShop().ownedLocationIds).toEqual([1]);
  });
  it("deducts coins and persists an unlock", () => {
    const result = buyLocation(loadShop(), 1100, 2);
    expect(result.success).toBe(true);
    expect(result.coins).toBe(600);
    saveShop(result.shop);
    expect(loadShop().ownedLocationIds).toContain(2);
  });
  it("rejects insufficient coins and double purchases", () => {
    const shop = loadShop();

    // 400 coins is not enough to buy Mountain River (500)
    const insufficient = buyLocation(shop, 400, 2);

    expect(insufficient.success).toBe(false);
    expect(insufficient.coins).toBe(400);

    // Successful purchase
    const purchased = buyLocation(shop, 600, 2);

    expect(purchased.success).toBe(true);
    expect(purchased.coins).toBe(100);

    // Cannot purchase the same location twice
    const duplicate = buyLocation(purchased.shop, purchased.coins, 2);

    expect(duplicate.success).toBe(false);
    expect(duplicate.coins).toBe(100);
  });
  it("migrates older shop saves safely", () => {
    localStorage.setItem(
      "cozy-fishing-shop-v1",
      JSON.stringify({
        ownedRodIds: ["wooden", "golden"],
        equippedRodId: "golden",
      }),
    );
    const loaded = loadShop();
    expect(loaded.equippedRodId).toBe("golden");
    expect(loaded.ownedLocationIds).toEqual([1]);
  });
});
