import { useTranslation } from "react-i18next";
import { House, ArrowLeft, RotateCw, RotateCcw, Bug } from "lucide-react";
import clsx from "clsx";
import { Button } from "@components/ui/Button";
import { useDocumentTitle } from "@hooks/use-document-title";
import { ABOUT } from "@config/about";
import { resolveErrorMeta, severityTextClass, type ErrorKind } from "@config/error-pages";

interface ErrorPageProps {
  /** Which designed error to render. */
  kind: ErrorKind;
  /** `fullscreen` (default) for standalone routes — no app shell. `contained`
   *  for the in-place {@link import("@components/ErrorBoundary").ErrorBoundary}
   *  fallback card. */
  variant?: "fullscreen" | "contained";
  /** Reset handler for the `contained` boundary fallback ("Try again"). */
  onReset?: () => void;
  /** Optional technical detail (error message) shown in the contained card. */
  detail?: string;
}

/**
 * Shared presentational error page, dispatching to a full-screen route page or
 * the contained boundary card.
 *
 * Intentionally **router-agnostic**: the root ErrorBoundary in `main.tsx`
 * mounts *outside* `<HashRouter>`, so calling `useNavigate()` here would throw
 * "useNavigate may be used only in the context of a Router" inside the very
 * crash path it is meant to handle. Navigation is therefore plain hash anchors
 * (`#/`) + `history.back()`, which work whether or not a Router is above.
 *
 * The dispatcher itself calls no hooks, so each variant component owns its own
 * unconditional hook calls (no hook-order hazard across the branch).
 */
export function ErrorPage(props: ErrorPageProps) {
  return props.variant === "contained" ? (
    <ContainedError {...props} />
  ) : (
    <FullscreenError {...props} />
  );
}

function FullscreenError({ kind }: ErrorPageProps) {
  const { t } = useTranslation("ui");
  const meta = resolveErrorMeta(kind);
  const Icon = meta.icon;
  const colour = severityTextClass(meta.severity);
  const title = t(`errorPages.${meta.keyPrefix}.title`);
  const description = t(`errorPages.${meta.keyPrefix}.description`);
  const canReload = kind === "serverError" || kind === "runtime";

  useDocumentTitle(title);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-surface-0 px-6 py-12 text-center">
      <Icon className={clsx("h-16 w-16", colour)} aria-hidden />
      {meta.code !== null && (
        <p className={clsx("font-mono text-6xl font-bold tabular-nums leading-none", colour)}>
          {meta.code}
        </p>
      )}
      <div className="max-w-md space-y-2">
        <h1 className="text-2xl font-semibold text-text-primary">{title}</h1>
        <p className="text-sm text-text-secondary">{description}</p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button
          variant="primary"
          onClick={() => {
            window.location.hash = "#/";
          }}
        >
          <House className="h-4 w-4" />
          {t("errorPages.actions.home")}
        </Button>
        <Button variant="secondary" onClick={() => window.history.back()}>
          <ArrowLeft className="h-4 w-4" />
          {t("errorPages.actions.back")}
        </Button>
        {canReload && (
          <Button variant="secondary" onClick={() => window.location.reload()}>
            <RotateCw className="h-4 w-4" />
            {t("errorPages.actions.reload")}
          </Button>
        )}
        <ReportBugLink />
      </div>
    </div>
  );
}

function ContainedError({ kind, onReset, detail }: ErrorPageProps) {
  const { t } = useTranslation("ui");
  const meta = resolveErrorMeta(kind);
  const Icon = meta.icon;
  const colour = severityTextClass(meta.severity);
  const title = t(`errorPages.${meta.keyPrefix}.title`);
  const description = t(`errorPages.${meta.keyPrefix}.description`);

  return (
    <div className="flex min-h-[200px] items-center justify-center p-6">
      <div className="border-danger/40 w-full max-w-md rounded-lg border bg-surface-2 p-5 shadow-md shadow-black/10">
        <div className={clsx("mb-3 flex items-center gap-2", colour)}>
          <Icon className="h-4 w-4" />
          <h2 className="text-sm font-semibold">{title}</h2>
        </div>
        <p className="mb-3 text-xs text-text-secondary">{description}</p>
        {detail && (
          <pre className="mb-4 max-h-32 overflow-auto whitespace-pre-wrap rounded bg-surface-3 p-2 text-[11px] text-text-muted">
            {detail}
          </pre>
        )}
        <div className="flex flex-wrap items-center gap-2">
          {onReset && (
            <Button variant="primary" size="sm" onClick={onReset}>
              <RotateCcw className="h-3.5 w-3.5" />
              {t("errorPages.actions.retry")}
            </Button>
          )}
          <Button variant="secondary" size="sm" onClick={() => window.location.reload()}>
            <RotateCw className="h-3.5 w-3.5" />
            {t("errorPages.actions.reload")}
          </Button>
          <ReportBugLink size="sm" />
        </div>
      </div>
    </div>
  );
}

/** External "report a bug" link, styled to match the `ghost` Button. */
function ReportBugLink({ size = "md" }: { size?: "sm" | "md" }) {
  const { t } = useTranslation("ui");
  const sizeClass =
    size === "sm" ? "min-h-[36px] px-2.5 py-1 text-xs" : "min-h-touch px-4 py-2 text-sm";
  const iconClass = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";
  return (
    <a
      href={ABOUT.bugReportUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={clsx(
        "focus:ring-accent/50 inline-flex items-center justify-center gap-2 rounded-lg font-medium text-text-secondary transition-colors hover:bg-surface-2 hover:text-text-primary focus:outline-none focus:ring-2",
        sizeClass,
      )}
    >
      <Bug className={iconClass} />
      {t("errorPages.actions.reportBug")}
    </a>
  );
}
