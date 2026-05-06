import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { GenreId } from "@config/genres";
import type { SupportedLanguage } from "@engine/types";
import { saveSettings, loadSettings } from "@utils/storage-adapter";
import {
  healSettings,
  initialSettings,
  type SettingsData,
  type TitleFormatConfig,
} from "./settings-heal";

export type {
  SettingsData,
  TitleFormatConfig,
  TitleBadgePosition,
  TitleSeparatorId,
  TitleBadgeCase,
} from "./settings-heal";
export { healSettings, initialSettings } from "./settings-heal";

interface SettingsState extends SettingsData {
  setTheme: (theme: "dark" | "light") => void;
  setAppLanguage: (lang: SupportedLanguage) => void;
  setDefaultOutputLanguage: (lang: SupportedLanguage) => void;
  setDefaultGenres: (genres: GenreId[]) => void;
  setSetting: <K extends keyof SettingsData>(key: K, value: SettingsData[K]) => void;
  setTitleFormat: (patch: Partial<TitleFormatConfig>) => void;
  toggleEditorAccordion: (id: string) => void;
}

const STORE_KEY = "ytdescgen-settings";

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...initialSettings,

      setTheme: (theme) => {
        document.documentElement.classList.toggle("dark", theme === "dark");
        document.documentElement.classList.toggle("light", theme === "light");
        set({ theme });
      },

      setAppLanguage: (lang) => set({ appLanguage: lang }),

      setDefaultOutputLanguage: (lang) => set({ defaultOutputLanguage: lang }),

      setDefaultGenres: (genres) => set({ defaultGenres: genres }),

      setSetting: (key, value) => set({ [key]: value }),

      setTitleFormat: (patch) =>
        set((state) => ({ titleFormat: { ...state.titleFormat, ...patch } })),

      toggleEditorAccordion: (id) =>
        set((state) => ({
          editorAccordionState: {
            ...state.editorAccordionState,
            [id]: !state.editorAccordionState[id],
          },
        })),
    }),
    {
      name: STORE_KEY,
      storage: createJSONStorage(() => localStorage),
      // v7 → v8: v0.10 added `sidebarCollapsed`. Additive — `healSettings`
      // back-fills the default via the spread of `initialSettings`, so no
      // explicit per-version migration step is required here.
      // v8 → v9: v0.11 added `showThirdPartyAds`. Additive — same back-fill
      // path as v8.
      version: 9,
      migrate: (persistedState: unknown): SettingsData => healSettings(persistedState),
      partialize: (state) => extractData(state),
      onRehydrateStorage: () => {
        return () => {
          // Fall back to the (already-healed) zustand state so the file read
          // never downgrades the store if the on-disk copy is missing keys.
          const fallback = extractData(useSettingsStore.getState());
          loadSettings<Partial<SettingsData>>(STORE_KEY, fallback).then((data) => {
            if (data) {
              useSettingsStore.setState(healSettings(data));
            }
          });
        };
      },
    },
  ),
);

function extractData(state: SettingsData): SettingsData {
  return {
    appLanguage: state.appLanguage,
    defaultOutputLanguage: state.defaultOutputLanguage,
    defaultGenres: state.defaultGenres,
    theme: state.theme,
    showCharCount: state.showCharCount,
    compactTagDisplay: state.compactTagDisplay,
    historyLimit: state.historyLimit,
    includeMultilingualTags: state.includeMultilingualTags,
    includeTrendingTags: state.includeTrendingTags,
    hashtagCount: state.hashtagCount,
    showQualityBadge: state.showQualityBadge,
    showCopyright: state.showCopyright,
    showUsagePolicy: state.showUsagePolicy,
    showSponsorCredit: state.showSponsorCredit,
    showThirdPartyAds: state.showThirdPartyAds,
    showPinnedCommentTemplate: state.showPinnedCommentTemplate,
    pinnedCommentIncludeAskNextGame: state.pinnedCommentIncludeAskNextGame,
    pinnedCommentIncludeGenrePlaylist: state.pinnedCommentIncludeGenrePlaylist,
    genrePlaylists: { ...state.genrePlaylists },
    titleFormat: { ...state.titleFormat },
    editorAccordionState: state.editorAccordionState,
    sidebarCollapsed: state.sidebarCollapsed,
  };
}

// Dual-write: also save to file on every change. Guarantees the
// `settings.json` on disk always contains the full schema after the first
// rehydrate, even on a fresh install with no prior localStorage.
useSettingsStore.subscribe((state) => {
  saveSettings(STORE_KEY, extractData(state));
});
