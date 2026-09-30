import { toast } from "sonner";
import i18n from "@i18n/index";
import { HAS_NATIVE_DIALOGS, recoverLegacyData } from "@utils/native";
import { logger } from "@utils/logger";
import { startAutoBackup } from "./auto-backup";
import { restoreAppBackup } from "./restore-flow";

/**
 * App-data chores for the Tauri builds, run once at start-up.
 *
 * First the files versions before 1.0 wrote next to the data folder are moved
 * into it: the old data file becomes a backup the user is offered to review —
 * never applied on its own, since the data in the app is usually newer —
 * and the old log files join the others. Then, on desktop, automatic backups
 * start. Resolves to a function that stops them.
 */
export async function startAppData(): Promise<() => void> {
  try {
    const report = await recoverLegacyData();
    if (report.logsMoved > 0) {
      logger.info("storage", `Moved ${report.logsMoved} log file(s) into the logs folder`);
    }
    const [newest] = report.backups;
    if (newest) {
      logger.info("storage", `Saved the old data file as ${report.backups.join(", ")}`);
      toast.info(i18n.t("backup.legacyFound", { ns: "ui" }), {
        duration: 30_000,
        action: {
          label: i18n.t("backup.review", { ns: "ui" }),
          onClick: () => void restoreAppBackup(newest),
        },
      });
    }
  } catch (e) {
    logger.warn("storage", "Could not check for data files from older versions", String(e));
  }
  return HAS_NATIVE_DIALOGS ? startAutoBackup() : () => undefined;
}
