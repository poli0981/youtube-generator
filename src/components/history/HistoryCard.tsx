import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { Button } from "@components/ui/Button";
import { CopyButton } from "@components/output/CopyButton";
import { useHistoryStore, type HistoryEntry } from "@store/history-store";
import { VIDEO_TYPES } from "@config/video-types";

interface HistoryCardProps {
  entry: HistoryEntry;
}

export function HistoryCard({ entry }: HistoryCardProps) {
  const { t } = useTranslation("ui");
  const deleteEntry = useHistoryStore((s) => s.deleteEntry);
  const [expanded, setExpanded] = useState(false);

  const videoType = VIDEO_TYPES.find((vt) => vt.id === entry.videoType);
  const date = new Date(entry.createdAt).toLocaleDateString();

  return (
    <div className="hover:border-accent/30 rounded-lg border border-border-strong bg-surface-2 shadow-md shadow-black/10 transition-colors">
      <div
        className="flex cursor-pointer items-center justify-between p-3"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex-1">
          <div className="flex items-center gap-2">
            {videoType && <span>{videoType.icon}</span>}
            <span className="text-sm font-medium text-text-primary">{entry.title}</span>
          </div>
          <div className="mt-1 flex gap-2 text-xs text-text-muted">
            <span>{entry.gameName}</span>
            <span>{entry.language.toUpperCase()}</span>
            <span>{date}</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              deleteEntry(entry.id);
            }}
          >
            <Trash2 className="h-3.5 w-3.5 text-danger" />
          </Button>
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-text-muted" />
          ) : (
            <ChevronDown className="h-4 w-4 text-text-muted" />
          )}
        </div>
      </div>

      {expanded && (
        <div className="border-t border-border p-3">
          <div className="mb-2 flex gap-2">
            <CopyButton text={entry.title} label={t("output.copyTitle")} />
            <CopyButton text={entry.description} label={t("output.copyDescription")} />
            <CopyButton text={entry.tags} label={t("output.copyTags")} />
          </div>
          <pre className="max-h-48 overflow-y-auto whitespace-pre-wrap rounded bg-surface-2 p-2 font-sans text-xs text-text-secondary">
            {entry.description}
          </pre>
        </div>
      )}
    </div>
  );
}
