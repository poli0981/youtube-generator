import type {
  GeneratorInput,
  TranslationFn,
  CharLimitWarning,
  TitleBadgePosition,
  TitleSeparatorId,
  TitleBadgeCase,
} from "./types";
import { YT_LIMITS } from "./types";
import {
  DEFAULT_GACHA_QUEST_TYPE,
  GACHA_PART_SUFFIX_STYLES,
  type GachaQuestType,
} from "@config/gacha-quest-types";

/**
 * Compact "[2K 60FPS]" badge appended to the video-type segment when the
 * recording quality is above the defaults (1080p / 60fps).
 *
 * Rules:
 * - 1080p + 60fps → empty string (no badge, keeps the title short).
 * - Resolution above 1080p → map 1440p to "2K"; 720p/4K pass through.
 * - Non-default FPS → include the resolution alongside (e.g. "1080p 120FPS")
 *   so a lonely FPS number isn't ambiguous.
 *
 * Always returns upper-case. Callers apply `badgeCase: "lower"` downstream
 * — this function is a label producer, not a display formatter.
 */
export function buildQualityBadge(resolution?: string, fps?: string): string {
  const res = resolution || "1080p";
  const fpsValue = fps || "60";
  const resDefault = res === "1080p";
  const fpsDefault = fpsValue === "60";
  if (resDefault && fpsDefault) return "";

  const resLabel = res === "1440p" ? "2K" : res;
  return fpsDefault ? resLabel : `${resLabel} ${fpsValue}FPS`;
}

export interface BuildTitleOptions {
  /** When true, a `[2K]`-style badge is appended/prefixed according to
   *  `badgePosition`. When false, the badge is suppressed regardless of
   *  resolution/fps. Default: true. */
  showQualityBadge?: boolean;
  /** Where the badge sits. Default: "middle" (v0.6 behavior). */
  badgePosition?: TitleBadgePosition;
  /** Separator ID, resolved via `templates.title.separators.<id>`.
   *  Falls back to the legacy `templates.title.separator` when the
   *  id-keyed form is missing. Default: "emDash". */
  separator?: TitleSeparatorId;
  /** Case of the badge label. Default: "upper" (v0.6 behavior). */
  badgeCase?: TitleBadgeCase;
}

const DEFAULT_TITLE_OPTIONS: Required<BuildTitleOptions> = {
  showQualityBadge: true,
  badgePosition: "middle",
  separator: "emDash",
  badgeCase: "upper",
};

function normalizeOptions(
  optsOrShow: BuildTitleOptions | boolean | undefined,
): Required<BuildTitleOptions> {
  if (typeof optsOrShow === "boolean") {
    return { ...DEFAULT_TITLE_OPTIONS, showQualityBadge: optsOrShow };
  }
  return { ...DEFAULT_TITLE_OPTIONS, ...(optsOrShow ?? {}) };
}

interface ComposeArgs {
  gameName: string;
  videoTypeLabel: string;
  suffix: string;
  badge: string;
  separator: string;
  position: TitleBadgePosition;
}

/**
 * Assembles the final title string. Three positions supported:
 *
 * - "middle": badge glues to the video-type segment. If that segment is
 *   empty (e.g. `full` video type renders as ""), the badge becomes its
 *   own segment between game name and suffix — preserves the v0.6 edge
 *   case where a 4K full run still surfaces the quality label.
 * - "prefix": `[badge] gameName <sep> videoTypeLabel? <sep> suffix`.
 *   The badge attaches to the game-name segment with a literal space
 *   (no separator between badge and game — matches the visual
 *   convention of `qualityFirst` in title-variants.ts).
 * - "suffix": `gameName <sep> videoTypeLabel? <sep> [badge] suffix`.
 *   Badge prefixes the "Gameplay No Commentary" tail.
 *
 * When `badge` is empty, all three positions collapse to an identical
 * string — tested explicitly in title-builder.test.ts.
 */
function composeTitle(args: ComposeArgs): string {
  const { gameName, videoTypeLabel, suffix, badge, separator, position } = args;
  const badgeTag = badge ? `[${badge}]` : "";

  if (position === "prefix") {
    const head = badgeTag ? `${badgeTag} ${gameName}` : gameName;
    const parts = [head];
    if (videoTypeLabel) parts.push(videoTypeLabel);
    parts.push(suffix);
    return parts.join(separator);
  }

  if (position === "suffix") {
    const tail = badgeTag ? `${badgeTag} ${suffix}` : suffix;
    const parts = [gameName];
    if (videoTypeLabel) parts.push(videoTypeLabel);
    parts.push(tail);
    return parts.join(separator);
  }

  // position === "middle" (default / v0.6 behavior)
  const parts = [gameName];
  if (videoTypeLabel) {
    parts.push(badgeTag ? `${videoTypeLabel} ${badgeTag}` : videoTypeLabel);
  } else if (badgeTag) {
    parts.push(badgeTag);
  }
  parts.push(suffix);
  return parts.join(separator);
}

/**
 * English ordinal suffix for an integer (1 → "st", 2 → "nd", 11 → "th",
 * 21 → "st", etc.). Used by the Anniversary template to render
 * `"{{anniversaryYear}}{{ordinalSuffix}} Anniversary"` as e.g.
 * `"2nd Anniversary"`. Non-English locales pass an empty string so the
 * native form ("第2周年", "주년") doesn't pick up an English suffix.
 */
export function ordinalSuffix(n: number): string {
  const abs = Math.abs(Math.trunc(n));
  const lastTwo = abs % 100;
  if (lastTwo >= 11 && lastTwo <= 13) return "th";
  switch (abs % 10) {
    case 1:
      return "st";
    case 2:
      return "nd";
    case 3:
      return "rd";
    default:
      return "th";
  }
}

/**
 * Build the per-quest-type partNumber suffix for a gacha title — e.g.
 * `" - Part 5"`, `" - Day 3"`, `" - Floor 12"`. Driven by the
 * {@link GACHA_PART_SUFFIX_STYLES} mapping so each quest type renders
 * its own canonical wording. Returns an empty string when the part
 * number is blank or the quest type doesn't carry a suffix.
 */
export function buildGachaPartSuffix(
  questType: GachaQuestType,
  partNumber: string | undefined,
  t: TranslationFn,
): string {
  const n = (partNumber ?? "").trim();
  if (!n) return "";
  const style = GACHA_PART_SUFFIX_STYLES[questType];
  if (style === "none") return "";
  const key = `title.gachaPartSuffix.${style}`;
  const resolved = t(key, { n });
  return resolved && resolved !== key ? resolved : "";
}

export function buildTitle(
  input: GeneratorInput,
  t: TranslationFn,
  optionsOrShowQualityBadge: BuildTitleOptions | boolean = true,
): string {
  const opts = normalizeOptions(optionsOrShowQualityBadge);

  // Resolve the separator: prefer the id-keyed form, fall back to the
  // legacy single key so locales that haven't been migrated still work.
  const separatorKey = `title.separators.${opts.separator}`;
  const resolved = t(separatorKey);
  const separator = resolved && resolved !== separatorKey ? resolved : t("title.separator");

  const suffix = t("title.suffix");

  const gameName =
    input.gameNameLocalized?.[input.language] ?? input.gameName;

  let badge = opts.showQualityBadge ? buildQualityBadge(input.resolution, input.fps) : "";
  if (badge && opts.badgeCase === "lower") badge = badge.toLowerCase();

  // Gacha-quest titles compose their own head segment via the
  // per-quest-type i18n template (which already embeds gameName +
  // chapterName / questName + the optional partSuffix). The standard
  // suffix ("Gameplay No Commentary") still tails the result, and the
  // quality badge respects `badgePosition` as usual.
  if (input.videoType === "gacha_quest") {
    const questType = input.gachaQuestType ?? DEFAULT_GACHA_QUEST_TYPE;
    const partSuffix = buildGachaPartSuffix(questType, input.partNumber, t);
    const gachaHeadKey = `title.gachaQuestType.${questType}`;
    const gachaHead = t(gachaHeadKey, {
      gameName,
      chapterName: input.chapterName ?? "",
      questName: input.questName ?? "",
      characterName: input.characterName ?? "",
      anniversaryYear: input.anniversaryYear != null ? String(input.anniversaryYear) : "",
      ordinalSuffix: input.anniversaryYear != null ? ordinalSuffix(input.anniversaryYear) : "",
      gachaVersion: input.gachaVersion ?? "",
      partSuffix,
    });

    return composeTitle({
      gameName: gachaHead,
      videoTypeLabel: "",
      suffix,
      badge,
      separator,
      position: opts.badgePosition,
    });
  }

  const videoTypeLabel = t(`title.videoType.${input.videoType}`, {
    partNumber: input.partNumber ?? "",
    bossName: input.bossName ?? "",
    dlcName: input.dlcName ?? "",
    challengeName: input.challengeName ?? "",
    modName: input.modName ?? "",
  });

  return composeTitle({
    gameName,
    videoTypeLabel,
    suffix,
    badge,
    separator,
    position: opts.badgePosition,
  });
}

export function checkTitleWarning(title: string): CharLimitWarning | null {
  if (title.length > YT_LIMITS.TITLE_MAX) {
    return {
      field: "title",
      current: title.length,
      limit: YT_LIMITS.TITLE_MAX,
      message: `Title exceeds ${YT_LIMITS.TITLE_MAX} characters (${title.length}/${YT_LIMITS.TITLE_MAX})`,
    };
  }
  return null;
}
