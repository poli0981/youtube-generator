import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useDocumentTitle } from "@hooks/use-document-title";
import { ChevronRight, FileJson, FileText, ScrollText, Search, Trash2 } from "lucide-react";
import { Input } from "@components/ui/Input";
import { Button } from "@components/ui/Button";
import { Badge } from "@components/ui/Badge";
import { Card } from "@components/ui/Card";
import { ConfirmDialog } from "@components/ui/ConfirmDialog";
import { EmptyState } from "@components/ui/EmptyState";
import { IconButton } from "@components/ui/IconButton";
import { PageContainer, PageHeader } from "@components/ui/PageHeader";
import { SegmentedControl } from "@components/ui/SegmentedControl";
import { LogEntryCard } from "@components/logs/LogEntry";
import { useLogStore, type LogEntry, type LogLevel } from "@store/log-store";
import { exportTypedToJsonFile } from "@utils/import-export";
import { saveTextFile } from "@utils/file-ops";
import { useFileExport } from "@hooks/use-file-export";
import clsx from "clsx";

const LEVEL_FILTERS: ReadonlyArray<LogLevel | "all"> = ["all", "error", "warn", "info", "debug"];

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
  const { report } = useFileExport();
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

  const handleExportJson = async () => {
    report(await exportTypedToJsonFile("history", entries, `ytdescgen-logs-${todayStamp()}.json`));
  };

  const handleExportTxt = async () => {
    // Built synchronously so `saveTextFile` is the first await — the web file
    // picker needs the click's transient user activation, and an earlier await
    // would spend it.
    const text = entries
      .slice()
      .reverse() // chronological order in the export
      .map(formatPlaintextLine)
      .join("\n");
    report(
      await saveTextFile({
        content: text,
        filename: `ytdescgen-logs-${todayStamp()}.txt`,
        mimeType: "text/plain",
      }),
    );
  };

  return (
    <PageContainer>
      <PageHeader
        title={t("logs.title")}
        description={
          <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1">
            {t("logs.summary", { entries: entries.length, sessions: sessions.length })}
            {totalErrorCount > 0 && (
              <Badge tone="danger">{t("logs.errorCount", { n: totalErrorCount })}</Badge>
            )}
            {totalWarnCount > 0 && (
              <Badge tone="warning">{t("logs.warnCount", { n: totalWarnCount })}</Badge>
            )}
          </span>
        }
        actions={
          entries.length > 0 && (
            <>
              <Button variant="ghost" size="sm" onClick={() => void handleExportJson()}>
                <FileJson />
                {t("logs.exportJson")}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => void handleExportTxt()}>
                <FileText />
                {t("logs.exportTxt")}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setShowClearAll(true)}>
                <Trash2 />
                {t("logs.clearAll")}
              </Button>
            </>
          )
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SegmentedControl
          ariaLabel={t("logs.levels.all")}
          layoutId="log-level"
          size="sm"
          value={levelFilter}
          onChange={setLevelFilter}
          options={LEVEL_FILTERS.map((level) => ({
            value: level,
            label: t(`logs.levels.${level}`),
          }))}
        />
        <div className="flex-1">
          <Input
            type="search"
            aria-label={t("logs.searchPlaceholder")}
            placeholder={t("logs.searchPlaceholder")}
            leading={<Search />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {sessions.length === 0 ? (
        <EmptyState icon={ScrollText} title={t("logs.emptyState")} />
      ) : (
        <div className="flex flex-col gap-2">
          {sessions.map((session, idx) => {
            const isCollapsed = collapsedSessions.has(session.id);
            // Auto-collapse non-current sessions on first render — we
            // store the inverse (collapsed-set) so this defaults to
            // expanded for the current session.
            const effectivelyCollapsed = session.isCurrent
              ? isCollapsed
              : !collapsedSessions.has(`__expanded__${session.id}`);

            return (
              <Card key={session.id} className="overflow-hidden">
                <div className="flex items-center gap-1 pr-2">
                  <button
                    type="button"
                    aria-expanded={!effectivelyCollapsed}
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
                    className="hover:bg-surface-2/60 flex min-w-0 flex-1 cursor-pointer flex-wrap items-center gap-x-2 gap-y-1 px-3 py-2.5 text-left"
                  >
                    <ChevronRight
                      className={clsx(
                        "text-text-muted size-4 shrink-0 transition-transform",
                        !effectivelyCollapsed && "rotate-90",
                      )}
                      aria-hidden="true"
                    />
                    <span className="text-text-primary text-sm font-semibold">
                      {session.isCurrent
                        ? t("logs.sessionCurrent")
                        : t("logs.sessionLabel", { n: sessions.length - idx })}
                    </span>
                    <span className="text-text-muted tabular text-xs">
                      {formatRange(session.firstAt, session.lastAt)} · {session.entries.length}{" "}
                      {t("logs.entriesShort")}
                    </span>
                    {session.errorCount > 0 && (
                      <Badge tone="danger">{t("logs.errorCount", { n: session.errorCount })}</Badge>
                    )}
                    {session.warnCount > 0 && (
                      <Badge tone="warning">{t("logs.warnCount", { n: session.warnCount })}</Badge>
                    )}
                  </button>
                  <IconButton
                    label={t("logs.clearSession")}
                    size="icon-sm"
                    className="hover:text-danger"
                    onClick={() => clearSession(session.id)}
                  >
                    <Trash2 />
                  </IconButton>
                </div>
                {!effectivelyCollapsed && (
                  <div className="border-border flex flex-col gap-1 border-t p-2">
                    {session.entries.map((entry) => (
                      <LogEntryCard key={entry.id} entry={entry} />
                    ))}
                  </div>
                )}
              </Card>
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
    </PageContainer>
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
