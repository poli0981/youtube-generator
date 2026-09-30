import { useId, useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronDown, FileText, Trash2 } from "lucide-react";
import clsx from "clsx";
import { Card } from "@components/ui/Card";
import { IconButton } from "@components/ui/IconButton";
import { CopyButton } from "@components/output/CopyButton";
import { VIDEO_TYPE_ICONS } from "@components/editor/video-type-icons";
import { useHistoryStore, type HistoryEntry } from "@store/history-store";
import { VIDEO_TYPES } from "@config/video-types";

export function HistoryCard({ entry }: { entry: HistoryEntry }) {
  const { t, i18n } = useTranslation("ui");
  const deleteEntry = useHistoryStore((s) => s.deleteEntry);
  const [expanded, setExpanded] = useState(false);
  const panelId = useId();

  const videoType = VIDEO_TYPES.find((vt) => vt.id === entry.videoType);
  const Icon = videoType ? VIDEO_TYPE_ICONS[videoType.id] : FileText;
  const date = new Date(entry.createdAt).toLocaleString(i18n.language, {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center gap-2 pr-2">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          aria-controls={panelId}
          className="hover:bg-surface-2/60 flex min-w-0 flex-1 cursor-pointer items-center gap-3 p-3 text-left transition-colors"
        >
          <span className="bg-surface-2 text-text-muted flex size-9 shrink-0 items-center justify-center rounded-lg">
            <Icon className="size-4" aria-hidden />
          </span>
          <span className="min-w-0 flex-1">
            <span className="text-text-primary block truncate text-sm font-medium">
              {entry.title}
            </span>
            <span className="text-text-muted mt-0.5 block truncate text-xs">
              {[
                entry.gameName,
                videoType ? t(videoType.labelKey) : null,
                entry.language.toUpperCase(),
                date,
              ]
                .filter(Boolean)
                .join(" · ")}
            </span>
          </span>
          <ChevronDown
            className={clsx(
              "text-text-muted size-4 shrink-0 transition-transform duration-200",
              expanded && "rotate-180",
            )}
            aria-hidden="true"
          />
        </button>
        <IconButton
          label={t("common.delete")}
          size="icon-sm"
          className="hover:text-danger"
          onClick={() => deleteEntry(entry.id)}
        >
          <Trash2 />
        </IconButton>
      </div>

      {expanded && (
        <div id={panelId} className="border-border flex flex-col gap-2 border-t p-3">
          <div className="flex flex-wrap gap-1">
            <CopyButton text={entry.title} label={t("output.copyTitle")} />
            <CopyButton text={entry.description} label={t("output.copyDescription")} />
            <CopyButton text={entry.tags} label={t("output.copyTags")} />
          </div>
          <pre className="bg-surface-0 border-border text-text-secondary max-h-56 scrollbar-thin overflow-y-auto rounded-lg border p-2.5 font-sans text-xs leading-relaxed whitespace-pre-wrap">
            {entry.description}
          </pre>
        </div>
      )}
    </Card>
  );
}
