import { IS_MOBILE, IS_TAURI } from "./platform";

/**
 * Typed bridge to the app's own Tauri commands (`src-tauri/src/storage.rs`,
 * `src-tauri/src/file_dialog.rs`).
 *
 * None of them takes a path. Backups and logs are addressed by file name and
 * live under the app's data directory; exports and imports go through a
 * native dialog opened on the Rust side, so the only file touched is the one
 * the user picked. Only call these when {@link IS_TAURI} is true.
 */
async function call<T>(command: string, args?: Record<string, unknown>): Promise<T> {
  const { invoke } = await import("@tauri-apps/api/core");
  return invoke<T>(command, args);
}

/**
 * Native Save / Open dialogs. Desktop only: on Android a picked location is a
 * content URI rather than a path, so exports stay a download there.
 */
export const HAS_NATIVE_DIALOGS = IS_TAURI && !IS_MOBILE;

export interface AppBackupFile {
  name: string;
  size: number;
  /** Last modified, ms since the epoch. */
  modifiedMs: number;
}

export const appBackups = {
  /** Newest first. */
  list: () => call<AppBackupFile[]>("backup_list"),
  read: (name: string) => call<string>("backup_read", { name }),
  /** Automatic backups (`ytdescgen-backup-…`) beyond the newest ten are pruned. */
  write: (name: string, content: string) => call<null>("backup_write", { name, content }),
  remove: (name: string) => call<null>("backup_delete", { name }),
};

export const appLogs = {
  append: (name: string, content: string) => call<null>("log_append", { name, content }),
  list: () => call<string[]>("log_list"),
  read: (name: string) => call<string>("log_read", { name }),
  remove: (name: string) => call<null>("log_delete", { name }),
};

export interface LegacyRecovery {
  /** Backup names the files written by versions before 1.0 were saved as. */
  backups: string[];
  logsMoved: number;
}

/** Move files older versions wrote next to the data folder into place. */
export const recoverLegacyData = () => call<LegacyRecovery>("recover_legacy_data");

export interface NativeDialogOptions {
  /** Filter label shown in the dialog, e.g. "JSON". */
  filterName: string;
  /** Without dots. Limited to json, jsonl, txt, csv and md by the app. */
  extensions: string[];
  title?: string;
}

/** Returns the saved file's name, or `null` when the user cancelled. */
export const nativeSaveTextFile = (
  options: NativeDialogOptions & { suggestedName: string; content: string },
) => call<string | null>("export_text_file", { ...options });

export interface PickedTextFile {
  name: string;
  text: string;
}

/** Returns the picked file, or `null` when the user cancelled. */
export const nativeOpenTextFile = (options: NativeDialogOptions) =>
  call<PickedTextFile | null>("import_text_file", { ...options });
