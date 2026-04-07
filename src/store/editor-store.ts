import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { VideoType, Genre, SupportedLanguage } from "@engine/types";
import { DEFAULTS } from "@config/defaults";

interface EditorData {
  videoType: VideoType;
  language: SupportedLanguage;
  genre: Genre;
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

interface EditorActions {
  set: <K extends keyof EditorData>(key: K, value: EditorData[K]) => void;
  setNested: <G extends "storeLinks" | "social" | "rig">(
    group: G,
    key: string,
    value: string,
  ) => void;
  loadProfile: (profile: Partial<EditorData>) => void;
  loadPreset: (preset: Partial<EditorData>) => void;
  reset: () => void;
}

type EditorState = EditorData & EditorActions;

const initialState: EditorData = {
  videoType: DEFAULTS.editor.videoType as VideoType,
  language: DEFAULTS.editor.language as SupportedLanguage,
  genre: DEFAULTS.editor.genre as Genre,
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

      loadProfile: (profile) => set((state) => ({ ...state, ...profile })),

      loadPreset: (preset) => set((state) => ({ ...state, ...preset })),

      reset: () => set(initialState),
    }),
    {
      name: "ytdescgen-editor-draft",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => {
        const {
          set: _s,
          setNested: _sn,
          loadProfile: _lp,
          loadPreset: _lpre,
          reset: _r,
          ...data
        } = state;
        return data;
      },
    },
  ),
);
