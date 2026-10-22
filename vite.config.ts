import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { legalDocsPlugin } from "./build-plugins/legal-docs.ts";
import { cloudflareWebAnalytics, securityTxt } from "./build-plugins/web-only.ts";

const isTauri = !!process.env.TAURI_ENV_PLATFORM;

export default defineConfig({
  plugins: [
    react(),
    // In-app Legal Center content for every build; the static /legal pages,
    // security.txt and the analytics beacon only for the web deployment.
    legalDocsPlugin({ emitStaticPages: !isTauri }),
    ...(isTauri ? [] : [securityTxt(), cloudflareWebAnalytics()]),
  ],
  // Both builds are served from the root: the web build from
  // https://ytgenerator.stream (Cloudflare Workers static assets, see
  // wrangler.jsonc) and the Tauri build from its own asset protocol. The old
  // GitHub Pages sub-path `/youtube-generator/` is gone as of v1.0.0.
  base: "/",
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
  server: {
    // `tauri dev` loads this server while cargo rewrites files under
    // src-tauri/target, and watching those crashed Vite on Windows (EBUSY on
    // the locked .dll). Nothing under src-tauri or .wrangler is part of the
    // web app.
    watch: { ignored: ["**/src-tauri/**", "**/.wrangler/**"] },
  },
  build: {
    // No `target`: the web and Tauri builds share Vite's default,
    // `baseline-widely-available` (Chrome 111, Safari 16.4, Firefox 114), which
    // is also the floor tsconfig.json's `lib` holds the app to. Tauri builds
    // used to be lowered to es2020 for frozen ~91 Android System WebViews, but
    // the stylesheet's cascade layers already need Chromium 99+ / Safari 15.4+,
    // so such a WebView rendered the app unstyled either way.
    //
    // Never inline assets as data: URIs — the Tauri CSP only allows 'self'
    // for images and fonts, so an inlined icon would silently fail there.
    assetsInlineLimit: 0,
    // The full license text of every bundled package, for the "Third-party
    // notices" page to link to (Apache-2.0 / MIT / ISC all ask for it).
    license: { fileName: "licenses/third-party.md" },
    rollupOptions: {
      output: {
        // Vite 8 bundles with Rolldown, which only accepts the function form of
        // manualChunks (the object form is a Rollup-only API). Anchored [\\/]
        // regexes keep each vendor in its own chunk without cross-matching —
        // react-router* and react-i18next must not fall into the "react" chunk.
        manualChunks(id) {
          if (/[\\/]node_modules[\\/]react(-dom)?[\\/]/.test(id)) return "react";
          if (/[\\/]node_modules[\\/]react-router(-dom)?[\\/]/.test(id)) return "router";
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
