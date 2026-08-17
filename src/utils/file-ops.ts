import { IS_TAURI, IS_MOBILE } from "./platform";
import { logger } from "./logger";

/**
 * What actually happened, so callers can stay silent on a cancel instead of
 * toasting an error at someone who just pressed Escape.
 */
export type SaveOutcome = "saved" | "cancelled" | "failed";

export interface SaveTextFileOptions {
  content: string;
  /** Suggested filename, extension included. */
  filename: string;
  /** Defaults to JSON — every caller but the log .txt export writes JSON. */
  mimeType?: string;
  /** Human-readable file-type label shown in the picker's filter dropdown. */
  description?: string;
}

/** `.json` → `json`. Empty string when the name has no extension. */
function extensionOf(filename: string): string {
  const dot = filename.lastIndexOf(".");
  return dot > 0 ? filename.slice(dot + 1) : "";
}

/**
 * Last-resort writer: an anchor with `download`. No dialog — the file lands
 * wherever the browser puts downloads. Used on Android (scoped storage makes
 * a native path write unreliable) and in browsers without the File System
 * Access API.
 */
function blobDownload(content: string, filename: string, mimeType: string): SaveOutcome {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
  return "saved";
}

/**
 * Write text to a file the user chooses, on every platform we ship.
 *
 * Before v0.35.0 there were two writers that disagreed. `saveFile` branched
 * correctly but had exactly one caller (the log .txt export), while every JSON
 * export went through a separate blob-download helper with no platform branch
 * at all — so "Export" on Settings, Profiles, Presets, Templates, Social and
 * the log JSON silently dumped into the Downloads folder even on desktop,
 * where a native Save As dialog was available the whole time.
 *
 * Three branches, in order of how good the experience is:
 *
 *  1. **Tauri desktop** — native "Save As" via the dialog plugin, then the
 *     `save_to_file` Rust command. Capabilities already permit both.
 *  2. **Web with the File System Access API** (Chromium) — a real picker.
 *     Must be the FIRST await in the click handler: the API requires transient
 *     user activation, and an earlier await spends it. A `NotAllowedError` from
 *     a spent activation falls through to (3) rather than failing outright.
 *  3. **Anything else** — Android WebView, Firefox, Safari: blob download.
 */
export async function saveTextFile({
  content,
  filename,
  mimeType = "application/json",
  description,
}: SaveTextFileOptions): Promise<SaveOutcome> {
  const ext = extensionOf(filename);

  // 1. Tauri desktop. On Android `IS_TAURI` is also true, but the native save
  // dialog + std::fs path write doesn't work under scoped storage, so mobile
  // deliberately falls through to the blob download.
  if (IS_TAURI && !IS_MOBILE) {
    try {
      const { save } = await import("@tauri-apps/plugin-dialog");
      const { invoke } = await import("@tauri-apps/api/core");
      const path = await save({
        defaultPath: filename,
        ...(ext
          ? { filters: [{ name: description ?? ext.toUpperCase(), extensions: [ext] }] }
          : {}),
      });
      if (!path) return "cancelled";
      await invoke("save_to_file", { path, content });
      return "saved";
    } catch (e) {
      logger.error("file-ops", `Native save failed for ${filename}`, String(e));
      return "failed";
    }
  }

  // 2. Web with a real picker.
  if (!IS_TAURI && typeof window.showSaveFilePicker === "function") {
    try {
      const handle = await window.showSaveFilePicker({
        suggestedName: filename,
        ...(ext
          ? {
              types: [
                {
                  description: description ?? ext.toUpperCase(),
                  accept: { [mimeType]: [`.${ext}`] },
                },
              ],
            }
          : {}),
      });
      const writable = await handle.createWritable();
      await writable.write(content);
      await writable.close();
      return "saved";
    } catch (e) {
      const name = e instanceof DOMException ? e.name : "";
      // The user pressed Escape or Cancel. Not an error — say nothing.
      if (name === "AbortError") return "cancelled";
      // Activation was spent, or we're in a context where the API is blocked
      // (sandboxed iframe, insecure origin). Degrade instead of losing the file.
      if (name !== "NotAllowedError" && name !== "SecurityError") {
        logger.error("file-ops", `File picker failed for ${filename}`, String(e));
        return "failed";
      }
      logger.warn("file-ops", `File picker unavailable (${name}); falling back to download`);
    }
  }

  // 3. Blob download.
  return blobDownload(content, filename, mimeType);
}
