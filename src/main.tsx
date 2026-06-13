import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { ErrorBoundary } from "./components/ErrorBoundary";
import i18n, { ensureLanguagesLoaded } from "@i18n/index";
import { useSettingsStore } from "@store/settings-store";
import { useEditorStore } from "@store/editor-store";
import "./styles/globals.css";

const root = document.getElementById("root");
if (!root) throw new Error("Root element not found");

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
}

// Top-level safety net. Per-route boundaries in App.tsx catch most
// errors with route-specific labels; this outer one only fires if
// something explodes *before* the router mounts (e.g. i18n init, store
// rehydrate). Without it, a top-level crash still produces a black
// page — defeating the point of per-route boundaries.
void preloadLocales().finally(() => {
  applyPersistedTheme();
  createRoot(root).render(
    <StrictMode>
      <ErrorBoundary label="app">
        <App />
      </ErrorBoundary>
    </StrictMode>,
  );
});
