import { useProfileStore } from "@store/profile-store";
import { usePresetStore } from "@store/preset-store";
import { useTemplateStore } from "@store/template-store";
import { useHistoryStore } from "@store/history-store";
import { useSettingsStore } from "@store/settings-store";
import { appBackups } from "@utils/native";
import { logger } from "@utils/logger";
import { SECTIONS } from "./format";
import { collectBackup } from "./collect";

/**
 * Automatic backups in the desktop app's own folder
 * (`<app data>/backups/ytdescgen-backup-YYYYMMDD-HHmm.json`, newest ten kept
 * by the Rust side).
 *
 * One is written shortly after start and then after the library changes —
 * once things have been quiet for a while, and not more often than every ten
 * minutes — and only when the data differs from the last one written. The
 * draft rides along but doesn't trigger a backup on its own: it changes with
 * every keystroke.
 */

const AUTO_PREFIX = "ytdescgen-backup-";
const QUIET_MS = 30_000;
const MIN_INTERVAL_MS = 10 * 60_000;
const STARTUP_DELAY_MS = 5_000;

let lastHash: string | null = null;
let lastWriteAt = 0;

/** FNV-1a — enough to tell "same data as last time" apart. */
function hash(text: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16);
}

function stamp(now: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(
    now.getHours(),
  )}${pad(now.getMinutes())}`;
}

function isLibraryEmpty(): boolean {
  return (
    useProfileStore.getState().profiles.length === 0 &&
    usePresetStore.getState().presets.length === 0 &&
    useTemplateStore.getState().templates.length === 0 &&
    useHistoryStore.getState().entries.length === 0
  );
}

export type BackupReason = "auto" | "manual" | "before-restore";

/**
 * Write a backup of everything now. `auto` skips data identical to the last
 * backup; the others always write. Returns the file name, or null when
 * nothing was written.
 */
export async function writeAppBackup(reason: BackupReason): Promise<string | null> {
  const now = new Date();
  // An empty library is never backed up on its own: after the app's data is
  // lost, a run of empty backups would otherwise push the good ones out.
  if (reason === "auto" && isLibraryEmpty()) return null;
  const envelope = collectBackup(SECTIONS, now);
  const digest = hash(JSON.stringify(envelope.data));
  if (reason === "auto" && digest === lastHash) return null;
  const name = `${AUTO_PREFIX}${stamp(now)}${reason === "before-restore" ? "-before-restore" : ""}.json`;
  await appBackups.write(name, JSON.stringify(envelope, null, 2));
  lastHash = digest;
  lastWriteAt = now.getTime();
  return name;
}

/**
 * Pick up where the last session left off: the newest automatic backup's
 * data and time, so a restart with nothing changed writes nothing.
 */
async function seedFromNewestBackup(): Promise<void> {
  const newest = (await appBackups.list()).find((file) => file.name.startsWith(AUTO_PREFIX));
  if (!newest) return;
  const parsed = JSON.parse(await appBackups.read(newest.name)) as { data?: unknown };
  lastHash = hash(JSON.stringify(parsed.data));
  lastWriteAt = newest.modifiedMs;
}

/** Start watching the library. Returns a stop function. */
export function startAutoBackup(): () => void {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const ready = seedFromNewestBackup().catch(() => undefined);

  const run = () => {
    timer = undefined;
    ready
      .then(() => writeAppBackup("auto"))
      .catch((e: unknown) => logger.warn("backup", "Automatic backup failed", String(e)));
  };

  const schedule = (delay: number) => {
    if (timer) clearTimeout(timer);
    const wait = Math.max(delay, lastWriteAt + MIN_INTERVAL_MS - Date.now());
    timer = setTimeout(run, wait);
  };

  const onChange = () => schedule(QUIET_MS);
  const unsubscribe = [
    useProfileStore.subscribe(onChange),
    usePresetStore.subscribe(onChange),
    useTemplateStore.subscribe(onChange),
    useHistoryStore.subscribe(onChange),
    useSettingsStore.subscribe(onChange),
  ];
  // Not held back by the interval: skipped anyway when nothing changed.
  timer = setTimeout(run, STARTUP_DELAY_MS);

  return () => {
    if (timer) clearTimeout(timer);
    for (const stop of unsubscribe) stop();
  };
}
