import { defineConfig } from "vitest/config";

const runIntegration = process.env.FEVRIPS_RUN_INTEGRATION === "1";

export default defineConfig({
  test: {
    include: runIntegration
      ? ["src/**/*.test.ts", "src/**/*.integration.test.ts"]
      : ["src/**/*.test.ts"],
    exclude: runIntegration ? [] : ["src/**/*.integration.test.ts"],
  },
});
