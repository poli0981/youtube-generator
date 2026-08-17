import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@config": path.resolve(__dirname, "./src/config"),
      "@engine": path.resolve(__dirname, "./src/engine"),
      "@store": path.resolve(__dirname, "./src/store"),
      "@hooks": path.resolve(__dirname, "./src/hooks"),
      "@components": path.resolve(__dirname, "./src/components"),
      "@pages": path.resolve(__dirname, "./src/pages"),
      "@utils": path.resolve(__dirname, "./src/utils"),
      "@i18n": path.resolve(__dirname, "./src/i18n"),
    },
  },
  test: {
    globals: true,
    // `.tsx` was absent until v0.35.0, so any component test written here
    // would have been collected by nobody and passed silently. Note that the
    // default environment is node — a test that renders needs an explicit
    // `// @vitest-environment jsdom` docblock (and jsdom installed).
    include: ["tests/**/*.test.{ts,tsx}", "src/**/*.test.{ts,tsx}"],
  },
});
