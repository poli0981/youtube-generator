export type VideoType =
  | "full"
  | "part"
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
  | "guide";

export type Genre =
  | "action"
  | "horror"
  | "rpg"
  | "fps"
  | "openworld"
  | "indie"
  | "soulslike"
  | "racing"
  | "story"
  | "simulation"
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
  | "battle_royale"
  | "crpg"
  | "tactical"
  | "space"
  | "farming";

export type SupportedLanguage = "en" | "vi" | "ja" | "es" | "ko" | "zh";

export interface GeneratorInput {
  videoType: VideoType;
  language: SupportedLanguage;
  genre: Genre;
  gameName: string;
  gameNameLocalized?: Partial<Record<SupportedLanguage, string>>;
  channelName: string;
  platform: string;
  partNumber?: string;
  bossName?: string;
  dlcName?: string;
  challengeName?: string;
  resolution?: string;
  fps?: string;
  graphicsPreset?: string;
  timestamps?: string;
  playlistLink?: string;
  contactEmail?: string;
  spoilerWarning: boolean;
  matureWarning: boolean;
  storeLinks: Partial<Record<string, string>>;
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
