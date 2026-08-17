import { useCallback } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import type { SaveOutcome } from "@utils/file-ops";

/**
 * Turn a {@link SaveOutcome} into the right user feedback, in one place.
 *
 * The rule that matters: **"cancelled" is silent.** Dismissing a save dialog is
 * a decision, not a failure, and toasting "Export failed" at someone who
 * pressed Escape is exactly the kind of thing that trains people to ignore
 * toasts. Only a genuine write error says anything red.
 *
 * Six export buttons across five pages share this, which also retires the
 * hardcoded English "Exported!" / "Export failed" strings those handlers
 * carried before v0.35.0.
 */
export function useFileExport(): { report: (outcome: SaveOutcome) => void } {
  const { t } = useTranslation("ui");

  const report = useCallback(
    (outcome: SaveOutcome) => {
      if (outcome === "saved") toast.success(t("common.exported"));
      else if (outcome === "failed") toast.error(t("common.exportFailed"));
      // "cancelled" — deliberately nothing.
    },
    [t],
  );

  return { report };
}
