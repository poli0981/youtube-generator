import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { ErrorBoundary } from "./components/ErrorBoundary";
import i18n, { ensureLanguagesLoaded } from "@i18n/index";
import { useSettingsStore } from "@store/settings-store";
import { useEditorStore } from "@store/editor-store";
import { installExternalLinkHandler } from "@utils/open-external";
import { IS_TAURI } from "@utils/platform";
import { CURRENT_TERMS_VERSION, needsConsent, termsVersionFromCookie } from "@config/legal";
// Self-hosted variable fonts; each subset (latin, latin-ext, vietnamese, …)
// is a separate file the browser only fetches when a page uses it.
import "@fontsource-variable/inter";
import "@fontsource-variable/jetbrains-mono";
import "./styles/globals.css";

const root = document.getElementById("root");
if (!root) throw new Error("Root element not found");

/**
 * v1.0.0 moved the web build from hash routes (`/#/output`) to real paths
 * (`/output`). Rewrite an old bookmark in place before the router reads the
 * URL. Tauri keeps hash routing, so this is web-only.
 */
function migrateHashUrl(): void {
  if (IS_TAURI || !window.location.hash.startsWith("#/")) return;
  window.history.replaceState(null, "", window.location.hash.slice(1) || "/");
}

/**
 * The Cloudflare gate page asks for the same Terms/Privacy agreement as the
 * in-app consent screen and records it in the `ytg_terms` cookie. Carry that
 * acceptance over before the first render so a web visitor meets one blocking
 * screen, not two. Only ever upgrades; never set on desktop / Android.
 */
function acceptConsentFromGate(): void {
  if (IS_TAURI) return;
  const fromGate = termsVersionFromCookie(document.cookie);
  const settings = useSettingsStore.getState();
  if (
    fromGate !== null &&
    fromGate >= CURRENT_TERMS_VERSION &&
    needsConsent(settings.legalConsentVersion)
  ) {
    settings.acceptLegalConsent();
  }
}

/**
 * After a deploy, a tab opened on the previous build asks for chunk files that
 * no longer exist. Reload once to pick up the new build instead of rendering
 * an error page; the session flag stops a reload loop if the failure is real.
 */
function reloadOnStaleChunks(): void {
  window.addEventListener("vite:preloadError", (event) => {
    try {
      if (sessionStorage.getItem("ytdescgen-chunk-reload")) return;
      sessionStorage.setItem("ytdescgen-chunk-reload", "1");
    } catch {
      return;
    }
    event.preventDefault();
    window.location.reload();
  });
}

migrateHashUrl();
acceptConsentFromGate();
reloadOnStaleChunks();

// Screen readers and the browser's own translation/spell-check key off
// <html lang>, which index.html fixes at "en".
i18n.on("languageChanged", (lng) => {
  document.documentElement.lang = lng;
});

/**
 * Lazy-loaded locales (v0.26): fetch the persisted UI + output languages
 * before first paint so a non-English user never sees an English flash
 * (and the Output page never renders a placeholder on cold start).
 * zustand persist hydrates synchronously from localStorage, so these
 * reads already hold the user's values; Tauri's async settings-file
 * rehydrate is bridged later by App's store subscription.
 *
 * `en` resolves from the eagerly-bundled resources, so English users pay
 * zero extra latency. The 2 s race cap means a dead network can delay —
 * but never block — first paint; the readiness hooks re-gate after render.
 */
async function preloadLocales(): Promise<void> {
  const { appLanguage, defaultOutputLanguage } = useSettingsStore.getState();
  const outputLanguage = useEditorStore.getState().language;
  await Promise.race([
    Promise.all([
      i18n.changeLanguage(appLanguage),
      ensureLanguagesLoaded([defaultOutputLanguage, outputLanguage]),
    ]),
    new Promise<void>((resolve) => setTimeout(resolve, 2000)),
  ]).catch(() => undefined);
}

/**
 * Apply the persisted theme class to <html> at boot. `index.html` hardcodes
 * `class="dark"`, and `setTheme` (the Header toggle) is the only other place
 * that touches the class — so before v0.28.0 a light-theme user saw a dark
 * flash until they interacted. zustand persist has already hydrated from
 * localStorage at module load, so `getState().theme` is the user's value.
 * Runs before first paint so the consent gate (and AppShell) render in the
 * right theme.
 */
function applyPersistedTheme(): void {
  const { theme } = useSettingsStore.getState();
  document.documentElement.classList.toggle("dark", theme === "dark");
  document.documentElement.classList.toggle("light", theme === "light");
  document.documentElement.style.colorScheme = theme;
}

// Top-level safety net. Per-route boundaries in App.tsx catch most
// errors with route-specific labels; this outer one only fires if
// something explodes *before* the router mounts (e.g. i18n init, store
// rehydrate). Without it, a top-level crash still produces a black
// page — defeating the point of per-route boundaries.
void preloadLocales().finally(() => {
  applyPersistedTheme();
  // In a Tauri webview, `<a target="_blank">` is inert — route external links
  // through the OS via the opener plugin. No-op on the web build.
  installExternalLinkHandler();
  createRoot(root).render(
    <StrictMode>
      <ErrorBoundary label="app">
        <App />
      </ErrorBoundary>
    </StrictMode>,
  );
});
