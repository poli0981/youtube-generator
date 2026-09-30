import { useProfileStore } from "@store/profile-store";
import { usePresetStore } from "@store/preset-store";
import { useTemplateStore } from "@store/template-store";
import { useHistoryStore, type HistoryEntry } from "@store/history-store";
import { extractData, useSettingsStore } from "@store/settings-store";
import { editorDataOf, useEditorStore } from "@store/editor-store";
import {
  BACKUP_CONTAINER_VERSION,
  SECTION_VERSIONS,
  makeEnvelope,
  type BackupData,
  type Envelope,
  type Section,
} from "./format";
import { portableSettings } from "./sanitize";

/** What each section holds right now, as it goes into a file. */
function sectionData(section: Section): unknown {
  switch (section) {
    case "profiles":
      return useProfileStore.getState().profiles;
    case "presets":
      return usePresetStore.getState().presets;
    case "templates":
      return useTemplateStore.getState().templates;
    case "history":
      return useHistoryStore.getState().entries;
    case "settings":
      return portableSettings(extractData(useSettingsStore.getState()));
    case "draft":
      return editorDataOf(useEditorStore.getState());
  }
}

/** How many items a section holds (settings and the draft count as one). */
export function sectionSize(section: Section): number {
  const data = sectionData(section);
  return Array.isArray(data) ? data.length : 1;
}

/** A `backup` file with the chosen sections. */
export function collectBackup(
  sections: readonly Section[],
  now = new Date(),
): Envelope<BackupData> {
  const data: BackupData = {};
  for (const section of sections) {
    const value = sectionData(section);
    data[section] = Array.isArray(value)
      ? { version: SECTION_VERSIONS[section], items: value }
      : { version: SECTION_VERSIONS[section], value };
  }
  return makeEnvelope("backup", BACKUP_CONTAINER_VERSION, data, now);
}

/** A single-section file (`_type: "profiles"`, …), as the library tabs export. */
export function collectSection(section: Exclude<Section, "draft">): Envelope {
  return makeEnvelope(section, SECTION_VERSIONS[section], sectionData(section));
}

/** RFC 4180 cell; `'`-prefixed when a spreadsheet would read it as a formula. */
function csvCell(value: string): string {
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return `"${safe.replace(/"/g, '""')}"`;
}

/**
 * History as CSV, one video per row. Starts with a byte-order mark so Excel
 * reads Vietnamese, Japanese… as UTF-8 instead of guessing a code page.
 */
export function historyToCsv(entries: readonly HistoryEntry[]): string {
  const header = [
    "created_at",
    "game",
    "video_type",
    "language",
    "genres",
    "title",
    "description",
    "tags",
  ];
  const rows = entries.map((e) =>
    [
      e.createdAt,
      e.gameName,
      e.videoType,
      e.language,
      e.genres.join(", "),
      e.title,
      e.description,
      e.tags,
    ].map(csvCell),
  );
  return `\uFEFF${[header.map(csvCell), ...rows].map((row) => row.join(",")).join("\r\n")}\r\n`;
}
