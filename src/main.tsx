import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { ErrorBoundary } from "./components/ErrorBoundary";
import "./styles/globals.css";

const root = document.getElementById("root");
if (!root) throw new Error("Root element not found");

// Top-level safety net. Per-route boundaries in App.tsx catch most
// errors with route-specific labels; this outer one only fires if
// something explodes *before* the router mounts (e.g. i18n init, store
// rehydrate). Without it, a top-level crash still produces a black
// page — defeating the point of per-route boundaries.
createRoot(root).render(
  <StrictMode>
    <ErrorBoundary label="app">
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
