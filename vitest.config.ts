import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    include: ["tests/**/*.test.ts"],
    environment: "node",
    coverage: {
      provider: "v8",
      include: ["src/domain/**/*.ts"],
      exclude: ["src/domain/index.ts", "src/domain/types.ts"],
      // Spec §14 targets ≥80% domain coverage.
      thresholds: { lines: 80, functions: 80, branches: 80, statements: 80 },
    },
  },
});
