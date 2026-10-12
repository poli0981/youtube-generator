import { describe, it, expect } from "vitest";
import { TECH_NOTE_GROUPS } from "@config/tech-note-groups";
import { TECH_NOTES } from "@engine/types";
import { schemaKeys } from "../helpers/locale-schema";

/**
 * The tech-notes twin of content-warning-groups.test.ts. TypeScript rejects a
 * group item that isn't a TechNote, but an id added to TECH_NOTES and left out
 * of every group never shows in the editor, and an id without i18n keys shows
 * a raw key and renders no bullet.
 */
describe("TECH_NOTE_GROUPS ↔ TECH_NOTES parity", () => {
  const grouped = TECH_NOTE_GROUPS.flatMap((g) => g.items);

  it("contains no duplicate ids across groups", () => {
    expect(grouped.filter((id, i) => grouped.indexOf(id) !== i)).toEqual([]);
  });

  it("covers every engine tech note exactly (none missing, none extra)", () => {
    expect([...grouped].sort()).toEqual([...TECH_NOTES].sort());
  });
});

describe("tech-note i18n keys", () => {
  const ids = [...TECH_NOTES].sort();

  it("has an editor label for every tech note, and none for unknown ids", () => {
    expect(schemaKeys("ui", "editor.techNoteOptions")).toEqual(ids);
  });

  it("has a description bullet for every tech note, and none for unknown ids", () => {
    expect(schemaKeys("templates", "description.techNotes.items")).toEqual(ids);
  });

  it("has a heading for every group", () => {
    for (const group of TECH_NOTE_GROUPS) {
      expect(group.labelKey).toBe(`editor.techNoteGroups.${group.id}`);
    }
    expect(schemaKeys("ui", "editor.techNoteGroups")).toEqual(
      TECH_NOTE_GROUPS.map((g) => g.id).sort(),
    );
  });
});
