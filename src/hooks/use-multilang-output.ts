import { useMemo } from "react";
import i18n from "i18next";
import { useSettingsStore } from "@store/settings-store";
import { renderAll } from "@engine/template-renderer";
import type { GeneratorOutput, SupportedLanguage } from "@engine/types";
import { useCurrentGeneratorInput } from "./use-current-generator-input";
import { useLanguagesReady } from "./use-languages-ready";

export function useMultilangOutput(
  languages: SupportedLanguage[],
): Record<string, GeneratorOutput> {
  const baseInput = useCurrentGeneratorInput();
  // Lazy-loaded locales (v0.26): all-or-nothing gate — OutputPage already
  // renders nothing for an absent tab entry, and the per-language chunks
  // load in parallel, so partial results aren't worth the complexity.
  const ready = useLanguagesReady(languages);
  const {
    includeMultilingualTags,
    includeTrendingTags,
    hashtagCount,
    showQualityBadge,
    showCopyright,
    showUsagePolicy,
    showSponsorCredit,
    showGameCopyright,
    showThirdPartyAds,
    showTranslationQuality,
    titleFormat,
  } = useSettingsStore();

  // Always-English `t` for the bilingual content-warning / translation-quality
  // blocks — must match `useGeneratedOutput` so multi-language tabs render the
  // same `EN · LOCAL` output instead of falling back to target-language-only.
  // `en` is eagerly bundled, so it never needs the readiness gate.
  const tEn = useMemo(() => i18n.getFixedT("en", "templates"), []);

  return useMemo(() => {
    const results: Record<string, GeneratorOutput> = {};
    if (!ready) return results;
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
        showGameCopyright,
        showThirdPartyAds,
        showTranslationQuality,
        titleFormat,
        tEn,
      });
    }
    return results;
  }, [
    ready,
    languages,
    baseInput,
    includeMultilingualTags,
    includeTrendingTags,
    hashtagCount,
    showQualityBadge,
    showCopyright,
    showUsagePolicy,
    showSponsorCredit,
    showGameCopyright,
    showThirdPartyAds,
    showTranslationQuality,
    titleFormat,
    tEn,
  ]);
}
