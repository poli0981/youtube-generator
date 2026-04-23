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
        set((state) => {
          const existingIds = new Set(state.presets.map((p) => p.id));
          const normalised = presets.map((p) => normalisePreset(p as LegacyPreset));
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
