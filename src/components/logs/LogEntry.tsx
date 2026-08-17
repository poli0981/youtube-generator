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
        "bg-surface-2 rounded-lg border transition-colors",
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
        <span className="bg-surface-3 text-text-muted shrink-0 rounded px-1.5 py-0.5 text-[10px]">
          {entry.source}
        </span>
        <span className="text-text-primary min-w-0 flex-1 truncate text-xs">{entry.message}</span>
        <span className="text-text-muted shrink-0 text-[10px]">{time}</span>
        <div className="flex shrink-0 items-center gap-0.5">
          <button
            onClick={handleCopy}
            className="text-text-muted hover:bg-surface-3 hover:text-text-primary rounded p-1"
          >
            {copied ? <Check className="text-success h-3 w-3" /> : <Copy className="h-3 w-3" />}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              deleteEntry(entry.id);
            }}
            className="text-text-muted hover:bg-surface-3 hover:text-danger rounded p-1"
          >
            <Trash2 className="h-3 w-3" />
          </button>
          {entry.details &&
            (expanded ? (
              <ChevronUp className="text-text-muted h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="text-text-muted h-3.5 w-3.5" />
            ))}
        </div>
      </div>

      {expanded && entry.details && (
        <div className="border-border border-t px-3 py-2">
          <pre className="text-text-secondary max-h-40 overflow-auto font-mono text-[11px] whitespace-pre-wrap">
            {entry.details}
          </pre>
        </div>
      )}
    </div>
  );
}
