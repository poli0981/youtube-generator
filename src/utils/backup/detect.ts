import {
  APP_MARKER,
  BACKUP_CONTAINER_VERSION,
  FILE_FORMAT,
  SECTIONS,
  SECTION_VERSIONS,
  isListSection,
  type Section,
  type SectionPayload,
} from "./format";

/**
 * Recognise every file a version of YTDescGen has written and turn it into
 * one shape: raw sections, each with the store version its data is in.
 *
 * | File                                   | Written by           |
 * |----------------------------------------|----------------------|
 * | `_format: 2` backup / section export   | v1.0.0+              |
 * | `{ _app, _type: "profile", … }`        | v0.15 – v0.38        |
 * | bare array of profiles / presets / …   | before v0.15         |
 * | `{ "ytdescgen-settings": …, … }`       | the desktop app's old data file, and the old Settings export |
 * | bare settings object                   | hand-made / pre-v0.18 |
 *
 * Nothing is checked or migrated here — see `sanitize.ts` — this only finds
 * the data and the version it is in. A version that isn't known (a bare
 * array, the old data file) is 0: every migration step is idempotent, so
 * running all of them on data that didn't need them changes nothing.
 */

export interface RawSection extends SectionPayload {
  /** Saved by a newer build than this one — shown, but not restorable. */
  tooNew: boolean;
}

export interface ParsedFile {
  kind: "data";
  /** `_type` of a v2 file, or what an older file turned out to hold. */
  label: "backup" | "section" | "legacy";
  appVersion?: string;
  exportedAt?: string;
  sections: Partial<Record<Section, RawSection>>;
}

export interface OtherFile {
  kind: "logs" | "social";
  data: unknown;
}

export type DetectError = "empty" | "not-json" | "unknown" | "newer";

export type DetectResult =
  { ok: true; file: ParsedFile | OtherFile } | { ok: false; error: DetectError };

/** localStorage key of each store — also the keys of the old desktop data file. */
export const STORE_KEYS: Record<Section, string> = {
  profiles: "ytdescgen-profiles",
  presets: "ytdescgen-presets",
  templates: "ytdescgen-templates",
  history: "ytdescgen-history",
  settings: "ytdescgen-settings",
  draft: "ytdescgen-editor-draft",
};

/** The field that holds a list section's items in its store's saved state. */
const LIST_KEYS = {
  profiles: "profiles",
  presets: "presets",
  templates: "templates",
  history: "entries",
} as const;

const V1_TYPES: Record<string, Section | "logs-or-history" | "social"> = {
  profile: "profiles",
  preset: "presets",
  template: "templates",
  settings: "settings",
  history: "logs-or-history",
  social: "social",
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function section(section: Section, version: number, data: unknown): RawSection | null {
  const tooNew = version > SECTION_VERSIONS[section];
  if (isListSection(section)) {
    return Array.isArray(data) ? { version, items: data, tooNew } : null;
  }
  return isRecord(data) ? { version, value: data, tooNew } : null;
}

function versionOf(value: unknown): number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0 ? value : 0;
}

/** Log exports were labelled "history" before v1.0.0; their rows say otherwise. */
function looksLikeLogs(rows: unknown[]): boolean {
  const sample = rows.find(isRecord);
  return (
    !!sample &&
    typeof sample.level === "string" &&
    typeof sample.message === "string" &&
    typeof sample.source === "string"
  );
}

function fromV2(file: Record<string, unknown>): DetectResult {
  const type = file._type;
  const version = versionOf(file._schemaVersion);
  const meta = {
    appVersion: typeof file._appVersion === "string" ? file._appVersion : undefined,
    exportedAt: typeof file._exportedAt === "string" ? file._exportedAt : undefined,
  };
  if (type === "logs" || type === "social") {
    return { ok: true, file: { kind: type, data: file.data } };
  }
  if (type === "backup") {
    if (version > BACKUP_CONTAINER_VERSION) return { ok: false, error: "newer" };
    if (!isRecord(file.data)) return { ok: false, error: "unknown" };
    const sections: ParsedFile["sections"] = {};
    for (const name of SECTIONS) {
      const payload = file.data[name];
      if (!isRecord(payload)) continue;
      const found = section(
        name,
        versionOf(payload.version),
        isListSection(name) ? payload.items : payload.value,
      );
      if (found) sections[name] = found;
    }
    return { ok: true, file: { kind: "data", label: "backup", ...meta, sections } };
  }
  if (typeof type === "string" && (SECTIONS as readonly string[]).includes(type)) {
    const found = section(type as Section, version, file.data);
    if (!found) return { ok: false, error: "unknown" };
    return {
      ok: true,
      file: { kind: "data", label: "section", ...meta, sections: { [type]: found } },
    };
  }
  return { ok: false, error: "unknown" };
}

function fromV1(file: Record<string, unknown>): DetectResult {
  const target = typeof file._type === "string" ? V1_TYPES[file._type] : undefined;
  const version = versionOf(file._schemaVersion);
  const meta = {
    appVersion: typeof file._appVersion === "string" ? file._appVersion : undefined,
    exportedAt: typeof file._exportedAt === "string" ? file._exportedAt : undefined,
  };
  if (!target) return { ok: false, error: "unknown" };
  if (target === "social") return { ok: true, file: { kind: "social", data: file.data } };
  let name: Section;
  if (target === "logs-or-history") {
    if (Array.isArray(file.data) && looksLikeLogs(file.data)) {
      return { ok: true, file: { kind: "logs", data: file.data } };
    }
    name = "history";
  } else {
    name = target;
  }
  const found = section(name, version, file.data);
  if (!found) return { ok: false, error: "unknown" };
  return {
    ok: true,
    file: { kind: "data", label: "section", ...meta, sections: { [name]: found } },
  };
}

/**
 * The old desktop data file (and the pre-v0.18 Settings export, which dumped
 * it): one key per store, each holding either the store's saved state
 * `{ state, version }` or just its data (`{ profiles: [...] }`).
 */
function fromStoreDump(file: Record<string, unknown>): DetectResult {
  const sections: ParsedFile["sections"] = {};
  for (const name of SECTIONS) {
    let value = file[STORE_KEYS[name]];
    let version = 0;
    if (isRecord(value) && isRecord(value.state) && typeof value.version === "number") {
      version = versionOf(value.version);
      value = value.state;
    }
    if (!isRecord(value)) continue;
    const data = isListSection(name) ? value[LIST_KEYS[name]] : value;
    const found = section(name, version, data);
    if (found) sections[name] = found;
  }
  if (Object.keys(sections).length === 0) return { ok: false, error: "unknown" };
  return { ok: true, file: { kind: "data", label: "legacy", sections } };
}

/** Pre-v0.15 exports: a bare array. Guess what it holds from its first row. */
function guessArraySection(rows: unknown[]): Section | "logs" | null {
  const sample = rows.find(isRecord);
  if (!sample) return null;
  if (isRecord(sample.snapshot)) return "templates";
  if (typeof sample.channelName === "string" || (isRecord(sample.social) && isRecord(sample.rig))) {
    return "profiles";
  }
  if (typeof sample.gameName === "string" && isRecord(sample.storeLinks)) return "presets";
  if (looksLikeLogs(rows)) return "logs";
  if (
    typeof sample.createdAt === "string" &&
    (typeof sample.title === "string" || typeof sample.tags === "string")
  ) {
    return "history";
  }
  return null;
}

export function detectFile(parsed: unknown): DetectResult {
  if (Array.isArray(parsed)) {
    const name = guessArraySection(parsed);
    if (name === "logs") return { ok: true, file: { kind: "logs", data: parsed } };
    const found = name ? section(name, 0, parsed) : null;
    if (!name || !found) return { ok: false, error: "unknown" };
    return { ok: true, file: { kind: "data", label: "legacy", sections: { [name]: found } } };
  }
  if (!isRecord(parsed)) return { ok: false, error: "unknown" };

  if (parsed._app === APP_MARKER) {
    const format = parsed._format;
    if (typeof format === "number" && format > FILE_FORMAT) return { ok: false, error: "newer" };
    return format === FILE_FORMAT ? fromV2(parsed) : fromV1(parsed);
  }
  if (SECTIONS.some((name) => STORE_KEYS[name] in parsed)) return fromStoreDump(parsed);
  if ("appLanguage" in parsed || "theme" in parsed) {
    const found = section("settings", 0, parsed);
    if (found) {
      return { ok: true, file: { kind: "data", label: "legacy", sections: { settings: found } } };
    }
  }
  return { ok: false, error: "unknown" };
}

/** Parse file text (JSON) and detect what it holds. */
export function readBackupText(text: string): DetectResult {
  if (!text.trim()) return { ok: false, error: "empty" };
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, error: "not-json" };
  }
  return detectFile(parsed);
}
