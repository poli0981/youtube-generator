import { useTranslation } from "react-i18next";
import { House, ArrowLeft, RotateCw, RotateCcw, Bug } from "lucide-react";
import clsx from "clsx";
import { Button } from "@components/ui/Button";
import { Card } from "@components/ui/Card";
import { Logo } from "@components/brand/Logo";
import { useDocumentTitle } from "@hooks/use-document-title";
import { ABOUT } from "@config/about";
import { IS_TAURI } from "@utils/platform";
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
 * mounts *outside* the router, so calling `useNavigate()` here would throw
 * "useNavigate may be used only in the context of a Router" inside the very
 * crash path it is meant to handle. Navigation is therefore a plain location
 * change ({@link goHome}) + `history.back()`, which work whether or not a
 * Router is above.
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

/** Home without a router: hash routing in Tauri, real paths on the web. */
function goHome(): void {
  if (IS_TAURI) window.location.hash = "#/";
  else window.location.assign("/");
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
    <main className="bg-surface-0 relative flex min-h-dvh flex-col items-center justify-center gap-6 overflow-hidden px-6 py-12 text-center">
      <div
        className="bg-brand-gradient pointer-events-none absolute top-0 left-1/2 h-64 w-[36rem] max-w-full -translate-x-1/2 rounded-full opacity-10 blur-3xl"
        aria-hidden="true"
      />
      <Logo className="relative size-10" />
      <div className="relative flex flex-col items-center gap-3">
        <Icon className={clsx("size-12", colour)} aria-hidden />
        {meta.code !== null && (
          <p className={clsx("font-mono text-6xl leading-none font-bold tabular-nums", colour)}>
            {meta.code}
          </p>
        )}
      </div>
      <div className="relative max-w-md space-y-2">
        <h1 className="text-text-primary text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="text-text-secondary text-sm">{description}</p>
      </div>
      <div className="relative flex flex-wrap items-center justify-center gap-2">
        <Button variant="primary" onClick={goHome}>
          <House />
          {t("errorPages.actions.home")}
        </Button>
        <Button variant="secondary" onClick={() => window.history.back()}>
          <ArrowLeft />
          {t("errorPages.actions.back")}
        </Button>
        {canReload && (
          <Button variant="secondary" onClick={() => window.location.reload()}>
            <RotateCw />
            {t("errorPages.actions.reload")}
          </Button>
        )}
        <ReportBugLink />
      </div>
    </main>
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
      <Card className="border-danger/40 w-full max-w-md p-5">
        <div className={clsx("mb-3 flex items-center gap-2", colour)}>
          <Icon className="size-4" aria-hidden />
          <h2 className="text-sm font-semibold">{title}</h2>
        </div>
        <p className="text-text-secondary mb-3 text-xs">{description}</p>
        {detail && (
          <pre className="bg-surface-0 border-border text-text-muted mb-4 max-h-32 scrollbar-thin overflow-auto rounded-lg border p-2 font-mono text-[11px] whitespace-pre-wrap">
            {detail}
          </pre>
        )}
        <div className="flex flex-wrap items-center gap-2">
          {onReset && (
            <Button variant="primary" size="sm" onClick={onReset}>
              <RotateCcw />
              {t("errorPages.actions.retry")}
            </Button>
          )}
          <Button variant="secondary" size="sm" onClick={() => window.location.reload()}>
            <RotateCw />
            {t("errorPages.actions.reload")}
          </Button>
          <ReportBugLink size="sm" />
        </div>
      </Card>
    </div>
  );
}

/** External "report a bug" link, styled as a ghost button. */
function ReportBugLink({ size = "md" }: { size?: "sm" | "md" }) {
  const { t } = useTranslation("ui");
  return (
    <Button asChild variant="ghost" size={size}>
      <a href={ABOUT.bugReportUrl} target="_blank" rel="noopener noreferrer">
        <Bug aria-hidden="true" />
        {t("errorPages.actions.reportBug")}
      </a>
    </Button>
  );
}
