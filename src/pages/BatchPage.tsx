import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useDocumentTitle } from "@hooks/use-document-title";
import i18n from "i18next";
import { Layers, Play } from "lucide-react";
import { Input } from "@components/ui/Input";
import { Button } from "@components/ui/Button";
import { Badge } from "@components/ui/Badge";
import { Banner } from "@components/ui/Banner";
import { Card } from "@components/ui/Card";
import { ChipGroup } from "@components/ui/ChipGroup";
import { EmptyState } from "@components/ui/EmptyState";
import { PageContainer, PageHeader } from "@components/ui/PageHeader";
import { CopyButton } from "@components/output/CopyButton";
import { CharCounter } from "@components/output/CharCounter";
import { LimitBlockBanner } from "@components/output/LimitBlockBanner";
import { useEditorStore } from "@store/editor-store";
import { useSettingsStore } from "@store/settings-store";
import { SUPPORTED_LANGUAGES, ensureLanguagesLoaded } from "@i18n/index";
import { renderAll } from "@engine/template-renderer";
import { buildPinnedComment } from "@engine/pinned-comment-builder";
import { YT_LIMITS } from "@engine/types";
import type { GeneratorOutput, SupportedLanguage } from "@engine/types";
import { useCurrentGeneratorInput } from "@hooks/use-current-generator-input";
import { useRenderOptions } from "@hooks/use-render-options";
import { validateBatchRange } from "@utils/validation";
import { useStrictBlock } from "@hooks/use-strict-block";
import { StrictModeBanner } from "@components/ui/StrictModeBanner";
import {
  getOutputLimitStatus,
  isCopyAllBlocked,
  isFieldOver,
  mergeLimitStatus,
  type OutputLimitStatus,
} from "@engine/limits";

interface BatchLanguageRow {
  language: SupportedLanguage;
  output: GeneratorOutput;
  /** Empty string when the pinned-comment template setting is off. */
  pinnedComment: string;
  /**
   * Over-limit state for this one row. Computed at generate time so the
   * render pass stays cheap across 100 parts x 6 languages.
   */
  status: OutputLimitStatus;
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
  // Was a hand-copied destructure of the settings store that had drifted out of
  // sync with the other two `renderAll` call sites — it silently dropped
  // `splitContactEmail` and `showThirdPartyAds`, so Batch rendered the legacy
  // single contact line while Output rendered the grouped block. v0.35.0.
  //
  // No `tEn`: Batch rows are one language each, so the bilingual
  // `EN · LOCAL` content-warning treatment would just duplicate every line.
  const renderOptions = useRenderOptions();
  const showPinnedCommentTemplate = useSettingsStore((s) => s.showPinnedCommentTemplate);
  const pinnedCommentIncludeAskNextGame = useSettingsStore(
    (s) => s.pinnedCommentIncludeAskNextGame,
  );
  // Strict Mode: refuse to spin out 100 parts from a form that already has a
  // known-bad field. No-op unless the user opted in.
  const strictBlocked = useStrictBlock();
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
        const output = renderAll(input, tFn, renderOptions);
        const pinnedComment = showPinnedCommentTemplate
          ? buildPinnedComment(input, tFn, {
              includeAskNextGame: pinnedCommentIncludeAskNextGame,
            })
          : "";
        return { language: lang, output, pinnedComment, status: getOutputLimitStatus(output) };
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
                ? `\n\n📌 ${t("output.pinnedCommentTemplate")}\n${l.pinnedComment}`
                : "";
              return `[${l.language.toUpperCase()}]\n${l.output.title}\n\n${l.output.description}${pinnedBlock}`;
            })
            .join("\n\n---\n\n"),
        )
        .join("\n\n===\n\n"),
    [results, t],
  );

  // Copy All Batch concatenates every row's title and description, so one
  // part over on either poisons the whole blob. A part over the limit only
  // disables its own offending field — never the other parts.
  const batchStatus = useMemo(
    () => mergeLimitStatus(results.flatMap((r) => r.languages.map((l) => l.status))),
    [results],
  );

  return (
    <PageContainer>
      <PageHeader title={t("batch.title")} description={t("batch.intro")} />

      <Card className="flex flex-col gap-4 p-4 sm:p-5">
        <ChipGroup
          label={t("output.selectLanguages")}
          multiple
          options={SUPPORTED_LANGUAGES.map((lang) => ({
            id: lang.id,
            label: `${lang.nativeName} (${lang.id})`,
          }))}
          value={selectedLangs}
          onChange={(next) => {
            if (next.length > 0) setSelectedLangs(next as SupportedLanguage[]);
          }}
        />
        <div className="grid gap-3 sm:grid-cols-[8rem_8rem_auto] sm:items-end">
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
            className="sm:justify-self-start"
            onClick={() => void handleGenerate()}
            loading={generating}
            disabled={!state.gameName || !rangeResult.valid || strictBlocked}
          >
            <Play />
            {t("batch.generateBatch")}
          </Button>
        </div>
        {rangeError && (
          <Banner tone="warning" alert>
            {rangeError}
          </Banner>
        )}
      </Card>

      <StrictModeBanner />

      {results.length === 0 ? (
        <EmptyState icon={Layers} title={t("batch.emptyState")} />
      ) : (
        <>
          <div className="flex flex-col gap-2">
            <LimitBlockBanner status={batchStatus} titleKey="output.limits.batchAllBlocked" />
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-text-secondary text-sm">
                {t("batch.summary", { parts: results.length, languages: selectedLangs.length })}
              </span>
              <CopyButton
                text={allCombined}
                label={t("batch.copyAllBatch")}
                blocked={isCopyAllBlocked(batchStatus)}
              />
            </div>
          </div>
          <div className="flex flex-col gap-4">
            {results.map((result) => (
              <Card key={result.partNumber} className="p-4">
                <h2 className="text-text-primary mb-3 text-sm font-semibold">
                  {t("batch.partLabel", { n: result.partNumber })}
                </h2>
                <div className="flex flex-col gap-3">
                  {result.languages.map((lang) => (
                    <div
                      key={lang.language}
                      className="bg-surface-0 border-border rounded-lg border p-3"
                    >
                      <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
                        <Badge>{lang.language.toUpperCase()}</Badge>
                        <div className="flex items-center gap-2">
                          <CharCounter text={lang.output.title} limit={YT_LIMITS.TITLE_MAX} />
                          <CopyButton
                            text={lang.output.title}
                            label={t("output.copyTitle")}
                            limit={YT_LIMITS.TITLE_MAX}
                            fieldLabel={t("output.title")}
                            blocked={isFieldOver(lang.status, "title")}
                          />
                        </div>
                      </div>
                      <p className="text-text-primary mb-2 text-sm font-medium">
                        {lang.output.title}
                      </p>
                      <pre className="text-text-secondary mb-2 line-clamp-3 font-sans text-xs whitespace-pre-wrap">
                        {lang.output.description}
                      </pre>
                      {/* Batch showed a counter for the title only, so a row
                          could be 1500 characters over on the description with
                          nothing on screen saying so. */}
                      <div className="mb-2 flex flex-wrap items-center gap-3">
                        <span className="text-text-muted text-xs">{t("output.description")}</span>
                        <CharCounter
                          text={lang.output.description}
                          limit={YT_LIMITS.DESCRIPTION_MAX}
                        />
                        <span className="text-text-muted text-xs">{t("output.tags")}</span>
                        <CharCounter
                          text={lang.output.tagString}
                          count={lang.output.charCounts.tags}
                          limit={YT_LIMITS.TAGS_MAX}
                        />
                      </div>
                      {lang.status.blocked && (
                        <p role="alert" className="text-danger mb-2 text-xs font-medium">
                          {t("output.limits.batchRowBlocked")}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-1">
                        <CopyButton
                          text={lang.output.description}
                          label={t("output.copyDescription")}
                          limit={YT_LIMITS.DESCRIPTION_MAX}
                          fieldLabel={t("output.description")}
                          blocked={isFieldOver(lang.status, "description")}
                        />
                        <CopyButton
                          text={lang.output.tagString}
                          label={t("output.copyTags")}
                          fieldLabel={t("output.tags")}
                          blocked={isFieldOver(lang.status, "tags")}
                        />
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
              </Card>
            ))}
          </div>
        </>
      )}
    </PageContainer>
  );
}
