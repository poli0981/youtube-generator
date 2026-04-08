import { create } from "zustand";
import { generateId } from "@utils/uuid";

export type LogLevel = "error" | "warn" | "info" | "debug";

export interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  source: string;
  message: string;
  details?: string;
}

interface LogState {
  entries: LogEntry[];
  addEntry: (data: Omit<LogEntry, "id" | "timestamp">) => void;
  deleteEntry: (id: string) => void;
  clearAll: () => void;
}

const MAX_ENTRIES = 500;

export const useLogStore = create<LogState>()((set) => ({
  entries: [],

  addEntry: (data) => {
    const entry: LogEntry = {
      ...data,
      id: generateId(),
      timestamp: new Date().toISOString(),
    };
    set((state) => ({
      entries: [entry, ...state.entries].slice(0, MAX_ENTRIES),
    }));
  },

  deleteEntry: (id) => {
    set((state) => ({ entries: state.entries.filter((e) => e.id !== id) }));
  },

  clearAll: () => set({ entries: [] }),
}));
