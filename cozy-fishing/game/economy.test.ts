import { beforeEach, describe, expect, it } from "vitest";
import { CATCHES } from "./catches";
import { getSalePrice, loadEconomy, saveEconomy } from "./economy";

beforeEach(() => {
  localStorage.clear();
});

describe("fishing economy", () => {
  it("calculates price from fish weight", () => {
    const carp = CATCHES.find((item) => item.id === "carp");

    if (!carp) throw new Error("Carp not found");

    expect(getSalePrice(carp, 2.96)).toBe(53);
  });

  it("does not allow selling junk", () => {
    const boot = CATCHES.find((item) => item.id === "old-boot");

    if (!boot) throw new Error("Boot not found");

    expect(getSalePrice(boot, 1)).toBe(0);
  });

  it("restores existing discoveries", () => {
    const economy = loadEconomy([
      {
        id: "perch",
        weightKg: 0.8,
        caughtAt: Date.now(),
      },
    ]);

    expect(economy.totalFishCaught).toBe(1);
    expect(economy.discoveredFishIds).toContain("perch");
  });

  it("keeps discovered species after a sale", () => {
    const economy = loadEconomy([
      {
        id: "perch",
        weightKg: 0.8,
        caughtAt: Date.now(),
      },
    ]);

    economy.coins = 10;
    saveEconomy(economy);

    const restored = loadEconomy([]);

    expect(restored.coins).toBe(10);
    expect(restored.discoveredFishIds).toContain("perch");
    expect(restored.totalFishCaught).toBe(1);
  });
});
