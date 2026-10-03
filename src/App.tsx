import { lazy, Suspense, useEffect, type ReactNode } from "react";
import { BrowserRouter, HashRouter, Outlet, Routes, Route } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AppShell } from "@components/layout/AppShell";
import { MotionProvider } from "@components/motion/MotionProvider";
import { TooltipProvider } from "@components/ui/Tooltip";
import { Toaster } from "@components/ui/Toaster";
import { Spinner } from "@components/icons/animated";
import { ErrorBoundary } from "@components/ErrorBoundary";
import { ErrorPage } from "@components/errors/ErrorPage";
import { OfflineBanner } from "@components/errors/OfflineBanner";
import { ConsentGate } from "@components/ConsentGate";
import { needsConsent } from "@config/legal";
import { EditorPage } from "@pages/EditorPage";
import { hydrateLogStore } from "@store/log-store";
import { useSettingsStore } from "@store/settings-store";
import { useEditorStore } from "@store/editor-store";
import i18n from "@i18n/index";
import { IS_TAURI } from "@utils/platform";
import { applyHideScrollbars } from "@utils/scrollbars";

// The Editor is the landing page and stays in the entry bundle; Output is
// the usual next stop, so it is fetched as soon as the browser is idle.
const loadOutputPage = () => import("@pages/OutputPage");
const OutputPage = lazy(() => loadOutputPage().then((m) => ({ default: m.OutputPage })));
const ProfilesPage = lazy(() =>
  import("@pages/ProfilesPage").then((m) => ({ default: m.ProfilesPage })),
);
const HistoryPage = lazy(() =>
  import("@pages/HistoryPage").then((m) => ({ default: m.HistoryPage })),
);
const SettingsPage = lazy(() =>
  import("@pages/SettingsPage").then((m) => ({ default: m.SettingsPage })),
);
const BatchPage = lazy(() => import("@pages/BatchPage").then((m) => ({ default: m.BatchPage })));
const SocialPage = lazy(() => import("@pages/SocialPage").then((m) => ({ default: m.SocialPage })));
const PlaylistPage = lazy(() =>
  import("@pages/PlaylistPage").then((m) => ({ default: m.PlaylistPage })),
);
const LogPage = lazy(() => import("@pages/LogPage").then((m) => ({ default: m.LogPage })));
const AboutPage = lazy(() => import("@pages/AboutPage").then((m) => ({ default: m.AboutPage })));
// Lazy on purpose: the rendered legal HTML travels with this chunk only.
const LegalPage = lazy(() => import("@pages/LegalPage").then((m) => ({ default: m.LegalPage })));

/**
 * Real paths on the web (ytgenerator.stream serves the shell for every route,
 * and Cloudflare Web Analytics counts page views by path); hash routing inside
 * Tauri, whose asset protocol has no server-side fallback to rely on.
 */
const Router = IS_TAURI ? HashRouter : BrowserRouter;

function PageLoader() {
  const { t } = useTranslation("ui");
  return (
    <div
      role="status"
      className="text-text-muted flex items-center justify-center gap-2 p-16 text-sm"
    >
      <Spinner className="size-4" />
      {t("common.loading")}
    </div>
  );
}

/**
 * Wrap a lazy-loaded page in both a {@link Suspense} (for the dynamic
 * import) and an {@link ErrorBoundary} (for render errors). The
 * boundary sits *outside* Suspense so a thrown error during lazy
 * resolution also gets caught, not just errors from rendered children.
 * Each route gets its own boundary instance so a crash on one tab
 * cannot black-screen the whole app — the user can navigate elsewhere
 * and recover.
 */
function PageBoundary({ label, children }: { label: string; children: ReactNode }) {
  return (
    <ErrorBoundary label={label}>
      <Suspense fallback={<PageLoader />}>{children}</Suspense>
    </ErrorBoundary>
  );
}

/**
 * v0.28.0 first-run legal consent gate, as a layout route: until the user
 * accepts the current terms version, every app route renders the gate instead.
 * The Legal Center routes sit outside this guard so the gate can open each
 * document in place.
 */
function ConsentGuard() {
  const legalConsentVersion = useSettingsStore((s) => s.legalConsentVersion);
  return needsConsent(legalConsentVersion) ? <ConsentGate /> : <Outlet />;
}

export default function App() {
  useEffect(() => {
    // A first run has no saved draft yet: start it in the Default Output
    // Language from Settings rather than the editor's built-in English.
    try {
      if (localStorage.getItem("ytdescgen-editor-draft") === null) {
        useEditorStore.setState({
          language: useSettingsStore.getState().defaultOutputLanguage,
        });
      }
    } catch {
      // Storage unavailable (private mode): nothing to decide.
    }
  }, []);

  useEffect(() => {
    // Tauri: move data files older versions misplaced, start automatic
    // backups (desktop) — then load the logs, which that may have moved.
    // v0.17.0: the log store is hydrated from persisted JSONL files /
    // localStorage so prior-session entries surface in the Logs tab,
    // using the retention setting as it is at start-up.
    let stopAppData: (() => void) | undefined;
    let unmounted = false;
    const retentionDays = useSettingsStore.getState().logRetentionDays;
    const appData = IS_TAURI
      ? import("@utils/backup/startup").then((m) => m.startAppData())
      : Promise.resolve(undefined);
    void appData
      .then((stop) => {
        if (unmounted) stop?.();
        else stopAppData = stop;
      })
      .catch(() => undefined)
      .finally(() => void hydrateLogStore(retentionDays));

    const prefetch = () => void loadOutputPage().catch(() => undefined);
    const cancelPrefetch =
      "requestIdleCallback" in window
        ? (() => {
            const id = window.requestIdleCallback(prefetch, { timeout: 4000 });
            return () => window.cancelIdleCallback(id);
          })()
        : (() => {
            const timer = setTimeout(prefetch, 1500);
            return () => clearTimeout(timer);
          })();
    return () => {
      unmounted = true;
      stopAppData?.();
      cancelPrefetch();
    };
  }, []);

  // v0.18.0: bridge the persisted `appLanguage` setting back to i18next.
  //
  // i18n is initialised synchronously at module load with `fallbackLng:
  // "en"` and no `lng` field — so on a fresh app boot the UI renders in
  // English even when the saved settings hold another language. Zustand's
  // persist middleware rehydrates the store synchronously from localStorage
  // *before* React mounts, so:
  //
  //   1. Read the current `appLanguage` at mount time and push it into
  //      i18n — handles the hydrate.
  //   2. Subscribe to later changes so a restored backup (and any
  //      user-driven switch via Header / SettingsPage) also propagates.
  useEffect(() => {
    const initialLang = useSettingsStore.getState().appLanguage;
    if (initialLang && i18n.language !== initialLang) {
      void i18n.changeLanguage(initialLang);
    }
    const unsub = useSettingsStore.subscribe((state, prev) => {
      if (state.appLanguage !== prev.appLanguage) {
        void i18n.changeLanguage(state.appLanguage);
      }
    });
    return () => unsub();
  }, []);

  // v1.1.0: keep <html class="hide-scrollbars"> in step with the setting.
  // theme-init.js and main.tsx apply it before first paint; the Settings
  // toggle, a restored backup and its undo all arrive here.
  useEffect(() => {
    applyHideScrollbars(useSettingsStore.getState().hideScrollbars);
    return useSettingsStore.subscribe((state, prev) => {
      if (state.hideScrollbars !== prev.hideScrollbars) applyHideScrollbars(state.hideScrollbars);
    });
  }, []);

  return (
    <MotionProvider>
      <TooltipProvider>
        <Router>
          <Routes>
            <Route
              path="/legal"
              element={
                <PageBoundary label="Legal">
                  <LegalPage />
                </PageBoundary>
              }
            />
            <Route
              path="/legal/:docId"
              element={
                <PageBoundary label="Legal">
                  <LegalPage />
                </PageBoundary>
              }
            />
            <Route element={<ConsentGuard />}>
              <Route element={<AppShell />}>
                <Route
                  index
                  element={
                    <ErrorBoundary label="Editor">
                      <EditorPage />
                    </ErrorBoundary>
                  }
                />
                <Route
                  path="output"
                  element={
                    <PageBoundary label="Output">
                      <OutputPage />
                    </PageBoundary>
                  }
                />
                <Route
                  path="profiles"
                  element={
                    <PageBoundary label="Profiles">
                      <ProfilesPage />
                    </PageBoundary>
                  }
                />
                <Route
                  path="history"
                  element={
                    <PageBoundary label="History">
                      <HistoryPage />
                    </PageBoundary>
                  }
                />
                <Route
                  path="settings"
                  element={
                    <PageBoundary label="Settings">
                      <SettingsPage />
                    </PageBoundary>
                  }
                />
                <Route
                  path="batch"
                  element={
                    <PageBoundary label="Batch">
                      <BatchPage />
                    </PageBoundary>
                  }
                />
                <Route
                  path="social"
                  element={
                    <PageBoundary label="Social">
                      <SocialPage />
                    </PageBoundary>
                  }
                />
                <Route
                  path="playlist"
                  element={
                    <PageBoundary label="Playlist">
                      <PlaylistPage />
                    </PageBoundary>
                  }
                />
                <Route
                  path="logs"
                  element={
                    <PageBoundary label="Logs">
                      <LogPage />
                    </PageBoundary>
                  }
                />
                <Route
                  path="about"
                  element={
                    <PageBoundary label="About">
                      <AboutPage />
                    </PageBoundary>
                  }
                />
              </Route>
              {/* Designed error pages — siblings of the AppShell group so they
              render full-screen with no Sidebar/Header. `403/419/500` are
              route-reachable for future triggers; `*` is the live 404 for
              any mistyped path. */}
              <Route path="/403" element={<ErrorPage kind="forbidden" />} />
              <Route path="/419" element={<ErrorPage kind="expired" />} />
              <Route path="/500" element={<ErrorPage kind="serverError" />} />
              <Route path="/offline" element={<ErrorPage kind="offline" />} />
              <Route path="*" element={<ErrorPage kind="notFound" />} />
            </Route>
          </Routes>
          <OfflineBanner />
        </Router>
        <Toaster />
      </TooltipProvider>
    </MotionProvider>
  );
}
