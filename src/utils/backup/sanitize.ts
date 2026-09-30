import { VIDEO_TYPES } from "@config/video-types";
import { GENRES } from "@config/genres";
import {
  ART_STYLES,
  FRAMEGEN_MULTIPLIERS,
  FRAMEGEN_VENDORS,
  GRAPHICS_PRESETS,
  RT_MODES,
  UPSCALE_QUALITIES,
} from "@config/graphics-settings";
import { VIDEO_STYLE_ERAS } from "@config/video-styles";
import { GACHA_QUEST_TYPES } from "@config/gacha-quest-types";
import { PLAYTEST_PLATFORMS, PLAYTEST_MAX_INVITES_CAP } from "@config/playtest-platforms";
import { FIELD_LIMITS } from "@config/field-limits";
import { PRESET_FIELDS, PROFILE_FIELDS } from "@config/library-fields";
import {
  CONTENT_WARNINGS,
  DIFFICULTY_LEVELS,
  GAME_VERSION_OPTIONS,
  LANGUAGE_PATCH_OPTIONS,
  PLAYTHROUGH_STATUSES,
  TECH_NOTES,
} from "@engine/types";
import { SUPPORTED_LANGUAGES } from "@i18n/index";
import {
  EDITOR_DATA_KEYS,
  PATCH_FIELD_LIMITS,
  initialEditorData,
  migrateEditorState,
  normalizeEditorPatch,
  type EditorData,
} from "@store/editor-store";
import { migrateProfilesState, type Profile } from "@store/profile-store";
import { migratePresetsState, type GamePreset } from "@store/preset-store";
import { migrateTemplatesState, type EditorTemplate } from "@store/template-store";
import { migrateHistoryState, type HistoryEntry } from "@store/history-store";
import { healSettings, type SettingsData } from "@store/settings-heal";
import { generateId } from "@utils/uuid";
import type { RawSection } from "./detect";
import type { ListSection, Section } from "./format";

/**
 * Turn raw imported data into rows the stores can hold.
 *
 * Every section runs its store's own migration first (the same function the
 * store runs on its saved data), then goes through a whitelist: only known
 * fields, with the right types, known values for every choice, strings cut
 * to the editor's limits and ids that are safe and unique. Whatever a file
 * contains — hand-edited, damaged, or crafted — only that can reach a store.
 * A key like `__proto__`, or `set` (which once overwrote an editor action),
 * is never copied because nothing is copied by key except the whitelist.
 */

type Dict = Record<string, unknown>;

function isRecord(value: unknown): value is Dict {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

const ids = <T extends { id: string }>(list: readonly T[]) => list.map((item) => item.id);

/** Allowed values of every editor field that is a choice. */
const CHOICES: Partial<Record<keyof EditorData, readonly unknown[]>> = {
  videoType: ids(VIDEO_TYPES),
  language: ids(SUPPORTED_LANGUAGES),
  graphicsPreset: GRAPHICS_PRESETS,
  frameGenVendor: FRAMEGEN_VENDORS,
  frameGenMultiplier: FRAMEGEN_MULTIPLIERS,
  upscaleQuality: UPSCALE_QUALITIES,
  artStyle: ART_STYLES,
  videoStyleEra: VIDEO_STYLE_ERAS,
  gachaQuestType: GACHA_QUEST_TYPES,
  playthroughStatus: PLAYTHROUGH_STATUSES,
  difficulty: DIFFICULTY_LEVELS,
  languagePatch: LANGUAGE_PATCH_OPTIONS,
  gameVersion: GAME_VERSION_OPTIONS,
  playtestPlatform: ids(PLAYTEST_PLATFORMS),
};

/** Editor fields that are lists of choices. */
const CHOICE_LISTS: Partial<Record<keyof EditorData, readonly string[]>> = {
  genres: ids(GENRES),
  rayTracingModes: RT_MODES,
  contentWarnings: CONTENT_WARNINGS,
  techNotes: TECH_NOTES,
};

const STORE_LINK_TYPES = ["paid", "free", "demo"] as const;
/** Map keys are field / platform / language ids: short, plain ASCII. */
const MAP_KEY = /^[A-Za-z0-9][A-Za-z0-9_.:-]{0,63}$/;
const MAX_MAP_ENTRIES = 100;
const MAX_LIST_ITEMS = 100;
/** Items a section may import; well past what anyone saves by hand. */
const MAX_SECTION_ITEMS = 5000;
const SAFE_ID = /^[A-Za-z0-9_-]{1,64}$/;

function text(value: unknown, max: number): string | undefined {
  return typeof value === "string" ? value.slice(0, max) : undefined;
}

function stringMap(
  value: unknown,
  allowed?: readonly string[],
): Record<string, string> | undefined {
  if (!isRecord(value)) return undefined;
  const out: Record<string, string> = {};
  let count = 0;
  for (const [key, entry] of Object.entries(value)) {
    if (count >= MAX_MAP_ENTRIES) break;
    if (!MAP_KEY.test(key) || typeof entry !== "string") continue;
    if (allowed && !allowed.includes(entry)) continue;
    out[key] = entry.slice(0, FIELD_LIMITS.URL * 2);
    count++;
  }
  return out;
}

function choiceList(value: unknown, allowed: readonly string[]): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  return [...new Set(value.filter((v): v is string => allowed.includes(v as string)))].slice(
    0,
    MAX_LIST_ITEMS,
  );
}

function wholeNumber(value: unknown, min: number, max: number): number | undefined {
  return typeof value === "number" && Number.isInteger(value) && value >= min && value <= max
    ? value
    : undefined;
}

function endings(value: unknown): EditorData["endings"] | undefined {
  if (!Array.isArray(value)) return undefined;
  return value
    .filter(isRecord)
    .slice(0, MAX_LIST_ITEMS)
    .map((row) => ({
      number: wholeNumber(row.number, 0, 9999) ?? null,
      name: text(row.name, FIELD_LIMITS.SHORT_NAME * 2) ?? "",
    }));
}

function ranges(value: unknown): EditorData["endingVideoRanges"] | undefined {
  if (!Array.isArray(value)) return undefined;
  const out: EditorData["endingVideoRanges"] = [];
  for (const row of value.slice(0, MAX_LIST_ITEMS)) {
    if (!isRecord(row)) return undefined;
    const from = wholeNumber(row.from, 1, MAX_LIST_ITEMS);
    const to = wholeNumber(row.to, 1, MAX_LIST_ITEMS);
    if (from === undefined || to === undefined || to < from) return undefined;
    out.push({ from, to });
  }
  return out;
}

/** One editor field, checked against the type and values it can hold. */
function editorField(key: keyof EditorData, value: unknown): unknown {
  const choices = CHOICES[key];
  if (choices) return choices.includes(value) ? value : undefined;
  const list = CHOICE_LISTS[key];
  if (list) return choiceList(value, list);
  switch (key) {
    case "storeLinkTypes":
      return stringMap(value, STORE_LINK_TYPES);
    case "storeLinks":
    case "social":
    case "rig":
    case "gameNameLocalized":
      return stringMap(value);
    case "endings":
      return endings(value);
    case "endingVideoRanges":
      return ranges(value);
    case "anniversaryYear":
      return value === null ? null : wholeNumber(value, 1, 20);
    case "endingVideoCount":
    case "endingVideoIndex":
      return wholeNumber(value, 1, MAX_LIST_ITEMS);
    case "playtestInvites":
      return wholeNumber(value, 0, PLAYTEST_MAX_INVITES_CAP);
    default:
      break;
  }
  const initial = initialEditorData()[key];
  if (typeof initial === "boolean") return typeof value === "boolean" ? value : undefined;
  if (typeof initial === "string") {
    return text(value, PATCH_FIELD_LIMITS[key] ?? FIELD_LIMITS.LONG_TEXT);
  }
  return undefined;
}

/**
 * The valid editor fields of `raw`, limited to `keys`. Legacy values (free
 * text graphics presets, the old warning toggles, GPU strings…) are mapped
 * first, the same way applying a saved item maps them.
 */
export function sanitizeEditorFields(
  raw: unknown,
  keys: readonly (keyof EditorData)[] = EDITOR_DATA_KEYS,
): Partial<EditorData> {
  if (!isRecord(raw)) return {};
  const normalized = normalizeEditorPatch(raw as Partial<EditorData>) as Dict;
  const out: Dict = {};
  for (const key of keys) {
    if (!Object.prototype.hasOwnProperty.call(normalized, key)) continue;
    const value = editorField(key, normalized[key]);
    if (value !== undefined) out[key] = value;
  }
  return out as Partial<EditorData>;
}

function timestamp(value: unknown, fallback: string): string {
  return typeof value === "string" && !Number.isNaN(Date.parse(value)) ? value : fallback;
}

/** Keeps a safe, unused id; gives anything else a new one. */
class IdKeeper {
  private readonly seen = new Set<string>();

  take(value: unknown): string {
    const id =
      typeof value === "string" && SAFE_ID.test(value) && !this.seen.has(value)
        ? value
        : generateId();
    this.seen.add(id);
    return id;
  }
}

export function sanitizeProfile(raw: unknown, idKeeper: IdKeeper, now: string): Profile | null {
  if (!isRecord(raw)) return null;
  const fields = sanitizeEditorFields(raw, PROFILE_FIELDS);
  const blank = initialEditorData();
  const createdAt = timestamp(raw.createdAt, now);
  return {
    id: idKeeper.take(raw.id),
    name: text(raw.name, FIELD_LIMITS.SHORT_NAME)?.trim() || fields.channelName || "Profile",
    channelName: blank.channelName,
    contactEmail: blank.contactEmail,
    adEmail: blank.adEmail,
    gameKeyEmail: blank.gameKeyEmail,
    social: {},
    rig: {},
    resolution: blank.resolution,
    fps: blank.fps,
    graphicsPreset: blank.graphicsPreset,
    thirdPartyAdText: "",
    ...fields,
    createdAt,
    updatedAt: timestamp(raw.updatedAt, createdAt),
  };
}

export function sanitizePreset(raw: unknown, idKeeper: IdKeeper, now: string): GamePreset | null {
  if (!isRecord(raw)) return null;
  const fields = sanitizeEditorFields(raw, PRESET_FIELDS);
  const gameName = fields.gameName?.trim();
  if (!gameName) return null;
  const createdAt = timestamp(raw.createdAt, now);
  const preset: GamePreset = {
    id: idKeeper.take(raw.id),
    genres: [],
    platform: "",
    storeLinks: {},
    ...fields,
    gameName,
    createdAt,
    updatedAt: timestamp(raw.updatedAt, createdAt),
  };
  if (typeof raw.showGameCopyright === "boolean") preset.showGameCopyright = raw.showGameCopyright;
  return preset;
}

export function sanitizeTemplate(
  raw: unknown,
  idKeeper: IdKeeper,
  now: string,
): EditorTemplate | null {
  if (!isRecord(raw) || !isRecord(raw.snapshot)) return null;
  const createdAt = timestamp(raw.createdAt, now);
  return {
    id: idKeeper.take(raw.id),
    name: text(raw.name, FIELD_LIMITS.SHORT_NAME)?.trim() || "Untitled",
    createdAt,
    updatedAt: timestamp(raw.updatedAt, createdAt),
    snapshot: sanitizeEditorFields(raw.snapshot),
  };
}

export function sanitizeHistoryEntry(
  raw: unknown,
  idKeeper: IdKeeper,
  now: string,
): HistoryEntry | null {
  if (!isRecord(raw)) return null;
  const blank = initialEditorData();
  const title = text(raw.title, 1000);
  if (title === undefined) return null;
  const videoType = CHOICES.videoType?.includes(raw.videoType) ? raw.videoType : blank.videoType;
  const language = CHOICES.language?.includes(raw.language) ? raw.language : blank.language;
  return {
    id: idKeeper.take(raw.id),
    gameName: text(raw.gameName, FIELD_LIMITS.SHORT_NAME) ?? "",
    videoType: videoType as HistoryEntry["videoType"],
    language: language as HistoryEntry["language"],
    genres: (choiceList(raw.genres, CHOICE_LISTS.genres ?? []) ?? []) as HistoryEntry["genres"],
    title,
    description: text(raw.description, 20_000) ?? "",
    tags: text(raw.tags, 5000) ?? "",
    createdAt: timestamp(raw.createdAt, now),
  };
}

/**
 * Settings fields that describe this device and this person, not how their
 * descriptions look — never exported, never overwritten by an import.
 */
export const LOCAL_SETTINGS_KEYS = [
  "legalConsentVersion",
  "legalConsentAt",
  "editorAccordionState",
  "settingsAccordionState",
  "sidebarCollapsed",
  "lastProfileId",
  "lastPresetId",
] as const satisfies readonly (keyof SettingsData)[];

/** Settings as they go into a file: without the local fields. */
export function portableSettings(settings: SettingsData): Partial<SettingsData> {
  const local = new Set<string>(LOCAL_SETTINGS_KEYS);
  return Object.fromEntries(
    Object.entries(settings).filter(([key]) => !local.has(key)),
  ) as Partial<SettingsData>;
}

/** Imported settings, healed, with this device's local fields kept. */
export function sanitizeSettings(raw: unknown, current: SettingsData): SettingsData {
  const healed = healSettings(isRecord(raw) ? raw : {});
  const out = { ...healed };
  for (const key of LOCAL_SETTINGS_KEYS) {
    (out as Record<string, unknown>)[key] = current[key];
  }
  return out;
}

export interface SanitizedSections {
  profiles?: Profile[];
  presets?: GamePreset[];
  templates?: EditorTemplate[];
  history?: HistoryEntry[];
  settings?: SettingsData;
  draft?: EditorData;
  /** Rows that were dropped as unusable, per section. */
  dropped: Partial<Record<Section, number>>;
}

const MIGRATE: Record<ListSection, (state: unknown, version: number) => unknown> = {
  profiles: migrateProfilesState,
  presets: migratePresetsState,
  templates: migrateTemplatesState,
  history: migrateHistoryState,
};

const LIST_KEY: Record<ListSection, string> = {
  profiles: "profiles",
  presets: "presets",
  templates: "templates",
  history: "entries",
};

/**
 * Run a list section's store migration over copies of its rows. A row that
 * breaks the migration is dropped instead of failing the whole import.
 */
function migrateRows(section: ListSection, raw: RawSection): unknown[] {
  const rows = (raw.items ?? []).slice(0, MAX_SECTION_ITEMS);
  const migrateOne = (row: unknown): unknown[] => {
    const state = { [LIST_KEY[section]]: [structuredClone(row)] };
    const migrated = MIGRATE[section](state, raw.version) as Dict;
    const out = migrated[LIST_KEY[section]];
    return Array.isArray(out) ? out : [];
  };
  try {
    // One pass keeps the history migration's de-duplication across rows.
    const state = { [LIST_KEY[section]]: structuredClone(rows) };
    const migrated = MIGRATE[section](state, raw.version) as Dict;
    const out = migrated[LIST_KEY[section]];
    if (Array.isArray(out)) return out;
  } catch {
    // Fall back to row by row, below.
  }
  return rows.flatMap((row) => {
    try {
      return migrateOne(row);
    } catch {
      return [];
    }
  });
}

type RowSanitizer<T> = (raw: unknown, idKeeper: IdKeeper, now: string) => T | null;

function sanitizeRows<T>(rows: unknown[], clean: RowSanitizer<T>, now: string) {
  const idKeeper = new IdKeeper();
  const kept: T[] = [];
  for (const row of rows) {
    const item = clean(row, idKeeper, now);
    if (item) kept.push(item);
  }
  return { kept, dropped: rows.length - kept.length };
}

/** Migrate and clean every restorable section of a parsed file. */
export function sanitizeSections(
  sections: Partial<Record<Section, RawSection>>,
  currentSettings: SettingsData,
  now = new Date().toISOString(),
): SanitizedSections {
  const result: SanitizedSections = { dropped: {} };
  const list = <T>(section: ListSection, clean: RowSanitizer<T>): T[] | undefined => {
    const raw = sections[section];
    if (!raw || raw.tooNew) return undefined;
    const rows = migrateRows(section, raw);
    const { kept, dropped } = sanitizeRows(rows, clean, now);
    const skipped = dropped + ((raw.items?.length ?? 0) - rows.length);
    if (skipped > 0) result.dropped[section] = skipped;
    return kept;
  };
  result.profiles = list("profiles", sanitizeProfile);
  result.presets = list("presets", sanitizePreset);
  result.templates = list("templates", sanitizeTemplate);
  result.history = list("history", sanitizeHistoryEntry);

  const settings = sections.settings;
  if (settings && !settings.tooNew) {
    result.settings = sanitizeSettings(settings.value, currentSettings);
  }
  const draft = sections.draft;
  if (draft && !draft.tooNew && isRecord(draft.value)) {
    try {
      const migrated = migrateEditorState(structuredClone(draft.value), draft.version);
      result.draft = { ...initialEditorData(), ...sanitizeEditorFields(migrated) };
    } catch {
      result.dropped.draft = 1;
    }
  }
  return result;
}

export { IdKeeper };
