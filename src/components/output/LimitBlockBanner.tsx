import { AlertTriangle } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { OutputLimitStatus } from "@engine/limits";

interface LimitBlockBannerProps {
  status: OutputLimitStatus;
  /** Optional override for the heading — Batch uses a Copy-All-specific one. */
  titleKey?: string;
}

/**
 * Explains why copying is disabled, naming each offending field with its count.
 *
 * Without this, a disabled Copy button is just a dead control. The counts come
 * from the engine's warnings rather than `CharLimitWarning.message`, which is a
 * hardcoded English string.
 */
export function LimitBlockBanner({ status, titleKey }: LimitBlockBannerProps) {
  const { t } = useTranslation("ui");
  if (!status.blocked) return null;

  return (
    <div
      role="alert"
      className="border-danger/40 bg-danger/10 flex flex-col gap-1 rounded-lg border px-3 py-2 text-xs text-danger"
    >
      <span className="flex items-center gap-1.5 font-semibold">
        <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
        {t(titleKey ?? "output.limits.bannerTitle")}
      </span>
      <ul className="flex flex-col gap-0.5 pl-5">
        {status.overflows.map((o) => (
          <li key={o.field}>
            {t("output.limits.fieldLine", {
              field: t(`output.${o.field}`),
              count: o.current,
              limit: o.limit,
            })}
          </li>
        ))}
      </ul>
      <span className="text-text-muted">{t("output.limits.bannerHint")}</span>
    </div>
  );
}
