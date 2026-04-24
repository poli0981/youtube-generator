import { useMemo } from "react";
import i18n from "i18next";
import { useSettingsStore } from "@store/settings-store";
import { renderAll } from "@engine/template-renderer";
import type { GeneratorOutput, SupportedLanguage } from "@engine/types";
import { useCurrentGeneratorInput } from "./use-current-generator-input";

export function useMultilangOutput(
  languages: SupportedLanguage[],
): Record<string, GeneratorOutput> {
  const baseInput = useCurrentGeneratorInput();
  const {
    includeMultilingualTags,
    includeTrendingTags,
    hashtagCount,
    showQualityBadge,
    showCopyright,
    showUsagePolicy,
    showSponsorCredit,
    titleFormat,
  } = useSettingsStore();

  return useMemo(() => {
    const results: Record<string, GeneratorOutput> = {};
    for (const lang of languages) {
      const tFn = i18n.getFixedT(lang, "templates");
      const input = { ...baseInput, language: lang };
      results[lang] = renderAll(input, tFn, {
        includeMultilingualTags,
        includeTrendingTags,
        hashtagCount,
        showQualityBadge,
        showCopyright,
        showUsagePolicy,
        showSponsorCredit,
        titleFormat,
      });
    }
    return results;
  }, [
    languages,
    baseInput,
    includeMultilingualTags,
    includeTrendingTags,
    hashtagCount,
    showQualityBadge,
    showCopyright,
    showUsagePolicy,
    showSponsorCredit,
    titleFormat,
  ]);
}
