import type { VideoTypeId } from "./video-types";
import type { GenreId } from "./genres";
import type { SupportedLanguage, StoreLinkType } from "@engine/types";

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
  resolution: string;
  fps: string;
  graphicsPreset: string;
  timestamps: string;
  playlistLink: string;
  contactEmail: string;
  spoilerWarning: boolean;
  matureWarning: boolean;
  storeLinks: Record<string, string>;
  storeLinkTypes: Record<string, StoreLinkType>;
  social: Record<string, string>;
  rig: Record<string, string>;
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
    resolution: "1080p",
    fps: "60",
    graphicsPreset: "Ultra",
    timestamps: "",
    playlistLink: "",
    contactEmail: "",
    spoilerWarning: false,
    matureWarning: false,
    storeLinks: {},
    storeLinkTypes: {},
    social: {},
    rig: {},
  } satisfies EditorDefaults,

  settings: {
    theme: "dark",
    defaultLanguage: "en",
    defaultGenres: ["action"],
  } satisfies SettingsDefaults,
} as const;
