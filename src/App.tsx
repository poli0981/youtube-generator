import { lazy, Suspense } from "react";
import { HashRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AppShell } from "@components/layout/AppShell";
import { EditorPage } from "@pages/EditorPage";
import { OutputPage } from "@pages/OutputPage";
import "@i18n/index";

const ProfilesPage = lazy(() =>
  import("@pages/ProfilesPage").then((m) => ({ default: m.ProfilesPage })),
);
const HistoryPage = lazy(() =>
  import("@pages/HistoryPage").then((m) => ({ default: m.HistoryPage })),
);
const SettingsPage = lazy(() =>
  import("@pages/SettingsPage").then((m) => ({ default: m.SettingsPage })),
);
const BatchPage = lazy(() =>
  import("@pages/BatchPage").then((m) => ({ default: m.BatchPage })),
);

function PageLoader() {
  return <div className="flex items-center justify-center p-12 text-text-muted">Loading...</div>;
}

export default function App() {
  return (
    <>
      <HashRouter>
        <Routes>
          <Route element={<AppShell />}>
            <Route index element={<EditorPage />} />
            <Route path="output" element={<OutputPage />} />
            <Route
              path="profiles"
              element={
                <Suspense fallback={<PageLoader />}>
                  <ProfilesPage />
                </Suspense>
              }
            />
            <Route
              path="history"
              element={
                <Suspense fallback={<PageLoader />}>
                  <HistoryPage />
                </Suspense>
              }
            />
            <Route
              path="settings"
              element={
                <Suspense fallback={<PageLoader />}>
                  <SettingsPage />
                </Suspense>
              }
            />
            <Route
              path="batch"
              element={
                <Suspense fallback={<PageLoader />}>
                  <BatchPage />
                </Suspense>
              }
            />
          </Route>
        </Routes>
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
