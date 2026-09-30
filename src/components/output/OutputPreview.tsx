import { useTranslation } from "react-i18next";
import { FileText, Tags, Type } from "lucide-react";
import { useGeneratedOutput } from "@hooks/use-generated-output";
import { useSettingsStore } from "@store/settings-store";
import { CopyButton } from "./CopyButton";
import { CharCounter } from "./CharCounter";
import { OutputField, OutputText } from "./OutputField";
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
  const showCharCount = useSettingsStore((s) => s.showCharCount);
  const compactTagDisplay = useSettingsStore((s) => s.compactTagDisplay);
  const output = outputProp ?? defaultOutput;

  return (
    <div className="flex flex-col gap-4">
      <OutputField
        title={t("output.title")}
        icon={Type}
        actions={
          <>
            {showCharCount && <CharCounter text={output.title} limit={YT_LIMITS.TITLE_MAX} />}
            <CopyButton
              text={output.title}
              label={t("output.copyTitle")}
              limit={YT_LIMITS.TITLE_MAX}
              fieldLabel={t("output.title")}
              blocked={status.blocked}
            />
          </>
        }
      >
        <p className="bg-surface-0 border-border text-text-primary rounded-lg border p-3 text-[0.9375rem] font-medium">
          {output.title || "…"}
        </p>
      </OutputField>

      <OutputField
        title={t("output.description")}
        icon={FileText}
        actions={
          <>
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
          </>
        }
      >
        <OutputText tall>{output.description || "…"}</OutputText>
      </OutputField>

      <OutputField
        title={`${t("output.tags")} · ${output.tags.length}`}
        icon={Tags}
        actions={
          <>
            {showCharCount && <CharCounter text={output.tagString} limit={YT_LIMITS.TAGS_MAX} />}
            <CopyButton
              text={output.tagString}
              label={t("output.copyTags")}
              limit={YT_LIMITS.TAGS_MAX}
              fieldLabel={t("output.tags")}
              blocked={status.blocked}
            />
          </>
        }
      >
        {compactTagDisplay ? (
          <p className="bg-surface-0 border-border text-text-secondary rounded-lg border p-3 text-xs leading-relaxed">
            {output.tagString}
          </p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {output.tags.map((tag, i) => (
              <span
                key={i}
                className="border-border bg-surface-2 text-text-secondary rounded-md border px-2 py-0.5 text-xs"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </OutputField>
    </div>
  );
}
