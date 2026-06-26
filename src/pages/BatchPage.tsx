import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useDocumentTitle } from "@hooks/use-document-title";
import i18n from "i18next";
import { Input } from "@components/ui/Input";
import { Button } from "@components/ui/Button";
import { CopyButton } from "@components/output/CopyButton";
import { CharCounter } from "@components/output/CharCounter";
import { useEditorStore } from "@store/editor-store";
import { useSettingsStore } from "@store/settings-store";
import { SUPPORTED_LANGUAGES, ensureLanguagesLoaded } from "@i18n/index";
import { renderAll } from "@engine/template-renderer";
import { buildPinnedComment } from "@engine/pinned-comment-builder";
import { YT_LIMITS } from "@engine/types";
import type { GeneratorOutput, SupportedLanguage } from "@engine/types";
import { useCurrentGeneratorInput } from "@hooks/use-current-generator-input";
import { validateBatchRange } from "@utils/validation";
import clsx from "clsx";

interface BatchLanguageRow {
  language: SupportedLanguage;
  output: GeneratorOutput;
  /** Empty string when the pinned-comment template setting is off. */
  pinnedComment: string;
}

interface BatchResult {
  partNumber: string;
  languages: BatchLanguageRow[];
}

export function BatchPage() {
  const { t } = useTranslation("ui");
  useDocumentTitle(t("tabs.batch"));
  const state = useEditorStore();
  const baseInput = useCurrentGeneratorInput();
  const {
    includeMultilingualTags,
    includeTrendingTags,
    hashtagCount,
    showQualityBadge,
    showCopyright,
    showUsagePolicy,
    showSponsorCredit,
    showGameCopyright,
    showTranslationQuality,
    showPinnedCommentTemplate,
    pinnedCommentIncludeAskNextGame,
    titleFormat,
  } = useSettingsStore();
  const [startPart, setStartPart] = useState("1");
  const [endPart, setEndPart] = useState("5");
  const [selectedLangs, setSelectedLangs] = useState<SupportedLanguage[]>([state.language]);
  const [results, setResults] = useState<BatchResult[]>([]);
  const [generating, setGenerating] = useState(false);

  // Block generation on an invalid part range: negative / decimal / NaN
  // endpoints, end < start, or a span over 100 parts (the loop's hard cap).
  const rangeResult = useMemo(
    () => validateBatchRange(startPart, endPart, { maxSpan: 100 }),
    [startPart, endPart],
  );
  const rangeError = rangeResult.valid
    ? undefined
    : t(rangeResult.error ?? "", rangeResult.errorParams);

  const toggleLang = (lang: SupportedLanguage) => {
    setSelectedLangs((prev) => {
      if (prev.includes(lang)) {
        return prev.length <= 1 ? prev : prev.filter((l) => l !== lang);
      }
      return [...prev, lang];
    });
  };

  const generate = () => {
    const start = parseInt(startPart) || 1;
    const end = parseInt(endPart) || start;
    const outputs: BatchResult[] = [];

    for (let i = start; i <= Math.min(end, start + 99); i++) {
      const languages: BatchLanguageRow[] = selectedLangs.map((lang) => {
        const tFn = i18n.getFixedT(lang, "templates");
        // Batch generates "part" entries regardless of the editor's
        // currently-selected video type — the page exists to spin out a
        // series, not to batch-duplicate whatever the user last picked.
        const input = {
          ...baseInput,
          videoType: "part" as const,
          language: lang,
          partNumber: String(i),
          // Batch intentionally leaves the per-part timeline empty; the
          // editor's timestamps field is a single-video artifact.
          timestamps: "",
        };
        const output = renderAll(input, tFn, {
          includeMultilingualTags,
          includeTrendingTags,
          hashtagCount,
          showQualityBadge,
          showCopyright,
          showUsagePolicy,
          showSponsorCredit,
          showGameCopyright,
          showTranslationQuality,
          titleFormat,
        });
        const pinnedComment = showPinnedCommentTemplate
          ? buildPinnedComment(input, tFn, {
              includeAskNextGame: pinnedCommentIncludeAskNextGame,
            })
          : "";
        return { language: lang, output, pinnedComment };
      });
      outputs.push({ partNumber: String(i), languages });
    }
    setResults(outputs);
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      // Lazy-loaded locales (v0.26): batch generates across multiple
      // languages in one pass — every selected bundle must be in memory
      // before the loop, or getFixedT silently renders English.
      await ensureLanguagesLoaded(selectedLangs);
      generate();
    } finally {
      setGenerating(false);
    }
  };

  const allCombined = useMemo(
    () =>
      results
        .map((r) =>
          r.languages
            .map((l) => {
              const pinnedBlock = l.pinnedComment
                ? `\n\n📌 PINNED COMMENT\n${l.pinnedComment}`
                : "";
              return `[${l.language.toUpperCase()}]\n${l.output.title}\n\n${l.output.description}${pinnedBlock}`;
            })
            .join("\n\n---\n\n"),
        )
        .join("\n\n===\n\n"),
    [results],
  );

  return (
    <div className="mx-auto max-w-4xl p-4 sm:p-6">
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

      <div className="mb-2 flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-4">
        <Input
          label={t("batch.startPart")}
          type="number"
          min={1}
          step={1}
          inputMode="numeric"
          error={!rangeResult.valid}
          value={startPart}
          onChange={(e) => setStartPart(e.target.value)}
        />
        <Input
          label={t("batch.endPart")}
          type="number"
          min={1}
          step={1}
          inputMode="numeric"
          error={!rangeResult.valid}
          value={endPart}
          onChange={(e) => setEndPart(e.target.value)}
        />
        <Button
          className="w-full sm:w-auto"
          onClick={() => void handleGenerate()}
          disabled={!state.gameName || generating || !rangeResult.valid}
        >
          {t("batch.generateBatch")}
        </Button>
      </div>
      {rangeError && (
        <p
          role="alert"
          className="mb-6 rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-xs text-warning"
        >
          {rangeError}
        </p>
      )}
      {!rangeError && <div className="mb-6" />}

      {results.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border py-8 text-center text-sm text-text-muted">
          {t("batch.emptyState")}
        </p>
      ) : (
        <>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
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
                      <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
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
                      <div className="flex flex-wrap gap-2">
                        <CopyButton text={lang.output.description} label={t("output.copyDescription")} />
                        <CopyButton text={lang.output.tagString} label={t("output.copyTags")} />
                        {lang.pinnedComment && (
                          <CopyButton
                            text={lang.pinnedComment}
                            label={t("output.copyPinnedCommentTemplate")}
                          />
                        )}
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
