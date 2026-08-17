import { useTranslation } from "react-i18next";
import { useGeneratedOutput } from "@hooks/use-generated-output";

export function QuickPreview() {
  const { t } = useTranslation("ui");
  const output = useGeneratedOutput();

  return (
    <div className="border-border bg-surface-1 flex flex-col gap-3 rounded-lg border p-4">
      <span className="text-text-secondary text-sm font-medium">{t("editor.quickPreview")}</span>

      <div className="flex flex-col gap-2">
        <div>
          <span className="text-text-muted text-xs font-medium uppercase">{t("output.title")}</span>
          <p className="text-text-primary mt-1 text-sm font-medium">{output.title || "..."}</p>
        </div>

        <div>
          <span className="text-text-muted text-xs font-medium uppercase">
            {t("output.description")}
          </span>
          <p className="text-text-secondary mt-1 line-clamp-3 text-xs whitespace-pre-wrap">
            {output.description || "..."}
          </p>
        </div>

        <div>
          <span className="text-text-muted text-xs font-medium uppercase">
            {t("output.tags")} ({output.tags.length})
          </span>
          <p className="text-text-muted mt-1 line-clamp-2 text-xs">{output.tagString || "..."}</p>
        </div>
      </div>
    </div>
  );
}
