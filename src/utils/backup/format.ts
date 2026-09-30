import { ABOUT } from "@config/about";
import { PROFILE_STORE_VERSION } from "@store/profile-store";
import { PRESET_STORE_VERSION } from "@store/preset-store";
import { TEMPLATE_STORE_VERSION } from "@store/template-store";
import { HISTORY_STORE_VERSION } from "@store/history-store";
import { SETTINGS_STORE_VERSION } from "@store/settings-store";
import { EDITOR_STORE_VERSION } from "@store/editor-store";

/**
 * The file format every export has used since v1.0.0 (`_format: 2`).
 *
 * ```json
 * { "_app": "ytdescgen", "_format": 2, "_type": "backup", "_schemaVersion": 1,
 *   "_appVersion": "1.0.0", "_exportedAt": "2026-09-30T14:00:00.000Z",
 *   "data": { "profiles": { "version": 3, "items": [...] },
 *             "settings": { "version": 12, "value": {...} } } }
 * ```
 *
 * A single-section export (`_type: "profiles"`, …) carries the section's
 * store version in `_schemaVersion` and its items (or value) as `data`. The
 * store version is what lets an import run exactly the migrations a file
 * still needs — the same steps the store runs on its own saved data.
 */

export const APP_MARKER = "ytdescgen";
export const FILE_FORMAT = 2;
/** Version of the `backup` container itself, not of the data inside. */
export const BACKUP_CONTAINER_VERSION = 1;

/** Library data a backup can hold, in display order. */
export const SECTIONS = [
  "profiles",
  "presets",
  "templates",
  "history",
  "settings",
  "draft",
] as const;
export type Section = (typeof SECTIONS)[number];

/** Sections that hold a list of items; the others hold one value. */
export type ListSection = "profiles" | "presets" | "templates" | "history";
export const LIST_SECTIONS: readonly ListSection[] = [
  "profiles",
  "presets",
  "templates",
  "history",
];

export function isListSection(section: Section): section is ListSection {
  return (LIST_SECTIONS as readonly string[]).includes(section);
}

/** Everything a v2 file's `_type` can say. Logs and captions are exports, not restorable data. */
export type FileType = "backup" | Exclude<Section, "draft"> | "logs" | "social";

/** The current store version of each section — what this build writes. */
export const SECTION_VERSIONS: Record<Section, number> = {
  profiles: PROFILE_STORE_VERSION,
  presets: PRESET_STORE_VERSION,
  templates: TEMPLATE_STORE_VERSION,
  history: HISTORY_STORE_VERSION,
  settings: SETTINGS_STORE_VERSION,
  draft: EDITOR_STORE_VERSION,
};

export interface Envelope<T = unknown> {
  _app: typeof APP_MARKER;
  _format: typeof FILE_FORMAT;
  _type: FileType;
  _schemaVersion: number;
  _appVersion: string;
  _exportedAt: string;
  data: T;
}

export interface SectionPayload {
  version: number;
  items?: unknown[];
  value?: unknown;
}

export type BackupData = Partial<Record<Section, SectionPayload>>;

export function makeEnvelope<T>(
  type: FileType,
  schemaVersion: number,
  data: T,
  now = new Date(),
): Envelope<T> {
  return {
    _app: APP_MARKER,
    _format: FILE_FORMAT,
    _type: type,
    _schemaVersion: schemaVersion,
    _appVersion: ABOUT.version,
    _exportedAt: now.toISOString(),
    data,
  };
}

/** `ytdescgen-profiles-2026-09-30.json` — the local date, so files sort by day. */
export function datedFileName(kind: string, extension: string, now = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `ytdescgen-${kind}-${y}-${m}-${d}.${extension}`;
}
