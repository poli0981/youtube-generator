import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  VideoType,
  Genre,
  SupportedLanguage,
  StoreLinkType,
  PlaythroughStatus,
  DifficultyLevel,
  ContentWarning,
} from "@engine/types";
import {
  GRAPHICS_PRESETS,
  type GraphicsPreset,
  type RTMode,
  type FrameGenVendor,
  type FrameGenMultiplier,
  type UpscaleQuality,
  type ArtStyle,
} from "@config/graphics-settings";
import {
  GACHA_QUEST_TYPES,
  DEFAULT_GACHA_QUEST_TYPE,
  type GachaQuestType,
} from "@config/gacha-quest-types";
import { DEFAULTS } from "@config/defaults";

interface EditorData {
  videoType: VideoType;
  language: SupportedLanguage;
  genres: Genre[];
  gameName: string;
  gameNameLocalized: Record<string, string>;
  channelName: string;
  platform: string;
  partNumber: string;
  bossName: string;
  dlcName: string;
  challengeName: string;
  modName: string;
  modList: string;
  liveUrl: string;
  scheduledTime: string;
  gachaQuestType: GachaQuestType;
  chapterName: string;
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
  vnBankName: string;
  vnBankAccount: string;
  vnBankHolder: string;
  vnMomo: string;
  vnZalopay: string;
}

/**
 * Map a free-form pre-v0.8 `graphicsPreset` string ("Ultra", "Very High",
 * "Epic"…) to the v0.8 enum. Anything unrecognised is captured into the
 * Custom slot rather than dropped, so an existing draft round-trips
 * lossless through the migration. Exported for unit tests.
 */
export function legacyGraphicsPresetToEnum(legacy: string): {
  preset: GraphicsPreset;
  custom: string;
} {
  const trimmed = legacy.trim();
  if (!trimmed) return { preset: "medium", custom: "" };
  const normalised = trimmed.toLowerCase();
  const known = GRAPHICS_PRESETS.find(
    (p) => p !== "custom" && p.replace(/_/g, " ") === normalised,
  );
  if (known) return { preset: known, custom: "" };
  return { preset: "custom", custom: trimmed };
}

/**
 * Normalise a partial editor patch coming from a profile / preset /
 * template snapshot. Reused by `loadProfile` and `loadPreset` so legacy
 * string `graphicsPreset` values from before v0.8 are mapped through the
 * same logic as the persist-store v4→v5 migration. Pre-v0.8 snapshots
 * declare `graphicsPreset: string` rather than the v0.8 enum, which TS
 * accepts via structural compatibility — we sniff the runtime value here
 * via an `unknown` cast.
 */
function normalizeEditorPatch(patch: Partial<EditorData>): Partial<EditorData> {
  const out: Partial<EditorData> = { ...patch };
  const raw: unknown = (patch as { graphicsPreset?: unknown }).graphicsPreset;
  if (typeof raw === "string" && !(GRAPHICS_PRESETS as readonly string[]).includes(raw)) {
    const { preset, custom } = legacyGraphicsPresetToEnum(raw);
    out.graphicsPreset = preset;
    if (typeof patch.graphicsPresetCustom !== "string") {
      out.graphicsPresetCustom = custom;
    }
  }
  return out;
}

interface EditorActions {
  set: <K extends keyof EditorData>(key: K, value: EditorData[K]) => void;
  setNested: <G extends "storeLinks" | "social" | "rig">(
    group: G,
    key: string,
    value: string,
  ) => void;
  setStoreLinkType: (platformId: string, type: StoreLinkType) => void;
  loadProfile: (profile: Partial<EditorData>) => void;
  loadPreset: (preset: Partial<EditorData>) => void;
  reset: () => void;
}

type EditorState = EditorData & EditorActions;

const initialState: EditorData = {
  videoType: DEFAULTS.editor.videoType as VideoType,
  language: DEFAULTS.editor.language as SupportedLanguage,
  genres: [...DEFAULTS.editor.genres] as Genre[],
  gameName: DEFAULTS.editor.gameName,
  gameNameLocalized: { ...DEFAULTS.editor.gameNameLocalized },
  channelName: DEFAULTS.editor.channelName,
  platform: DEFAULTS.editor.platform,
  partNumber: DEFAULTS.editor.partNumber,
  bossName: DEFAULTS.editor.bossName,
  dlcName: DEFAULTS.editor.dlcName,
  challengeName: DEFAULTS.editor.challengeName,
  modName: DEFAULTS.editor.modName,
  modList: DEFAULTS.editor.modList,
  liveUrl: DEFAULTS.editor.liveUrl,
  scheduledTime: DEFAULTS.editor.scheduledTime,
  gachaQuestType: DEFAULTS.editor.gachaQuestType,
  chapterName: DEFAULTS.editor.chapterName,
  questName: DEFAULTS.editor.questName,
  resolution: DEFAULTS.editor.resolution,
  fps: DEFAULTS.editor.fps,
  graphicsPreset: DEFAULTS.editor.graphicsPreset,
  graphicsPresetCustom: DEFAULTS.editor.graphicsPresetCustom,
  skipGraphicsSettings: DEFAULTS.editor.skipGraphicsSettings,
  rayTracingModes: [...DEFAULTS.editor.rayTracingModes],
  frameGenVendor: DEFAULTS.editor.frameGenVendor,
  frameGenMultiplier: DEFAULTS.editor.frameGenMultiplier,
  upscaleQuality: DEFAULTS.editor.upscaleQuality,
  artStyle: DEFAULTS.editor.artStyle,
  versionInfo: DEFAULTS.editor.versionInfo,
  timestamps: DEFAULTS.editor.timestamps,
  playlistLink: DEFAULTS.editor.playlistLink,
  contactEmail: DEFAULTS.editor.contactEmail,
  musicAttribution: DEFAULTS.editor.musicAttribution,
  sponsorName: DEFAULTS.editor.sponsorName,
  sponsorPlatform: DEFAULTS.editor.sponsorPlatform,
  thumbnailText: DEFAULTS.editor.thumbnailText,
  pinnedComment: DEFAULTS.editor.pinnedComment,
  spoilerWarning: DEFAULTS.editor.spoilerWarning,
  matureWarning: DEFAULTS.editor.matureWarning,
  playthroughStatus: DEFAULTS.editor.playthroughStatus as PlaythroughStatus,
  difficulty: DEFAULTS.editor.difficulty as DifficultyLevel,
  difficultyCustomLabel: DEFAULTS.editor.difficultyCustomLabel,
  contentWarnings: [...DEFAULTS.editor.contentWarnings] as ContentWarning[],
  storeLinks: { ...DEFAULTS.editor.storeLinks },
  storeLinkTypes: { ...DEFAULTS.editor.storeLinkTypes },
  social: { ...DEFAULTS.editor.social },
  rig: { ...DEFAULTS.editor.rig },
  vnBankName: DEFAULTS.editor.vnBankName,
  vnBankAccount: DEFAULTS.editor.vnBankAccount,
  vnBankHolder: DEFAULTS.editor.vnBankHolder,
  vnMomo: DEFAULTS.editor.vnMomo,
  vnZalopay: DEFAULTS.editor.vnZalopay,
};

export const useEditorStore = create<EditorState>()(
  persist(
    (set) => ({
      ...initialState,

      set: (key, value) => set({ [key]: value }),

      setNested: (group, key, value) =>
        set((state) => ({
          [group]: { ...state[group], [key]: value },
        })),

      setStoreLinkType: (platformId, type) =>
        set((state) => ({
          storeLinkTypes: { ...state.storeLinkTypes, [platformId]: type },
        })),

      loadProfile: (profile) =>
        set((state) => ({ ...state, ...normalizeEditorPatch(profile) })),

      loadPreset: (preset) =>
        set((state) => ({ ...state, ...normalizeEditorPatch(preset) })),

      reset: () => set(initialState),
    }),
    {
      name: "ytdescgen-editor-draft",
      storage: createJSONStorage(() => localStorage),
      // v1 → v2: `genre: Genre` became `genres: Genre[]` in v0.5.
      // v2 → v3: sponsor credit fields added in v0.6.
      // v3 → v4: playthroughStatus / difficulty / difficultyCustomLabel /
      //         contentWarnings added in v0.7 phase 2. Missing entries
      //         fall back to the spread of `initialState`, but we still
      //         normalise the blob here so legacy drafts round-trip
      //         cleanly through the engine.
      // v4 → v5: graphics-settings v2 (v0.8 phase 2). Free-form
      //         `graphicsPreset` text became an enum + `Custom` field;
      //         RT modes, frame-gen vendor + multiplier, upscaling
      //         quality, art style, version info, and the livestream
      //         extras (liveUrl, scheduledTime) joined the schema.
      //         Missing fields fall through to `initialState`, but
      //         legacy `graphicsPreset` text needs explicit mapping so
      //         "Ultra"-era drafts don't end up with an enum value
      //         outside the GraphicsPreset literal union.
      // v5 → v6: v0.8 polish. Vietnam-specific donate fields
      //         (vnBankName / vnBankAccount / vnBankHolder / vnMomo /
      //         vnZalopay) and a long-form modList textarea joined the
      //         schema. All additive — empty-string defaults round-trip
      //         cleanly without any value mapping.
      // v6 → v7: v0.9 phase 1. Gacha-quest extras
      //         (gachaQuestType / chapterName / questName) joined the
      //         schema. Additive — pre-v0.9 drafts get the
      //         `"main_story"` default for the enum + empty strings for
      //         the free-form labels.
      version: 7,
      migrate: (persistedState: unknown, version: number): EditorData => {
        if (!persistedState || typeof persistedState !== "object") {
          return { ...initialState };
        }
        const state = persistedState as Record<string, unknown> & {
          genre?: unknown;
          sponsorName?: unknown;
          sponsorPlatform?: unknown;
        };
        if (version < 2 && typeof state.genre === "string" && !Array.isArray(state.genres)) {
          state.genres = [state.genre];
          delete state.genre;
        }
        if (version < 3) {
          if (typeof state.sponsorName !== "string") state.sponsorName = "";
          if (typeof state.sponsorPlatform !== "string") state.sponsorPlatform = "";
        }
        if (version < 4) {
          if (typeof state.playthroughStatus !== "string") state.playthroughStatus = "none";
          if (typeof state.difficulty !== "string") state.difficulty = "none";
          if (typeof state.difficultyCustomLabel !== "string") {
            state.difficultyCustomLabel = "";
          }
          if (!Array.isArray(state.contentWarnings)) state.contentWarnings = [];
        }
        if (version < 5) {
          // Map legacy free-form preset text to the new enum + Custom slot.
          const legacy = typeof state.graphicsPreset === "string" ? state.graphicsPreset : "";
          const isAlreadyEnum = (GRAPHICS_PRESETS as readonly string[]).includes(legacy);
          if (!isAlreadyEnum) {
            const { preset, custom } = legacyGraphicsPresetToEnum(legacy);
            state.graphicsPreset = preset;
            if (typeof state.graphicsPresetCustom !== "string") {
              state.graphicsPresetCustom = custom;
            }
          } else if (typeof state.graphicsPresetCustom !== "string") {
            state.graphicsPresetCustom = "";
          }
          if (typeof state.skipGraphicsSettings !== "boolean") {
            state.skipGraphicsSettings = false;
          }
          if (!Array.isArray(state.rayTracingModes)) state.rayTracingModes = [];
          if (typeof state.frameGenVendor !== "string") state.frameGenVendor = "none";
          if (typeof state.frameGenMultiplier !== "string") state.frameGenMultiplier = "none";
          if (typeof state.upscaleQuality !== "string") state.upscaleQuality = "none";
          if (typeof state.artStyle !== "string") state.artStyle = "none";
          if (typeof state.versionInfo !== "string") state.versionInfo = "";
          if (typeof state.liveUrl !== "string") state.liveUrl = "";
          if (typeof state.scheduledTime !== "string") state.scheduledTime = "";
        }
        if (version < 6) {
          if (typeof state.modList !== "string") state.modList = "";
          if (typeof state.vnBankName !== "string") state.vnBankName = "";
          if (typeof state.vnBankAccount !== "string") state.vnBankAccount = "";
          if (typeof state.vnBankHolder !== "string") state.vnBankHolder = "";
          if (typeof state.vnMomo !== "string") state.vnMomo = "";
          if (typeof state.vnZalopay !== "string") state.vnZalopay = "";
        }
        if (version < 7) {
          const gqt = state.gachaQuestType;
          if (
            typeof gqt !== "string" ||
            !(GACHA_QUEST_TYPES as readonly string[]).includes(gqt)
          ) {
            state.gachaQuestType = DEFAULT_GACHA_QUEST_TYPE;
          }
          if (typeof state.chapterName !== "string") state.chapterName = "";
          if (typeof state.questName !== "string") state.questName = "";
        }
        return { ...initialState, ...state } as EditorData;
      },
      partialize: (state) => ({
        videoType: state.videoType,
        language: state.language,
        genres: state.genres,
        gameName: state.gameName,
        gameNameLocalized: state.gameNameLocalized,
        channelName: state.channelName,
        platform: state.platform,
        partNumber: state.partNumber,
        bossName: state.bossName,
        dlcName: state.dlcName,
        challengeName: state.challengeName,
        modName: state.modName,
        modList: state.modList,
        liveUrl: state.liveUrl,
        scheduledTime: state.scheduledTime,
        gachaQuestType: state.gachaQuestType,
        chapterName: state.chapterName,
        questName: state.questName,
        resolution: state.resolution,
        fps: state.fps,
        graphicsPreset: state.graphicsPreset,
        graphicsPresetCustom: state.graphicsPresetCustom,
        skipGraphicsSettings: state.skipGraphicsSettings,
        rayTracingModes: state.rayTracingModes,
        frameGenVendor: state.frameGenVendor,
        frameGenMultiplier: state.frameGenMultiplier,
        upscaleQuality: state.upscaleQuality,
        artStyle: state.artStyle,
        versionInfo: state.versionInfo,
        timestamps: state.timestamps,
        playlistLink: state.playlistLink,
        contactEmail: state.contactEmail,
        musicAttribution: state.musicAttribution,
        sponsorName: state.sponsorName,
        sponsorPlatform: state.sponsorPlatform,
        thumbnailText: state.thumbnailText,
        pinnedComment: state.pinnedComment,
        spoilerWarning: state.spoilerWarning,
        matureWarning: state.matureWarning,
        playthroughStatus: state.playthroughStatus,
        difficulty: state.difficulty,
        difficultyCustomLabel: state.difficultyCustomLabel,
        contentWarnings: state.contentWarnings,
        storeLinks: state.storeLinks,
        storeLinkTypes: state.storeLinkTypes,
        social: state.social,
        rig: state.rig,
        vnBankName: state.vnBankName,
        vnBankAccount: state.vnBankAccount,
        vnBankHolder: state.vnBankHolder,
        vnMomo: state.vnMomo,
        vnZalopay: state.vnZalopay,
      }),
    },
  ),
);
