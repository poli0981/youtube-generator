import { HashRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AppShell } from "@components/layout/AppShell";
import { EditorPage } from "@pages/EditorPage";
import { OutputPage } from "@pages/OutputPage";
import "@i18n/index";

export default function App() {
  return (
    <>
      <HashRouter>
        <Routes>
          <Route element={<AppShell />}>
            <Route index element={<EditorPage />} />
            <Route path="output" element={<OutputPage />} />
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
