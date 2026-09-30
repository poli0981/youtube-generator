import { useProfileStore, type Profile } from "@store/profile-store";
import { usePresetStore, type GamePreset } from "@store/preset-store";
import { useTemplateStore, type EditorTemplate } from "@store/template-store";
import {
  dedupeHistory,
  historyKey,
  useHistoryStore,
  type HistoryEntry,
} from "@store/history-store";
import { extractData, useSettingsStore } from "@store/settings-store";
import { editorDataOf, useEditorStore, type EditorData } from "@store/editor-store";
import type { SettingsData } from "@store/settings-heal";
import { generateId } from "@utils/uuid";
import { PLATFORMS } from "@config/platforms";
import type { ParsedFile } from "./detect";
import { SECTIONS, isListSection, type ListSection, type Section } from "./format";
import { sanitizeSections } from "./sanitize";

/**
 * Plan a restore (what is new, what is already here, what differs) and apply
 * the user's choice in one step, with an undo.
 */

export type RowStatus = "new" | "same" | "changed";

export interface PlanRow<T> {
  /** Unique within the section: the incoming item's id. */
  key: string;
  label: string;
  detail?: string;
  status: RowStatus;
  incoming: T;
  /** The item already here that this one matches. */
  existing?: T;
  /** The incoming copy was changed more recently than the one here. */
  incomingNewer: boolean;
}

export interface ListPlan<T> {
  rows: PlanRow<T>[];
  /** Damaged rows skipped while reading the file. */
  dropped: number;
}

export interface ValuePlan<T> {
  incoming: T;
  status: "same" | "changed";
}

export interface RestorePlan {
  profiles?: ListPlan<Profile>;
  presets?: ListPlan<GamePreset>;
  templates?: ListPlan<EditorTemplate>;
  history?: ListPlan<HistoryEntry>;
  settings?: ValuePlan<SettingsData>;
  draft?: ValuePlan<EditorData>;
  /** Sections the file has but this build is too old to read. */
  tooNew: Section[];
}

export interface CurrentData {
  profiles: Profile[];
  presets: GamePreset[];
  templates: EditorTemplate[];
  history: HistoryEntry[];
  settings: SettingsData;
  draft: EditorData;
}

export function readCurrentData(): CurrentData {
  return {
    profiles: useProfileStore.getState().profiles,
    presets: usePresetStore.getState().presets,
    templates: useTemplateStore.getState().templates,
    history: useHistoryStore.getState().entries,
    settings: extractData(useSettingsStore.getState()),
    draft: editorDataOf(useEditorStore.getState()),
  };
}

/** JSON with sorted keys, so equal data compares equal whatever its key order. */
function stable(value: unknown): string {
  return JSON.stringify(value, (_key, v: unknown) =>
    v && typeof v === "object" && !Array.isArray(v)
      ? Object.fromEntries(
          Object.entries(v as Record<string, unknown>).sort(([a], [b]) => (a < b ? -1 : 1)),
        )
      : v,
  );
}

const BOOKKEEPING = new Set(["id", "createdAt", "updatedAt"]);

/** The part of an item that matters when comparing: no id, no timestamps. */
function content(item: object): string {
  return stable(Object.fromEntries(Object.entries(item).filter(([key]) => !BOOKKEEPING.has(key))));
}

function changedAt(item: { createdAt: string; updatedAt?: string }): number {
  return Date.parse(item.updatedAt ?? item.createdAt) || 0;
}

interface Describe<T> {
  label: (item: T) => string;
  detail?: (item: T) => string | undefined;
  /** Another way to find the same item when ids differ (history: same video). */
  sameThing?: (a: T, b: T) => boolean;
}

function planList<T extends { id: string; createdAt: string; updatedAt?: string }>(
  incoming: T[],
  existing: readonly T[],
  describe: Describe<T>,
  dropped: number,
): ListPlan<T> {
  const byId = new Map(existing.map((item) => [item.id, item]));
  const byContent = new Map(existing.map((item) => [content(item), item]));
  const rows = incoming.map((item): PlanRow<T> => {
    const match =
      byId.get(item.id) ??
      byContent.get(content(item)) ??
      (describe.sameThing ? existing.find((e) => describe.sameThing?.(item, e)) : undefined);
    const status: RowStatus = !match
      ? "new"
      : content(match) === content(item)
        ? "same"
        : "changed";
    return {
      key: item.id,
      label: describe.label(item),
      detail: describe.detail?.(item),
      status,
      incoming: item,
      existing: match,
      incomingNewer: !!match && changedAt(item) > changedAt(match),
    };
  });
  return { rows, dropped };
}

export function planRestore(
  file: ParsedFile,
  current: CurrentData,
  now = new Date().toISOString(),
): RestorePlan {
  const clean = sanitizeSections(file.sections, current.settings, now);
  const plan: RestorePlan = {
    tooNew: SECTIONS.filter((section) => file.sections[section]?.tooNew),
  };
  const dropped = (section: Section) => clean.dropped[section] ?? 0;
  if (clean.profiles) {
    plan.profiles = planList(
      clean.profiles,
      current.profiles,
      { label: (p) => p.name, detail: (p) => p.channelName || undefined },
      dropped("profiles"),
    );
  }
  if (clean.presets) {
    plan.presets = planList(
      clean.presets,
      current.presets,
      {
        label: (p) => p.gameName,
        detail: (p) =>
          PLATFORMS.find((x) => x.id === p.platform)?.label ?? (p.platform || undefined),
      },
      dropped("presets"),
    );
  }
  if (clean.templates) {
    plan.templates = planList(
      clean.templates,
      current.templates,
      { label: (t) => t.name, detail: (t) => t.snapshot.gameName || undefined },
      dropped("templates"),
    );
  }
  if (clean.history) {
    plan.history = planList(
      clean.history,
      current.history,
      {
        label: (e) => e.title,
        detail: (e) => e.gameName || undefined,
        sameThing: (a, b) => historyKey(a) === historyKey(b),
      },
      dropped("history"),
    );
  }
  if (clean.settings) {
    plan.settings = {
      incoming: clean.settings,
      status: stable(clean.settings) === stable(current.settings) ? "same" : "changed",
    };
  }
  if (clean.draft) {
    plan.draft = {
      incoming: clean.draft,
      status: stable(clean.draft) === stable(current.draft) ? "same" : "changed",
    };
  }
  return plan;
}

/**
 * Sections the plan can restore, in display order. A list the file has but
 * that is empty is left out: all it could do is empty yours on a Replace.
 */
export function planSections(plan: RestorePlan): Section[] {
  return SECTIONS.filter((section) => {
    const part = plan[section];
    if (!part) return false;
    return "rows" in part ? part.rows.length > 0 || part.dropped > 0 : true;
  });
}

export type RestoreMode = "merge" | "replace";
/** When an item is in both places but differs (merge only). */
export type ConflictChoice = "newer" | "both";

export interface RestoreChoice {
  mode: RestoreMode;
  conflict: ConflictChoice;
  /** Sections to restore. */
  sections: ReadonlySet<Section>;
  /** Selected row keys of each list section. */
  rows: Partial<Record<ListSection, ReadonlySet<string>>>;
}

/** Rows that start selected: everything that would change something. */
export function defaultRows(plan: RestorePlan, mode: RestoreMode): RestoreChoice["rows"] {
  const rows: RestoreChoice["rows"] = {};
  for (const section of planSections(plan)) {
    if (!isListSection(section)) continue;
    const list = plan[section] as ListPlan<{ id: string }>;
    rows[section] = new Set(
      list.rows.filter((row) => mode === "replace" || row.status !== "same").map((r) => r.key),
    );
  }
  return rows;
}

export interface RestoreCounts {
  added: number;
  updated: number;
  removed: number;
}

/** A name not taken yet: "Main", then "Main (2)", "Main (3)"… */
function freeName(name: string, taken: Set<string>): string {
  if (!taken.has(name)) return name;
  for (let n = 2; ; n++) {
    const candidate = `${name} (${n})`;
    if (!taken.has(candidate)) return candidate;
  }
}

function mergeList<T extends { id: string }>(
  existing: readonly T[],
  list: ListPlan<T>,
  selected: ReadonlySet<string>,
  choice: RestoreChoice,
  rename: ((item: T, taken: Set<string>) => T) | null,
  names: (item: T) => string,
): { items: T[]; counts: RestoreCounts } {
  const counts: RestoreCounts = { added: 0, updated: 0, removed: 0 };
  const chosen = list.rows.filter((row) => selected.has(row.key));

  if (choice.mode === "replace") {
    const keep = new Set(chosen.map((row) => row.existing?.id).filter(Boolean));
    counts.removed = existing.filter((item) => !keep.has(item.id)).length;
    counts.added = chosen.filter((row) => row.status === "new").length;
    counts.updated = chosen.filter((row) => row.status === "changed").length;
    // A matched item keeps the id it has here, so nothing pointing at it breaks.
    const ids = new Set<string>();
    const items = chosen.map((row) => {
      const id = row.existing?.id ?? row.incoming.id;
      const unique = ids.has(id) ? generateId() : id;
      ids.add(unique);
      return { ...row.incoming, id: unique };
    });
    return { items, counts };
  }

  const items = [...existing];
  const ids = new Set(items.map((item) => item.id));
  const taken = new Set(items.map(names));
  for (const row of chosen) {
    if (row.status === "same") continue;
    if (row.status === "new") {
      const item = ids.has(row.incoming.id) ? { ...row.incoming, id: generateId() } : row.incoming;
      items.push(item);
      ids.add(item.id);
      taken.add(names(item));
      counts.added++;
      continue;
    }
    const match = row.existing;
    if (!match) continue;
    if (choice.conflict === "newer" || !rename) {
      if (!row.incomingNewer) continue;
      const index = items.findIndex((item) => item.id === match.id);
      if (index === -1) continue;
      items[index] = { ...row.incoming, id: match.id };
      counts.updated++;
    } else {
      const copy = rename({ ...row.incoming, id: generateId() }, taken);
      items.push(copy);
      ids.add(copy.id);
      taken.add(names(copy));
      counts.added++;
    }
  }
  return { items, counts };
}

export interface RestoreResult {
  counts: RestoreCounts;
  /** Sections that changed. */
  changed: Section[];
  undo: () => void;
}

/**
 * Apply a restore to every store in one synchronous step (nothing renders in
 * between), and return an undo that puts all of them back.
 */
export function applyRestore(plan: RestorePlan, choice: RestoreChoice): RestoreResult {
  const before = readCurrentData();
  const total: RestoreCounts = { added: 0, updated: 0, removed: 0 };
  const changed: Section[] = [];
  const add = (section: Section, counts: RestoreCounts) => {
    total.added += counts.added;
    total.updated += counts.updated;
    total.removed += counts.removed;
    if (counts.added + counts.updated + counts.removed > 0) changed.push(section);
  };
  const include = (section: Section) => choice.sections.has(section) && !!plan[section];
  const selected = (section: ListSection) => choice.rows[section] ?? new Set<string>();

  if (include("profiles") && plan.profiles) {
    const { items, counts } = mergeList(
      before.profiles,
      plan.profiles,
      selected("profiles"),
      choice,
      (p, taken) => ({ ...p, name: freeName(p.name, taken) }),
      (p) => p.name,
    );
    useProfileStore.setState({ profiles: items });
    add("profiles", counts);
  }
  if (include("presets") && plan.presets) {
    const { items, counts } = mergeList(
      before.presets,
      plan.presets,
      selected("presets"),
      choice,
      (p) => p,
      (p) => p.id,
    );
    usePresetStore.setState({ presets: items });
    add("presets", counts);
  }
  if (include("templates") && plan.templates) {
    const { items, counts } = mergeList(
      before.templates,
      plan.templates,
      selected("templates"),
      choice,
      (t, taken) => ({ ...t, name: freeName(t.name, taken) }),
      (t) => t.name,
    );
    useTemplateStore.setState({ templates: items });
    add("templates", counts);
  }
  if (include("history") && plan.history) {
    // History has no "keep both": one entry per video.
    const { items, counts } = mergeList(
      before.history,
      plan.history,
      selected("history"),
      { ...choice, conflict: "newer" },
      null,
      (e) => e.id,
    );
    const limit =
      (include("settings") && plan.settings?.incoming.historyLimit) || before.settings.historyLimit;
    const sorted = [...items].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
    useHistoryStore.setState({ entries: dedupeHistory(sorted).slice(0, limit) });
    add("history", counts);
  }
  if (include("settings") && plan.settings && plan.settings.status === "changed") {
    useSettingsStore.setState(plan.settings.incoming);
    useSettingsStore.getState().setTheme(plan.settings.incoming.theme);
    add("settings", { added: 0, updated: 1, removed: 0 });
  }
  if (include("draft") && plan.draft && plan.draft.status === "changed") {
    useEditorStore.setState(plan.draft.incoming);
    add("draft", { added: 0, updated: 1, removed: 0 });
  }

  // Only what this restore changed goes back, so an edit made after it survives.
  const undo = () => {
    const touched = new Set(changed);
    if (touched.has("profiles")) useProfileStore.setState({ profiles: before.profiles });
    if (touched.has("presets")) usePresetStore.setState({ presets: before.presets });
    if (touched.has("templates")) useTemplateStore.setState({ templates: before.templates });
    if (touched.has("history")) useHistoryStore.setState({ entries: before.history });
    if (touched.has("settings")) {
      useSettingsStore.setState(before.settings);
      useSettingsStore.getState().setTheme(before.settings.theme);
    }
    if (touched.has("draft")) useEditorStore.setState(before.draft);
  };

  return { counts: total, changed, undo };
}
