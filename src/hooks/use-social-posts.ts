import { useMemo } from "react";
import i18n from "i18next";
import { useSettingsStore } from "@store/settings-store";
import {
  buildAllSocialPosts,
  type SocialPostOutput,
} from "@engine/social-post-builder";
import { SOCIAL_PLATFORMS } from "@config/social-platforms";
import type { SupportedLanguage } from "@engine/types";
import { useCurrentGeneratorInput } from "./use-current-generator-input";
import { useLanguagesReady } from "./use-languages-ready";

/**
 * Memoised editor-state → cross-post captions hook (v0.24.0). Mirrors
 * {@link useGeneratedOutput}: assembles the same {@link GeneratorInput},
 * pulls the relevant description toggles, and renders one caption per
 * platform. Takes an optional language override so the Social page's bulk
 * mode can reuse it the way Batch reuses the generator input.
 */
export function useSocialPosts(
  languageOverride?: SupportedLanguage,
): Record<string, SocialPostOutput> {
  const input = useCurrentGeneratorInput(languageOverride);
  const { showCopyright, showSponsorCredit } = useSettingsStore();

  // Lazy-loaded locales (v0.26): no caption until the output language's
  // bundle is in memory — SocialPage renders nothing for an empty record.
  const ready = useLanguagesReady([input.language]);

  const t = useMemo(
    () => i18n.getFixedT(input.language, "templates"),
    [input.language],
  );
  // Always-English `t` for the bilingual content-warnings block, built
  // once so the engine receives a stable ref.
  const tEn = useMemo(() => i18n.getFixedT("en", "templates"), []);

  return useMemo(
    () =>
      !ready
        ? {}
        : buildAllSocialPosts(input, t, SOCIAL_PLATFORMS, {
            showCopyright,
            showSponsorCredit,
            tEn,
          }),
    [ready, input, t, tEn, showCopyright, showSponsorCredit],
  );
}
