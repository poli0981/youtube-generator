import { toast } from "sonner";
import i18n from "@i18n/index";
import { openTextFile, readTextFile, type OpenOutcome } from "@utils/file-ops";
import { appBackups } from "@utils/native";
import { logger } from "@utils/logger";
import { readBackupText, type DetectError } from "./detect";
import { useRestoreDialog } from "./restore-request";

/**
 * Getting a file into the restore dialog: from the Open dialog, a drop, or
 * one of the desktop app's own backups. Anything that isn't restorable data
 * ends here with a message saying why.
 */

const t = (key: string, options?: Record<string, unknown>) => i18n.t(key, { ns: "ui", ...options });

const DETECT_ERRORS: Record<DetectError, string> = {
  empty: "import.errors.empty",
  "not-json": "import.errors.notJson",
  unknown: "import.errors.unknown",
  newer: "import.errors.newer",
};

/** Detect what a file holds and open the restore dialog, or say why not. */
export function restoreFromText(text: string, fileName: string): void {
  const result = readBackupText(text);
  if (!result.ok) {
    toast.error(t(DETECT_ERRORS[result.error]));
    logger.warn("import", `Refused ${fileName}: ${result.error}`);
    return;
  }
  const { file } = result;
  if (file.kind !== "data") {
    toast.error(t(file.kind === "logs" ? "import.logsFile" : "import.socialFile"));
    return;
  }
  useRestoreDialog.getState().open({ file, fileName });
}

function reportOpenFailure(outcome: Extract<OpenOutcome, { kind: "failed" }>): void {
  const key =
    outcome.reason === "too-large"
      ? "import.errors.tooLarge"
      : outcome.reason === "wrong-type"
        ? "import.errors.wrongType"
        : "import.errors.unreadable";
  toast.error(t(key));
  logger.warn("import", `Could not open file (${outcome.reason})`, outcome.message);
}

function handleOutcome(outcome: OpenOutcome): void {
  if (outcome.kind === "cancelled") return;
  if (outcome.kind === "failed") {
    reportOpenFailure(outcome);
    return;
  }
  restoreFromText(outcome.text, outcome.name);
}

/** "Restore from file…" / "Import": pick a file, then the restore dialog. */
export async function pickFileToRestore(): Promise<void> {
  handleOutcome(await openTextFile({ extensions: ["json"], description: "JSON" }));
}

/** A file dropped on a drop zone. */
export async function restoreDroppedFile(file: File): Promise<void> {
  handleOutcome(await readTextFile(file, ["json"]));
}

/** One of the desktop app's own backups. */
export async function restoreAppBackup(name: string): Promise<void> {
  try {
    restoreFromText(await appBackups.read(name), name);
  } catch (e) {
    toast.error(t("backup.auto.loadFailed"));
    logger.error("backup", `Could not read backup ${name}`, String(e));
  }
}
