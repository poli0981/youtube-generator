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
import { formatEndingEntry, sliceEndingsForVideo } from "./endings-format";
import type { EndingEntry } from "./types";

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

/**
 * Build the video-type segment of the title when `videoType === "ending"`
 * AND the creator has filled at least one structured {@link EndingEntry}
 * (v0.17.0). Three tiers, picked by what's available:
 *
 *   1. Single entry → `formatEndingEntry()` (e.g. `"Ending 3: Best End"`,
 *      `"Ending 3"`, or `"Best End"`).
 *   2. Multiple entries, every entry has a non-empty `name` → comma-join
 *      the names. Plays well with multi-route VN-style endings where
 *      the creator cares more about the named routes than the ordinals.
 *   3. Multiple entries, every entry has a `number` AND they form a
 *      contiguous run → `"Endings {from}–{to}"` via locale key
 *      `title.endingLabel.range`. Tightest visible label for batched
 *      ending playthroughs ("Endings 1–3" / "Kết thúc 1–3").
 *   4. Mixed / non-contiguous fallback → `"{count} Endings"` via
 *      `title.endingLabel.count`.
 *
 * Returns `null` when no structured data is usable, signalling the
 * caller to fall back to the legacy locale-string label
 * (`title.videoType.ending` = "Ending"). This keeps existing single-
 * ending creators byte-identical post-migration.
 *
 * Slicing: respects `endingVideoIndex` + `endingVideoRanges` so a
 * per-video title for case C renders only that video's slice of
 * endings. The Output page passes the index when looping over
 * `endingVideoCount`; bare generation (no index) sees the union.
 */
function buildStructuredEndingLabel(
  input: GeneratorInput,
  t: TranslationFn,
): string | null {
  const endings: EndingEntry[] = input.endings ?? [];
  if (endings.length === 0) return null;

  const sliced = sliceEndingsForVideo(endings, input);
  // Drop entries that have neither number nor a non-empty name — they
  // produce no visible label and would dilute the comma-join / count.
  const usable = sliced.filter((e) => {
    const hasNumber =
      typeof e.number === "number" && Number.isFinite(e.number);
    const hasName = (e.name ?? "").trim().length > 0;
    return hasNumber || hasName;
  });
  if (usable.length === 0) return null;

  if (usable.length === 1) {
    const only = usable[0];
    return only ? formatEndingEntry(only) : null;
  }

  // Multi-entry: prefer named comma-join when every entry has a name.
  const allHaveNames = usable.every((e) => (e.name ?? "").trim().length > 0);
  if (allHaveNames) {
    return usable.map((e) => e.name.trim()).join(", ");
  }

  // Numbered + contiguous → range form. Sort + scan adjacent diffs to
  // detect contiguity so an out-of-order entry list ([3, 1, 2]) still
  // collapses to "Endings 1–3".
  const numbers = usable
    .map((e) => e.number)
    .filter((n): n is number => typeof n === "number" && Number.isFinite(n));
  if (numbers.length === usable.length) {
    const sorted = [...numbers].sort((a, b) => a - b);
    const isContiguous = sorted.every(
      (n, i) => i === 0 || n === (sorted[i - 1] as number) + 1,
    );
    if (isContiguous) {
      const from = sorted[0] as number;
      const to = sorted[sorted.length - 1] as number;
      const key = "title.endingLabel.range";
      const resolved = t(key, { from: String(from), to: String(to) });
      if (resolved && resolved !== key) return resolved;
      // Fallback if the locale hasn't migrated yet — keep behaviour sane.
      return `Endings ${from}–${to}`;
    }
  }

  // Mixed / non-contiguous: report count.
  const key = "title.endingLabel.count";
  const resolved = t(key, { count: String(usable.length) });
  if (resolved && resolved !== key) return resolved;
  return `${usable.length} Endings`;
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

  // v0.17.0: when the creator has filled structured endings, replace
  // the static "Ending" label with a context-aware one (single entry
  // surfaces the ending's name, multi-entry collapses to a name list /
  // contiguous range / count). Falls back to the locale string when no
  // structured data is usable, so the legacy single-ending creators
  // who haven't migrated see byte-identical output.
  let videoTypeLabel: string;
  if (input.videoType === "ending") {
    const structured = buildStructuredEndingLabel(input, t);
    videoTypeLabel = structured ?? t("title.videoType.ending");
  } else {
    videoTypeLabel = t(`title.videoType.${input.videoType}`, {
      partNumber: input.partNumber ?? "",
      bossName: input.bossName ?? "",
      dlcName: input.dlcName ?? "",
      challengeName: input.challengeName ?? "",
      modName: input.modName ?? "",
    });
  }

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
