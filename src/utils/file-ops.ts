import { IS_TAURI } from "./platform";

export async function saveFile(content: string, filename: string): Promise<void> {
  if (IS_TAURI) {
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

export async function loadFile(): Promise<string | null> {
  if (IS_TAURI) {
    const { open } = await import("@tauri-apps/plugin-dialog");
    const { invoke } = await import("@tauri-apps/api/core");
    const path = await open({
      filters: [{ name: "JSON", extensions: ["json"] }],
    });
    if (typeof path === "string") {
      return invoke<string>("read_from_file", { path });
    }
    return null;
  } else {
    return new Promise((resolve) => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = ".json";
      input.onchange = async () => {
        const file = input.files?.[0];
        if (file) resolve(await file.text());
        else resolve(null);
      };
      input.click();
    });
  }
}
