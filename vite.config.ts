import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

const isTauri = !!process.env.TAURI_ENV_PLATFORM;

export default defineConfig({
  plugins: [react()],
  base: isTauri ? "/" : "/youtube-generator/",
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
  build: {
    // Tauri ships the *system* WebView. On Android that can be an old, frozen
    // Chromium (e.g. some emulator system images sit at ~91 until the user
    // updates Android System WebView), which chokes on Vite's modern default
    // target and renders a blank/black screen. Downlevel the bundle for Tauri
    // builds so it runs on those older WebViews; the web (GitHub Pages) build
    // keeps Vite's modern default. Desktop WebViews are evergreen, so a lower
    // target is a harmless no-op there.
    target: isTauri ? "es2020" : undefined,
    rollupOptions: {
      output: {
        // Vite 8 bundles with Rolldown, which only accepts the function form of
        // manualChunks (the object form is a Rollup-only API). Anchored [\\/]
        // regexes keep each vendor in its own chunk without cross-matching —
        // react-router* and react-i18next must not fall into the "react" chunk.
        manualChunks(id) {
          if (/[\\/]node_modules[\\/]react(-dom)?[\\/]/.test(id)) return "react";
          if (/[\\/]node_modules[\\/]react-router(-dom)?[\\/]/.test(id))
            return "router";
          if (
            /[\\/]node_modules[\\/](i18next|react-i18next|i18next-resources-to-backend)[\\/]/.test(
              id,
            )
          )
            return "i18n";
          return undefined;
        },
      },
    },
  },
});
