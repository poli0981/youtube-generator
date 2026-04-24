import type { GeneratorInput, GeneratorOutput, TranslationFn, CharLimitWarning } from "./types";
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
}

export function renderAll(
  input: GeneratorInput,
  t: TranslationFn,
  options?: RenderOptions,
): GeneratorOutput {
  const title = buildTitle(input, t, options?.showQualityBadge ?? true);
  const description = buildDescription(input, t, {
    hashtagCount: options?.hashtagCount,
    showCopyright: options?.showCopyright,
    showUsagePolicy: options?.showUsagePolicy,
    showSponsorCredit: options?.showSponsorCredit,
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
