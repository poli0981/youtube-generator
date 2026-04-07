import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import i18n from "i18next";
import { Input } from "@components/ui/Input";
import { Button } from "@components/ui/Button";
import { CopyButton } from "@components/output/CopyButton";
import { CharCounter } from "@components/output/CharCounter";
import { useEditorStore } from "@store/editor-store";
import { useSettingsStore } from "@store/settings-store";
import { renderAll } from "@engine/template-renderer";
import { YT_LIMITS } from "@engine/types";
import type { GeneratorInput, GeneratorOutput } from "@engine/types";

export function BatchPage() {
  const { t } = useTranslation("ui");
  const state = useEditorStore();
  const { includeMultilingualTags, includeTrendingTags, hashtagCount } = useSettingsStore();
  const [startPart, setStartPart] = useState("1");
  const [endPart, setEndPart] = useState("5");
  const [results, setResults] = useState<GeneratorOutput[]>([]);

  const handleGenerate = () => {
    const start = parseInt(startPart) || 1;
    const end = parseInt(endPart) || start;
    const tFn = i18n.getFixedT(state.language, "templates");
    const outputs: GeneratorOutput[] = [];

    for (let i = start; i <= Math.min(end, start + 99); i++) {
      const input: GeneratorInput = {
        videoType: "part",
        language: state.language,
        genre: state.genre,
        gameName: state.gameName,
        gameNameLocalized: state.gameNameLocalized,
        channelName: state.channelName,
        platform: state.platform,
        partNumber: String(i),
        bossName: state.bossName,
        dlcName: state.dlcName,
        challengeName: state.challengeName,
        resolution: state.resolution,
        fps: state.fps,
        graphicsPreset: state.graphicsPreset,
        timestamps: "",
        playlistLink: state.playlistLink,
        contactEmail: state.contactEmail,
        spoilerWarning: state.spoilerWarning,
        matureWarning: state.matureWarning,
        storeLinks: state.storeLinks,
        social: state.social,
        rig: state.rig,
      };
      outputs.push(renderAll(input, tFn, { includeMultilingualTags, includeTrendingTags, hashtagCount }));
    }
    setResults(outputs);
  };

  const allCombined = useMemo(
    () => results.map((r) => `${r.title}\n\n${r.description}`).join("\n\n---\n\n"),
    [results],
  );

  return (
    <div className="mx-auto max-w-4xl p-6">
      <h1 className="mb-4 text-lg font-bold text-text-primary">{t("batch.title")}</h1>

      <div className="mb-6 flex items-end gap-4">
        <Input
          label={t("batch.startPart")}
          type="number"
          value={startPart}
          onChange={(e) => setStartPart(e.target.value)}
        />
        <Input
          label={t("batch.endPart")}
          type="number"
          value={endPart}
          onChange={(e) => setEndPart(e.target.value)}
        />
        <Button onClick={handleGenerate} disabled={!state.gameName}>
          {t("batch.generateBatch")}
        </Button>
      </div>

      {results.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border py-8 text-center text-sm text-text-muted">
          {t("batch.emptyState")}
        </p>
      ) : (
        <>
          <div className="mb-4 flex items-center justify-between">
            <span className="text-sm text-text-secondary">{results.length} results</span>
            <CopyButton text={allCombined} label={t("batch.copyAllBatch")} />
          </div>
          <div className="flex flex-col gap-3">
            {results.map((result, i) => (
              <div key={i} className="rounded-lg border border-border bg-surface-1 p-4">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-sm font-medium text-text-primary">{result.title}</h3>
                  <div className="flex items-center gap-2">
                    <CharCounter text={result.title} limit={YT_LIMITS.TITLE_MAX} />
                    <CopyButton text={result.title} label={t("output.copyTitle")} />
                  </div>
                </div>
                <pre className="mb-2 max-h-24 overflow-y-auto whitespace-pre-wrap rounded bg-surface-2 p-2 font-sans text-xs text-text-secondary">
                  {result.description.slice(0, 300)}...
                </pre>
                <div className="flex gap-2">
                  <CopyButton text={result.description} label={t("output.copyDescription")} />
                  <CopyButton text={result.tagString} label={t("output.copyTags")} />
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
