import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["src/__tests__/integration/**/*.test.ts"],
    testTimeout: 15000,
    fileParallelism: false,
    globalSetup: "./src/__tests__/globalSetup.ts",
  },
});
