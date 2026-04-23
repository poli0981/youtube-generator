import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { GenreId } from "@config/genres";
import type { SupportedLanguage } from "@engine/types";
import { saveSettings, loadSettings } from "@utils/storage-adapter";

interface SettingsState {
  appLanguage: SupportedLanguage;
  defaultOutputLanguage: SupportedLanguage;
  defaultGenres: GenreId[];
  theme: "dark" | "light";
  autoSaveDraft: boolean;
  showCharCount: boolean;
  compactTagDisplay: boolean;
  historyLimit: number;
  includeMultilingualTags: boolean;
  includeTrendingTags: boolean;
  hashtagCount: number;
  showQualityBadge: boolean;
  showCopyright: boolean;
  showUsagePolicy: boolean;
  editorAccordionState: Record<string, boolean>;
  setTheme: (theme: "dark" | "light") => void;
  setAppLanguage: (lang: SupportedLanguage) => void;
  setDefaultOutputLanguage: (lang: SupportedLanguage) => void;
  setDefaultGenres: (genres: GenreId[]) => void;
  setSetting: <K extends keyof SettingsData>(key: K, value: SettingsData[K]) => void;
  toggleEditorAccordion: (id: string) => void;
}

interface SettingsData {
  appLanguage: SupportedLanguage;
  defaultOutputLanguage: SupportedLanguage;
  defaultGenres: GenreId[];
  theme: "dark" | "light";
  autoSaveDraft: boolean;
  showCharCount: boolean;
  compactTagDisplay: boolean;
  historyLimit: number;
  includeMultilingualTags: boolean;
  includeTrendingTags: boolean;
  hashtagCount: number;
  showQualityBadge: boolean;
  showCopyright: boolean;
  showUsagePolicy: boolean;
  editorAccordionState: Record<string, boolean>;
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
  defaultGenres: ["action"],
  theme: "dark",
  autoSaveDraft: true,
  showCharCount: true,
  compactTagDisplay: false,
  historyLimit: 100,
  includeMultilingualTags: true,
  includeTrendingTags: true,
  hashtagCount: 3,
  showQualityBadge: true,
  showCopyright: true,
  showUsagePolicy: false,
  editorAccordionState: {
    gameInfo: true,
    videoSettings: true,
    contentDetails: false,
    attribution: false,
    rig: false,
    storeAndSocial: false,
  },
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

      setDefaultGenres: (genres) => set({ defaultGenres: genres }),

      setSetting: (key, value) => set({ [key]: value }),

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
      // v1 → v2 upgrade: `defaultGenre: GenreId` became
      // `defaultGenres: GenreId[]` in v0.5.
      version: 2,
      migrate: (persistedState: unknown, version: number): SettingsData => {
        if (version < 2 && persistedState && typeof persistedState === "object") {
          const state = persistedState as Record<string, unknown> & { defaultGenre?: unknown };
          if (typeof state.defaultGenre === "string" && !Array.isArray(state.defaultGenres)) {
            state.defaultGenres = [state.defaultGenre];
            delete state.defaultGenre;
          }
        }
        return persistedState as SettingsData;
      },
      partialize: (state) => ({
        appLanguage: state.appLanguage,
        defaultOutputLanguage: state.defaultOutputLanguage,
        defaultGenres: state.defaultGenres,
        theme: state.theme,
        autoSaveDraft: state.autoSaveDraft,
        showCharCount: state.showCharCount,
        compactTagDisplay: state.compactTagDisplay,
        historyLimit: state.historyLimit,
        includeMultilingualTags: state.includeMultilingualTags,
        includeTrendingTags: state.includeTrendingTags,
        hashtagCount: state.hashtagCount,
        showQualityBadge: state.showQualityBadge,
        showCopyright: state.showCopyright,
        showUsagePolicy: state.showUsagePolicy,
        editorAccordionState: state.editorAccordionState,
      }),
      onRehydrateStorage: () => {
        return () => {
          loadSettings<SettingsData>(STORE_KEY, initialSettings).then((data) => {
            if (data) {
              // The file-backed copy may still be v1-shaped; normalise
              // before piping into the store.
              const maybeOld = data as SettingsData & { defaultGenre?: GenreId };
              if (typeof maybeOld.defaultGenre === "string" && !Array.isArray(maybeOld.defaultGenres)) {
                maybeOld.defaultGenres = [maybeOld.defaultGenre];
                delete maybeOld.defaultGenre;
              }
              useSettingsStore.setState(data);
            }
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
    defaultGenres: state.defaultGenres,
    theme: state.theme,
    autoSaveDraft: state.autoSaveDraft,
    showCharCount: state.showCharCount,
    compactTagDisplay: state.compactTagDisplay,
    historyLimit: state.historyLimit,
    includeMultilingualTags: state.includeMultilingualTags,
    includeTrendingTags: state.includeTrendingTags,
    hashtagCount: state.hashtagCount,
    showQualityBadge: state.showQualityBadge,
    showCopyright: state.showCopyright,
    showUsagePolicy: state.showUsagePolicy,
    editorAccordionState: state.editorAccordionState,
  };
  saveSettings(STORE_KEY, data);
});
