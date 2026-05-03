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
import { DEFAULT_GACHA_QUEST_TYPE, type GachaQuestType } from "./gacha-quest-types";
import type {
  SupportedLanguage,
  StoreLinkType,
  PlaythroughStatus,
  DifficultyLevel,
  ContentWarning,
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
  versionInfo: string;
  timestamps: string;
  playlistLink: string;
  contactEmail: string;
  musicAttribution: string;
  sponsorName: string;
  sponsorPlatform: string;
  thumbnailText: string;
  pinnedComment: string;
  spoilerWarning: boolean;
  matureWarning: boolean;
  playthroughStatus: PlaythroughStatus;
  difficulty: DifficultyLevel;
  difficultyCustomLabel: string;
  contentWarnings: ContentWarning[];
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
  defaultGenres: GenreId[];
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
    versionInfo: "",
    timestamps: "",
    playlistLink: "",
    contactEmail: "",
    musicAttribution: "",
    sponsorName: "",
    sponsorPlatform: "",
    thumbnailText: "",
    pinnedComment: "",
    spoilerWarning: false,
    matureWarning: false,
    playthroughStatus: "none",
    difficulty: "none",
    difficultyCustomLabel: "",
    contentWarnings: [],
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
    defaultGenres: ["action"],
  } satisfies SettingsDefaults,
} as const;
