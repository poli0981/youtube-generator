import type { GenreId } from "@config/genres";
import type { SupportedLanguage } from "@engine/types";

/**
 * Shape of the settings payload that is persisted to disk + localStorage.
 * Kept separate from the zustand store type so pure helpers (like
 * {@link healSettings}) can run in any environment — the store itself
 * pulls in browser-only modules (`window`, Tauri bridges) that break
 * when imported from a Node-based test runner.
 */
export interface SettingsData {
  appLanguage: SupportedLanguage;
  defaultOutputLanguage: SupportedLanguage;
  defaultGenres: GenreId[];
  theme: "dark" | "light";
  showCharCount: boolean;
  compactTagDisplay: boolean;
  historyLimit: number;
  includeMultilingualTags: boolean;
  includeTrendingTags: boolean;
  hashtagCount: number;
  showQualityBadge: boolean;
  showCopyright: boolean;
  showUsagePolicy: boolean;
  showSponsorCredit: boolean;
  editorAccordionState: Record<string, boolean>;
}

export function detectBrowserLanguage(): SupportedLanguage {
  if (typeof navigator === "undefined") return "en";
  const lang = navigator.language.split("-")[0];
  const supported: SupportedLanguage[] = ["en", "vi", "ja", "es", "ko", "zh"];
  return (supported.find((s) => s === lang) ?? "en") as SupportedLanguage;
}

/**
 * Single source of truth for settings defaults. Evaluated once at module
 * load so detection (e.g. browser language) happens before any rehydrate.
 */
export const initialSettings: SettingsData = {
  appLanguage: detectBrowserLanguage(),
  defaultOutputLanguage: detectBrowserLanguage(),
  defaultGenres: ["action"],
  theme: "dark",
  showCharCount: true,
  compactTagDisplay: false,
  historyLimit: 100,
  includeMultilingualTags: true,
  includeTrendingTags: true,
  hashtagCount: 3,
  showQualityBadge: true,
  showCopyright: true,
  showUsagePolicy: false,
  showSponsorCredit: false,
  editorAccordionState: {
    gameInfo: true,
    videoSettings: true,
    contentDetails: false,
    attribution: false,
    rig: false,
    storeAndSocial: false,
  },
};

/**
 * Normalise persisted settings so missing keys are back-filled with the
 * current defaults, legacy shapes are upgraded, and removed keys are
 * stripped. Runs on every rehydrate so a hand-edited or partially-written
 * `settings.json` can never leave the store in an incomplete state.
 *
 * Pure — safe to call from unit tests.
 */
export function healSettings(raw: unknown): SettingsData {
  if (!raw || typeof raw !== "object") return { ...initialSettings };

  const incoming = { ...(raw as Record<string, unknown>) };

  // v1 → v2 shape upgrade: `defaultGenre: GenreId` became
  // `defaultGenres: GenreId[]`.
  if (typeof incoming.defaultGenre === "string" && !Array.isArray(incoming.defaultGenres)) {
    incoming.defaultGenres = [incoming.defaultGenre];
  }
  delete incoming.defaultGenre;

  // v2 → v3: `autoSaveDraft` removed (the draft autosaves unconditionally
  // via the editor store's persist middleware, so the toggle was dead).
  delete incoming.autoSaveDraft;

  return { ...initialSettings, ...incoming } as SettingsData;
}
