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
  resolution: string;
  fps: string;
  graphicsPreset: string;
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
  resolution: DEFAULTS.editor.resolution,
  fps: DEFAULTS.editor.fps,
  graphicsPreset: DEFAULTS.editor.graphicsPreset,
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

      loadProfile: (profile) => set((state) => ({ ...state, ...profile })),

      loadPreset: (preset) => set((state) => ({ ...state, ...preset })),

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
      version: 4,
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
        resolution: state.resolution,
        fps: state.fps,
        graphicsPreset: state.graphicsPreset,
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
      }),
    },
  ),
);
