import type { VideoTypeId } from "./video-types";
import type { GenreId } from "./genres";
import type {
  GraphicsPreset,
  RTMode,
  FrameGenVendor,
  FrameGenMultiplier,
  UpscaleQuality,
  ArtStyle,
} from "./graphics-settings";
import type { VideoStyleEra } from "./video-styles";
import { DEFAULT_GACHA_QUEST_TYPE, type GachaQuestType } from "./gacha-quest-types";
import type {
  SupportedLanguage,
  StoreLinkType,
  PlaythroughStatus,
  DifficultyLevel,
  ContentWarning,
  LanguagePatch,
  GameVersion,
  TechNote,
  EndingEntry,
  EndingVideoRange,
} from "@engine/types";

export interface EditorDefaults {
  videoType: VideoTypeId;
  language: SupportedLanguage;
  genres: GenreId[];
  gameName: string;
  gameNameLocalized: Record<string, string>;
  channelName: string;
  platform: string;
  partNumber: string;
  bossName: string;
  dlcName: string;
  challengeName: string;
  modName: string;
  /** Long-form mod credit list (multi-line) — only rendered for `mods` videoType. */
  modList: string;
  /** Livestream-only: live URL on YouTube/Twitch. */
  liveUrl: string;
  /** Livestream-only: ISO scheduled datetime. */
  scheduledTime: string;
  /** Gacha-quest selected pattern (v0.9). */
  gachaQuestType: GachaQuestType;
  /** Gacha-quest chapter / story-arc label (free-form). */
  chapterName: string;
  /** Gacha-quest individual quest / event name (free-form). */
  questName: string;
  /** Gacha-quest character name (v0.13) — only rendered for `showcase` quest type. */
  characterName: string;
  /** Gacha-quest anniversary year (v0.13) — only rendered for `anniversary` quest type. 1–20 or null. */
  anniversaryYear: number | null;
  /** Gacha-quest game version label (v0.13) — e.g. "1.2", "2.4". Only used for `gacha_quest` videoType. */
  gachaVersion: string;
  resolution: string;
  fps: string;
  graphicsPreset: GraphicsPreset;
  graphicsPresetCustom: string;
  skipGraphicsSettings: boolean;
  rayTracingModes: RTMode[];
  frameGenVendor: FrameGenVendor;
  frameGenMultiplier: FrameGenMultiplier;
  upscaleQuality: UpscaleQuality;
  artStyle: ArtStyle;
  /** v0.22.0 opt-in. Empty string = no style line in the description. */
  videoStyleEra: VideoStyleEra;
  versionInfo: string;
  timestamps: string;
  playlistLink: string;
  contactEmail: string;
  musicAttribution: string;
  sponsorName: string;
  sponsorPlatform: string;
  /**
   * Free-text publisher / developer name shown alongside the
   * Publisher / Developer site URL in the Store Links editor. Emitted
   * as a YouTube tag (e.g. "Ubisoft", "FromSoftware") via tag-generator.
   * Independent from {@link sponsorName}, which feeds the description's
   * "🎁 Thanks to …" line and is not added to tags.
   */
  pubDevName: string;
  /**
   * Channel-level third-party advertising / sponsor / partner copy
   * (v0.11). Persisted on the Profile so it carries across all videos
   * for a given channel. Empty string by default — the description
   * block is gated on both this being non-empty AND the
   * `showThirdPartyAds` settings toggle being on.
   */
  thirdPartyAdText: string;
  thumbnailText: string;
  pinnedComment: string;
  /** @deprecated v0.11 — superseded by `contentWarnings` checklist. */
  spoilerWarning: boolean;
  /** @deprecated v0.11 — superseded by `contentWarnings` checklist. */
  matureWarning: boolean;
  playthroughStatus: PlaythroughStatus;
  difficulty: DifficultyLevel;
  difficultyCustomLabel: string;
  /** Free-text endings descriptor for Playthrough Notes section (v0.12).
   *  @deprecated v0.16.0 — superseded by structured {@link endings}. */
  endingsShown: string;
  /** Structured ending list (v0.16.0). */
  endings: EndingEntry[];
  /** Number of videos the playthrough is split across (v0.16.0). */
  endingVideoCount: number;
  /** Per-video ending range (v0.16.0). */
  endingVideoRanges: EndingVideoRange[];
  /** Which per-video slice the Output previews (v0.17.1). */
  endingVideoIndex: number;
  /** Language-patch enum for Playthrough Notes section (v0.12). */
  languagePatch: LanguagePatch;
  /** Free-form label when `languagePatch` is `"official_other"` or `"custom"`. */
  languagePatchCustom: string;
  /** Game-version enum for Playthrough Notes section (v0.12). */
  gameVersion: GameVersion;
  /** Free-form label when `gameVersion === "custom"`. */
  gameVersionCustom: string;
  contentWarnings: ContentWarning[];
  /** Tech / production / playstyle disclaimer checklist items (v0.12). */
  techNotes: TechNote[];
  storeLinks: Record<string, string>;
  storeLinkTypes: Record<string, StoreLinkType>;
  social: Record<string, string>;
  rig: Record<string, string>;
  /** Vietnam-specific donate: bank transfer + e-wallet fields. Only
   *  rendered into the description when output language is Vietnamese. */
  vnBankName: string;
  vnBankAccount: string;
  vnBankHolder: string;
  vnMomo: string;
  vnZalopay: string;
}

export interface SettingsDefaults {
  theme: "dark" | "light";
  defaultLanguage: string;
}

export const DEFAULTS = {
  editor: {
    videoType: "full",
    language: "en",
    genres: ["action"],
    gameName: "",
    gameNameLocalized: {},
    channelName: "",
    platform: "steam",
    partNumber: "",
    bossName: "",
    dlcName: "",
    challengeName: "",
    modName: "",
    modList: "",
    liveUrl: "",
    scheduledTime: "",
    gachaQuestType: DEFAULT_GACHA_QUEST_TYPE,
    chapterName: "",
    questName: "",
    characterName: "",
    anniversaryYear: null,
    gachaVersion: "",
    resolution: "1080p",
    fps: "60",
    graphicsPreset: "medium",
    graphicsPresetCustom: "",
    skipGraphicsSettings: false,
    rayTracingModes: [],
    frameGenVendor: "none",
    frameGenMultiplier: "none",
    upscaleQuality: "none",
    artStyle: "none",
    videoStyleEra: "" satisfies VideoStyleEra,
    versionInfo: "",
    timestamps: "",
    playlistLink: "",
    contactEmail: "",
    musicAttribution: "",
    sponsorName: "",
    sponsorPlatform: "",
    pubDevName: "",
    thirdPartyAdText: "",
    thumbnailText: "",
    pinnedComment: "",
    spoilerWarning: false,
    matureWarning: false,
    playthroughStatus: "none",
    difficulty: "none",
    difficultyCustomLabel: "",
    endingsShown: "",
    endings: [],
    endingVideoCount: 1,
    endingVideoRanges: [],
    endingVideoIndex: 1,
    languagePatch: "none",
    languagePatchCustom: "",
    gameVersion: "full_release",
    gameVersionCustom: "",
    contentWarnings: [],
    techNotes: [],
    storeLinks: {},
    storeLinkTypes: {},
    social: {},
    rig: {},
    vnBankName: "",
    vnBankAccount: "",
    vnBankHolder: "",
    vnMomo: "",
    vnZalopay: "",
  } satisfies EditorDefaults,

  settings: {
    theme: "dark",
    defaultLanguage: "en",
  } satisfies SettingsDefaults,
} as const;
