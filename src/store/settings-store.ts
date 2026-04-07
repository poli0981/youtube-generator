import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { GenreId } from "@config/genres";
import type { SupportedLanguage } from "@engine/types";

interface SettingsState {
  theme: "dark" | "light";
  defaultLanguage: string;
  defaultOutputLanguage: SupportedLanguage;
  defaultGenre: GenreId;
  autoSaveDraft: boolean;
  showCharCount: boolean;
  compactTagDisplay: boolean;
  historyLimit: number;
  includeMultilingualTags: boolean;
  includeTrendingTags: boolean;
  hashtagCount: number;
  setTheme: (theme: "dark" | "light") => void;
  setDefaultLanguage: (lang: string) => void;
  setDefaultOutputLanguage: (lang: SupportedLanguage) => void;
  setDefaultGenre: (genre: GenreId) => void;
  setSetting: <K extends keyof SettingsData>(key: K, value: SettingsData[K]) => void;
}

interface SettingsData {
  theme: "dark" | "light";
  defaultLanguage: string;
  defaultOutputLanguage: SupportedLanguage;
  defaultGenre: GenreId;
  autoSaveDraft: boolean;
  showCharCount: boolean;
  compactTagDisplay: boolean;
  historyLimit: number;
  includeMultilingualTags: boolean;
  includeTrendingTags: boolean;
  hashtagCount: number;
}

const initialSettings: SettingsData = {
  theme: "dark",
  defaultLanguage: "en",
  defaultOutputLanguage: "en",
  defaultGenre: "action",
  autoSaveDraft: true,
  showCharCount: true,
  compactTagDisplay: false,
  historyLimit: 100,
  includeMultilingualTags: true,
  includeTrendingTags: true,
  hashtagCount: 3,
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...initialSettings,

      setTheme: (theme) => {
        document.documentElement.classList.toggle("dark", theme === "dark");
        document.documentElement.classList.toggle("light", theme === "light");
        set({ theme });
      },

      setDefaultLanguage: (lang) => set({ defaultLanguage: lang }),

      setDefaultOutputLanguage: (lang) => set({ defaultOutputLanguage: lang }),

      setDefaultGenre: (genre) => set({ defaultGenre: genre }),

      setSetting: (key, value) => set({ [key]: value }),
    }),
    {
      name: "ytdescgen-settings",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        theme: state.theme,
        defaultLanguage: state.defaultLanguage,
        defaultOutputLanguage: state.defaultOutputLanguage,
        defaultGenre: state.defaultGenre,
        autoSaveDraft: state.autoSaveDraft,
        showCharCount: state.showCharCount,
        compactTagDisplay: state.compactTagDisplay,
        historyLimit: state.historyLimit,
        includeMultilingualTags: state.includeMultilingualTags,
        includeTrendingTags: state.includeTrendingTags,
        hashtagCount: state.hashtagCount,
      }),
    },
  ),
);
