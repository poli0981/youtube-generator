import type { GeneratorInput, SupportedLanguage } from "./types";
import { YT_LIMITS } from "./types";
import { humanizeId } from "@utils/sanitize";

/**
 * Genre tag pool registry.
 *
 * Each entry returns an array of tags for the given game name. These tags
 * are language-agnostic (English-based SEO terms commonly searched across
 * all regions). Language-specific tags come from CORE_TAGS_BY_LANG and
 * MULTILINGUAL_TAGS.
 */
const GENRE_TAG_REGISTRY: Record<string, (gameName: string) => string[]> = {
  action: (g) => [`${g} action`, "action game no commentary", "action adventure gameplay", `${g} combat`],
  horror: (g) => [`${g} horror`, "horror game no commentary", "survival horror gameplay", `${g} scary`],
  rpg: (g) => [`${g} RPG`, "RPG no commentary", "RPG gameplay", "JRPG no commentary", `${g} role playing`],
  fps: (g) => [`${g} FPS`, "FPS no commentary", "shooter gameplay no commentary", `${g} shooter`],
  openworld: (g) => [`${g} open world`, "open world no commentary", "free roam gameplay", `${g} exploration`],
  indie: (g) => [`${g} indie`, `${g} indie game`, "indie game no commentary", "indie gameplay", "best indie games"],
  soulslike: (g) => [`${g} souls like`, "soulsborne no commentary", "souls like gameplay", `${g} hardcore`],
  racing: (g) => [`${g} racing`, "racing game no commentary", "racing gameplay", `${g} cars`],
  story: (g) => [
    `${g} story`,
    `${g} story mode`,
    "story game no commentary",
    "narrative gameplay",
    "cinematic adventure no commentary",
  ],
  simulation: (g) => [`${g} simulation`, "simulation game no commentary", "strategy gameplay", `${g} sim`],
  fighting: (g) => [`${g} fighting`, "fighting game no commentary", "combo gameplay", `${g} fight`],
  stealth: (g) => [`${g} stealth`, "stealth game no commentary", "stealth gameplay", `${g} ghost run`],
  survival_craft: (g) => [
    `${g} survival`,
    "survival crafting no commentary",
    "base building",
    `${g} crafting`,
  ],
  roguelike: (g) => [`${g} roguelike`, "roguelike no commentary", "roguelite gameplay", `${g} run`],
  metroidvania: (g) => [
    `${g} metroidvania`,
    "metroidvania no commentary",
    "exploration gameplay",
    `${g} platformer`,
  ],
  mmo: (g) => [`${g} MMO`, "MMO no commentary", "MMORPG gameplay", `${g} online`],
  rhythm: (g) => [`${g} rhythm`, "rhythm game no commentary", "music game gameplay", `${g} music`],
  puzzle: (g) => [`${g} puzzle`, "puzzle game no commentary", "brain teaser gameplay", `${g} logic`],
  tower_defense: (g) => [`${g} tower defense`, "tower defense no commentary", "TD gameplay", `${g} strategy`],
  card_game: (g) => [`${g} card game`, "deck builder no commentary", "card game gameplay", `${g} TCG`],
  battle_royale: (g) => [`${g} battle royale`, "battle royale no commentary", "BR gameplay", `${g} solo`],
  crpg: (g) => [`${g} CRPG`, "CRPG no commentary", "isometric RPG gameplay", `${g} party`],
  tactical: (g) => [`${g} tactical`, "tactical game no commentary", "turn based strategy", `${g} tactics`],
  space: (g) => [`${g} space`, "space game no commentary", "sci-fi gameplay", `${g} sci fi`],
  farming: (g) => [`${g} farming`, "farming sim no commentary", "cozy game gameplay", `${g} cozy`],
  fmv: (g) => [`${g} FMV`, "FMV game no commentary", "interactive movie gameplay", `${g} live action`],
  visual_novel: (g) => [
    `${g} visual novel`,
    `${g} VN no commentary`,
    "visual novel gameplay",
    "kinetic novel no commentary",
    `${g} story mode`,
  ],
};

const VIDEO_TYPE_TAGS: Record<string, (gameName: string) => string[]> = {
  full: (g) => [`${g} full game`, `${g} full gameplay no commentary`, `${g} longplay`],
  part: (g) => [`${g} walkthrough`, `${g} playthrough`, `${g} let's play no commentary`],
  full_demo: (g) => [
    `${g} demo`,
    `${g} full demo`,
    `${g} demo gameplay no commentary`,
    "game demo no commentary",
  ],
  demo_part: (g) => [
    `${g} demo part`,
    `${g} demo playthrough`,
    `${g} demo walkthrough`,
    "demo gameplay no commentary",
  ],
  boss: (g) => [`${g} boss fight`, `${g} boss battle`, "boss fight no commentary"],
  boss_nohit: (g) => [`${g} boss no hit`, `${g} no damage boss`, "no hit boss fight"],
  ending: (g) => [`${g} ending`, `${g} all endings`, `${g} final boss`],
  speedrun: (g) => [`${g} speedrun`, "speedrun no commentary", `${g} speed run`],
  "100percent": (g) => [`${g} 100%`, `${g} 100 percent`, `${g} completionist`],
  dlc: (g) => [`${g} DLC`, `${g} DLC gameplay`, "DLC no commentary"],
  newgame_plus: (g) => [`${g} new game plus`, `${g} NG+`, "new game plus no commentary"],
  challenge: (g) => [`${g} challenge`, `${g} challenge run`, "challenge no commentary"],
  side_quest: (g) => [`${g} side quest`, `${g} optional content`, "side quest no commentary"],
  secret: (g) => [`${g} secret`, `${g} hidden`, "secret content no commentary"],
  comparison: (g) => [`${g} comparison`, `${g} graphics comparison`, "comparison no commentary"],
  guide: (g) => [`${g} guide`, `${g} silent guide`, "guide no commentary"],
};

/**
 * Language-specific "core" tag pool. Replaces the previous English-only
 * getCoreTags. Selected by GeneratorInput.language so the channel can
 * match the viewer's region.
 */
const CORE_TAGS_BY_LANG: Record<SupportedLanguage, (gameName: string) => string[]> = {
  en: (g) => [
    `${g} gameplay`,
    `${g} no commentary`,
    "gameplay no commentary",
    `${g} walkthrough`,
    `${g} full game`,
    `${g} gameplay no commentary`,
  ],
  vi: (g) => [
    `${g} gameplay`,
    `${g} không bình luận`,
    `${g} gameplay không bình luận`,
    "gameplay không bình luận",
    `${g} chơi thử`,
    `${g} let's play`,
  ],
  ja: (g) => [
    `${g} ゲームプレイ`,
    `${g} 実況なし`,
    "ゲームプレイ 実況なし",
    `${g} 攻略`,
    `${g} プレイ動画`,
    `${g} 実況プレイ`,
  ],
  es: (g) => [
    `${g} gameplay`,
    `${g} sin comentarios`,
    "gameplay sin comentarios",
    `${g} completo`,
    `${g} guía`,
    `${g} español`,
  ],
  ko: (g) => [`${g} 게임플레이`, `${g} 무편집`, "게임플레이 무편집", `${g} 공략`, `${g} 플레이`, `${g} 한국어`],
  zh: (g) => [`${g} 游戏实况`, `${g} 无解说`, "游戏实况 无解说", `${g} 攻略`, `${g} 流程`, `${g} 通关`],
};

/**
 * Extra region-specific tags added when includeMultilingualTags is true.
 * Only the selected language's entry is used — v0.2.0 incorrectly mixed
 * all languages regardless of the user's choice.
 */
const MULTILINGUAL_TAGS: Record<SupportedLanguage, (gameName: string) => string[]> = {
  en: (g) => [`${g} english`, "gameplay english no commentary"],
  ja: (g) => [`${g} 日本語`, `${g} 実況`, "日本語 ゲームプレイ"],
  vi: (g) => [`${g} tiếng Việt`, `${g} thuyết minh`, "gameplay tiếng Việt"],
  es: (g) => [`${g} español`, `${g} en español`, "gameplay en español"],
  ko: (g) => [`${g} 한국어`, `${g} 플레이`, "한국어 게임플레이"],
  zh: (g) => [`${g} 中文`, `${g} 游戏`, "中文 游戏实况"],
};

function getPlatformTags(gameName: string, platform: string): string[] {
  if (!platform) return [];
  const platformLabel = platform.toUpperCase();
  return [
    `${gameName} ${platformLabel}`,
    `${platformLabel} gameplay`,
    `${gameName} ${platformLabel} gameplay`,
  ];
}

function getQualityTags(gameName: string, resolution?: string, fps?: string): string[] {
  const tags: string[] = [];
  if (resolution && resolution !== "1080p") {
    tags.push(`${gameName} ${resolution}`, `${resolution} gameplay no commentary`);
  }
  if (fps && fps !== "60") {
    tags.push(`${gameName} ${fps}fps`);
  }
  if (resolution && fps) {
    tags.push(`${gameName} ${resolution} ${fps}fps`);
  }
  return tags;
}

function getTrendingTags(gameName: string, genre: string): string[] {
  const year = new Date().getFullYear().toString();
  const genreLabel = humanizeId(genre);
  return [`${gameName} ${year}`, `best ${genreLabel} games ${year}`, `${genreLabel} gameplay ${year}`];
}

export interface TagOptions {
  includeMultilingualTags?: boolean;
  includeTrendingTags?: boolean;
}

export function generateTags(input: GeneratorInput, options?: TagOptions): string[] {
  const { includeMultilingualTags = true, includeTrendingTags = true } = options ?? {};
  const gameName = input.gameNameLocalized?.[input.language] ?? input.gameName;

  const allTags: string[] = [];

  // Core tags — language-specific (highest priority)
  const coreFn = CORE_TAGS_BY_LANG[input.language] ?? CORE_TAGS_BY_LANG.en;
  allTags.push(...coreFn(gameName));

  // Genre tags
  const genreFn = GENRE_TAG_REGISTRY[input.genre];
  if (genreFn) {
    allTags.push(...genreFn(gameName));
  }

  // Video type tags
  const typeFn = VIDEO_TYPE_TAGS[input.videoType];
  if (typeFn) {
    allTags.push(...typeFn(gameName));
  }

  // Platform tags
  allTags.push(...getPlatformTags(gameName, input.platform));

  // Quality tags
  allTags.push(...getQualityTags(gameName, input.resolution, input.fps));

  // Multilingual tags — only the selected language (v0.3.0 fix: was
  // previously iterating over every language entry).
  if (includeMultilingualTags) {
    const langFn = MULTILINGUAL_TAGS[input.language];
    if (langFn) {
      allTags.push(...langFn(gameName));
    }
  }

  // Trending tags (lowest priority)
  if (includeTrendingTags) {
    allTags.push(...getTrendingTags(gameName, input.genre));
  }

  // Dedup (case-insensitive) and enforce per-tag char limit
  const seen = new Set<string>();
  const deduped: string[] = [];
  for (const tag of allTags) {
    const lower = tag.toLowerCase().trim();
    if (lower && !seen.has(lower) && lower.length <= YT_LIMITS.SINGLE_TAG_MAX) {
      seen.add(lower);
      deduped.push(tag.trim());
    }
  }

  // Trim to 500 character limit
  return trimToCharLimit(deduped, YT_LIMITS.TAGS_MAX);
}

function trimToCharLimit(tags: string[], maxChars: number): string[] {
  const result: string[] = [];
  let totalLength = 0;

  for (const tag of tags) {
    const separatorLength = result.length > 0 ? 2 : 0; // ", "
    const newLength = totalLength + separatorLength + tag.length;
    if (newLength > maxChars) break;
    result.push(tag);
    totalLength = newLength;
  }

  return result;
}

export function formatTagString(tags: string[]): string {
  return tags.join(", ");
}
