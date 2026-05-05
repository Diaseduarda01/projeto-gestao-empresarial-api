import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["src/__tests__/unit/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: ["src/modules/**", "src/middlewares/**"],
      exclude: ["src/__tests__/**"],
      reporter: ["text", "html"],
    },
  },
});
