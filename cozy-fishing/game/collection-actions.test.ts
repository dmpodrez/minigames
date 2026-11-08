import { describe, expect, it } from "vitest";
import {
  clearCollection,
  discardJunk,
  isJunkCatch,
} from "./collection-actions";
import type { SavedCatch } from "./inventory";

const sample = (): SavedCatch[] => [
  { id: "perch", weightKg: 0.8, caughtAt: 1 },
  { id: "tin-can", weightKg: 0.2, caughtAt: 2 },
  { id: "stone", weightKg: 1.2, caughtAt: 3 },
  { id: "carp", weightKg: 2.5, caughtAt: 4 },
];

describe("collection cleanup", () => {
  it("recognizes junk and fish", () => {
    expect(isJunkCatch("tin-can")).toBe(true);
    expect(isJunkCatch("perch")).toBe(false);
  });

  it("removes junk without affecting fish", () => {
    const items = sample();
    expect(discardJunk(items)).toBe(2);
    expect(items.map((entry) => entry.id)).toEqual(["perch", "carp"]);
  });

  it("clears the entire collection", () => {
    const items = sample();
    expect(clearCollection(items)).toBe(4);
    expect(items).toEqual([]);
  });

  it("handles already empty collections", () => {
    const items: SavedCatch[] = [];
    expect(discardJunk(items)).toBe(0);
    expect(clearCollection(items)).toBe(0);
  });
});
