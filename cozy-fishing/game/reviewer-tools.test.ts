import { describe, expect, it } from "vitest";
import { FISHING_LOCATIONS, RODS, type ShopState } from "./shop";
import { getReviewerBonus, REVIEWER_MINIMUM_BONUS } from "./reviewer-tools";

const newPlayer: ShopState = {
  ownedRodIds: ["wooden"],
  equippedRodId: "wooden",
  ownedLocationIds: [1],
};

describe("reviewer tester bonus", () => {
  it("grants at least 5000 coins", () => {
    expect(getReviewerBonus(0, newPlayer)).toBe(REVIEWER_MINIMUM_BONUS);
  });

  it("covers all missing rods and locations", () => {
    const total =
      RODS.filter((rod) => !newPlayer.ownedRodIds.includes(rod.id)).reduce(
        (sum, rod) => sum + rod.price,
        0,
      ) +
      FISHING_LOCATIONS.filter(
        (location) => !newPlayer.ownedLocationIds.includes(location.id),
      ).reduce((sum, location) => sum + location.price, 0);

    const balance = 0;
    expect(
      balance + getReviewerBonus(balance, newPlayer),
    ).toBeGreaterThanOrEqual(total + 500);
  });

  it("does not mutate purchased rods or locations", () => {
    const snapshot = JSON.stringify(newPlayer);
    getReviewerBonus(750, newPlayer);
    expect(JSON.stringify(newPlayer)).toBe(snapshot);
  });
});
