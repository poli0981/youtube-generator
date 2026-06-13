import { Component, type ErrorInfo, type ReactNode } from "react";
import { ErrorPage } from "@components/errors/ErrorPage";

interface ErrorBoundaryProps {
  /** Children to render normally. The boundary only kicks in on render
   *  errors thrown inside this subtree. */
  children: ReactNode;
  /** Human label that appears in the fallback UI to tell the user
   *  *what* crashed (e.g. "Profiles tab", "Editor"). Defaults to a
   *  generic "this section" copy so the boundary still degrades nicely
   *  if a caller forgets the prop. */
  label?: string;
  /** Optional callback fired on every catch — useful in tests, or to
   *  funnel boundary errors into a centralised reporter. The component
   *  also logs to `useLogStore` directly so the in-app Log tab gets a
   *  copy regardless. */
  onError?: (error: Error, info: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  error: Error | null;
}

/**
 * Class-based React error boundary — there is still no hook equivalent
 * in React 18 (and as of React 19 only `useErrorBoundary` from external
 * libraries cover the gap). Catches *render-time* exceptions from any
 * descendant component and swaps in a fallback UI so the rest of the
 * app keeps working.
 *
 * Motivation: v0.13.x had no boundary anywhere, so any render error —
 * most commonly `Cannot convert undefined or null to object` when a
 * malformed profile / template was loaded via Object spread — escalated
 * into a black-screen crash. The boundary nets those errors at the
 * route level, surfaces a recovery affordance, and writes a structured
 * entry to the in-app log tab so the user can copy it into a bug
 * report.
 *
 * Per-route boundaries (one per `<Route>`) mean a crash on the Profiles
 * tab does not take down the Editor — the user can navigate away,
 * adjust state, and click "Try again" to remount the broken subtree.
 *
 * Does NOT catch: async errors (Promise rejections), event-handler
 * errors, SSR errors. For those use try/catch + the in-app logger
 * directly (see `SettingsPage.importSettingsFromFile`).
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // Best-effort: pull the in-app logger lazily so the boundary stays
    // importable from non-React entry points. We never let the logger
    // itself throw a secondary error — if the log store is missing we
    // fall back to the browser console.
    try {
      // Dynamic import dodges a circular dep with files that themselves
      // import ErrorBoundary, e.g. when the boundary is mounted in
      // main.tsx before the store has registered.
      void import("@utils/logger").then(({ logger }) => {
        logger.error(
          "errorBoundary",
          `[${this.props.label ?? "app"}] ${error.message}`,
          info.componentStack ?? error.stack ?? "",
        );
      });
    } catch {
      console.error("ErrorBoundary caught:", error, info);
    }
    this.props.onError?.(error, info);
  }

  private handleReset = (): void => {
    this.setState({ error: null });
  };

  render(): ReactNode {
    if (!this.state.error) return this.props.children;

    // The visible copy is now generic + localized via the shared ErrorPage
    // (contained variant). The `label` is still logged in componentDidCatch
    // so bug reports keep the "which subtree crashed" context.
    return (
      <ErrorPage
        kind="runtime"
        variant="contained"
        onReset={this.handleReset}
        detail={this.state.error.message}
      />
    );
  }
}
