import { FISHING_LOCATIONS, RODS, type ShopState } from "./shop";

/** One click should cover every remaining purchase, even if prices change. */
export const REVIEWER_MINIMUM_BONUS = 5000;

export function getReviewerBonus(coins: number, shop: ShopState): number {
  const missingRods = RODS.filter((rod) => !shop.ownedRodIds.includes(rod.id));
  const missingLocations = FISHING_LOCATIONS.filter(
    (location) => !shop.ownedLocationIds.includes(location.id),
  );

  const outstanding =
    missingRods.reduce((total, rod) => total + rod.price, 0) +
    missingLocations.reduce((total, location) => total + location.price, 0);

  // 500 spare coins are reserved for further gameplay checks.
  return Math.max(REVIEWER_MINIMUM_BONUS, outstanding + 500 - coins);
}
