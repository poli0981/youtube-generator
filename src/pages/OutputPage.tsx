import { useEffect, useRef, useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useDocumentTitle } from "@hooks/use-document-title";
import { Shuffle, Bookmark, Film } from "lucide-react";
import { Button } from "@components/ui/Button";
import { OutputPreview } from "@components/output/OutputPreview";
import { OutputExtras } from "@components/output/OutputExtras";
import { CopyAllBar } from "@components/output/CopyAllBar";
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
import { StrictModeBanner } from "@components/ui/StrictModeBanner";
import clsx from "clsx";

export function OutputPage() {
  const { t } = useTranslation("ui");
  useDocumentTitle(t("tabs.output"));
  const defaultOutput = useGeneratedOutput();
  const { gameName, videoType, language, genres } = useEditorStore();
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

  const toggleLang = (lang: SupportedLanguage) => {
    setSelectedLangs((prev) => {
      if (prev.includes(lang)) {
        if (prev.length <= 1) return prev;
        const next = prev.filter((l) => l !== lang);
        if (activeTab === lang && next.length > 0) setActiveTab(next[0] as SupportedLanguage);
        return next;
      }
      return [...prev, lang];
    });
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

  return (
    <div className="flex flex-1 flex-col">
      <div className="mx-auto w-full max-w-4xl flex-1 p-6">
        <div className="mb-4">
          <StrictModeBanner />
        </div>
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div className="flex-1">
            <span className="text-text-secondary mb-2 block text-sm font-medium">
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
          <div className="flex flex-wrap gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowVariants(true)}
              disabled={!gameName}
            >
              <Shuffle className="h-3.5 w-3.5" />
              {t("output.generateAlternatives")}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSaveTemplate(true)}
              disabled={!gameName}
            >
              <Bookmark className="h-3.5 w-3.5" />
              {t("output.saveAsTemplate")}
            </Button>
          </div>
        </div>

        {isMultiLang && (
          <div className="bg-surface-1 mb-4 flex gap-1 rounded-lg p-1">
            {selectedLangs.map((lang) => (
              <button
                key={lang}
                onClick={() => setActiveTab(lang)}
                className={clsx(
                  "rounded-md px-3 py-1 text-sm font-medium transition-colors",
                  activeTab === lang
                    ? "bg-accent text-white"
                    : "text-text-muted hover:text-text-primary",
                )}
              >
                {lang.toUpperCase()}
              </button>
            ))}
          </div>
        )}

        {isMultiVideoEnding && (
          <div className="border-accent/40 bg-accent/10 text-text-secondary mb-4 flex items-center gap-2 rounded-lg border px-3 py-2 text-xs">
            <Film className="text-accent h-3.5 w-3.5 shrink-0" />
            <span>
              {t("output.previewingVideo", {
                index: Math.min(endingVideoIndex, endingVideoCount),
                total: endingVideoCount,
                from: currentRange?.from ?? 1,
                to: currentRange?.to ?? 1,
              })}
            </span>
          </div>
        )}
        {currentOutput && (
          <OutputPreview output={isMultiLang ? currentOutput : undefined} status={tabBlocked} />
        )}
        <div className="mt-6">
          <OutputExtras />
        </div>
      </div>
      <CopyAllBar
        text={
          isMultiLang
            ? allLangsCombined
            : `${defaultOutput.title}

${defaultOutput.description}`
        }
        status={allBlocked}
      />

      <VariantPicker open={showVariants} onClose={() => setShowVariants(false)} />
      <TemplateSaveForm open={showSaveTemplate} onClose={() => setShowSaveTemplate(false)} />
    </div>
  );
}
