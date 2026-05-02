import type { GeneratorInput, SupportedLanguage } from "./types";
import { YT_LIMITS } from "./types";
import { humanizeId } from "@utils/sanitize";

/**
 * Reserve a 9-char tail for the most common composite suffix (" gameplay").
 * Composites whose suffix is longer than 9 chars may still get filtered out
 * by the per-tag char limit, but the bare game name and short composites are
 * guaranteed to land — fixing the silent-drop case where a long name made
 * every game-name-bearing tag disappear.
 */
const COMPOSITE_NAME_BUDGET = YT_LIMITS.SINGLE_TAG_MAX - 9;

const QUALIFIER_SUFFIX_RE =
  /[:\s]+(?:Definitive|Complete|Collector'?s?|Deluxe|Game\s+of\s+the\s+Year|GOTY|Ultimate|Special|Anniversary|Remastered|Remake|Enhanced|HD)(?:\s+(?:Edition|Cut|Version))?\s*$/i;

/**
 * Returns a shortened, tag-friendly form of `name` whose length is ≤ `budget`.
 *
 * Strips trademark marks, then iteratively peels off common edition
 * qualifiers ("Definitive Edition", "Remastered", "GOTY", …). If the result
 * is still over budget, drops everything after the first colon. Falls back
 * to picking leading whole words that fit.
 *
 * Pure — exported for testing.
 */
export function tagFriendlyGameName(name: string, budget: number): string {
  let n = name.replace(/[™®©]/g, "").trim();
  let prev: string;
  do {
    prev = n;
    n = n.replace(QUALIFIER_SUFFIX_RE, "").trim();
  } while (n !== prev);

  if (n.length <= budget) return n;

  const colonIdx = n.indexOf(":");
  if (colonIdx > 0) {
    const head = n.slice(0, colonIdx).trim();
    if (head.length <= budget) return head;
    n = head;
  }

  const words = n.split(/\s+/);
  const acc: string[] = [];
  let len = 0;
  for (const w of words) {
    const sep = acc.length === 0 ? 0 : 1;
    if (len + sep + w.length > budget) break;
    acc.push(w);
    len += sep + w.length;
  }
  return acc.join(" ") || n.slice(0, budget);
}

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
  hack_slash: (g) => [
    `${g} hack and slash`,
    "hack and slash no commentary",
    `${g} combo gameplay`,
    "character action game",
  ],
  beatemup: (g) => [
    `${g} beat em up`,
    "beat em up no commentary",
    `${g} brawler`,
    "belt scroll action",
  ],
  platformer: (g) => [
    `${g} platformer`,
    "platformer no commentary",
    `${g} 2d platformer`,
    `${g} 3d platformer`,
  ],
  survival_horror: (g) => [
    `${g} survival horror`,
    "survival horror no commentary",
    `${g} resource management horror`,
    "classic survival horror",
  ],
  psychological_horror: (g) => [
    `${g} psychological horror`,
    "psychological horror no commentary",
    `${g} atmospheric horror`,
    "mind bending horror gameplay",
  ],
  jrpg: (g) => [
    `${g} JRPG`,
    "JRPG no commentary",
    `${g} japanese RPG`,
    "turn based JRPG gameplay",
  ],
  action_rpg: (g) => [
    `${g} action RPG`,
    "action RPG no commentary",
    `${g} ARPG`,
    "action RPG gameplay",
  ],
  arena_shooter: (g) => [
    `${g} arena shooter`,
    "arena shooter no commentary",
    `${g} arena FPS`,
    "fast paced shooter gameplay",
  ],
  tactical_fps: (g) => [
    `${g} tactical FPS`,
    "tactical shooter no commentary",
    `${g} milsim`,
    "tactical FPS gameplay",
  ],
  boomer_shooter: (g) => [
    `${g} boomer shooter`,
    "boomer shooter no commentary",
    `${g} retro fps`,
    "90s shooter gameplay",
  ],
  extraction_shooter: (g) => [
    `${g} extraction shooter`,
    "extraction shooter no commentary",
    `${g} loot and extract`,
    "extraction FPS gameplay",
  ],
  shmup: (g) => [
    `${g} shmup`,
    `${g} bullet hell`,
    "shoot em up no commentary",
    "danmaku gameplay",
  ],
  city_builder: (g) => [
    `${g} city builder`,
    "city builder no commentary",
    `${g} city building`,
    "city sim gameplay",
  ],
  deck_builder: (g) => [
    `${g} deck builder`,
    "deck builder no commentary",
    `${g} deckbuilding roguelike`,
    "deck building gameplay",
  ],
  auto_battler: (g) => [
    `${g} auto battler`,
    "auto battler no commentary",
    `${g} auto chess`,
    "auto battler gameplay",
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
  mods: (g) => [
    `${g} mods`,
    `${g} modded gameplay`,
    "modded gameplay no commentary",
    `${g} mod showcase`,
  ],
  collectibles: (g) => [
    `${g} all collectibles`,
    `${g} 100% collectibles`,
    `${g} completionist no commentary`,
    `${g} achievement guide`,
  ],
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
  const rawName = input.gameNameLocalized?.[input.language] ?? input.gameName;

  // Two friendly forms of the game name:
  //   • bareNameTag — fits the per-tag 30-char limit; always added so the
  //     game name appears as a standalone tag even when long.
  //   • composeName — shorter still, used inside composite tags like
  //     `${name} gameplay` so the composites also fit ≤ 30.
  // For short names both equal `rawName` and behaviour matches v0.7.
  const bareNameTag =
    rawName.length <= YT_LIMITS.SINGLE_TAG_MAX
      ? rawName
      : tagFriendlyGameName(rawName, YT_LIMITS.SINGLE_TAG_MAX);
  const composeName =
    rawName.length <= COMPOSITE_NAME_BUDGET
      ? rawName
      : tagFriendlyGameName(rawName, COMPOSITE_NAME_BUDGET);

  const allTags: string[] = [];

  // Always seed the bare game-name tag(s) so they survive dedup even when
  // the pool composites overflow.
  if (bareNameTag) allTags.push(bareNameTag);
  if (composeName && composeName !== bareNameTag) allTags.push(composeName);

  // Core tags — language-specific (highest priority)
  const coreFn = CORE_TAGS_BY_LANG[input.language] ?? CORE_TAGS_BY_LANG.en;
  allTags.push(...coreFn(composeName));

  // Genre tags — merge contributions from every selected genre.
  // Final dedup at the bottom collapses overlap across the pools.
  for (const genre of input.genres) {
    const genreFn = GENRE_TAG_REGISTRY[genre];
    if (genreFn) {
      allTags.push(...genreFn(composeName));
    }
  }

  // Video type tags
  const typeFn = VIDEO_TYPE_TAGS[input.videoType];
  if (typeFn) {
    allTags.push(...typeFn(composeName));
  }

  // Platform tags
  allTags.push(...getPlatformTags(composeName, input.platform));

  // Quality tags
  allTags.push(...getQualityTags(composeName, input.resolution, input.fps));

  // Multilingual tags — only the selected language (v0.3.0 fix: was
  // previously iterating over every language entry).
  if (includeMultilingualTags) {
    const langFn = MULTILINGUAL_TAGS[input.language];
    if (langFn) {
      allTags.push(...langFn(composeName));
    }
  }

  // Trending tags (lowest priority). The first genre stands in as the
  // "primary" genre for the template — multi-genre games usually have
  // one headline category that searchers use.
  const primaryGenre = input.genres[0];
  if (includeTrendingTags && primaryGenre) {
    allTags.push(...getTrendingTags(composeName, primaryGenre));
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
