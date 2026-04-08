import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { GenreId } from "@config/genres";
import type { SupportedLanguage } from "@engine/types";
import { saveSettings, loadSettings } from "@utils/storage-adapter";

interface SettingsState {
  appLanguage: SupportedLanguage;
  defaultOutputLanguage: SupportedLanguage;
  defaultGenre: GenreId;
  theme: "dark" | "light";
  autoSaveDraft: boolean;
  showCharCount: boolean;
  compactTagDisplay: boolean;
  historyLimit: number;
  includeMultilingualTags: boolean;
  includeTrendingTags: boolean;
  hashtagCount: number;
  setTheme: (theme: "dark" | "light") => void;
  setAppLanguage: (lang: SupportedLanguage) => void;
  setDefaultOutputLanguage: (lang: SupportedLanguage) => void;
  setDefaultGenre: (genre: GenreId) => void;
  setSetting: <K extends keyof SettingsData>(key: K, value: SettingsData[K]) => void;
}

interface SettingsData {
  appLanguage: SupportedLanguage;
  defaultOutputLanguage: SupportedLanguage;
  defaultGenre: GenreId;
  theme: "dark" | "light";
  autoSaveDraft: boolean;
  showCharCount: boolean;
  compactTagDisplay: boolean;
  historyLimit: number;
  includeMultilingualTags: boolean;
  includeTrendingTags: boolean;
  hashtagCount: number;
}

const detectBrowserLanguage = (): SupportedLanguage => {
  const lang = navigator.language.split("-")[0];
  const supported: SupportedLanguage[] = ["en", "vi", "ja", "es", "ko", "zh"];
  return (supported.find((s) => s === lang) ?? "en") as SupportedLanguage;
};

const detectedLang = detectBrowserLanguage();

const initialSettings: SettingsData = {
  appLanguage: detectedLang,
  defaultOutputLanguage: detectedLang,
  defaultGenre: "action",
  theme: "dark",
  autoSaveDraft: true,
  showCharCount: true,
  compactTagDisplay: false,
  historyLimit: 100,
  includeMultilingualTags: true,
  includeTrendingTags: true,
  hashtagCount: 3,
};

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

      setDefaultGenre: (genre) => set({ defaultGenre: genre }),

      setSetting: (key, value) => set({ [key]: value }),
    }),
    {
      name: STORE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        appLanguage: state.appLanguage,
        defaultOutputLanguage: state.defaultOutputLanguage,
        defaultGenre: state.defaultGenre,
        theme: state.theme,
        autoSaveDraft: state.autoSaveDraft,
        showCharCount: state.showCharCount,
        compactTagDisplay: state.compactTagDisplay,
        historyLimit: state.historyLimit,
        includeMultilingualTags: state.includeMultilingualTags,
        includeTrendingTags: state.includeTrendingTags,
        hashtagCount: state.hashtagCount,
      }),
      onRehydrateStorage: () => {
        return () => {
          loadSettings<SettingsData>(STORE_KEY, initialSettings).then((data) => {
            if (data) useSettingsStore.setState(data);
          });
        };
      },
    },
  ),
);

// Dual-write: also save to file on every change
useSettingsStore.subscribe((state) => {
  const data: SettingsData = {
    appLanguage: state.appLanguage,
    defaultOutputLanguage: state.defaultOutputLanguage,
    defaultGenre: state.defaultGenre,
    theme: state.theme,
    autoSaveDraft: state.autoSaveDraft,
    showCharCount: state.showCharCount,
    compactTagDisplay: state.compactTagDisplay,
    historyLimit: state.historyLimit,
    includeMultilingualTags: state.includeMultilingualTags,
    includeTrendingTags: state.includeTrendingTags,
    hashtagCount: state.hashtagCount,
  };
  saveSettings(STORE_KEY, data);
});
