import type {
  GraphicsPreset,
  RTMode,
  FrameGenVendor,
  FrameGenMultiplier,
  UpscaleQuality,
  ArtStyle,
} from "@config/graphics-settings";
import type { GachaQuestType } from "@config/gacha-quest-types";

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
  | "collectibles"
  | "livestream"
  | "gacha_quest";

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
 * Language-patch state (v0.12). Distinguishes between an officially
 * shipped translation, a fan translation, machine translation, or no
 * patch at all. `"official_other"` covers official non-English releases
 * — pair with {@link languagePatchCustom} to surface the actual locale
 * (e.g. "Official KR"). `"none"` skips the bullet in the description.
 */
export const LANGUAGE_PATCH_OPTIONS = [
  "none",
  "official_en",
  "official_other",
  "fan_translation",
  "mtl",
  "custom",
] as const;
export type LanguagePatch = (typeof LANGUAGE_PATCH_OPTIONS)[number];

/**
 * Game-version state (v0.12). Lets viewers know if they're watching the
 * full release vs. a demo / EA / beta / prologue. `"custom"` is the
 * escape hatch for niche cases ("Steam Next Fest demo", "Kickstarter
 * backer build"); pair with {@link gameVersionCustom}. `"full_release"`
 * is the implicit default and skips the bullet (no need to announce
 * "this is the full game" — that's the assumed baseline).
 */
export const GAME_VERSION_OPTIONS = [
  "full_release",
  "demo",
  "early_access",
  "beta",
  "prologue",
  "pre_release",
  "custom",
] as const;
export type GameVersion = (typeof GAME_VERSION_OPTIONS)[number];

/**
 * Tech / production / playstyle disclaimer items (v0.12). One unified
 * checklist that consolidates "Technical issue", "Gameplay", and
 * "Game State" disclaimer pools. Items that overlap with structured
 * fields ({@link PlaythroughStatus}, {@link DifficultyLevel},
 * {@link LanguagePatch}, {@link GameVersion}, `endingsShown`) are
 * intentionally NOT in this list — the structured field renders that
 * data instead, so duplicating it here would surface the same fact
 * twice.
 *
 * Grouped semantically in the UI (see {@link TECH_NOTE_GROUPS} in
 * `@config/tech-note-groups`) but flat in the array — render order in
 * the description matches the user's selection order. Like content
 * warnings, the rendered block is bilingual when `tEn` is provided.
 */
export const TECH_NOTES = [
  // Audio
  "copyright_muted_sections",
  "volume_reduced_copyright",
  "music_replaced_copyright",
  "cutscene_audio_muted_only",
  "original_audio_kept",
  // Video quality
  "low_resolution_hardware",
  "low_graphics_performance",
  "fps_drops_hardware",
  // Recording issues
  "bug_from_game",
  "crash_kept_transparency",
  "loading_cut",
  "obs_artifacts_possible",
  // Playstyle disclaimers
  "not_no_hit_run",
  "not_clean_walkthrough",
  "casual_no_commentary",
  "many_deaths_patience",
  "slow_exploration",
  "puzzle_stuck_possible",
  "grinding_cut",
  "not_speedrun_relaxed",
  // Production / attribution
  "exploration_focus_skip_combat",
  "edited_for_pacing",
  "support_developers",
  "online_connectivity_issues",
] as const;
export type TechNote = (typeof TECH_NOTES)[number];

/**
 * Content warnings (v0.11 unified bilingual checklist). Replaces the
 * v0.7 trio (flashing_lights / loud_noises / jump_scares) plus the
 * standalone `spoilerWarning` / `matureWarning` boolean toggles. The 3
 * legacy ids are preserved unchanged so persisted drafts round-trip.
 *
 * Grouped semantically in the UI (see {@link CONTENT_WARNING_GROUPS} in
 * `@config/content-warning-groups`) but flat in the array — the engine
 * doesn't care about groups. Render order in the description matches
 * the user's selection order.
 */
export const CONTENT_WARNINGS = [
  // Spoilers
  "spoiler_story",
  "spoiler_ending",
  "spoiler_true_ending",
  "spoiler_post_game",
  "spoiler_secret_ending",
  "spoiler_dlc",
  // Photosensitive / health
  "flashing_lights",
  "motion_sickness",
  "migraine_trigger",
  "loud_noises",
  // Phobias
  "jump_scares",
  "acrophobia",
  "trypophobia",
  "thalassophobia",
  "claustrophobia",
  "arachnophobia",
  "entomophobia",
  "ophidiophobia",
  "cynophobia",
  "nyctophobia",
  "pyrophobia",
  "pediophobia",
  "hemophobia",
  // Mental health
  "anxiety_inducing",
  "depression_themes",
  "eating_disorders",
  "substance_use",
  "self_harm",
  "ptsd_themes",
  "needles",
  "body_fluids",
  "pregnancy_horror",
  "illness_themes",
  "bipolar_themes",
  "ocd_themes",
  "panic_attacks",
  "dissociation",
  // Mature / sensitive
  "blood_gore",
  "mature_18plus",
  "disturbing_imagery",
  "animal_abuse",
  "child_harm",
  "domestic_violence",
  "sexual_assault",
  "torture",
  "religion_themes",
  "war_violence",
  "discrimination",
  "police_violence",
  "smoking_drinking",
  "detailed_killing",
  "cult_occult",
  "psychological_manipulation",
  "grief_loss",
  "kidnapping",
  "hate_speech",
  "historical_atrocity",
  "slavery_themes",
  "terrorism_themes",
  "bullying_themes",
  // Playstyle disclosures
  "blind_playthrough",
  "no_spoilers_chat",
  "casual_difficulty",
  "hardcore_difficulty",
  "permadeath_run",
  "speedrun_attempt",
  "completionist_run",
  "learning_mechanics",
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
  /**
   * Long-form mod credit list (multi-line text). Renders into a separate
   * `🧩 MOD LIST` description section when {@link videoType} is `"mods"`.
   * Free-form so creators can paste straight from a Wabbajack / Vortex /
   * Mod Organizer modlist.
   */
  modList?: string;
  /** Livestream-only: canonical YouTube/Twitch live URL. */
  liveUrl?: string;
  /** Livestream-only: ISO datetime (`<input type="datetime-local">`). */
  scheduledTime?: string;
  /**
   * Gacha-quest-only (v0.9 phase 1). Selected quest pattern; drives both
   * the per-type title format and the per-type intro template. Defaults
   * to `"main_story"` in the editor; missing values in pre-v0.9 drafts
   * fall through to `"main_story"` via the editor-store v6→v7 migration.
   */
  gachaQuestType?: GachaQuestType;
  /**
   * Gacha-quest-only: human chapter / story-arc label, e.g.
   * `"Chapter 5 Act 2: Where the Stars Fall"`, `"Penacony 2.0"`.
   */
  chapterName?: string;
  /**
   * Gacha-quest-only: individual quest / event name, e.g.
   * `"A Solitary Constellation"`. Optional — `main_story`-style videos
   * usually rely on `chapterName` only.
   */
  questName?: string;
  /**
   * Gacha-quest-only (v0.13): character name. Used by the `showcase`
   * quest type as the primary subject of the title and description.
   */
  characterName?: string;
  /**
   * Gacha-quest-only (v0.13): anniversary year (1–20). Used by the
   * `anniversary` quest type to render "1st", "2nd", ..., "Nth"
   * Anniversary in title and description templates.
   */
  anniversaryYear?: number | null;
  /**
   * Gacha-quest-only (v0.13): game version label like `"1.2"`, `"2.4"`.
   * Distinct from {@link versionInfo} which is the driver / generic game
   * version shown in 🖥 VIDEO SETTINGS for any video type. `gachaVersion`
   * is rendered inside Gacha-specific intros (showcase / anniversary etc.).
   */
  gachaVersion?: string;
  resolution?: string;
  fps?: string;
  /**
   * Graphics-quality preset (v0.8 enum + `"custom"` escape hatch).
   * Pre-v0.8 drafts persisted this as free-form text — the editor-store
   * v4→v5 migration maps known labels to enum values and routes anything
   * else into {@link graphicsPresetCustom}.
   */
  graphicsPreset?: GraphicsPreset;
  /** Free-form preset name when {@link graphicsPreset} === `"custom"`. */
  graphicsPresetCustom?: string;
  /**
   * When true, the entire 🖥 VIDEO SETTINGS section is omitted from the
   * description — for 2D / pixel-art / web games that have no in-game
   * graphics settings to talk about.
   */
  skipGraphicsSettings?: boolean;
  /** Multi-select RT modes layered on the graphics line. */
  rayTracingModes?: RTMode[];
  /** GPU vendor whose upscaling / frame-gen the creator used. */
  frameGenVendor?: FrameGenVendor;
  /** Frame-generation multiplier (only meaningful when vendor !== "none"). */
  frameGenMultiplier?: FrameGenMultiplier;
  /** Upscaling quality (DLSS / FSR / XeSS quality preset). */
  upscaleQuality?: UpscaleQuality;
  /** High-level art-style descriptor — surfaces a separate line. */
  artStyle?: ArtStyle;
  /**
   * Free-form short string for driver / game version, e.g.
   * "GeForce 565.90 | Game v1.4". Surfaces as the trailing token of the
   * video-settings line.
   */
  versionInfo?: string;
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
  /**
   * Free-text publisher / developer label paired with the
   * `Publisher / Developer site` URL in the Store Links editor. When
   * non-empty, the tag generator emits it as a bare YouTube tag (e.g.
   * "Ubisoft", "FromSoftware"). Distinct from {@link sponsorName}, which
   * drives the description's "🎁 Thanks to …" line and is not tagged.
   */
  pubDevName?: string;
  /**
   * Channel-level third-party advertising / sponsor / partner copy
   * (v0.11). Free-form multi-line text persisted on the Profile (so it
   * carries across all videos for a given channel). Rendered into a
   * "🤝 SPONSORS & PARTNERS" description block when both the
   * `showThirdPartyAds` settings toggle is on AND this field is non-empty.
   */
  thirdPartyAdText?: string;
  /**
   * @deprecated v0.11 — merged into the unified content-warning checklist
   * as the `spoiler_story` item. Field retained on input for back-compat
   * with persisted drafts; the engine no longer renders a standalone
   * spoiler block.
   */
  spoilerWarning: boolean;
  /**
   * @deprecated v0.11 — merged into the unified content-warning checklist
   * as the `mature_18plus` item. Field retained on input for back-compat
   * with persisted drafts; the engine no longer renders a standalone
   * mature block.
   */
  matureWarning: boolean;
  /**
   * Playthrough state — feeds the "Run type" bullet of the unified
   * `▸ 🎮 PLAYTHROUGH NOTES` block (v0.12). Defaults to `"none"` (bullet
   * is skipped). Pre-v0.12 this rendered as a standalone "🎯 Playthrough:"
   * line above `noCommentaryLine`.
   */
  playthroughStatus?: PlaythroughStatus;
  /**
   * Preset / custom difficulty — feeds the "Difficulty" bullet of the
   * unified `▸ 🎮 PLAYTHROUGH NOTES` block (v0.12). When `"custom"`, the
   * value comes from {@link difficultyCustomLabel}. Pre-v0.12 this had
   * its own `🎮 DIFFICULTY` section after Video Settings.
   */
  difficulty?: DifficultyLevel;
  /** Free-form label used when `difficulty === "custom"`. */
  difficultyCustomLabel?: string;
  /**
   * Free-text "endings shown" bullet for the `▸ 🎮 PLAYTHROUGH NOTES`
   * block (v0.12). Examples: "1 of 3", "True ending only", "All routes
   * 100%". Empty → bullet is skipped. Free-form on purpose: the natural
   * value space is too varied for an enum.
   */
  endingsShown?: string;
  /**
   * Language-patch state for the `▸ 🎮 PLAYTHROUGH NOTES` block (v0.12).
   * `"none"` → skip the bullet. `"official_other"` and `"custom"` pair
   * with {@link languagePatchCustom} to surface a free-form value
   * ("Official KR", "VNI fan translation v2.1").
   */
  languagePatch?: LanguagePatch;
  /** Free-form label for `languagePatch === "official_other"` or `"custom"`. */
  languagePatchCustom?: string;
  /**
   * Game-version state for the `▸ 🎮 PLAYTHROUGH NOTES` block (v0.12).
   * `"full_release"` → skip the bullet (it's the assumed baseline; no
   * need to announce). `"custom"` pairs with {@link gameVersionCustom}.
   */
  gameVersion?: GameVersion;
  /** Free-form label for `gameVersion === "custom"`. */
  gameVersionCustom?: string;
  /**
   * Accessibility warnings — renders a "⚠️ CONTENT WARNINGS" bulleted
   * block after the spoiler section. Empty / missing → skipped.
   */
  contentWarnings?: ContentWarning[];
  /**
   * Tech / production / playstyle disclaimers (v0.12) — renders a
   * "▸ 🛠 TECH NOTES" bulleted block after the content-warnings block.
   * Bilingual when `tEn` is provided. Empty / missing → skipped.
   */
  techNotes?: TechNote[];
  storeLinks: Partial<Record<string, string>>;
  /**
   * Parallel map from the same platform id to a pricing category.
   * Missing entries default to "paid" so pre-v0.4.0 drafts keep working.
   */
  storeLinkTypes?: Partial<Record<string, StoreLinkType>>;
  social: Partial<Record<string, string>>;
  rig: Partial<Record<string, string>>;
  /**
   * Vietnam-specific donate metadata (v0.8 polish). The corresponding
   * `🏦 CHUYỂN KHOẢN / VÍ ĐIỆN TỬ` description block is gated on
   * {@link language} === `"vi"` — non-Vietnamese viewers don't typically
   * use VN bank transfer, so the block stays out of their description.
   */
  vnBankName?: string;
  vnBankAccount?: string;
  vnBankHolder?: string;
  vnMomo?: string;
  vnZalopay?: string;
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
 * Optional second translation function, fixed to English. Used by the
 * description-builder to render the bilingual content-warning block
 * (v0.11): each line becomes `{EN} · {output-language}`. The engine
 * stays framework-agnostic — the caller (use-generated-output) builds it
 * via i18next's `getFixedT("en", "templates")` and passes it in.
 */
export type EnglishTranslationFn = TranslationFn;

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
