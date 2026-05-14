import { IS_TAURI } from "./platform";
import type { LogEntry } from "@store/log-store";

/**
 * Log persistence (v0.17.0). Bridges the in-memory log store to
 * disk (Tauri JSONL files) / localStorage (web) so creators get a
 * persistent trail across app restarts.
 *
 * Design choices:
 *
 * - **JSONL on disk**, one entry per line. Lets us append on every
 *   `addEntry` without re-serialising the whole tail, and a corrupt
 *   line never breaks the rest of the file (parse failures are
 *   filtered, not propagated).
 * - **Daily file rotation** (`ytdescgen-YYYYMMDD.jsonl`). Cleanup
 *   sweeps just delete whole files older than `logRetentionDays`,
 *   which is dramatically faster than scanning every line.
 * - **localStorage cap on web** (5000 entries). When the cap is
 *   exceeded, oldest entries drop. Roughly matches a week of
 *   moderate use; users who need more should use the desktop build.
 * - **Best-effort writes**: persistence failures never throw — the
 *   in-memory store stays the source of truth even if disk writes
 *   fail. Errors get logged to the *previous* log entry's source so
 *   we don't recurse into an infinite write loop.
 */

const LOG_DIR_SUBPATH = "logs";
const FILE_PREFIX = "ytdescgen-";
const FILE_SUFFIX = ".jsonl";
const WEB_STORAGE_KEY = "ytdescgen-logs";
const WEB_MAX_ENTRIES = 5000;

/** Build today's log file name (`ytdescgen-YYYYMMDD.jsonl`). */
function todayFileName(now = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${FILE_PREFIX}${y}${m}${d}${FILE_SUFFIX}`;
}

/** Extract the YYYYMMDD date from a log file name. Returns null when
 *  the name doesn't match the prefix/suffix shape — defensive against
 *  hand-edited files in the same directory. */
function parseFileDate(name: string): Date | null {
  if (!name.startsWith(FILE_PREFIX) || !name.endsWith(FILE_SUFFIX)) {
    return null;
  }
  const datePart = name.slice(FILE_PREFIX.length, name.length - FILE_SUFFIX.length);
  if (!/^\d{8}$/.test(datePart)) return null;
  const y = parseInt(datePart.slice(0, 4), 10);
  const m = parseInt(datePart.slice(4, 6), 10) - 1;
  const d = parseInt(datePart.slice(6, 8), 10);
  return new Date(y, m, d);
}

/** Compute the absolute path to today's log file on the Tauri side. */
async function getTodayLogPath(): Promise<string> {
  const { appDataDir } = await import("@tauri-apps/api/path");
  const dir = await appDataDir();
  return `${dir}${LOG_DIR_SUBPATH}/${todayFileName()}`;
}

async function getLogDirPath(): Promise<string> {
  const { appDataDir } = await import("@tauri-apps/api/path");
  const dir = await appDataDir();
  return `${dir}${LOG_DIR_SUBPATH}`;
}

/**
 * Append a single {@link LogEntry} to durable storage. On Tauri this
 * writes one JSONL line to the daily file; on web it appends to the
 * `ytdescgen-logs` localStorage key (with FIFO eviction when the cap
 * is hit). Failures are swallowed — the in-memory store remains the
 * canonical view.
 */
export async function persistLogEntry(entry: LogEntry): Promise<void> {
  try {
    if (IS_TAURI) {
      const { invoke } = await import("@tauri-apps/api/core");
      const path = await getTodayLogPath();
      const line = `${JSON.stringify(entry)}\n`;
      await invoke("append_to_file", { path, content: line });
    } else {
      const raw = localStorage.getItem(WEB_STORAGE_KEY);
      const existing: LogEntry[] = raw ? safeParseArray(raw) : [];
      existing.push(entry);
      const trimmed =
        existing.length > WEB_MAX_ENTRIES
          ? existing.slice(existing.length - WEB_MAX_ENTRIES)
          : existing;
      localStorage.setItem(WEB_STORAGE_KEY, JSON.stringify(trimmed));
    }
  } catch {
    // Swallow — see top-of-file comment. We can't even log the failure
    // because that would recurse here. The in-memory store still has
    // the entry, so the user sees it for the current session.
  }
}

/**
 * Load persisted log entries from durable storage, filtered to the
 * last `maxAgeDays` days. Used at app boot to seed the in-memory
 * store with prior-session history.
 *
 * Web: one localStorage read + filter by `timestamp`.
 *
 * Tauri: lists files in `{appData}/logs/`, picks each `ytdescgen-*.jsonl`
 * with a parsed date within the retention window, reads + parses
 * JSONL line-by-line. Corrupt lines are skipped silently so a single
 * bad write can't poison the whole tail.
 */
export async function loadRecentLogs(maxAgeDays: number): Promise<LogEntry[]> {
  const cutoff = Date.now() - maxAgeDays * 24 * 60 * 60 * 1000;
  try {
    if (IS_TAURI) {
      return await loadRecentTauriLogs(cutoff);
    }
    const raw = localStorage.getItem(WEB_STORAGE_KEY);
    if (!raw) return [];
    return safeParseArray(raw).filter((e) => Date.parse(e.timestamp) >= cutoff);
  } catch {
    return [];
  }
}

async function loadRecentTauriLogs(cutoffMs: number): Promise<LogEntry[]> {
  const { invoke } = await import("@tauri-apps/api/core");
  const dirPath = await getLogDirPath();
  const names = await invoke<string[]>("list_dir", { path: dirPath });
  // Only consider files whose parsed date is within the window. Saves
  // a full read of files we'd just throw away.
  const candidates = names
    .map((name) => ({ name, date: parseFileDate(name) }))
    .filter(
      (x): x is { name: string; date: Date } =>
        x.date !== null && x.date.getTime() >= cutoffMs - 24 * 60 * 60 * 1000,
    );
  const entries: LogEntry[] = [];
  for (const { name } of candidates) {
    try {
      const content: string = await invoke("read_from_file", {
        path: `${dirPath}/${name}`,
      });
      for (const line of content.split("\n")) {
        if (!line.trim()) continue;
        try {
          const parsed = JSON.parse(line) as LogEntry;
          if (Date.parse(parsed.timestamp) >= cutoffMs) {
            entries.push(parsed);
          }
        } catch {
          // Corrupt line — skip without failing the whole sweep.
        }
      }
    } catch {
      // Couldn't read this file — skip it.
    }
  }
  return entries;
}

/**
 * Delete log files older than `maxAgeDays`. Runs at app boot after
 * `loadRecentLogs` so a long-idle install doesn't keep months of old
 * JSONL around. Web path is a no-op — the localStorage cap already
 * handles eviction by FIFO.
 */
export async function pruneOldLogs(maxAgeDays: number): Promise<void> {
  if (!IS_TAURI) return;
  const cutoff = Date.now() - maxAgeDays * 24 * 60 * 60 * 1000;
  try {
    const { invoke } = await import("@tauri-apps/api/core");
    const dirPath = await getLogDirPath();
    const names = await invoke<string[]>("list_dir", { path: dirPath });
    for (const name of names) {
      const date = parseFileDate(name);
      if (date && date.getTime() < cutoff) {
        try {
          await invoke("delete_file", { path: `${dirPath}/${name}` });
        } catch {
          // Permission denied / already gone → skip.
        }
      }
    }
  } catch {
    // Directory listing failed — non-fatal.
  }
}

/**
 * Hard-clear ALL persisted logs (Tauri files + web localStorage).
 * Used by the LogPage "Clear all persisted logs" action. The
 * in-memory store is reset separately by the caller.
 */
export async function clearAllPersistedLogs(): Promise<void> {
  try {
    if (IS_TAURI) {
      const { invoke } = await import("@tauri-apps/api/core");
      const dirPath = await getLogDirPath();
      const names = await invoke<string[]>("list_dir", { path: dirPath });
      for (const name of names) {
        if (name.startsWith(FILE_PREFIX) && name.endsWith(FILE_SUFFIX)) {
          await invoke("delete_file", { path: `${dirPath}/${name}` });
        }
      }
    } else {
      localStorage.removeItem(WEB_STORAGE_KEY);
    }
  } catch {
    // Best-effort; caller already cleared the in-memory store.
  }
}

/** Parse a JSON array string safely; returns [] on any failure. */
function safeParseArray(raw: string): LogEntry[] {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as LogEntry[]) : [];
  } catch {
    return [];
  }
}
