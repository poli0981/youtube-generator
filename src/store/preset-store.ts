import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { generateId } from "@utils/uuid";
import { saveSettings } from "@utils/storage-adapter";
import type { Genre } from "@engine/types";

export interface GamePreset {
  id: string;
  gameName: string;
  gameNameLocalized?: Record<string, string>;
  genres: Genre[];
  platform: string;
  storeLinks: Record<string, string>;
  spoilerWarning: boolean;
  matureWarning: boolean;
  /**
   * Game's dev/publisher name. v0.21.0 lifted this from a side-label on
   * the publisher store link to a first-class field so it survives across
   * preset reloads — useful when a creator covers a series spanning many
   * episodes and doesn't want to re-type the studio name each session.
   * Optional so older presets (pre-v0.21) hydrate without breaking.
   */
  pubDevName?: string;
  /**
   * Per-preset toggle that mirrors `settings.showGameCopyright`. v0.21.0
   * added this so a preset can carry the credit obligation alongside the
   * publisher name — applying the preset hydrates both fields together,
   * which is the common case for games whose dev requires attribution in
   * the description. Optional; missing means "don't touch the setting".
   */
  showGameCopyright?: boolean;
  createdAt: string;
}

interface PresetState {
  presets: GamePreset[];
  addPreset: (data: Omit<GamePreset, "id" | "createdAt">) => string;
  updatePreset: (id: string, data: Partial<Omit<GamePreset, "id" | "createdAt">>) => void;
  deletePreset: (id: string) => void;
  getPreset: (id: string) => GamePreset | undefined;
  importPresets: (presets: GamePreset[]) => void;
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

export const usePresetStore = create<PresetState>()(
  persist(
    (set, get) => ({
      presets: [],

      addPreset: (data) => {
        const id = generateId();
        const preset: GamePreset = { ...data, id, createdAt: new Date().toISOString() };
        set((state) => ({ presets: [...state.presets, preset] }));
        return id;
      },

      updatePreset: (id, data) => {
        set((state) => ({
          presets: state.presets.map((p) => (p.id === id ? { ...p, ...data } : p)),
        }));
      },

      deletePreset: (id) => {
        set((state) => ({ presets: state.presets.filter((p) => p.id !== id) }));
      },

      getPreset: (id) => {
        return get().presets.find((p) => p.id === id);
      },

      importPresets: (presets) => {
        // v0.15.0: shape-check incoming rows before they hit the
        // store. See profile-store.importProfiles for the rationale —
        // a hand-edited / malformed file used to slip in rows with
        // missing fields that then crashed downstream consumers.
        if (!Array.isArray(presets)) return;
        const valid = presets.filter(
          (p): p is GamePreset =>
            !!p && typeof p === "object" && typeof (p as GamePreset).id === "string",
        );
        set((state) => {
          const existingIds = new Set(state.presets.map((p) => p.id));
          const normalised = valid.map((p) => normalisePreset(p as LegacyPreset));
          const newPresets = normalised.filter((p) => !existingIds.has(p.id));
          return { presets: [...state.presets, ...newPresets] };
        });
      },
    }),
    {
      name: "ytdescgen-presets",
      storage: createJSONStorage(() => localStorage),
      // v1 → v2 upgrade: GamePreset.genre (single) became genres[] in v0.5.
      version: 2,
      migrate: (persistedState: unknown, version: number) => {
        if (version < 2 && persistedState && typeof persistedState === "object") {
          const state = persistedState as { presets?: LegacyPreset[] };
          if (Array.isArray(state.presets)) {
            state.presets = state.presets.map(normalisePreset);
          }
        }
        return persistedState as { presets: GamePreset[] };
      },
      partialize: (state) => ({ presets: state.presets }),
    },
  ),
);

usePresetStore.subscribe((state) => {
  saveSettings("ytdescgen-presets", { presets: state.presets });
});
