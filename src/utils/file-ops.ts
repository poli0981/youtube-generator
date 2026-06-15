import { IS_TAURI, IS_MOBILE } from "./platform";

export async function saveFile(content: string, filename: string): Promise<void> {
  // On Android `IS_TAURI` is true, but the native save dialog + std::fs path
  // write doesn't work under scoped storage — fall through to the blob
  // download (lands in Downloads). Desktop keeps the native "Save As" dialog.
  if (IS_TAURI && !IS_MOBILE) {
    const { save } = await import("@tauri-apps/plugin-dialog");
    const { invoke } = await import("@tauri-apps/api/core");
    const path = await save({ defaultPath: filename });
    if (path) await invoke("save_to_file", { path, content });
  } else {
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
}
