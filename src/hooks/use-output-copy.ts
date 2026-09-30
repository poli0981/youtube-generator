import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { getOutputLimitStatus } from "@engine/limits";
import { YT_LIMITS } from "@engine/types";
import { useEditorStore } from "@store/editor-store";
import { useGeneratedOutput } from "./use-generated-output";
import { useClipboard } from "./use-clipboard";
import { useStrictBlock } from "./use-strict-block";

export type OutputCopyTarget = "title" | "description" | "tags" | "all";

/**
 * Copy part of the current output from outside the Output page — the command
 * palette and Ctrl/⌘+Shift+C — under the same rules as the Output page's own
 * buttons: nothing is copied while Strict Mode is blocking or while any field
 * is over its YouTube limit. (The shortcut used to copy title + description
 * past both gates.)
 */
export function useOutputCopy(): (target: OutputCopyTarget) => Promise<boolean> {
  const { t } = useTranslation("ui");
  const output = useGeneratedOutput();
  const hasGame = useEditorStore((s) => s.gameName.trim() !== "");
  const strictBlocked = useStrictBlock();
  const { copy } = useClipboard();

  return useCallback(
    async (target: OutputCopyTarget) => {
      if (!hasGame || !output.title) {
        toast.error(t("output.copy.empty"));
        return false;
      }
      if (strictBlocked) {
        toast.error(t("strict.copyBlocked"));
        return false;
      }
      if (getOutputLimitStatus(output).blocked) {
        toast.error(t("output.limits.bannerTitle"));
        return false;
      }
      switch (target) {
        case "title":
          return copy(output.title, { limit: YT_LIMITS.TITLE_MAX, fieldLabel: t("output.title") });
        case "description":
          return copy(output.description, {
            limit: YT_LIMITS.DESCRIPTION_MAX,
            fieldLabel: t("output.description"),
          });
        case "tags":
          return copy(output.tagString, {
            limit: YT_LIMITS.TAGS_MAX,
            fieldLabel: t("output.tags"),
          });
        case "all":
          return copy(`${output.title}\n\n${output.description}`);
      }
    },
    [output, hasGame, strictBlocked, copy, t],
  );
}
