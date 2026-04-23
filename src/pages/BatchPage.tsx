import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import i18n from "i18next";
import { Input } from "@components/ui/Input";
import { Button } from "@components/ui/Button";
import { CopyButton } from "@components/output/CopyButton";
import { CharCounter } from "@components/output/CharCounter";
import { useEditorStore } from "@store/editor-store";
import { useSettingsStore } from "@store/settings-store";
import { SUPPORTED_LANGUAGES } from "@i18n/index";
import { renderAll } from "@engine/template-renderer";
import { YT_LIMITS } from "@engine/types";
import type { GeneratorInput, GeneratorOutput, SupportedLanguage } from "@engine/types";
import clsx from "clsx";

interface BatchResult {
  partNumber: string;
  languages: { language: SupportedLanguage; output: GeneratorOutput }[];
}

export function BatchPage() {
  const { t } = useTranslation("ui");
  const state = useEditorStore();
  const { includeMultilingualTags, includeTrendingTags, hashtagCount } = useSettingsStore();
  const [startPart, setStartPart] = useState("1");
  const [endPart, setEndPart] = useState("5");
  const [selectedLangs, setSelectedLangs] = useState<SupportedLanguage[]>([state.language]);
  const [results, setResults] = useState<BatchResult[]>([]);

  const toggleLang = (lang: SupportedLanguage) => {
    setSelectedLangs((prev) => {
      if (prev.includes(lang)) {
        return prev.length <= 1 ? prev : prev.filter((l) => l !== lang);
      }
      return [...prev, lang];
    });
  };

  const handleGenerate = () => {
    const start = parseInt(startPart) || 1;
    const end = parseInt(endPart) || start;
    const outputs: BatchResult[] = [];

    for (let i = start; i <= Math.min(end, start + 99); i++) {
      const languages = selectedLangs.map((lang) => {
        const tFn = i18n.getFixedT(lang, "templates");
        const input: GeneratorInput = {
          videoType: "part",
          language: lang,
          genres: state.genres,
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
          storeLinkTypes: state.storeLinkTypes,
          social: state.social,
          rig: state.rig,
        };
        return { language: lang, output: renderAll(input, tFn, { includeMultilingualTags, includeTrendingTags, hashtagCount }) };
      });
      outputs.push({ partNumber: String(i), languages });
    }
    setResults(outputs);
  };

  const allCombined = useMemo(
    () =>
      results
        .map((r) =>
          r.languages
            .map((l) => `[${l.language.toUpperCase()}]\n${l.output.title}\n\n${l.output.description}`)
            .join("\n\n---\n\n"),
        )
        .join("\n\n===\n\n"),
    [results],
  );

  return (
    <div className="mx-auto max-w-4xl p-6">
      <h1 className="mb-4 text-lg font-bold text-text-primary">{t("batch.title")}</h1>

      {/* Language selector */}
      <div className="mb-4">
        <span className="mb-2 block text-sm font-medium text-text-secondary">
          {t("output.selectLanguages")}
        </span>
        <div className="flex flex-wrap gap-2">
          {SUPPORTED_LANGUAGES.map((lang) => (
            <button
              key={lang.id}
              onClick={() => toggleLang(lang.id as SupportedLanguage)}
              className={clsx(
                "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                selectedLangs.includes(lang.id as SupportedLanguage)
                  ? "bg-accent text-white"
                  : "bg-surface-2 text-text-muted hover:text-text-primary",
              )}
            >
              {lang.flag} {lang.nativeName}
            </button>
          ))}
        </div>
      </div>

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
            <span className="text-sm text-text-secondary">
              {results.length} parts x {selectedLangs.length} languages
            </span>
            <CopyButton text={allCombined} label={t("batch.copyAllBatch")} />
          </div>
          <div className="flex flex-col gap-4">
            {results.map((result) => (
              <div key={result.partNumber} className="rounded-lg border border-border bg-surface-1 p-4">
                <h3 className="mb-3 text-sm font-semibold text-text-primary">
                  Part {result.partNumber}
                </h3>
                <div className="flex flex-col gap-3">
                  {result.languages.map((lang) => (
                    <div key={lang.language} className="rounded-lg bg-surface-2 p-3">
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-xs font-medium uppercase text-text-muted">
                          {lang.language.toUpperCase()}
                        </span>
                        <div className="flex items-center gap-2">
                          <CharCounter text={lang.output.title} limit={YT_LIMITS.TITLE_MAX} />
                          <CopyButton text={lang.output.title} label={t("output.copyTitle")} />
                        </div>
                      </div>
                      <p className="mb-2 text-sm font-medium text-text-primary">
                        {lang.output.title}
                      </p>
                      <pre className="mb-2 max-h-20 overflow-y-auto whitespace-pre-wrap font-sans text-xs text-text-secondary">
                        {lang.output.description.slice(0, 200)}...
                      </pre>
                      <div className="flex gap-2">
                        <CopyButton text={lang.output.description} label={t("output.copyDescription")} />
                        <CopyButton text={lang.output.tagString} label={t("output.copyTags")} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
