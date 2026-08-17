import type { GeneratorInput, TranslationFn } from "./types";
import type { SocialPlatform } from "@config/social-platforms";
import { buildTitle } from "./title-builder";
import { buildBilingualBulletSection } from "./description-builder";
import { formatRigValue } from "@config/rig-fields";
import { sanitizeHashtag } from "@utils/sanitize";

/**
 * Cross-post caption builder (v0.24.0). Re-packages the same
 * {@link GeneratorInput} that drives the YouTube description into a
 * short-form caption for TikTok / Instagram Reels / Facebook Reels.
 *
 * Reuses leaf engine pieces rather than the full description renderer:
 * {@link buildTitle} (badge suppressed), {@link formatRigValue}, the
 * shared {@link buildBilingualBulletSection} (content warnings), the
 * `description.sections.*` copyright / sponsor templates, and
 * {@link sanitizeHashtag}. The YouTube description output is therefore
 * untouched — captions are a parallel renderer, not a fork of it.
 */

export interface SocialPostOptions {
  /** Platform character ceiling. The caption never silently exceeds it;
   *  optional blocks are dropped first, then `isOver` flags any residual
   *  overflow for the UI. */
  charLimit: number;
  /** Platform-popular hashtags appended after the derived game / genre
   *  hashtags (deduped case-insensitively). */
  popularHashtags: readonly string[];
  /** Append the `© year channel` line (mirrors the description toggle). */
  showCopyright?: boolean;
  /** Append the `🎁 Thanks to …` line when both sponsor fields are set. */
  showSponsorCredit?: boolean;
  /** English-fixed `t` for the bilingual content-warnings block. */
  tEn?: TranslationFn;
}

export interface SocialPostOutput {
  text: string;
  charCount: number;
  isOver: boolean;
  /** Ids of optional blocks dropped to fit the limit, in the order
   *  dropped (empty when everything fit). */
  droppedBlocks: string[];
}

/** Optional blocks listed in display order (Title is always first,
 *  hashtags always last — neither is in this list). */
const DISPLAY_ORDER = ["rig", "warnings", "thanks", "copyright"] as const;
type BlockId = (typeof DISPLAY_ORDER)[number];

/** Drop priority when the caption overflows: warnings go first (longest,
 *  least essential for a short clip), the rig credit goes last. */
const DROP_ORDER: readonly BlockId[] = ["warnings", "copyright", "thanks", "rig"];

function buildRigBlock(input: GeneratorInput, t: TranslationFn): string {
  // Mirrors the description-builder rig block: id → formatted value,
  // skipping empties, `KEY: value` per line under the localized header.
  const rigLines = Object.entries(input.rig ?? {})
    .map(([k, v]) => [k, formatRigValue(k, v ?? "")] as const)
    .filter(([, v]) => v && v.trim() !== "")
    .map(([k, v]) => `${k.replace(/_/g, " ").toUpperCase()}: ${v}`)
    .join("\n");
  return rigLines ? `${t("description.sections.rig")}\n${rigLines}` : "";
}

function dedupeHashtags(tags: readonly string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const tag of tags) {
    const key = tag.toLowerCase();
    if (!tag || seen.has(key)) continue;
    seen.add(key);
    out.push(tag);
  }
  return out;
}

function buildHashtagLine(input: GeneratorInput, popular: readonly string[]): string {
  const gameName = input.gameNameLocalized?.[input.language] ?? input.gameName;
  const primaryGenre = input.genres[0];
  const derived = [
    `#${sanitizeHashtag(gameName)}`,
    "#GameplayNoCommentary",
    ...(primaryGenre ? [`#${sanitizeHashtag(primaryGenre)}`] : []),
  ];
  return dedupeHashtags([...derived, ...popular]).join(" ");
}

export function buildSocialPost(
  input: GeneratorInput,
  t: TranslationFn,
  options: SocialPostOptions,
): SocialPostOutput {
  const { charLimit, popularHashtags, showCopyright, showSponsorCredit, tEn } = options;

  // Title — short-form, so the `[2K 60FPS]` badge is suppressed.
  const title = buildTitle(input, t, { showQualityBadge: false });

  const blocks: Record<BlockId, string> = {
    rig: buildRigBlock(input, t),
    warnings:
      buildBilingualBulletSection(
        input.contentWarnings ?? [],
        "description.contentWarnings",
        input.language,
        t,
        tEn,
      ) ?? "",
    thanks:
      showSponsorCredit && input.sponsorName?.trim() && input.sponsorPlatform?.trim()
        ? t("description.sections.sponsorCredit", {
            sponsor: input.sponsorName.trim(),
            platform: input.sponsorPlatform.trim(),
          })
        : "",
    copyright:
      showCopyright && input.channelName.trim()
        ? t("description.sections.copyright", {
            year: String(new Date().getFullYear()),
            channelName: input.channelName.trim(),
          })
        : "",
  };

  const hashtags = buildHashtagLine(input, popularHashtags);

  // Track which optional blocks are still present; drop in priority order
  // until the caption fits. Title + hashtags are always kept.
  const present = new Set<BlockId>(DISPLAY_ORDER.filter((id) => blocks[id].trim() !== ""));

  const assemble = (): string => {
    const parts: string[] = [title];
    for (const id of DISPLAY_ORDER) {
      if (present.has(id)) parts.push(blocks[id]);
    }
    if (hashtags) parts.push(hashtags);
    return parts.filter((p) => p.trim() !== "").join("\n\n");
  };

  const droppedBlocks: string[] = [];
  let text = assemble();
  for (const id of DROP_ORDER) {
    if (text.length <= charLimit) break;
    if (present.has(id)) {
      present.delete(id);
      droppedBlocks.push(id);
      text = assemble();
    }
  }

  return {
    text,
    charCount: text.length,
    isOver: text.length > charLimit,
    droppedBlocks,
  };
}

/**
 * Build a caption for every platform in `platforms`, keyed by platform id.
 * `shared` carries the description-level toggles + the English-fixed `t`
 * so each platform renders consistently.
 */
export function buildAllSocialPosts(
  input: GeneratorInput,
  t: TranslationFn,
  platforms: readonly SocialPlatform[],
  shared: {
    showCopyright?: boolean;
    showSponsorCredit?: boolean;
    tEn?: TranslationFn;
  },
): Record<string, SocialPostOutput> {
  const out: Record<string, SocialPostOutput> = {};
  for (const p of platforms) {
    out[p.id] = buildSocialPost(input, t, {
      charLimit: p.charLimit,
      popularHashtags: p.popularHashtags,
      showCopyright: shared.showCopyright,
      showSponsorCredit: shared.showSponsorCredit,
      tEn: shared.tEn,
    });
  }
  return out;
}
