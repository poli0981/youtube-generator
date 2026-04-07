import type { GeneratorInput } from "./types";
import { YT_LIMITS } from "./types";

const GENRE_TAG_REGISTRY: Record<string, (gameName: string) => string[]> = {
  action: (g) => [`${g} action`, "action game no commentary", "action adventure gameplay"],
  horror: (g) => [`${g} horror`, "horror game no commentary", "survival horror gameplay"],
  rpg: (g) => [`${g} RPG`, "RPG no commentary", "RPG gameplay", "JRPG no commentary"],
  fps: (g) => [`${g} FPS`, "FPS no commentary", "shooter gameplay no commentary"],
  openworld: (g) => [`${g} open world`, "open world no commentary", "free roam gameplay"],
  indie: (g) => [`${g} indie`, "indie game no commentary", "indie gameplay"],
  soulslike: (g) => [`${g} souls like`, "soulsborne no commentary", "souls like gameplay"],
  racing: (g) => [`${g} racing`, "racing game no commentary", "racing gameplay"],
  story: (g) => [`${g} story`, "story game no commentary", "narrative gameplay"],
  simulation: (g) => [`${g} simulation`, "simulation game no commentary", "strategy gameplay"],
  fighting: (g) => [`${g} fighting`, "fighting game no commentary", "combo gameplay"],
  stealth: (g) => [`${g} stealth`, "stealth game no commentary", "stealth gameplay"],
  survival_craft: (g) => [`${g} survival`, "survival crafting no commentary", "base building"],
  roguelike: (g) => [`${g} roguelike`, "roguelike no commentary", "roguelite gameplay"],
  metroidvania: (g) => [`${g} metroidvania`, "metroidvania no commentary", "exploration gameplay"],
  mmo: (g) => [`${g} MMO`, "MMO no commentary", "MMORPG gameplay"],
  rhythm: (g) => [`${g} rhythm`, "rhythm game no commentary", "music game gameplay"],
  puzzle: (g) => [`${g} puzzle`, "puzzle game no commentary", "brain teaser gameplay"],
  tower_defense: (g) => [`${g} tower defense`, "tower defense no commentary", "TD gameplay"],
  card_game: (g) => [`${g} card game`, "deck builder no commentary", "card game gameplay"],
  battle_royale: (g) => [`${g} battle royale`, "battle royale no commentary", "BR gameplay"],
  crpg: (g) => [`${g} CRPG`, "CRPG no commentary", "isometric RPG gameplay"],
  tactical: (g) => [`${g} tactical`, "tactical game no commentary", "turn based strategy"],
  space: (g) => [`${g} space`, "space game no commentary", "sci-fi gameplay"],
  farming: (g) => [`${g} farming`, "farming sim no commentary", "cozy game gameplay"],
};

const VIDEO_TYPE_TAGS: Record<string, (gameName: string) => string[]> = {
  full: (g) => [`${g} full game`, `${g} full gameplay no commentary`, `${g} longplay`],
  part: (g) => [`${g} walkthrough`, `${g} playthrough`, `${g} let's play no commentary`],
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

const MULTILINGUAL_TAGS: Record<string, (gameName: string) => string[]> = {
  ja: (g) => [`${g} ゲームプレイ`, `${g} 実況なし`, "ゲームプレイ 実況なし"],
  vi: (g) => [`${g} gameplay không bình luận`, `${g} không bình luận`],
  es: (g) => [`${g} sin comentarios`, `${g} gameplay completo`],
  ko: (g) => [`${g} 게임플레이`, `${g} 무편집`],
  zh: (g) => [`${g} 无解说`, `${g} 游戏实况`],
};

function getCoreTags(gameName: string): string[] {
  return [
    `${gameName} gameplay`,
    `${gameName} no commentary`,
    "gameplay no commentary",
    `${gameName} walkthrough`,
    `${gameName} full game`,
    `${gameName} gameplay no commentary`,
  ];
}

function getPlatformTags(gameName: string, platform: string): string[] {
  if (!platform) return [];
  const platformLabel = platform.toUpperCase();
  return [`${gameName} ${platformLabel}`, `${platformLabel} gameplay`, `${gameName} ${platformLabel} gameplay`];
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
  return [`${gameName} ${year}`, `best ${genre} games ${year}`, `${genre} gameplay ${year}`];
}

export interface TagOptions {
  includeMultilingualTags?: boolean;
  includeTrendingTags?: boolean;
}

export function generateTags(input: GeneratorInput, options?: TagOptions): string[] {
  const { includeMultilingualTags = true, includeTrendingTags = true } = options ?? {};
  const gameName =
    input.gameNameLocalized?.[input.language] ?? input.gameName;

  const allTags: string[] = [];

  // Core tags (highest priority)
  allTags.push(...getCoreTags(gameName));

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

  // Multilingual tags
  if (includeMultilingualTags) {
    for (const [, langFn] of Object.entries(MULTILINGUAL_TAGS)) {
      allTags.push(...langFn(gameName));
    }
  }

  // Trending tags (lowest priority)
  if (includeTrendingTags) {
    allTags.push(...getTrendingTags(gameName, input.genre));
  }

  // Dedup (case-insensitive)
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
