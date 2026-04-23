import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { VideoType, Genre, SupportedLanguage, StoreLinkType } from "@engine/types";
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
  resolution: DEFAULTS.editor.resolution,
  fps: DEFAULTS.editor.fps,
  graphicsPreset: DEFAULTS.editor.graphicsPreset,
  timestamps: DEFAULTS.editor.timestamps,
  playlistLink: DEFAULTS.editor.playlistLink,
  contactEmail: DEFAULTS.editor.contactEmail,
  spoilerWarning: DEFAULTS.editor.spoilerWarning,
  matureWarning: DEFAULTS.editor.matureWarning,
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
      // v1 → v2 upgrade: `genre: Genre` became `genres: Genre[]` in v0.5.
      // Old drafts still round-trip by wrapping the single value.
      version: 2,
      migrate: (persistedState: unknown, version: number): EditorData => {
        if (version < 2 && persistedState && typeof persistedState === "object") {
          const state = persistedState as Record<string, unknown> & { genre?: unknown };
          if (typeof state.genre === "string" && !Array.isArray(state.genres)) {
            state.genres = [state.genre];
            delete state.genre;
          }
        }
        return persistedState as EditorData;
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
        resolution: state.resolution,
        fps: state.fps,
        graphicsPreset: state.graphicsPreset,
        timestamps: state.timestamps,
        playlistLink: state.playlistLink,
        contactEmail: state.contactEmail,
        spoilerWarning: state.spoilerWarning,
        matureWarning: state.matureWarning,
        storeLinks: state.storeLinks,
        storeLinkTypes: state.storeLinkTypes,
        social: state.social,
        rig: state.rig,
      }),
    },
  ),
);
