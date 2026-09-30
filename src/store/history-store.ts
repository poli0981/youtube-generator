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

/** Same bounds as the History Limit setting. */
const LIMIT_MIN = 10;
const LIMIT_MAX = 500;

/**
 * Which video an entry is about: the same game, type, language and title
 * (the title carries the part number, boss name…) is the same video, even
 * if its description has changed since.
 */
export function historyKey(
  entry: Pick<HistoryEntry, "gameName" | "videoType" | "language" | "title">,
): string {
  return [
    entry.gameName.trim().toLowerCase(),
    entry.videoType,
    entry.language,
    entry.title.trim(),
  ].join("\n");
}

/** Newest-first entries with every video listed once (its newest entry). */
export function dedupeHistory(entries: readonly HistoryEntry[]): HistoryEntry[] {
  const seen = new Set<string>();
  return entries.filter((entry) => {
    const key = historyKey(entry);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export const useHistoryStore = create<HistoryState>()(
  persist(
    (set) => ({
      entries: [],

      /**
       * Record a generated output. The Output page calls this every time it
       * renders a new result — it used to add a new entry on every visit, so
       * one video filled the history many times over. A video already in the
       * history is now updated in place (latest description and tags) and
       * moved to the top.
       */
      addEntry: (data, limit = 100) => {
        set((state) => {
          const key = historyKey(data);
          const existing = state.entries.find((e) => historyKey(e) === key);
          const entry: HistoryEntry = {
            ...data,
            id: existing?.id ?? generateId(),
            createdAt: new Date().toISOString(),
          };
          const others = state.entries.filter((e) => historyKey(e) !== key);
          const cap = Math.min(LIMIT_MAX, Math.max(LIMIT_MIN, Math.round(limit) || 100));
          return { entries: [entry, ...others].slice(0, cap) };
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
      // v1 → v2: HistoryEntry.genre (single) became genres[] in v0.5.
      // v2 → v3: v1.0.0 folds the duplicates earlier versions piled up (one
      // per Output visit) into one entry per video, keeping the newest.
      version: 3,
      migrate: (persistedState: unknown, version: number) => {
        if (!persistedState || typeof persistedState !== "object") return persistedState;
        const state = persistedState as { entries?: LegacyEntry[] };
        if (!Array.isArray(state.entries)) return persistedState;
        let entries = state.entries;
        if (version < 2) entries = entries.map(normaliseEntry);
        if (version < 3) entries = dedupeHistory(entries as HistoryEntry[]);
        state.entries = entries;
        return persistedState as { entries: HistoryEntry[] };
      },
      partialize: (state) => ({ entries: state.entries }),
    },
  ),
);

useHistoryStore.subscribe((state) => {
  saveSettings("ytdescgen-history", { entries: state.entries });
});
