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
});
