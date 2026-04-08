import { useState } from "react";
import { ChevronDown, ChevronUp, Trash2, Copy, Check } from "lucide-react";
import { useLogStore, type LogEntry as LogEntryType, type LogLevel } from "@store/log-store";
import clsx from "clsx";

const LEVEL_STYLES: Record<LogLevel, string> = {
  error: "bg-red-500/20 text-red-400",
  warn: "bg-yellow-500/20 text-yellow-400",
  info: "bg-blue-500/20 text-blue-400",
  debug: "bg-gray-500/20 text-gray-400",
};

interface LogEntryProps {
  entry: LogEntryType;
}

export function LogEntryCard({ entry }: LogEntryProps) {
  const deleteEntry = useLogStore((s) => s.deleteEntry);
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const time = new Date(entry.timestamp).toLocaleTimeString();

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    const text = `[${entry.level.toUpperCase()}] [${entry.source}] ${entry.message}${entry.details ? `\n${entry.details}` : ""}`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <div
      className={clsx(
        "rounded-lg border bg-surface-2 transition-colors",
        entry.level === "error" ? "border-red-500/30" : "border-border",
      )}
    >
      <div
        className="flex cursor-pointer items-center gap-2 px-3 py-2"
        onClick={() => setExpanded(!expanded)}
      >
        <span
          className={clsx(
            "shrink-0 rounded px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase",
            LEVEL_STYLES[entry.level],
          )}
        >
          {entry.level}
        </span>
        <span className="shrink-0 rounded bg-surface-3 px-1.5 py-0.5 text-[10px] text-text-muted">
          {entry.source}
        </span>
        <span className="min-w-0 flex-1 truncate text-xs text-text-primary">{entry.message}</span>
        <span className="shrink-0 text-[10px] text-text-muted">{time}</span>
        <div className="flex shrink-0 items-center gap-0.5">
          <button
            onClick={handleCopy}
            className="rounded p-1 text-text-muted hover:bg-surface-3 hover:text-text-primary"
          >
            {copied ? <Check className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              deleteEntry(entry.id);
            }}
            className="rounded p-1 text-text-muted hover:bg-surface-3 hover:text-danger"
          >
            <Trash2 className="h-3 w-3" />
          </button>
          {entry.details &&
            (expanded ? (
              <ChevronUp className="h-3.5 w-3.5 text-text-muted" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5 text-text-muted" />
            ))}
        </div>
      </div>

      {expanded && entry.details && (
        <div className="border-t border-border px-3 py-2">
          <pre className="max-h-40 overflow-auto whitespace-pre-wrap font-mono text-[11px] text-text-secondary">
            {entry.details}
          </pre>
        </div>
      )}
    </div>
  );
}
