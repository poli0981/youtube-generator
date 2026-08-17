import { useTranslation } from "react-i18next";
import { useGeneratedOutput } from "@hooks/use-generated-output";
import { useSettingsStore } from "@store/settings-store";
import { CopyButton } from "./CopyButton";
import { CharCounter } from "./CharCounter";
import { YT_LIMITS } from "@engine/types";
import type { GeneratorOutput } from "@engine/types";
import type { OutputLimitStatus } from "@engine/limits";

interface OutputPreviewProps {
  output?: GeneratorOutput;
  /**
   * Over-limit status of the output actually shown. All three copy buttons are
   * gated on it together — see `CopyButton.blocked` for why it is
   * all-or-nothing rather than per field.
   */
  status: OutputLimitStatus;
}

export function OutputPreview({ output: outputProp, status }: OutputPreviewProps) {
  const { t } = useTranslation("ui");
  const defaultOutput = useGeneratedOutput();
  const { showCharCount, compactTagDisplay } = useSettingsStore();
  const output = outputProp ?? defaultOutput;

  return (
    <div className="flex flex-col gap-6">
      {/* Title */}
      <section className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h3 className="text-text-primary text-sm font-semibold">{t("output.title")}</h3>
          <div className="flex items-center gap-3">
            {showCharCount && <CharCounter text={output.title} limit={YT_LIMITS.TITLE_MAX} />}
            <CopyButton
              text={output.title}
              label={t("output.copyTitle")}
              limit={YT_LIMITS.TITLE_MAX}
              fieldLabel={t("output.title")}
              blocked={status.blocked}
            />
          </div>
        </div>
        <div className="border-border bg-surface-1 rounded-lg border p-3">
          <p className="text-text-primary text-sm font-medium">{output.title}</p>
        </div>
      </section>

      {/* Description */}
      <section className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h3 className="text-text-primary text-sm font-semibold">{t("output.description")}</h3>
          <div className="flex items-center gap-3">
            {showCharCount && (
              <CharCounter text={output.description} limit={YT_LIMITS.DESCRIPTION_MAX} />
            )}
            <CopyButton
              text={output.description}
              label={t("output.copyDescription")}
              limit={YT_LIMITS.DESCRIPTION_MAX}
              fieldLabel={t("output.description")}
              blocked={status.blocked}
            />
          </div>
        </div>
        <div className="border-border bg-surface-1 max-h-[60vh] overflow-y-auto rounded-lg border p-3 sm:max-h-[400px]">
          <pre className="text-text-secondary font-sans text-sm whitespace-pre-wrap">
            {output.description}
          </pre>
        </div>
      </section>

      {/* Tags */}
      <section className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h3 className="text-text-primary text-sm font-semibold">
            {t("output.tags")} ({output.tags.length})
          </h3>
          <div className="flex items-center gap-3">
            {showCharCount && <CharCounter text={output.tagString} limit={YT_LIMITS.TAGS_MAX} />}
            <CopyButton
              text={output.tagString}
              label={t("output.copyTags")}
              limit={YT_LIMITS.TAGS_MAX}
              fieldLabel={t("output.tags")}
              blocked={status.blocked}
            />
          </div>
        </div>
        <div className="border-border bg-surface-1 rounded-lg border p-3">
          {compactTagDisplay ? (
            <p className="text-text-secondary text-xs">{output.tagString}</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {output.tags.map((tag, i) => (
                <span
                  key={i}
                  className="bg-surface-2 text-text-secondary rounded-md px-2 py-0.5 text-xs"
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
