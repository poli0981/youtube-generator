import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { generateId } from "@utils/uuid";
import type { VideoType, Genre, SupportedLanguage } from "@engine/types";

export interface HistoryEntry {
  id: string;
  gameName: string;
  videoType: VideoType;
  language: SupportedLanguage;
  genre: Genre;
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
      partialize: (state) => ({ entries: state.entries }),
    },
  ),
);
