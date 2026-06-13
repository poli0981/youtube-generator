import {
  SearchX,
  ShieldX,
  Clock,
  ServerCrash,
  WifiOff,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react";

/**
 * The set of error "kinds" the app can present.
 *
 * YTDescGen is a pure-client SPA (HashRouter, no backend), so `forbidden` /
 * `expired` / `serverError` never arise from the app's own logic today — they
 * exist as designed, route-reachable pages (`/#/403`, `/#/419`, `/#/500`)
 * ready to be wired to future triggers (a Tauri command failure, a future
 * sync backend). The kinds that *do* fire:
 *   - `notFound` — the catch-all `*` route (a mistyped hash path)
 *   - `offline`  — `navigator.onLine` flips false (see use-online-status)
 *   - `runtime`  — a render crash caught by ErrorBoundary
 */
export type ErrorKind =
  | "notFound"
  | "forbidden"
  | "expired"
  | "serverError"
  | "offline"
  | "runtime";

type ErrorSeverity = "accent" | "danger" | "warning";

export interface ErrorPageMeta {
  /** HTTP-style status shown large on the page, or `null` for the non-HTTP
   *  states (offline / runtime crash) that have no meaningful code. */
  readonly code: number | null;
  /** lucide icon rendered above the code. */
  readonly icon: LucideIcon;
  /** i18n key prefix under `ui:errorPages.*` for `.title` / `.description`. */
  readonly keyPrefix: string;
  /** Drives the icon/code colour token — see {@link severityTextClass}. */
  readonly severity: ErrorSeverity;
}

/**
 * `serverError` deliberately covers 408 + the whole 5xx family — one design,
 * one locale set. Kept exhaustive over {@link ErrorKind} via `satisfies` so a
 * newly-added kind fails the build until it is mapped here.
 */
export const ERROR_PAGES = {
  notFound: { code: 404, icon: SearchX, keyPrefix: "notFound", severity: "accent" },
  forbidden: { code: 403, icon: ShieldX, keyPrefix: "forbidden", severity: "danger" },
  expired: { code: 419, icon: Clock, keyPrefix: "expired", severity: "warning" },
  serverError: { code: 500, icon: ServerCrash, keyPrefix: "serverError", severity: "danger" },
  offline: { code: null, icon: WifiOff, keyPrefix: "offline", severity: "warning" },
  runtime: { code: null, icon: TriangleAlert, keyPrefix: "runtime", severity: "danger" },
} as const satisfies Record<ErrorKind, ErrorPageMeta>;

/** Look up the presentation metadata for an error kind. */
export function resolveErrorMeta(kind: ErrorKind): ErrorPageMeta {
  return ERROR_PAGES[kind];
}

/** Map a severity to its Tailwind text-colour token. */
export function severityTextClass(severity: ErrorPageMeta["severity"]): string {
  return severity === "danger"
    ? "text-danger"
    : severity === "warning"
      ? "text-warning"
      : "text-accent";
}
