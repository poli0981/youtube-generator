import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useEditorStore } from "@store/editor-store";
import { useHistoryStore } from "@store/history-store";
import { useSettingsStore } from "@store/settings-store";
import { useGeneratedOutput } from "./use-generated-output";

/**
 * Save the current output to History now (Ctrl/⌘+S). The Output page also
 * records what it shows; this works from anywhere, e.g. straight from the
 * editor. History keeps one entry per video, so saving again updates it.
 */
export function useSaveToHistory(): () => boolean {
  const { t } = useTranslation("ui");
  const output = useGeneratedOutput();
  const gameName = useEditorStore((s) => s.gameName);
  const videoType = useEditorStore((s) => s.videoType);
  const language = useEditorStore((s) => s.language);
  const genres = useEditorStore((s) => s.genres);
  const historyLimit = useSettingsStore((s) => s.historyLimit);
  const addEntry = useHistoryStore((s) => s.addEntry);

  return useCallback(() => {
    if (!gameName.trim() || !output.title) {
      toast.error(t("output.copy.empty"));
      return false;
    }
    addEntry(
      {
        gameName,
        videoType,
        language,
        genres,
        title: output.title,
        description: output.description,
        tags: output.tagString,
      },
      historyLimit,
    );
    toast.success(t("history.savedSnapshot"));
    return true;
  }, [output, gameName, videoType, language, genres, historyLimit, addEntry, t]);
}
