import { defineConfig } from "vitest/config";
// `import.meta.dirname` rather than `__dirname`: Vite 8's native config
// loader (planned to become the default) does not provide the CJS global,
// and warns on every run until this changes.
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
      "@config": path.resolve(import.meta.dirname, "./src/config"),
      "@engine": path.resolve(import.meta.dirname, "./src/engine"),
      "@store": path.resolve(import.meta.dirname, "./src/store"),
      "@hooks": path.resolve(import.meta.dirname, "./src/hooks"),
      "@components": path.resolve(import.meta.dirname, "./src/components"),
      "@pages": path.resolve(import.meta.dirname, "./src/pages"),
      "@utils": path.resolve(import.meta.dirname, "./src/utils"),
      "@i18n": path.resolve(import.meta.dirname, "./src/i18n"),
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
