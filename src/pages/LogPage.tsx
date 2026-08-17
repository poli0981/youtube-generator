import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useDocumentTitle } from "@hooks/use-document-title";
import { Trash2, ChevronDown, ChevronRight, FileJson, FileText } from "lucide-react";
import { Input } from "@components/ui/Input";
import { Button } from "@components/ui/Button";
import { ConfirmDialog } from "@components/ui/ConfirmDialog";
import { LogEntryCard } from "@components/logs/LogEntry";
import { useLogStore, type LogEntry, type LogLevel } from "@store/log-store";
import { exportTypedToJsonFile } from "@utils/import-export";
import { saveFile } from "@utils/file-ops";
import clsx from "clsx";

const LEVEL_FILTERS: Array<{ value: LogLevel | "all"; label: string; color: string }> = [
  { value: "all", label: "All", color: "" },
  { value: "error", label: "Error", color: "text-red-400" },
  { value: "warn", label: "Warn", color: "text-yellow-400" },
  { value: "info", label: "Info", color: "text-blue-400" },
  { value: "debug", label: "Debug", color: "text-gray-400" },
];

/**
 * v0.17.0 LogPage. Three new concerns over the v0.16.x version:
 *
 * 1. **Session-grouped accordion**. The store now tags each entry
 *    with a `sessionId` (one per app boot). The page collects
 *    consecutive entries by id and renders one collapsible block
 *    per session. The *current* session expands by default; prior
 *    sessions collapse so the page opens fast even after a week of
 *    persisted history.
 *
 * 2. **Export buttons**. Two flavours:
 *    - JSON (envelope-wrapped) — feeds back into the v0.15 import
 *      pipeline (`_type: "history"` for now; eventually a dedicated
 *      `log` type when there's a use case to re-import).
 *    - Plaintext (.txt) — one line per entry, formatted as
 *      `[ISO time] [LEVEL] [source] message — details`. Most useful
 *      for pasting into a bug report.
 *
 * 3. **Session-scoped clear**. The existing `Clear All` confirms
 *    via the same dialog; a new "Clear this session" inline action
 *    on each session header lets a creator drop one bad debug run
 *    without losing prior history.
 */
export function LogPage() {
  const { t } = useTranslation("ui");
  useDocumentTitle(t("tabs.logs"));
  // `clearAll` (in-memory only) intentionally omitted — the page uses
  // `clearAllPersisted` so the on-disk JSONL files don't drift out of
  // sync with the in-memory tail when the user hits the toolbar trash.
  const { entries, currentSessionId, clearSession, clearAllPersisted } = useLogStore();
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState<LogLevel | "all">("all");
  const [showClearAll, setShowClearAll] = useState(false);
  const [collapsedSessions, setCollapsedSessions] = useState<Set<string>>(new Set());

  /** Apply level + search filters before grouping so empty sessions
   *  (whose only entries got filtered out) disappear entirely. */
  const filtered = useMemo<LogEntry[]>(() => {
    return entries.filter((e) => {
      if (levelFilter !== "all" && e.level !== levelFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          e.message.toLowerCase().includes(q) ||
          e.source.toLowerCase().includes(q) ||
          (e.details?.toLowerCase().includes(q) ?? false)
        );
      }
      return true;
    });
  }, [entries, levelFilter, search]);

  /** Group filtered entries by sessionId, preserving the descending-time
   *  order the store maintains. Each session carries summary counts
   *  rendered in the header. */
  const sessions = useMemo(() => {
    const map = new Map<string, LogEntry[]>();
    for (const entry of filtered) {
      const existing = map.get(entry.sessionId);
      if (existing) {
        existing.push(entry);
      } else {
        map.set(entry.sessionId, [entry]);
      }
    }
    return Array.from(map.entries()).map(([id, sessionEntries]) => ({
      id,
      entries: sessionEntries,
      isCurrent: id === currentSessionId,
      // First entry is newest (entries are prepended); last is oldest
      // — used for the time range label.
      firstAt: sessionEntries[sessionEntries.length - 1]?.timestamp ?? "",
      lastAt: sessionEntries[0]?.timestamp ?? "",
      errorCount: sessionEntries.filter((e) => e.level === "error").length,
      warnCount: sessionEntries.filter((e) => e.level === "warn").length,
    }));
  }, [filtered, currentSessionId]);

  const totalErrorCount = entries.filter((e) => e.level === "error").length;
  const totalWarnCount = entries.filter((e) => e.level === "warn").length;

  const handleExportJson = () => {
    exportTypedToJsonFile("history", entries, `ytdescgen-logs-${todayStamp()}.json`);
  };

  const handleExportTxt = async () => {
    const text = entries
      .slice()
      .reverse() // chronological order in the export
      .map(formatPlaintextLine)
      .join("\n");
    await saveFile(text, `ytdescgen-logs-${todayStamp()}.txt`);
  };

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold text-text-primary">{t("logs.title")}</h1>
          <span className="text-xs text-text-muted">
            {entries.length} entries · {sessions.length} sessions
            {totalErrorCount > 0 && (
              <span className="ml-1 text-red-400">({totalErrorCount} errors)</span>
            )}
            {totalWarnCount > 0 && (
              <span className="ml-1 text-yellow-400">({totalWarnCount} warnings)</span>
            )}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {entries.length > 0 && (
            <>
              <Button variant="ghost" size="sm" onClick={handleExportJson}>
                <FileJson className="h-3.5 w-3.5" />
                {t("logs.exportJson")}
              </Button>
              <Button variant="ghost" size="sm" onClick={handleExportTxt}>
                <FileText className="h-3.5 w-3.5" />
                {t("logs.exportTxt")}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setShowClearAll(true)}>
                <Trash2 className="h-3.5 w-3.5" />
                {t("logs.clearAll")}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex gap-1 rounded-lg bg-surface-1 p-1">
          {LEVEL_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setLevelFilter(f.value)}
              className={clsx(
                "rounded-md px-3 py-1 text-xs font-medium transition-colors",
                levelFilter === f.value
                  ? "bg-accent text-white"
                  : clsx("text-text-muted hover:text-text-primary", f.color),
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex-1">
          <Input
            placeholder={t("logs.searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Session-grouped entries */}
      {sessions.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border py-12 text-center text-sm text-text-muted">
          {t("logs.emptyState")}
        </p>
      ) : (
        <div className="flex max-h-[65vh] flex-col gap-2 overflow-y-auto">
          {sessions.map((session, idx) => {
            const isCollapsed = collapsedSessions.has(session.id);
            // Auto-collapse non-current sessions on first render — we
            // store the inverse (collapsed-set) so this defaults to
            // expanded for the current session.
            const effectivelyCollapsed = session.isCurrent
              ? isCollapsed
              : !collapsedSessions.has(`__expanded__${session.id}`);

            return (
              <div key={session.id} className="rounded-lg border border-border bg-surface-1">
                <div
                  className="flex cursor-pointer items-center gap-2 px-3 py-2"
                  onClick={() => {
                    // Two different toggle keys depending on default
                    // state — keeps the "current expanded, others
                    // collapsed" semantic from leaking into the set.
                    setCollapsedSessions((prev) => {
                      const next = new Set(prev);
                      const key = session.isCurrent ? session.id : `__expanded__${session.id}`;
                      if (next.has(key)) next.delete(key);
                      else next.add(key);
                      return next;
                    });
                  }}
                >
                  {effectivelyCollapsed ? (
                    <ChevronRight className="h-4 w-4 text-text-muted" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-text-muted" />
                  )}
                  <span className="text-sm font-semibold text-text-primary">
                    {session.isCurrent
                      ? t("logs.sessionCurrent")
                      : t("logs.sessionLabel", { n: sessions.length - idx })}
                  </span>
                  <span className="text-xs text-text-muted">
                    {formatRange(session.firstAt, session.lastAt)}
                  </span>
                  <span className="text-xs text-text-muted">
                    · {session.entries.length} {t("logs.entriesShort")}
                  </span>
                  {session.errorCount > 0 && (
                    <span className="text-xs text-red-400">· {session.errorCount} errors</span>
                  )}
                  {session.warnCount > 0 && (
                    <span className="text-xs text-yellow-400">· {session.warnCount} warnings</span>
                  )}
                  <div className="flex-1" />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      clearSession(session.id);
                    }}
                    className="rounded p-1 text-text-muted hover:bg-surface-3 hover:text-danger"
                    title={t("logs.clearSession")}
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
                {!effectivelyCollapsed && (
                  <div className="flex flex-col gap-1 border-t border-border p-2">
                    {session.entries.map((entry) => (
                      <LogEntryCard key={entry.id} entry={entry} />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={showClearAll}
        onConfirm={() => {
          void clearAllPersisted();
          setShowClearAll(false);
        }}
        onCancel={() => setShowClearAll(false)}
        title={t("logs.clearAll")}
        message={t("logs.clearPersistedConfirm")}
        variant="danger"
      />
    </div>
  );
}

/** Format an ISO timestamp pair as `HH:MM:SS → HH:MM:SS`. Falls back
 *  to a single point when both ends match (single-entry session). */
function formatRange(firstIso: string, lastIso: string): string {
  const first = firstIso ? new Date(firstIso).toLocaleTimeString() : "";
  const last = lastIso ? new Date(lastIso).toLocaleTimeString() : "";
  if (!first) return last;
  if (!last || first === last) return first;
  return `${first} → ${last}`;
}

/** Build today's date stamp for export filenames. */
function todayStamp(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}${m}${d}`;
}

/** One-line text formatter for the plaintext export. */
function formatPlaintextLine(entry: LogEntry): string {
  const time = entry.timestamp;
  const head = `[${time}] [${entry.level.toUpperCase()}] [${entry.source}] ${entry.message}`;
  return entry.details ? `${head} — ${entry.details}` : head;
}
