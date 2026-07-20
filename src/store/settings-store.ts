import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { SupportedLanguage } from "@engine/types";
import { CURRENT_TERMS_VERSION } from "@config/legal";
import { saveSettings, loadSettings } from "@utils/storage-adapter";
import {
  healSettings,
  initialSettings,
  type SettingsData,
  type TitleFormatConfig,
} from "./settings-heal";

export type { SettingsData } from "./settings-heal";
export { healSettings } from "./settings-heal";

interface SettingsState extends SettingsData {
  setTheme: (theme: "dark" | "light") => void;
  setAppLanguage: (lang: SupportedLanguage) => void;
  setDefaultOutputLanguage: (lang: SupportedLanguage) => void;
  setSetting: <K extends keyof SettingsData>(key: K, value: SettingsData[K]) => void;
  setTitleFormat: (patch: Partial<TitleFormatConfig>) => void;
  toggleEditorAccordion: (id: string) => void;
  /** Record acceptance of the current legal terms (dismisses the consent gate). */
  acceptLegalConsent: () => void;
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

      acceptLegalConsent: () =>
        set({
          legalConsentVersion: CURRENT_TERMS_VERSION,
          legalConsentAt: new Date().toISOString(),
        }),
    }),
    {
      name: STORE_KEY,
      storage: createJSONStorage(() => localStorage),
      // v7 → v8: v0.10 added `sidebarCollapsed`. Additive — `healSettings`
      // back-fills the default via the spread of `initialSettings`, so no
      // explicit per-version migration step is required here.
      // v8 → v9: v0.11 added `showThirdPartyAds`. Additive — same back-fill
      // path as v8.
      // v9 → v10: v0.17.0 added `logRetentionDays`. Additive — defaults to
      // 7 days; `healSettings` clamps incoming values to [1, 90].
      // v10 → v11: v0.34.0 added `splitContactEmail`. Additive — the
      // `initialSettings` spread in `healSettings` back-fills the default
      // (false), so no explicit per-version migration step is required.
      version: 11,
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

/**
 * Strip the {@link SettingsState} action functions from a live store
 * snapshot, returning only the persisted {@link SettingsData} fields.
 * Used by the persist middleware's `partialize` hook and by
 * {@link SettingsPage}'s typed export so a JSON file written from the
 * Settings tab carries only data — not the actions that would otherwise
 * leak into the file as `null` values.
 *
 * Pure — safe to call from anywhere, no side effects.
 */
export function extractData(state: SettingsData): SettingsData {
  return {
    appLanguage: state.appLanguage,
    defaultOutputLanguage: state.defaultOutputLanguage,
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
    showGameCopyright: state.showGameCopyright,
    showThirdPartyAds: state.showThirdPartyAds,
    showTranslationQuality: state.showTranslationQuality,
    splitContactEmail: state.splitContactEmail,
    showPinnedCommentTemplate: state.showPinnedCommentTemplate,
    pinnedCommentIncludeAskNextGame: state.pinnedCommentIncludeAskNextGame,
    pinnedCommentIncludeGenrePlaylist: state.pinnedCommentIncludeGenrePlaylist,
    genrePlaylists: { ...state.genrePlaylists },
    titleFormat: { ...state.titleFormat },
    editorAccordionState: state.editorAccordionState,
    sidebarCollapsed: state.sidebarCollapsed,
    logRetentionDays: state.logRetentionDays,
    legalConsentVersion: state.legalConsentVersion,
    legalConsentAt: state.legalConsentAt,
  };
}

// Dual-write: also save to file on every change. Guarantees the
// `settings.json` on disk always contains the full schema after the first
// rehydrate, even on a fresh install with no prior localStorage.
useSettingsStore.subscribe((state) => {
  saveSettings(STORE_KEY, extractData(state));
});
