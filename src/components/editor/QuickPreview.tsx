import { useTranslation } from "react-i18next";
import { useGeneratedOutput } from "@hooks/use-generated-output";

export function QuickPreview() {
  const { t } = useTranslation("ui");
  const output = useGeneratedOutput();

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-surface-1 p-4">
      <span className="text-sm font-medium text-text-secondary">{t("editor.quickPreview")}</span>

      <div className="flex flex-col gap-2">
        <div>
          <span className="text-xs font-medium uppercase text-text-muted">
            {t("output.title")}
          </span>
          <p className="mt-1 text-sm font-medium text-text-primary">
            {output.title || "..."}
          </p>
        </div>

        <div>
          <span className="text-xs font-medium uppercase text-text-muted">
            {t("output.description")}
          </span>
          <p className="mt-1 line-clamp-3 whitespace-pre-wrap text-xs text-text-secondary">
            {output.description || "..."}
          </p>
        </div>

        <div>
          <span className="text-xs font-medium uppercase text-text-muted">
            {t("output.tags")} ({output.tags.length})
          </span>
          <p className="mt-1 line-clamp-2 text-xs text-text-muted">
            {output.tagString || "..."}
          </p>
        </div>
      </div>
    </div>
  );
}
