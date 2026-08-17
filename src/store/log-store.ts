import { create } from "zustand";
import { generateId } from "@utils/uuid";
import {
  persistLogEntry,
  loadRecentLogs,
  pruneOldLogs,
  clearAllPersistedLogs,
} from "@utils/log-storage";

export type LogLevel = "error" | "warn" | "info" | "debug";

export interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  source: string;
  message: string;
  details?: string;
  /**
   * Session identifier (v0.17.0). One per app boot, attached to
   * every entry the store records during that lifetime. Lets the
   * LogPage group entries into per-session accordion sections so
   * "what happened since I opened the app" is readable at a glance,
   * and prior-session history doesn't smear into the current run.
   */
  sessionId: string;
}

interface LogState {
  entries: LogEntry[];
  /** Session id of the *current* app boot. Stable for the lifetime
   *  of the store; entries from prior runs carry their own id. */
  currentSessionId: string;
  addEntry: (data: Omit<LogEntry, "id" | "timestamp" | "sessionId">) => void;
  deleteEntry: (id: string) => void;
  clearAll: () => void;
  /** Clear in-memory state AND wipe persisted log files / localStorage.
   *  Used by the "Clear all persisted logs" action. */
  clearAllPersisted: () => Promise<void>;
  /** Clear all entries from a single session (current or historical). */
  clearSession: (sessionId: string) => void;
}

/**
 * In-memory cap. The previous limit (500) covered ~a few hours of
 * heavy debug logging; raised to 2000 with persistence in play so
 * the in-memory tail can fully represent a session for the LogPage
 * accordion to render without paging.
 */
const MAX_ENTRIES = 2000;

/**
 * Session id for THIS app boot. Module-scoped (not store-scoped) so
 * every entry recorded during this process lifetime shares the same
 * value regardless of which call site lands first.
 */
const CURRENT_SESSION_ID = generateId();

export const useLogStore = create<LogState>()((set) => ({
  entries: [],
  currentSessionId: CURRENT_SESSION_ID,

  addEntry: (data) => {
    const entry: LogEntry = {
      ...data,
      id: generateId(),
      timestamp: new Date().toISOString(),
      sessionId: CURRENT_SESSION_ID,
    };
    set((state) => ({
      entries: [entry, ...state.entries].slice(0, MAX_ENTRIES),
    }));
    // Fire-and-forget persistence. `persistLogEntry` swallows failures
    // — we don't want a disk hiccup to escalate into a log loop.
    void persistLogEntry(entry);
  },

  deleteEntry: (id) => {
    set((state) => ({ entries: state.entries.filter((e) => e.id !== id) }));
  },

  clearAll: () => set({ entries: [] }),

  clearAllPersisted: async () => {
    set({ entries: [] });
    await clearAllPersistedLogs();
  },

  clearSession: (sessionId) =>
    set((state) => ({
      entries: state.entries.filter((e) => e.sessionId !== sessionId),
    })),
}));

/**
 * Boot-time hydration. Reads recent persisted entries from disk /
 * localStorage and folds them into the in-memory store before the
 * UI mounts. Idempotent — re-running just produces the same merge
 * (entries are deduped by id).
 *
 * Async and best-effort: if persistence fails or the platform layer
 * isn't ready yet, the store just starts empty and accumulates from
 * the current session forward. Called once from `App.tsx`.
 */
export async function hydrateLogStore(retentionDays: number): Promise<void> {
  try {
    const prior = await loadRecentLogs(retentionDays);
    if (prior.length === 0) {
      // No-op — first run / nothing in the retention window.
    } else {
      // Sort by timestamp descending so the newest is first
      // (matches `addEntry`'s prepend semantics). Filter out anything
      // already in memory by id to keep hydration idempotent.
      const sorted = [...prior].sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp));
      useLogStore.setState((state) => {
        const existing = new Set(state.entries.map((e) => e.id));
        const fresh = sorted.filter((e) => !existing.has(e.id));
        // Place fresh prior entries AFTER current session's entries
        // (which were added between boot and this call) so the
        // accordion still opens with the current session at top.
        return { entries: [...state.entries, ...fresh].slice(0, MAX_ENTRIES) };
      });
    }
    // Run retention sweep AFTER hydrate so the load can pick up
    // entries that are about to be pruned (last-chance access).
    void pruneOldLogs(retentionDays);
  } catch {
    // Hydration failure → store stays empty + per-session forward.
  }
}
