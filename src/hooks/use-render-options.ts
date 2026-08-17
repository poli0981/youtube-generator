import { useMemo } from "react";
import { useSettingsStore } from "@store/settings-store";
import type { SettingsData } from "@store/settings-heal";
import type {
  RenderOptions,
  RenderOptionOverrides,
  SettingsRenderOptions,
} from "@engine/template-renderer";

/**
 * Single source of truth for the settings → engine option mapping.
 *
 * `renderAll` has three call sites (the Output hook, the multi-language Output
 * hook, and BatchPage). Until v0.35.0 each one hand-copied the same twelve
 * settings fields, and they had drifted: BatchPage's copy omitted
 * `splitContactEmail` and `showThirdPartyAds`, so a creator with split contact
 * emails configured saw the grouped `📧 BUSINESS / CONTACT` block on the Output
 * tab and only the legacy single "Business inquiries" line in Batch.
 *
 * The fix is structural rather than a third copy of the list: everyone derives
 * options from here, so a new engine option is wired once. Two guards keep it
 * that way — `Required<SettingsRenderOptions>` below (a missing key is a
 * compile error) and `tests/hooks/render-options-parity.test.ts` (a key added
 * to Settings but never wired here is a test failure).
 */

/**
 * Every key `buildRenderOptions` is responsible for producing. Kept as a value,
 * not just a type, so the parity test can iterate it at runtime.
 */
export const SETTINGS_DERIVED_RENDER_KEYS = [
  "includeMultilingualTags",
  "includeTrendingTags",
  "hashtagCount",
  "showQualityBadge",
  "titleFormat",
  "showCopyright",
  "showUsagePolicy",
  "showSponsorCredit",
  "showThirdPartyAds",
  "splitContactEmail",
  "showGameCopyright",
  "showTranslationQuality",
  // Every entry must name a field that exists on BOTH sides of the mapping.
  // A typo, or an engine option Settings does not actually store, fails here.
] as const satisfies readonly (keyof SettingsRenderOptions & keyof SettingsData)[];

/**
 * Exactly the slice of Settings the engine consumes — nothing else. Callers
 * pass this rather than the whole store so the hook can subscribe field by
 * field, and so a test fixture does not have to build all 30 settings.
 */
export type RenderSettingsSlice = Pick<SettingsData, (typeof SETTINGS_DERIVED_RENDER_KEYS)[number]>;

/**
 * Pure settings → `RenderOptions` mapping, testable without React.
 *
 * The `Required<SettingsRenderOptions>` annotation is load-bearing: it is what
 * turns "someone added an option to the engine and forgot this file" into a
 * type error instead of an option that silently defaults to `undefined`.
 */
export function buildRenderOptions(
  settings: RenderSettingsSlice,
  overrides?: RenderOptionOverrides,
): RenderOptions {
  const fromSettings: Required<SettingsRenderOptions> = {
    includeMultilingualTags: settings.includeMultilingualTags,
    includeTrendingTags: settings.includeTrendingTags,
    hashtagCount: settings.hashtagCount,
    showQualityBadge: settings.showQualityBadge,
    titleFormat: settings.titleFormat,
    showCopyright: settings.showCopyright,
    showUsagePolicy: settings.showUsagePolicy,
    showSponsorCredit: settings.showSponsorCredit,
    showThirdPartyAds: settings.showThirdPartyAds,
    splitContactEmail: settings.splitContactEmail,
    showGameCopyright: settings.showGameCopyright,
    showTranslationQuality: settings.showTranslationQuality,
  };
  // Spread the overrides rather than assigning them unconditionally, so an
  // absent `tEn` stays absent instead of becoming an explicit `undefined` —
  // the engine's `options?.tEn` fallback distinguishes the two.
  return { ...fromSettings, ...overrides };
}

/**
 * React binding for {@link buildRenderOptions}.
 *
 * Subscribes with one selector per field rather than `useSettingsStore()`. The
 * no-selector form returns a fresh state object on every store write, which
 * would hand back a new options reference each render and defeat the `useMemo`
 * in `useGeneratedOutput`.
 *
 * `tEn` and `bilingualContentBlocks` are positional for the same reason —
 * an inline `{ tEn }` object literal at the call site would be a new reference
 * every render.
 */
export function useRenderOptions(
  tEn?: RenderOptionOverrides["tEn"],
  bilingualContentBlocks?: RenderOptionOverrides["bilingualContentBlocks"],
): RenderOptions {
  const includeMultilingualTags = useSettingsStore((s) => s.includeMultilingualTags);
  const includeTrendingTags = useSettingsStore((s) => s.includeTrendingTags);
  const hashtagCount = useSettingsStore((s) => s.hashtagCount);
  const showQualityBadge = useSettingsStore((s) => s.showQualityBadge);
  const titleFormat = useSettingsStore((s) => s.titleFormat);
  const showCopyright = useSettingsStore((s) => s.showCopyright);
  const showUsagePolicy = useSettingsStore((s) => s.showUsagePolicy);
  const showSponsorCredit = useSettingsStore((s) => s.showSponsorCredit);
  const showThirdPartyAds = useSettingsStore((s) => s.showThirdPartyAds);
  const splitContactEmail = useSettingsStore((s) => s.splitContactEmail);
  const showGameCopyright = useSettingsStore((s) => s.showGameCopyright);
  const showTranslationQuality = useSettingsStore((s) => s.showTranslationQuality);

  return useMemo(() => {
    const overrides: RenderOptionOverrides = {};
    if (tEn) overrides.tEn = tEn;
    if (bilingualContentBlocks !== undefined) {
      overrides.bilingualContentBlocks = bilingualContentBlocks;
    }
    return buildRenderOptions(
      {
        includeMultilingualTags,
        includeTrendingTags,
        hashtagCount,
        showQualityBadge,
        titleFormat,
        showCopyright,
        showUsagePolicy,
        showSponsorCredit,
        showThirdPartyAds,
        splitContactEmail,
        showGameCopyright,
        showTranslationQuality,
      },
      overrides,
    );
  }, [
    tEn,
    bilingualContentBlocks,
    includeMultilingualTags,
    includeTrendingTags,
    hashtagCount,
    showQualityBadge,
    titleFormat,
    showCopyright,
    showUsagePolicy,
    showSponsorCredit,
    showThirdPartyAds,
    splitContactEmail,
    showGameCopyright,
    showTranslationQuality,
  ]);
}
