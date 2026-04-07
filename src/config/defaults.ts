import type { VideoTypeId } from "./video-types";
import type { GenreId } from "./genres";
import type { SupportedLanguage } from "@engine/types";

export interface EditorDefaults {
  videoType: VideoTypeId;
  language: SupportedLanguage;
  genre: GenreId;
  gameName: string;
  gameNameLocalized: Record<string, string>;
  channelName: string;
  platform: string;
  partNumber: string;
  bossName: string;
  dlcName: string;
  challengeName: string;
  resolution: string;
  fps: string;
  graphicsPreset: string;
  timestamps: string;
  playlistLink: string;
  contactEmail: string;
  spoilerWarning: boolean;
  matureWarning: boolean;
  storeLinks: Record<string, string>;
  social: Record<string, string>;
  rig: Record<string, string>;
}

export interface SettingsDefaults {
  theme: "dark" | "light";
  defaultLanguage: string;
  defaultGenre: GenreId;
}

export const DEFAULTS = {
  editor: {
    videoType: "full",
    language: "en",
    genre: "action",
    gameName: "",
    gameNameLocalized: {},
    channelName: "",
    platform: "steam",
    partNumber: "",
    bossName: "",
    dlcName: "",
    challengeName: "",
    resolution: "1080p",
    fps: "60",
    graphicsPreset: "Ultra",
    timestamps: "",
    playlistLink: "",
    contactEmail: "",
    spoilerWarning: false,
    matureWarning: false,
    storeLinks: {},
    social: {},
    rig: {},
  } satisfies EditorDefaults,

  settings: {
    theme: "dark",
    defaultLanguage: "en",
    defaultGenre: "action",
  } satisfies SettingsDefaults,
} as const;
