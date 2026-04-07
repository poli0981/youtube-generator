import { useEffect, useRef, useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { OutputPreview } from "@components/output/OutputPreview";
import { CopyAllBar } from "@components/output/CopyAllBar";
import { useGeneratedOutput } from "@hooks/use-generated-output";
import { useMultilangOutput } from "@hooks/use-multilang-output";
import { useEditorStore } from "@store/editor-store";
import { useHistoryStore } from "@store/history-store";
import { useSettingsStore } from "@store/settings-store";
import { SUPPORTED_LANGUAGES } from "@i18n/index";
import type { SupportedLanguage } from "@engine/types";
import clsx from "clsx";

export function OutputPage() {
  const { t } = useTranslation("ui");
  const defaultOutput = useGeneratedOutput();
  const { gameName, videoType, language, genre } = useEditorStore();
  const addEntry = useHistoryStore((s) => s.addEntry);
  const historyLimit = useSettingsStore((s) => s.historyLimit);
  const savedRef = useRef<string>("");

  const [selectedLangs, setSelectedLangs] = useState<SupportedLanguage[]>([language]);
  const [activeTab, setActiveTab] = useState<SupportedLanguage>(language);

  const isMultiLang = selectedLangs.length > 1;
  const multilangOutputs = useMultilangOutput(isMultiLang ? selectedLangs : []);

  const currentOutput = isMultiLang ? multilangOutputs[activeTab] : defaultOutput;

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
        genre,
        title: defaultOutput.title,
        description: defaultOutput.description,
        tags: defaultOutput.tagString,
      },
      historyLimit,
    );
  }, [gameName, videoType, language, genre, defaultOutput.title, defaultOutput.description, defaultOutput.tagString, addEntry, historyLimit]);

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

        {isMultiLang && (
          <div className="mb-4 flex gap-1 rounded-lg bg-surface-1 p-1">
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

        {currentOutput && <OutputPreview output={isMultiLang ? currentOutput : undefined} />}
      </div>
      <CopyAllBar extraText={isMultiLang ? allLangsCombined : undefined} />
    </div>
  );
}
