import { useMemo } from "react";
import i18n from "i18next";
import { useSettingsStore } from "@store/settings-store";
import { renderAll } from "@engine/template-renderer";
import type { GeneratorOutput } from "@engine/types";
import { useCurrentGeneratorInput } from "./use-current-generator-input";

export function useGeneratedOutput(): GeneratorOutput {
  const input = useCurrentGeneratorInput();
  const {
    includeMultilingualTags,
    includeTrendingTags,
    hashtagCount,
    showQualityBadge,
    showCopyright,
    showUsagePolicy,
    showSponsorCredit,
    showThirdPartyAds,
    titleFormat,
  } = useSettingsStore();

  const t = useMemo(() => i18n.getFixedT(input.language, "templates"), [input.language]);
  // Always-English `t` for the v0.11 bilingual content-warning block.
  // Built once per render so the engine receives a stable function ref;
  // the engine falls back to `t` when this is undefined.
  const tEn = useMemo(() => i18n.getFixedT("en", "templates"), []);

  return useMemo(
    () =>
      renderAll(input, t, {
        includeMultilingualTags,
        includeTrendingTags,
        hashtagCount,
        showQualityBadge,
        showCopyright,
        showUsagePolicy,
        showSponsorCredit,
        showThirdPartyAds,
        titleFormat,
        tEn,
      }),
    [
      input,
      t,
      tEn,
      includeMultilingualTags,
      includeTrendingTags,
      hashtagCount,
      showQualityBadge,
      showCopyright,
      showUsagePolicy,
      showSponsorCredit,
      showThirdPartyAds,
      titleFormat,
    ],
  );
}
