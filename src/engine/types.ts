export type VideoType =
  | "full"
  | "part"
  | "full_demo"
  | "demo_part"
  | "boss"
  | "boss_nohit"
  | "ending"
  | "speedrun"
  | "100percent"
  | "dlc"
  | "newgame_plus"
  | "challenge"
  | "side_quest"
  | "secret"
  | "comparison"
  | "guide"
  | "mods"
  | "collectibles";

export type Genre =
  | "action"
  | "hack_slash"
  | "beatemup"
  | "platformer"
  | "horror"
  | "survival_horror"
  | "psychological_horror"
  | "rpg"
  | "jrpg"
  | "action_rpg"
  | "crpg"
  | "fps"
  | "arena_shooter"
  | "tactical_fps"
  | "boomer_shooter"
  | "extraction_shooter"
  | "shmup"
  | "openworld"
  | "indie"
  | "soulslike"
  | "racing"
  | "story"
  | "simulation"
  | "city_builder"
  | "fighting"
  | "stealth"
  | "survival_craft"
  | "roguelike"
  | "metroidvania"
  | "mmo"
  | "rhythm"
  | "puzzle"
  | "tower_defense"
  | "card_game"
  | "deck_builder"
  | "auto_battler"
  | "battle_royale"
  | "tactical"
  | "space"
  | "farming"
  | "fmv"
  | "visual_novel";

/**
 * Max number of genres a user can multi-select in the editor.
 * Tag dedup already collapses overlap, but 3 keeps the UI tidy and
 * prevents the tag pool from exploding.
 */
export const MAX_GENRES = 3;

export type SupportedLanguage = "en" | "vi" | "ja" | "es" | "ko" | "zh";

/**
 * Pricing category of a store link. Decides the heading wording
 * ("GET THE GAME" vs "DOWNLOAD THE GAME") and per-link suffix in the
 * generated description.
 */
export type StoreLinkType = "paid" | "free" | "demo";

/**
 * Playthrough state (v0.7 phase 2). Explains how the creator is
 * approaching this run — viewers repeatedly ask "is this your first
 * time?" / "NG+?", so surfacing the answer in the description removes a
 * whole class of comment friction.
 *
 * `"none"` is the sentinel for "creator hasn't picked" → section is
 * skipped entirely, not rendered with a blank value.
 */
export const PLAYTHROUGH_STATUSES = [
  "none",
  "blind",
  "replay",
  "newgame_plus",
  "postgame",
] as const;
export type PlaythroughStatus = (typeof PLAYTHROUGH_STATUSES)[number];

/**
 * Difficulty level (v0.7 phase 2). Covers the common ladder across most
 * games; `"custom"` reveals a free-form label field for games whose
 * difficulty names don't fit (e.g. "Lethal", "Fromsoft default").
 * `"none"` → skip the section.
 */
export const DIFFICULTY_LEVELS = [
  "none",
  "easy",
  "normal",
  "hard",
  "nightmare",
  "custom",
] as const;
export type DifficultyLevel = (typeof DIFFICULTY_LEVELS)[number];

/**
 * Accessibility-oriented content warnings (v0.7 phase 2). Multi-select:
 * a single video can have flashing lights AND loud noises AND jump
 * scares. Empty array → skip the section entirely.
 */
export const CONTENT_WARNINGS = [
  "flashing_lights",
  "loud_noises",
  "jump_scares",
] as const;
export type ContentWarning = (typeof CONTENT_WARNINGS)[number];

export interface GeneratorInput {
  videoType: VideoType;
  language: SupportedLanguage;
  /**
   * Selected genres in user-preferred order. The first entry drives the
   * genre hashtag and the trending-tag template; the rest contribute
   * extra tags through the genre registry (dedup strips overlap).
   * Consumers should assume at least one genre is present.
   */
  genres: Genre[];
  gameName: string;
  gameNameLocalized?: Partial<Record<SupportedLanguage, string>>;
  channelName: string;
  platform: string;
  partNumber?: string;
  bossName?: string;
  dlcName?: string;
  challengeName?: string;
  modName?: string;
  resolution?: string;
  fps?: string;
  graphicsPreset?: string;
  timestamps?: string;
  playlistLink?: string;
  contactEmail?: string;
  /**
   * Music / sound attribution credit. Free-form multiline string.
   * When set, adds a "🎵 MUSIC / SOUND" section to the description
   * before the donate links.
   */
  musicAttribution?: string;
  /**
   * Name of the publisher / developer who provided the game key. Combined
   * with {@link sponsorPlatform} and the `showSponsorCredit` render
   * option to emit a "🎁 Thanks to …" line in the description.
   */
  sponsorName?: string;
  /**
   * Storefront the provided key unlocks on (e.g. "Steam", "Epic Games").
   * Free-form string so regional / non-listed stores still work.
   */
  sponsorPlatform?: string;
  spoilerWarning: boolean;
  matureWarning: boolean;
  /**
   * Playthrough state — renders a "🎯 Playthrough: …" block above
   * `noCommentaryLine`. Defaults to `"none"` (skipped).
   */
  playthroughStatus?: PlaythroughStatus;
  /**
   * Preset / custom difficulty — renders a "🎮 DIFFICULTY" block after
   * the Video Settings section. When `"custom"`, the value is taken
   * from {@link difficultyCustomLabel} instead of the locale preset.
   */
  difficulty?: DifficultyLevel;
  /** Free-form label used when `difficulty === "custom"`. */
  difficultyCustomLabel?: string;
  /**
   * Accessibility warnings — renders a "⚠️ CONTENT WARNINGS" bulleted
   * block after the spoiler section. Empty / missing → skipped.
   */
  contentWarnings?: ContentWarning[];
  storeLinks: Partial<Record<string, string>>;
  /**
   * Parallel map from the same platform id to a pricing category.
   * Missing entries default to "paid" so pre-v0.4.0 drafts keep working.
   */
  storeLinkTypes?: Partial<Record<string, StoreLinkType>>;
  social: Partial<Record<string, string>>;
  rig: Partial<Record<string, string>>;
}

export interface GeneratorOutput {
  title: string;
  description: string;
  tags: string[];
  tagString: string;
  charCounts: {
    title: number;
    description: number;
    tags: number;
  };
  warnings: CharLimitWarning[];
}

export interface CharLimitWarning {
  field: "title" | "description" | "tags";
  current: number;
  limit: number;
  message: string;
}

export const YT_LIMITS = {
  TITLE_MAX: 100,
  DESCRIPTION_MAX: 5000,
  TAGS_MAX: 500,
  SINGLE_TAG_MAX: 30,
  HASHTAG_MAX: 3,
} as const;

export interface TranslationFn {
  (key: string, options?: Record<string, string>): string;
}

/**
 * Where the quality-badge ("[2K]") sits relative to the other title segments:
 * - "middle"  → attached to the video-type segment (v0.6 behavior)
 * - "prefix"  → before the game name, e.g. "[2K] Elden Ring — …"
 * - "suffix"  → before the "Gameplay No Commentary" tail
 */
export type TitleBadgePosition = "prefix" | "middle" | "suffix";

/**
 * Stable IDs for the segment separator. The actual character is resolved
 * per-locale via `templates.title.separators.<id>` so locales can pick
 * their own punctuation conventions.
 */
export type TitleSeparatorId = "emDash" | "hyphen" | "colon" | "pipe";

/** Case of the quality-badge label in the rendered title ("2K" vs "2k"). */
export type TitleBadgeCase = "upper" | "lower";

/**
 * User-configurable title formatting. Defaults (middle / emDash / upper)
 * reproduce v0.6 output byte-for-byte.
 */
export interface TitleFormatConfig {
  badgePosition: TitleBadgePosition;
  separator: TitleSeparatorId;
  badgeCase: TitleBadgeCase;
}
