import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { generateId } from "@utils/uuid";
import { saveSettings } from "@utils/storage-adapter";
import type { VideoType, Genre, SupportedLanguage } from "@engine/types";

export interface HistoryEntry {
  id: string;
  gameName: string;
  videoType: VideoType;
  language: SupportedLanguage;
  genres: Genre[];
  title: string;
  description: string;
  tags: string;
  createdAt: string;
}

interface HistoryState {
  entries: HistoryEntry[];
  addEntry: (data: Omit<HistoryEntry, "id" | "createdAt">, limit?: number) => void;
  deleteEntry: (id: string) => void;
  clearAll: () => void;
}

type LegacyEntry = Omit<HistoryEntry, "genres"> & { genre?: Genre; genres?: Genre[] };

function normaliseEntry(e: LegacyEntry): HistoryEntry {
  const { genre, ...rest } = e;
  if (Array.isArray(rest.genres) && rest.genres.length > 0) {
    return rest as HistoryEntry;
  }
  const fallback = genre ?? "action";
  return { ...rest, genres: [fallback] } as HistoryEntry;
}

export const useHistoryStore = create<HistoryState>()(
  persist(
    (set) => ({
      entries: [],

      addEntry: (data, limit = 100) => {
        const entry: HistoryEntry = {
          ...data,
          id: generateId(),
          createdAt: new Date().toISOString(),
        };
        set((state) => {
          const updated = [entry, ...state.entries];
          return { entries: updated.slice(0, limit) };
        });
      },

      deleteEntry: (id) => {
        set((state) => ({ entries: state.entries.filter((e) => e.id !== id) }));
      },

      clearAll: () => set({ entries: [] }),
    }),
    {
      name: "ytdescgen-history",
      storage: createJSONStorage(() => localStorage),
      // v1 → v2 upgrade: HistoryEntry.genre (single) became genres[] in v0.5.
      version: 2,
      migrate: (persistedState: unknown, version: number) => {
        if (version < 2 && persistedState && typeof persistedState === "object") {
          const state = persistedState as { entries?: LegacyEntry[] };
          if (Array.isArray(state.entries)) {
            state.entries = state.entries.map(normaliseEntry);
          }
        }
        return persistedState as { entries: HistoryEntry[] };
      },
      partialize: (state) => ({ entries: state.entries }),
    },
  ),
);

useHistoryStore.subscribe((state) => {
  saveSettings("ytdescgen-history", { entries: state.entries });
});
