import type {
  GeneratorInput,
  GeneratorOutput,
  TranslationFn,
  CharLimitWarning,
  TitleFormatConfig,
} from "./types";
import { buildTitle, checkTitleWarning } from "./title-builder";
import { buildDescription, checkDescriptionWarning } from "./description-builder";
import { generateTags, formatTagString, type TagOptions } from "./tag-generator";
import { YT_LIMITS } from "./types";

export interface RenderOptions extends TagOptions {
  hashtagCount?: number;
  /**
   * When true, buildTitle appends a `[2K 60FPS]`-style badge to the
   * video-type segment whenever resolution/fps are above the defaults.
   * Defaults to true at the engine level; callers override with the
   * user's setting.
   */
  showQualityBadge?: boolean;
  /**
   * Title formatting knobs (badge position, separator, badge case).
   * Partial — any omitted sub-key falls back to the v0.6 default inside
   * buildTitle. Flowed from the user's Settings.
   */
  titleFormat?: Partial<TitleFormatConfig>;
  /**
   * When true (and channelName is non-empty), the description ends with
   * an auto-generated `© <year> <channelName>. All rights reserved.` line.
   */
  showCopyright?: boolean;
  /**
   * When true, the description appends a localised "usage policy" block
   * (📋 USAGE POLICY) after the copyright line.
   */
  showUsagePolicy?: boolean;
  /**
   * When true and both `sponsorName` and `sponsorPlatform` are set on
   * the input, the description emits a "🎁 Thanks to …" credit line
   * above the music / donate block.
   */
  showSponsorCredit?: boolean;
  /**
   * When true and the active profile's `thirdPartyAdText` is non-empty,
   * the description emits a "🤝 SPONSORS & PARTNERS" block above the
   * music section (v0.11).
   */
  showThirdPartyAds?: boolean;
  /**
   * When true and the editor's `pubDevName` is non-empty, the description
   * emits a `© {publisher}. All rights reserved.` line right after the
   * Store Links block (v0.21.0). Opt-in — meant for games whose
   * dev/publisher contractually requires attribution in the description.
   */
  showGameCopyright?: boolean;
  /**
   * Optional English-fixed translation function. Used by the v0.11
   * unified content-warnings block to render bilingual lines
   * `EN · output-language`. When omitted, the warnings block falls back
   * to single-language output via `t`.
   */
  tEn?: TranslationFn;
}

export function renderAll(
  input: GeneratorInput,
  t: TranslationFn,
  options?: RenderOptions,
): GeneratorOutput {
  const title = buildTitle(input, t, {
    showQualityBadge: options?.showQualityBadge ?? true,
    badgePosition: options?.titleFormat?.badgePosition,
    separator: options?.titleFormat?.separator,
    badgeCase: options?.titleFormat?.badgeCase,
  });
  const description = buildDescription(input, t, {
    hashtagCount: options?.hashtagCount,
    showCopyright: options?.showCopyright,
    showUsagePolicy: options?.showUsagePolicy,
    showSponsorCredit: options?.showSponsorCredit,
    showThirdPartyAds: options?.showThirdPartyAds,
    showGameCopyright: options?.showGameCopyright,
    tEn: options?.tEn,
  });
  const tags = generateTags(input, options);
  const tagString = formatTagString(tags);

  const charCounts = {
    title: title.length,
    description: description.length,
    tags: tagString.length,
  };

  const warnings: CharLimitWarning[] = [];

  const titleWarning = checkTitleWarning(title);
  if (titleWarning) warnings.push(titleWarning);

  const descWarning = checkDescriptionWarning(description);
  if (descWarning) warnings.push(descWarning);

  if (tagString.length > YT_LIMITS.TAGS_MAX) {
    warnings.push({
      field: "tags",
      current: tagString.length,
      limit: YT_LIMITS.TAGS_MAX,
      message: `Tags exceed ${YT_LIMITS.TAGS_MAX} characters (${tagString.length}/${YT_LIMITS.TAGS_MAX})`,
    });
  }

  return {
    title,
    description,
    tags,
    tagString,
    charCounts,
    warnings,
  };
}
