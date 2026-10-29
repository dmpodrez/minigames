import { describe, expect, it } from "vitest";
import { CATCHES, generateCatch } from "./catches";

describe("generateCatch", () => {
  it("uses unique item IDs and valid chances", () => {
    expect(new Set(CATCHES.map((item) => item.id)).size).toBe(CATCHES.length);
    expect(CATCHES.reduce((sum, item) => sum + item.chance, 0)).toBe(100);
  });

  it("selects the first fish at the start of the random range", () => {
    const result = generateCatch(() => 0);
    expect(result.item.id).toBe("perch");
    expect(result.weightKg).toBe(result.item.minWeight);
  });

  it("can select a junk item near the end of the range", () => {
    const result = generateCatch(() => 0.99);
    expect(result.item.id).toBe("stone");
    expect(result.item.kind).toBe("junk");
  });

  it("produces weights inside each item's defined range", () => {
    for (let i = 0; i <= 100; i++) {
      const result = generateCatch(() => i / 100);
      expect(result.weightKg).toBeGreaterThanOrEqual(result.item.minWeight);
      expect(result.weightKg).toBeLessThanOrEqual(result.item.maxWeight);
    }
  });

  it("can generate a legendary fish", () => {
    const result = generateCatch(() => 0.79);
    expect(result.item.id).toBe("golden-fish");
    expect(result.item.rarity).toBe("legendary");
  });
});
