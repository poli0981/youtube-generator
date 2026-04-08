import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Trash2 } from "lucide-react";
import { Input } from "@components/ui/Input";
import { Button } from "@components/ui/Button";
import { ConfirmDialog } from "@components/ui/ConfirmDialog";
import { LogEntryCard } from "@components/logs/LogEntry";
import { useLogStore, type LogLevel } from "@store/log-store";
import clsx from "clsx";

const LEVEL_FILTERS: Array<{ value: LogLevel | "all"; label: string; color: string }> = [
  { value: "all", label: "All", color: "" },
  { value: "error", label: "Error", color: "text-red-400" },
  { value: "warn", label: "Warn", color: "text-yellow-400" },
  { value: "info", label: "Info", color: "text-blue-400" },
  { value: "debug", label: "Debug", color: "text-gray-400" },
];

export function LogPage() {
  const { t } = useTranslation("ui");
  const { entries, clearAll } = useLogStore();
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState<LogLevel | "all">("all");
  const [showClearAll, setShowClearAll] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const listRef = useRef<HTMLDivElement>(null);

  const filtered = entries.filter((e) => {
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

  const errorCount = entries.filter((e) => e.level === "error").length;
  const warnCount = entries.filter((e) => e.level === "warn").length;

  useEffect(() => {
    if (autoScroll && listRef.current) {
      listRef.current.scrollTop = 0;
    }
  }, [entries.length, autoScroll]);

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold text-text-primary">{t("logs.title")}</h1>
          <span className="text-xs text-text-muted">
            {entries.length} entries
            {errorCount > 0 && (
              <span className="ml-1 text-red-400">({errorCount} errors)</span>
            )}
            {warnCount > 0 && (
              <span className="ml-1 text-yellow-400">({warnCount} warnings)</span>
            )}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 text-xs text-text-muted">
            <input
              type="checkbox"
              checked={autoScroll}
              onChange={(e) => setAutoScroll(e.target.checked)}
              className="rounded"
            />
            Auto-scroll
          </label>
          {entries.length > 0 && (
            <Button variant="ghost" size="sm" onClick={() => setShowClearAll(true)}>
              <Trash2 className="h-3.5 w-3.5" />
              {t("logs.clearAll")}
            </Button>
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

      {/* Log entries */}
      {filtered.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border py-12 text-center text-sm text-text-muted">
          {t("logs.emptyState")}
        </p>
      ) : (
        <div ref={listRef} className="flex max-h-[65vh] flex-col gap-1.5 overflow-y-auto">
          {filtered.map((entry) => (
            <LogEntryCard key={entry.id} entry={entry} />
          ))}
        </div>
      )}

      <ConfirmDialog
        open={showClearAll}
        onConfirm={() => {
          clearAll();
          setShowClearAll(false);
        }}
        onCancel={() => setShowClearAll(false)}
        title={t("logs.clearAll")}
        message={t("logs.clearConfirm")}
        variant="danger"
      />
    </div>
  );
}
