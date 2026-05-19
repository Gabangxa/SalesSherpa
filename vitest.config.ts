import { defineConfig } from "vitest/config";
import path, { dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client", "src"),
      "@shared": path.resolve(__dirname, "shared"),
      "@assets": path.resolve(__dirname, "attached_assets"),
    },
  },
  test: {
    environment: "node",
    include: ["server/__tests__/**/*.test.ts", "shared/__tests__/**/*.test.ts"],
    // Tests that touch the real DB or external services should be opt-in via
    // separate suites; default suite must be hermetic.
    testTimeout: 5_000,
  },
});
