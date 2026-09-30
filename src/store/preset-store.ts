import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { generateId } from "@utils/uuid";
import type {
  ContentWarning,
  GameVersion,
  Genre,
  LanguagePatch,
  StoreLinkType,
} from "@engine/types";
import type { ArtStyle } from "@config/graphics-settings";

/**
 * A game preset — the editor's per-game fields (`PRESET_FIELDS` in
 * `@config/library-fields`), reused across every part of one game.
 */
export interface GamePreset {
  id: string;
  gameName: string;
  gameNameLocalized?: Record<string, string>;
  genres: Genre[];
  platform: string;
  storeLinks: Record<string, string>;
  /** Paid / free / demo per store link (v1.0.0). */
  storeLinkTypes?: Record<string, StoreLinkType>;
  /** @deprecated v0.11 — folded into `contentWarnings` when applied. */
  spoilerWarning?: boolean;
  /** @deprecated v0.11 — folded into `contentWarnings` when applied. */
  matureWarning?: boolean;
  /**
   * Game's dev/publisher name. v0.21.0 lifted this from a side-label on
   * the publisher store link to a first-class field so it survives across
   * preset reloads. Optional so older presets (pre-v0.21) hydrate without
   * breaking.
   */
  pubDevName?: string;
  /**
   * Per-preset toggle that mirrors `settings.showGameCopyright` (v0.21.0),
   * so a preset can carry the credit obligation alongside the publisher
   * name. Missing means "don't touch the setting".
   */
  showGameCopyright?: boolean;
  /** v1.0.0: the rest of the per-game fields. Optional — older presets
   *  don't have them, and applying one leaves those editor fields alone. */
  contentWarnings?: ContentWarning[];
  languagePatch?: LanguagePatch;
  languagePatchCustom?: string;
  gameVersion?: GameVersion;
  gameVersionCustom?: string;
  artStyle?: ArtStyle;
  skipGraphicsSettings?: boolean;
  playlistLink?: string;
  createdAt: string;
  /** v1.0.0. Missing on older presets — treat `createdAt` as the last change. */
  updatedAt?: string;
}

export type GamePresetData = Omit<GamePreset, "id" | "createdAt" | "updatedAt">;

interface PresetState {
  presets: GamePreset[];
  addPreset: (data: GamePresetData) => string;
  updatePreset: (id: string, data: Partial<GamePresetData>) => void;
  deletePreset: (id: string) => void;
  getPreset: (id: string) => GamePreset | undefined;
}

type LegacyPreset = Omit<GamePreset, "genres"> & { genre?: Genre; genres?: Genre[] };

function normalisePreset(p: LegacyPreset): GamePreset {
  const { genre, ...rest } = p;
  if (Array.isArray(rest.genres) && rest.genres.length > 0) {
    return rest as GamePreset;
  }
  const fallback = genre ?? "action";
  return { ...rest, genres: [fallback] } as GamePreset;
}

/** v1 → v2: GamePreset.genre (single) became genres[] in v0.5. */
export const PRESET_STORE_VERSION = 2;

/** The persist migration, shared with backup import. Every step is idempotent. */
export function migratePresetsState(persistedState: unknown, version: number): unknown {
  if (version < 2 && persistedState && typeof persistedState === "object") {
    const state = persistedState as { presets?: LegacyPreset[] };
    if (Array.isArray(state.presets)) {
      state.presets = state.presets.map((p) =>
        p && typeof p === "object" ? normalisePreset(p) : p,
      );
    }
  }
  return persistedState;
}

export const usePresetStore = create<PresetState>()(
  persist(
    (set, get) => ({
      presets: [],

      addPreset: (data) => {
        const id = generateId();
        const now = new Date().toISOString();
        const preset: GamePreset = { ...data, id, createdAt: now, updatedAt: now };
        set((state) => ({ presets: [...state.presets, preset] }));
        return id;
      },

      updatePreset: (id, data) => {
        set((state) => ({
          presets: state.presets.map((p) =>
            p.id === id ? { ...p, ...data, updatedAt: new Date().toISOString() } : p,
          ),
        }));
      },

      deletePreset: (id) => {
        set((state) => ({ presets: state.presets.filter((p) => p.id !== id) }));
      },

      getPreset: (id) => {
        return get().presets.find((p) => p.id === id);
      },
    }),
    {
      name: "ytdescgen-presets",
      storage: createJSONStorage(() => localStorage),
      version: PRESET_STORE_VERSION,
      migrate: (persistedState, version) =>
        migratePresetsState(persistedState, version) as { presets: GamePreset[] },
      partialize: (state) => ({ presets: state.presets }),
    },
  ),
);
