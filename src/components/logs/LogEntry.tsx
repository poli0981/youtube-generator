import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronDown, Trash2 } from "lucide-react";
import clsx from "clsx";
import { useLogStore, type LogEntry as LogEntryType, type LogLevel } from "@store/log-store";
import { CopyStateIcon } from "@components/icons/animated";
import { IconButton } from "@components/ui/IconButton";

const LEVEL_STYLES: Record<LogLevel, string> = {
  error: "bg-danger/15 text-danger",
  warn: "bg-warning/15 text-warning",
  info: "bg-info/15 text-info",
  debug: "bg-surface-3 text-text-muted",
};

export function LogEntryCard({ entry }: { entry: LogEntryType }) {
  const { t, i18n } = useTranslation("ui");
  const deleteEntry = useLogStore((s) => s.deleteEntry);
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const time = new Date(entry.timestamp).toLocaleTimeString(i18n.language);
  const hasDetails = Boolean(entry.details);

  const handleCopy = () => {
    const text = `[${entry.level.toUpperCase()}] [${entry.source}] ${entry.message}${entry.details ? `\n${entry.details}` : ""}`;
    void navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  const summary = (
    <>
      <span
        className={clsx(
          "shrink-0 rounded px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase",
          LEVEL_STYLES[entry.level],
        )}
      >
        {entry.level}
      </span>
      <span className="bg-surface-2 text-text-muted shrink-0 rounded px-1.5 py-0.5 font-mono text-[10px]">
        {entry.source}
      </span>
      <span className="text-text-primary min-w-0 flex-1 truncate text-xs">{entry.message}</span>
      <span className="text-text-muted tabular shrink-0 text-[10px]">{time}</span>
    </>
  );

  return (
    <div
      className={clsx(
        "bg-surface-0 rounded-lg border",
        entry.level === "error" ? "border-danger/30" : "border-border",
      )}
    >
      <div className="flex items-center gap-1 pr-1">
        {hasDetails ? (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 px-3 py-2 text-left"
          >
            {summary}
            <ChevronDown
              className={clsx(
                "text-text-muted size-3.5 shrink-0 transition-transform",
                expanded && "rotate-180",
              )}
              aria-hidden="true"
            />
          </button>
        ) : (
          <div className="flex min-w-0 flex-1 items-center gap-2 px-3 py-2">{summary}</div>
        )}
        <IconButton
          label={t("logs.copyEntry")}
          size="icon-sm"
          onClick={handleCopy}
          className="size-7"
        >
          <CopyStateIcon copied={copied} className="size-3.5" />
        </IconButton>
        <IconButton
          label={t("logs.deleteEntry")}
          size="icon-sm"
          className="hover:text-danger size-7"
          onClick={() => deleteEntry(entry.id)}
        >
          <Trash2 className="size-3.5" />
        </IconButton>
      </div>

      {expanded && entry.details && (
        <div className="border-border border-t px-3 py-2">
          <pre className="text-text-secondary max-h-40 scrollbar-thin overflow-auto font-mono text-[11px] whitespace-pre-wrap">
            {entry.details}
          </pre>
        </div>
      )}
    </div>
  );
}
