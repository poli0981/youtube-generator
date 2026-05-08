import { useTranslation } from "react-i18next";
import { useGeneratedOutput } from "@hooks/use-generated-output";
import { useSettingsStore } from "@store/settings-store";
import { CopyButton } from "./CopyButton";
import { CharCounter } from "./CharCounter";
import { YT_LIMITS } from "@engine/types";
import type { GeneratorOutput } from "@engine/types";

interface OutputPreviewProps {
  output?: GeneratorOutput;
}

export function OutputPreview({ output: outputProp }: OutputPreviewProps) {
  const { t } = useTranslation("ui");
  const defaultOutput = useGeneratedOutput();
  const { showCharCount, compactTagDisplay } = useSettingsStore();
  const output = outputProp ?? defaultOutput;

  return (
    <div className="flex flex-col gap-6">
      {/* Title */}
      <section className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-text-primary">{t("output.title")}</h3>
          <div className="flex items-center gap-3">
            {showCharCount && <CharCounter text={output.title} limit={YT_LIMITS.TITLE_MAX} />}
            <CopyButton
              text={output.title}
              label={t("output.copyTitle")}
              limit={YT_LIMITS.TITLE_MAX}
              fieldLabel={t("output.title")}
            />
          </div>
        </div>
        <div className="rounded-lg border border-border bg-surface-1 p-3">
          <p className="text-sm font-medium text-text-primary">{output.title}</p>
        </div>
      </section>

      {/* Description */}
      <section className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-text-primary">{t("output.description")}</h3>
          <div className="flex items-center gap-3">
            {showCharCount && <CharCounter text={output.description} limit={YT_LIMITS.DESCRIPTION_MAX} />}
            <CopyButton
              text={output.description}
              label={t("output.copyDescription")}
              limit={YT_LIMITS.DESCRIPTION_MAX}
              fieldLabel={t("output.description")}
            />
          </div>
        </div>
        <div className="max-h-[400px] overflow-y-auto rounded-lg border border-border bg-surface-1 p-3">
          <pre className="whitespace-pre-wrap font-sans text-sm text-text-secondary">
            {output.description}
          </pre>
        </div>
      </section>

      {/* Tags */}
      <section className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-text-primary">
            {t("output.tags")} ({output.tags.length})
          </h3>
          <div className="flex items-center gap-3">
            {showCharCount && <CharCounter text={output.tagString} limit={YT_LIMITS.TAGS_MAX} />}
            <CopyButton
              text={output.tagString}
              label={t("output.copyTags")}
              limit={YT_LIMITS.TAGS_MAX}
              fieldLabel={t("output.tags")}
            />
          </div>
        </div>
        <div className="rounded-lg border border-border bg-surface-1 p-3">
          {compactTagDisplay ? (
            <p className="text-xs text-text-secondary">{output.tagString}</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {output.tags.map((tag, i) => (
                <span
                  key={i}
                  className="rounded-md bg-surface-2 px-2 py-0.5 text-xs text-text-secondary"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
