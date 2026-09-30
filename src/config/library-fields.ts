import type { EditorData } from "@store/editor-store";

/**
 * Which editor fields each kind of library item carries — the one list the
 * save forms, "Apply", backups and imports all read, so they can't drift.
 */

/**
 * A channel profile: who is publishing and what they record on. Everything
 * here stays the same from one video to the next.
 */
export const PROFILE_FIELDS = [
  "channelName",
  "contactEmail",
  "adEmail",
  "gameKeyEmail",
  "social",
  "rig",
  "resolution",
  "fps",
  "graphicsPreset",
  "graphicsPresetCustom",
  "thirdPartyAdText",
  "vnBankName",
  "vnBankAccount",
  "vnBankHolder",
  "vnMomo",
  "vnZalopay",
  "messengerCommunityLink",
  "zaloGroupLink",
  "signalGroupLink",
  "instagramGroupLink",
  "facebookGroupLink",
] as const satisfies readonly (keyof EditorData)[];

/**
 * A game preset: what stays the same for every part of one game — its names,
 * stores, warnings and series playlist.
 */
export const PRESET_FIELDS = [
  "gameName",
  "gameNameLocalized",
  "genres",
  "platform",
  "storeLinks",
  "storeLinkTypes",
  "pubDevName",
  "contentWarnings",
  "languagePatch",
  "languagePatchCustom",
  "gameVersion",
  "gameVersionCustom",
  "artStyle",
  "skipGraphicsSettings",
  "playlistLink",
] as const satisfies readonly (keyof EditorData)[];

export type ProfileField = (typeof PROFILE_FIELDS)[number];
export type PresetField = (typeof PRESET_FIELDS)[number];
