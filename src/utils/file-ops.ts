import { IS_TAURI } from "./platform";
import { HAS_NATIVE_DIALOGS, nativeOpenTextFile, nativeSaveTextFile } from "./native";
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
  /** Defaults to JSON — every caller but the plain-text exports writes JSON. */
  mimeType?: string;
  /** Human-readable file-type label shown in the picker's filter dropdown. */
  description?: string;
}

/** `.json` → `json`. Empty string when the name has no extension. */
function extensionOf(filename: string): string {
  const dot = filename.lastIndexOf(".");
  return dot > 0 ? filename.slice(dot + 1).toLowerCase() : "";
}

/**
 * Last-resort writer: an anchor with `download`. No dialog — the file lands
 * wherever the browser puts downloads. Used on Android (a picked location is
 * a content URI there, not a path) and in browsers without the File System
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
 *  1. **Tauri desktop** — the native Save dialog, opened and written from
 *     Rust (`export_text_file`): the path never passes through the webview.
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

  if (HAS_NATIVE_DIALOGS) {
    try {
      const saved = await nativeSaveTextFile({
        suggestedName: filename,
        content,
        filterName: description ?? ext.toUpperCase(),
        extensions: [ext || "txt"],
      });
      return saved === null ? "cancelled" : "saved";
    } catch (e) {
      logger.error("file-ops", `Native save failed for ${filename}`, String(e));
      return "failed";
    }
  }

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

  return blobDownload(content, filename, mimeType);
}

/** No export the app writes comes close; same ceiling as the Rust side. */
export const MAX_IMPORT_BYTES = 20 * 1024 * 1024;

export type OpenOutcome =
  | { kind: "picked"; name: string; text: string }
  | { kind: "cancelled" }
  | { kind: "failed"; reason: "too-large" | "wrong-type" | "unreadable"; message?: string };

export interface OpenTextFileOptions {
  /** Without dots, e.g. `["json"]`. */
  extensions: string[];
  /** Filter label for the native dialog. */
  description?: string;
}

/** Read a `File` from a file input or a drop, with the same checks as the dialog. */
export async function readTextFile(file: File, extensions: string[]): Promise<OpenOutcome> {
  if (!extensions.includes(extensionOf(file.name))) {
    return { kind: "failed", reason: "wrong-type", message: file.name };
  }
  if (file.size > MAX_IMPORT_BYTES) return { kind: "failed", reason: "too-large" };
  try {
    const text = await file.text();
    return { kind: "picked", name: file.name, text: text.replace(/^\uFEFF/, "") };
  } catch (e) {
    return { kind: "failed", reason: "unreadable", message: String(e) };
  }
}

/**
 * Let the user pick a text file and read it.
 *
 * Desktop uses the native Open dialog (run from Rust, which checks the type
 * and size). Elsewhere a hidden file input: its `cancel` event reports a
 * dismissed picker, so there is no guessing from window focus — before
 * v1.0.0 a 250 ms timer decided the user had cancelled, which dropped files
 * that took longer than that to arrive.
 */
export async function openTextFile({
  extensions,
  description,
}: OpenTextFileOptions): Promise<OpenOutcome> {
  if (HAS_NATIVE_DIALOGS) {
    try {
      const picked = await nativeOpenTextFile({
        filterName: description ?? extensions[0]?.toUpperCase() ?? "",
        extensions,
      });
      return picked ? { kind: "picked", ...picked } : { kind: "cancelled" };
    } catch (e) {
      const message = String(e);
      return {
        kind: "failed",
        reason: message.includes("too large")
          ? "too-large"
          : message.includes("unsupported file type")
            ? "wrong-type"
            : "unreadable",
        message,
      };
    }
  }

  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = extensions.map((ext) => `.${ext}`).join(",");
    input.addEventListener("cancel", () => resolve({ kind: "cancelled" }), { once: true });
    input.addEventListener(
      "change",
      () => {
        const file = input.files?.[0];
        if (!file) resolve({ kind: "cancelled" });
        else void readTextFile(file, extensions).then(resolve);
      },
      { once: true },
    );
    input.click();
  });
}
