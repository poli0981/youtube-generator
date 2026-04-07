import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { generateId } from "@utils/uuid";
import type { Genre } from "@engine/types";

export interface GamePreset {
  id: string;
  gameName: string;
  gameNameLocalized?: Record<string, string>;
  genre: Genre;
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
          const newPresets = presets.filter((p) => !existingIds.has(p.id));
          return { presets: [...state.presets, ...newPresets] };
        });
      },
    }),
    {
      name: "ytdescgen-presets",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ presets: state.presets }),
    },
  ),
);
