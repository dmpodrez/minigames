import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["**/*.ts"],
      exclude: [
        "**/*.test.ts",
        "**/*.spec.ts",
        "**/*.d.ts",
        "vitest.config.mts",
        "node_modules/**",
        "dist/**",
      ],
      thresholds: {
        statements: 80,
      },
    },
  },
});
