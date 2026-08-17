import type { TFunction } from "i18next";
import toast from "react-hot-toast";
import { useSettingsStore, healSettings, extractData } from "@store/settings-store";
import { exportTypedToJsonFile, importParsedFromJsonFile } from "@utils/import-export";
import { resolveForType } from "@utils/file-schema";
import { logger } from "@utils/logger";

/**
 * Settings file import / export.
 *
 * Extracted from SettingsPage in v0.35.0: ~120 lines of pure IO and
 * failure-classification with no JSX and no hooks, sitting in front of a
 * component that had grown past 540 lines. Nothing here needs React, so it can
 * be read — and eventually tested — on its own.
 */
const SETTINGS_STORE_KEY = "ytdescgen-settings";

/**
 * Identifier-fingerprint check: pre-v0.18.0 exports were a raw dump of
 * the entire on-disk `settings.json`, keyed by every store's
 * localStorage name (`ytdescgen-settings`, `ytdescgen-profiles`, …).
 * v0.18.0 narrowed Export Settings to write only the Settings store,
 * wrapped in the typed envelope used by the rest of the Profiles tab.
 * Detect the legacy shape so we can refuse the import with a friendly
 * message instead of silently injecting profiles / templates / history
 * into the Settings store.
 */
function isLegacyMultiStoreDump(parsed: unknown): boolean {
  if (!parsed || typeof parsed !== "object") return false;
  const asRecord = parsed as Record<string, unknown>;
  if ("_type" in asRecord) return false; // already an envelope
  return SETTINGS_STORE_KEY in asRecord;
}

/**
 * Write the Settings store to disk as a typed envelope JSON file.
 * v0.18.0 replaced the old "dump the entire on-disk settings.json"
 * approach (which leaked Profiles / Templates / History into the
 * exported file). The envelope wrapper matches what the Profiles tab
 * produces, so users can swap export files between machines without
 * worrying about which tab they're using.
 */
export async function exportSettingsToFile(t: TFunction<"ui">) {
  // `extractData` is synchronous, so the export call is the first await — the
  // web file picker needs the click's transient user activation.
  const data = extractData(useSettingsStore.getState());
  const outcome = await exportTypedToJsonFile("settings", data, "ytdescgen-settings.json");
  // Dismissing the save dialog is a decision, not a failure — stay silent.
  if (outcome === "cancelled") return;
  if (outcome === "failed") {
    toast.error(t("common.exportFailed"));
    logger.error("settings", "Failed to export settings");
    return;
  }
  toast.success(t("common.exported"));
}

/**
 * Import settings from a user-picked `.json` file. Accepts the
 * v0.18.0 envelope shape (`{ _type: "settings", data: {...} }`) and a
 * bare `SettingsData` object (hand-edited / shared partial files).
 * Pre-v0.18.0 multi-store dumps are rejected with a friendly toast —
 * see {@link isLegacyMultiStoreDump} for the rationale.
 *
 * `healSettings()` back-fills any missing keys, so a partial import
 * never leaves the store in an incomplete state. The healed payload is
 * dispatched via `setState`, which both updates React and triggers the
 * persist `subscribe` → `saveSettings`, syncing localStorage *and* the
 * on-disk `settings.json` (so re-opening the app doesn't undo the
 * import).
 */
export async function importSettingsFromFile() {
  const read = await importParsedFromJsonFile();
  if (!read.ok) {
    // `importParsedFromJsonFile` only emits these four failure kinds —
    // `wrong-shape` / `newer-schema` come from `importTypedFromJsonFile`
    // (which layers `resolveForType` on top). The `default` keeps TS
    // happy with the wider `ImportFailure` union without being reachable
    // at runtime.
    switch (read.failure.kind) {
      case "cancelled":
        return; // silent
      case "read-failed":
        toast.error(`Could not read file: ${read.failure.message}`);
        logger.error("settings", "read-failed during settings import", read.failure.message);
        return;
      case "empty":
        toast.error("File is empty");
        logger.warn("settings", "Import file is empty");
        return;
      case "parse-error":
        toast.error(`Invalid JSON syntax: ${read.failure.message}`);
        logger.error("settings", "JSON parse failed during settings import", read.failure.message);
        return;
      default:
        toast.error("Import failed");
        logger.error("settings", "Unexpected import failure", JSON.stringify(read.failure));
        return;
    }
  }

  const { shape } = read;

  // Pre-v0.18.0 multi-store dump → refuse with a targeted message so
  // the user knows to re-export from v0.18.0+ rather than silently
  // accept a file that would pollute the settings store with profile /
  // template / history data.
  if (isLegacyMultiStoreDump(shape.data)) {
    toast.error(
      "Legacy export format from v0.17.x or earlier is no longer supported. Please re-export from v0.18.0+.",
    );
    logger.warn("settings", "Refused legacy multi-store dump on import");
    return;
  }

  const resolved = resolveForType(shape, "settings");
  if (!resolved.ok) {
    switch (resolved.reason.kind) {
      case "wrong-type":
        toast.error(`This file looks like a ${resolved.reason.actual} export, not settings.`);
        logger.warn(
          "settings",
          `Refused wrong-type file on settings import (got ${resolved.reason.actual})`,
        );
        return;
      case "unknown-shape":
        toast.error("File shape is not recognised — choose a YTDescGen settings export.");
        logger.warn("settings", "Refused unknown-shape file on settings import");
        return;
      case "newer-schema":
        toast.error(
          `File was exported by a newer version (schema v${resolved.reason.actual}; this build supports up to v${resolved.reason.supported}). Update YTDescGen.`,
        );
        logger.warn(
          "settings",
          `Refused newer-schema settings file (file=v${resolved.reason.actual} supported=v${resolved.reason.supported})`,
        );
        return;
    }
  }

  const healed = healSettings(resolved.data);
  useSettingsStore.setState(healed);
  // Re-apply the theme class on <html> — `setTheme` does this in the
  // store action, but `setState` bypasses actions, so the class can
  // get out of sync if the imported theme differs from the current.
  document.documentElement.classList.toggle("dark", healed.theme === "dark");
  document.documentElement.classList.toggle("light", healed.theme === "light");

  toast.success("Settings imported");
  logger.info("settings", "Imported settings from file");
}
