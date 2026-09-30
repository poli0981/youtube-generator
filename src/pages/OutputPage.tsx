import { useEffect, useRef, useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useDocumentTitle } from "@hooks/use-document-title";
import { Link } from "react-router-dom";
import { Bookmark, ClipboardCopy, Film, PenLine, Shuffle } from "lucide-react";
import { Button } from "@components/ui/Button";
import { Banner } from "@components/ui/Banner";
import { ChipGroup } from "@components/ui/ChipGroup";
import { EmptyState } from "@components/ui/EmptyState";
import { PageContainer, PageHeader } from "@components/ui/PageHeader";
import { TabPanel, Tabs } from "@components/ui/Tabs";
import { OutputPreview } from "@components/output/OutputPreview";
import { OutputExtras } from "@components/output/OutputExtras";
import { LimitBlockBanner } from "@components/output/LimitBlockBanner";
import { YouTubePreview } from "@components/output/YouTubePreview";
import { VariantPicker } from "@components/output/VariantPicker";
import { TemplateSaveForm } from "@components/templates/TemplateSaveForm";
import { useGeneratedOutput } from "@hooks/use-generated-output";
import { useMultilangOutput } from "@hooks/use-multilang-output";
import { useEditorStore } from "@store/editor-store";
import { useHistoryStore } from "@store/history-store";
import { useSettingsStore } from "@store/settings-store";
import { SUPPORTED_LANGUAGES } from "@i18n/index";
import type { GeneratorOutput, SupportedLanguage } from "@engine/types";
import { useOutputLimits } from "@hooks/use-output-limits";
import { useStrictBlock } from "@hooks/use-strict-block";
import { useClipboard } from "@hooks/use-clipboard";
import { StrictModeBanner } from "@components/ui/StrictModeBanner";

export function OutputPage() {
  const { t } = useTranslation("ui");
  useDocumentTitle(t("tabs.output"));
  const defaultOutput = useGeneratedOutput();
  const { gameName, videoType, language, genres, channelName } = useEditorStore();
  const { copy } = useClipboard();
  // v0.17.1: surface the per-video preview state so the page can
  // render a "Showing: Video N of M" banner — without it, a creator
  // who flipped the EndingsEditor selector wouldn't see which video
  // they're currently looking at without scrolling back.
  const endingVideoCount = useEditorStore((s) => s.endingVideoCount);
  const endingVideoIndex = useEditorStore((s) => s.endingVideoIndex);
  const endingVideoRanges = useEditorStore((s) => s.endingVideoRanges);
  const isMultiVideoEnding = videoType === "ending" && endingVideoCount > 1;
  const currentRange = isMultiVideoEnding
    ? endingVideoRanges[Math.max(0, Math.min(endingVideoCount, endingVideoIndex) - 1)]
    : undefined;
  const addEntry = useHistoryStore((s) => s.addEntry);
  const historyLimit = useSettingsStore((s) => s.historyLimit);
  const savedRef = useRef<string>("");

  const [selectedLangs, setSelectedLangs] = useState<SupportedLanguage[]>([language]);
  const [activeTab, setActiveTab] = useState<SupportedLanguage>(language);
  const [showVariants, setShowVariants] = useState(false);
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);

  const isMultiLang = selectedLangs.length > 1;
  const multilangOutputs = useMultilangOutput(isMultiLang ? selectedLangs : []);

  const currentOutput = isMultiLang ? multilangOutputs[activeTab] : defaultOutput;

  // Two different scopes, on purpose:
  //  - `tabStatus` gates the three per-field copy buttons, and reflects only
  //    the language currently on screen. An over-long Japanese title must not
  //    disable the English copy button the user is looking at.
  //  - `allStatus` gates Copy All, which concatenates every selected language,
  //    so any one of them being over means the blob is unusable.
  const shownOutputs = useMemo(() => (currentOutput ? [currentOutput] : []), [currentOutput]);
  const everyOutput = useMemo(
    () =>
      isMultiLang
        ? selectedLangs
            .map((l) => multilangOutputs[l])
            .filter((o): o is GeneratorOutput => Boolean(o))
        : [defaultOutput],
    [isMultiLang, selectedLangs, multilangOutputs, defaultOutput],
  );
  const tabStatus = useOutputLimits(shownOutputs);
  const allStatus = useOutputLimits(everyOutput);

  // Strict Mode folds into the same "blocked" signal the char-limit gate
  // uses, so a copy button has one reason to be disabled, not two.
  const strictBlocked = useStrictBlock();
  const tabBlocked = useMemo(
    () => (strictBlocked ? { ...tabStatus, blocked: true } : tabStatus),
    [strictBlocked, tabStatus],
  );
  const allBlocked = useMemo(
    () => (strictBlocked ? { ...allStatus, blocked: true } : allStatus),
    [strictBlocked, allStatus],
  );

  // At least one language stays selected; the active tab follows a removal.
  const changeLangs = (next: SupportedLanguage[]) => {
    if (next.length === 0) return;
    setSelectedLangs(next);
    if (!next.includes(activeTab)) setActiveTab(next[0] as SupportedLanguage);
  };

  useEffect(() => {
    if (!gameName || !defaultOutput.title) return;
    const key = `${gameName}-${videoType}-${language}-${defaultOutput.title}`;
    if (savedRef.current === key) return;
    savedRef.current = key;
    addEntry(
      {
        gameName,
        videoType,
        language,
        genres,
        title: defaultOutput.title,
        description: defaultOutput.description,
        tags: defaultOutput.tagString,
      },
      historyLimit,
    );
  }, [
    gameName,
    videoType,
    language,
    genres,
    defaultOutput.title,
    defaultOutput.description,
    defaultOutput.tagString,
    addEntry,
    historyLimit,
  ]);

  const allLangsCombined = useMemo(() => {
    if (!isMultiLang) return "";
    return selectedLangs
      .map((lang) => {
        const o = multilangOutputs[lang];
        if (!o) return "";
        return `[${lang.toUpperCase()}]\n${o.title}\n\n${o.description}`;
      })
      .join("\n\n===\n\n");
  }, [isMultiLang, selectedLangs, multilangOutputs]);

  const copyAllText = isMultiLang
    ? allLangsCombined
    : `${defaultOutput.title}

${defaultOutput.description}`;
  const copyAll = () => void copy(copyAllText);
  const copyAllDisabled = allBlocked.blocked || !gameName;

  const shownOutput = currentOutput ?? defaultOutput;

  return (
    <PageContainer className="pb-24 md:pb-6 lg:pb-8">
      <PageHeader
        title={t("tabs.output")}
        actions={
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowVariants(true)}
              disabled={!gameName}
            >
              <Shuffle />
              {t("output.generateAlternatives")}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSaveTemplate(true)}
              disabled={!gameName}
            >
              <Bookmark />
              {t("output.saveAsTemplate")}
            </Button>
            {/* md+ only — phones get the floating button below. */}
            <div className="hidden md:block">
              <Button size="sm" onClick={copyAll} disabled={copyAllDisabled}>
                <ClipboardCopy />
                {t("output.copyAll")}
              </Button>
            </div>
          </>
        }
      />

      <StrictModeBanner />
      <LimitBlockBanner status={allStatus} />

      {!gameName ? (
        <EmptyState
          icon={PenLine}
          title={t("output.emptyTitle")}
          description={t("output.emptyHint")}
          action={
            <Button asChild size="sm">
              <Link to="/">{t("tabs.editor")}</Link>
            </Button>
          }
        />
      ) : (
        <>
          <ChipGroup
            label={t("output.selectLanguages")}
            multiple
            options={SUPPORTED_LANGUAGES.map((lang) => ({
              id: lang.id,
              label: `${lang.nativeName} (${lang.id})`,
            }))}
            value={selectedLangs}
            onChange={(next) => changeLangs(next as SupportedLanguage[])}
          />

          {isMultiVideoEnding && (
            <Banner tone="accent">
              <span className="inline-flex items-center gap-1.5">
                <Film className="size-3.5 shrink-0" aria-hidden="true" />
                {t("output.previewingVideo", {
                  index: Math.min(endingVideoIndex, endingVideoCount),
                  total: endingVideoCount,
                  from: currentRange?.from ?? 1,
                  to: currentRange?.to ?? 1,
                })}
              </span>
            </Banner>
          )}

          {isMultiLang ? (
            <Tabs
              value={activeTab}
              onChange={setActiveTab}
              ariaLabel={t("output.selectLanguages")}
              layoutId="output-language-tab"
              items={selectedLangs.map((lang) => ({ value: lang, label: lang.toUpperCase() }))}
            >
              {selectedLangs.map((lang) => (
                <TabPanel key={lang} value={lang} className="flex flex-col gap-4 pt-4">
                  {multilangOutputs[lang] && (
                    <OutputPreview output={multilangOutputs[lang]} status={tabBlocked} />
                  )}
                </TabPanel>
              ))}
            </Tabs>
          ) : (
            <OutputPreview status={tabBlocked} />
          )}

          <YouTubePreview
            title={shownOutput.title}
            description={shownOutput.description}
            channelName={channelName}
            gameName={gameName}
          />
          <OutputExtras />
        </>
      )}

      {/* Phones: Copy All as a floating button (the header one is md+). */}
      {gameName && (
        <Button
          onClick={copyAll}
          disabled={copyAllDisabled}
          className="shadow-pop fixed right-4 bottom-[calc(4.5rem_+_env(safe-area-inset-bottom))] z-30 rounded-full md:hidden"
        >
          <ClipboardCopy />
          {t("output.copyAll")}
        </Button>
      )}

      <VariantPicker open={showVariants} onClose={() => setShowVariants(false)} />
      <TemplateSaveForm open={showSaveTemplate} onClose={() => setShowSaveTemplate(false)} />
    </PageContainer>
  );
}
