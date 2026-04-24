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
    titleFormat,
  } = useSettingsStore();

  const t = useMemo(() => i18n.getFixedT(input.language, "templates"), [input.language]);

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
        titleFormat,
      }),
    [
      input,
      t,
      includeMultilingualTags,
      includeTrendingTags,
      hashtagCount,
      showQualityBadge,
      showCopyright,
      showUsagePolicy,
      showSponsorCredit,
      titleFormat,
    ],
  );
}
