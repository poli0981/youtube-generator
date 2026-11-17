import { defineConfig } from "vitest/config";
// The app's import aliases, defined once in vite.config.ts.
import { alias } from "./vite.config.ts";

export default defineConfig({
  resolve: { alias },
  test: {
    globals: true,
    // Node 25+ defines a global `localStorage` that is `undefined` unless
    // `--localstorage-file` is given. zustand's persist only falls back to
    // memory when reading the storage *throws*, so every store `set` then
    // crashes on `undefined.setItem`. Without Web Storage the global is gone
    // and the stores fall back the way they always did on Node 22. The flag is
    // accepted by Node 22 too.
    execArgv: ["--no-experimental-webstorage"],
    // `.tsx` was absent until v0.35.0, so any component test written here
    // would have been collected by nobody and passed silently. Note that the
    // default environment is node — a test that renders needs an explicit
    // `// @vitest-environment jsdom` docblock (and jsdom installed).
    include: ["tests/**/*.test.{ts,tsx}", "src/**/*.test.{ts,tsx}"],
    // `npm run test:coverage` (what CI runs). It measures the logic layers —
    // what the unit tests are for. Components, pages and hooks are checked in
    // the running app (no test renders one), i18n is i18next set-up, and
    // scripts/ is CI tooling. SonarCloud reads the LCOV file (the `sonarcloud`
    // job in ci.yml) and counts a file missing from it as 0 % covered, so
    // `sonar.coverage.exclusions` in sonar-project.properties lists everything
    // outside this scope — keep the two in step.
    //
    // Thresholds sit just under the measured coverage so they catch
    // regressions without blocking work; raise them as tests are added. The
    // engine is the part the whole app trusts, the worker is the part that
    // guards the site.
    coverage: {
      provider: "v8",
      include: [
        "src/engine/**",
        "src/config/**",
        "src/store/**",
        "src/utils/**",
        "worker/**",
        "build-plugins/**",
      ],
      exclude: ["worker/index.ts"],
      reporter: ["text-summary", "json-summary", "lcovonly"],
      thresholds: {
        "src/engine/**": { statements: 88, branches: 85, functions: 60, lines: 88 },
        "worker/**": { statements: 95, branches: 85, functions: 95, lines: 95 },
      },
    },
  },
});
