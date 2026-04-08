import { IS_TAURI } from "./platform";

const SETTINGS_FILENAME = "settings.json";

async function getSettingsPath(): Promise<string> {
  const { appDataDir } = await import("@tauri-apps/api/path");
  const dir = await appDataDir();
  return `${dir}${SETTINGS_FILENAME}`;
}

export async function loadSettings<T>(key: string, fallback: T): Promise<T> {
  if (IS_TAURI) {
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      const path = await getSettingsPath();
      const raw: string = await invoke("read_from_file", { path });
      const allSettings = JSON.parse(raw) as Record<string, unknown>;
      if (key in allSettings) return allSettings[key] as T;
    } catch {
      // File doesn't exist yet or read error
    }
  }

  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw) as T;
  } catch {
    // Parse error
  }

  return fallback;
}

/**
 * Check if the Tauri data file exists and is valid JSON.
 * If missing or corrupt, recreate it from localStorage data.
 * Returns a status message or null if not in Tauri / all good.
 */
export async function checkDataFileHealth(): Promise<string | null> {
  if (!IS_TAURI) return null;

  try {
    const { invoke } = await import("@tauri-apps/api/core");
    const path = await getSettingsPath();

    try {
      const raw: string = await invoke("read_from_file", { path });
      JSON.parse(raw);
      return null; // File exists and is valid
    } catch {
      // File missing or corrupt — rebuild from localStorage
      const rebuilt: Record<string, unknown> = {};
      const keys = [
        "ytdescgen-settings",
        "ytdescgen-profiles",
        "ytdescgen-presets",
        "ytdescgen-history",
        "ytdescgen-editor-draft",
      ];
      for (const key of keys) {
        try {
          const raw = localStorage.getItem(key);
          if (raw) rebuilt[key] = JSON.parse(raw);
        } catch {
          // Skip corrupt entries
        }
      }
      await invoke("save_to_file", {
        path,
        content: JSON.stringify(rebuilt, null, 2),
      });
      return "Data file was missing or corrupt. Restored from local cache.";
    }
  } catch {
    return null;
  }
}

export async function saveSettings<T>(key: string, value: T): Promise<void> {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or disabled
  }

  if (IS_TAURI) {
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      const path = await getSettingsPath();

      let allSettings: Record<string, unknown> = {};
      try {
        const raw: string = await invoke("read_from_file", { path });
        allSettings = JSON.parse(raw) as Record<string, unknown>;
      } catch {
        // File doesn't exist yet
      }

      allSettings[key] = value;
      await invoke("save_to_file", {
        path,
        content: JSON.stringify(allSettings, null, 2),
      });
    } catch {
      // Write error — localStorage is the fallback
    }
  }
}
