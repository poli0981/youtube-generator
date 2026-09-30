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
import { useCopyGate } from "@hooks/use-copy-gate";

interface OutputPreviewProps {
  output?: GeneratorOutput;
  /** Over-limit status of the output actually shown; gates each copy button. */
  status: OutputLimitStatus;
  /** Strict Mode is blocking: nothing can be copied. */
  strictBlocked?: boolean;
}

export function OutputPreview({
  output: outputProp,
  status,
  strictBlocked = false,
}: OutputPreviewProps) {
  const { t } = useTranslation("ui");
  const gate = useCopyGate(status, strictBlocked);
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
              {...gate("title")}
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
              {...gate("description")}
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
            {showCharCount && (
              <CharCounter
                text={output.tagString}
                count={output.charCounts.tags}
                limit={YT_LIMITS.TAGS_MAX}
              />
            )}
            <CopyButton
              text={output.tagString}
              label={t("output.copyTags")}
              fieldLabel={t("output.tags")}
              {...gate("tags")}
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
