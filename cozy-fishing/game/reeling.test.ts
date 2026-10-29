import { describe, expect, it } from "vitest";
import { nextReelState } from "./reeling";

describe("fishing rod upgrades", () => {
  it("reduces line tension with better rods", () => {
    const initial = {
      progress: 0,
      tension: 10,
      elapsed: 0,
    };

    const wooden = nextReelState(initial, true, 0.05, 1);

    const reinforced = nextReelState(initial, true, 0.05, 0.85);

    const golden = nextReelState(initial, true, 0.05, 0.7);

    expect(golden.tension).toBeLessThan(reinforced.tension);

    expect(reinforced.tension).toBeLessThan(wooden.tension);

    expect(golden.progress).toBe(wooden.progress);
  });

  it("makes stronger fish harder to catch", () => {
    const initial = {
      progress: 0,
      tension: 10,
      elapsed: 0,
    };

    const perch = nextReelState(initial, true, 0.05, 1, 0.85);

    const pike = nextReelState(initial, true, 0.05, 1, 1.45);

    // Strong fish increase tension faster.
    expect(pike.tension).toBeGreaterThan(perch.tension);

    // Strong fish are pulled in more slowly.
    expect(pike.progress).toBeLessThan(perch.progress);
  });
});
