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
  spoilerWarning: boolean;
  matureWarning: boolean;
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
