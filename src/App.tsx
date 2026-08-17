import { lazy, Suspense, useEffect, type ReactNode } from "react";
import { HashRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import toast from "react-hot-toast";
import { AppShell } from "@components/layout/AppShell";
import { ErrorBoundary } from "@components/ErrorBoundary";
import { ErrorPage } from "@components/errors/ErrorPage";
import { OfflineBanner } from "@components/errors/OfflineBanner";
import { ConsentGate } from "@components/ConsentGate";
import { needsConsent } from "@config/legal";
import { EditorPage } from "@pages/EditorPage";
import { OutputPage } from "@pages/OutputPage";
import { checkDataFileHealth } from "@utils/storage-adapter";
import { hydrateLogStore } from "@store/log-store";
import { useSettingsStore } from "@store/settings-store";
import i18n from "@i18n/index";

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

function PageLoader() {
  return <div className="flex items-center justify-center p-12 text-text-muted">Loading...</div>;
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

export default function App() {
  useEffect(() => {
    checkDataFileHealth().then((msg) => {
      if (msg) toast(msg, { icon: "⚠️", duration: 5000 });
    });
    // v0.17.0: hydrate the log store from persisted JSONL files /
    // localStorage so prior-session entries surface in the Logs tab
    // accordion. Uses the current `logRetentionDays` setting — read
    // directly off the store at mount time so we don't rerun on
    // every settings tweak.
    const retentionDays = useSettingsStore.getState().logRetentionDays;
    void hydrateLogStore(retentionDays);
  }, []);

  // v0.18.0: bridge the persisted `appLanguage` setting back to i18next.
  //
  // i18n is initialised synchronously at module load with `fallbackLng:
  // "en"` and no `lng` field — so on a fresh app boot the UI renders in
  // English even when localStorage / settings.json contain a non-English
  // preference. Zustand's persist middleware rehydrates the store
  // synchronously from localStorage *before* React mounts, and the
  // storage-adapter then *asynchronously* reads the Tauri `settings.json`
  // and may overwrite the value again. We cover both paths:
  //
  //   1. Read the current `appLanguage` at mount time and push it into
  //      i18n — handles the synchronous localStorage hydrate.
  //   2. Subscribe to subsequent changes so the async Tauri rehydrate
  //      (and any future user-driven switch via Header / SettingsPage)
  //      also propagates. The Header/SettingsPage callsites still call
  //      `i18n.changeLanguage` directly, which is now redundant but
  //      harmless — the subscribe is the single source of truth.
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

  // v0.28.0: first-run legal consent gate. Until the user accepts the current
  // terms version, render the gate INSTEAD of the router so nothing in the app
  // is reachable. The whole tree stays inside the root ErrorBoundary
  // (main.tsx), so a gate render error still degrades to the error page.
  const legalConsentVersion = useSettingsStore((s) => s.legalConsentVersion);

  if (needsConsent(legalConsentVersion)) {
    return (
      <>
        <ConsentGate />
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: "var(--surface-2)",
              color: "var(--text-primary)",
              border: "1px solid var(--border)",
            },
          }}
        />
      </>
    );
  }

  return (
    <>
      <HashRouter>
        <Routes>
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
                <ErrorBoundary label="Output">
                  <OutputPage />
                </ErrorBoundary>
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
              any mistyped hash path. */}
          <Route path="/403" element={<ErrorPage kind="forbidden" />} />
          <Route path="/419" element={<ErrorPage kind="expired" />} />
          <Route path="/500" element={<ErrorPage kind="serverError" />} />
          <Route path="/offline" element={<ErrorPage kind="offline" />} />
          <Route path="*" element={<ErrorPage kind="notFound" />} />
        </Routes>
        <OfflineBanner />
      </HashRouter>
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: "var(--surface-2)",
            color: "var(--text-primary)",
            border: "1px solid var(--border)",
          },
        }}
      />
    </>
  );
}
