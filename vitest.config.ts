import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    environment: "node",
    exclude: [
      "e2e/**",
      "node_modules/**",
      ".claude/**",
      ".agents/**",
      "extensions/**",
    ],
  },
});
