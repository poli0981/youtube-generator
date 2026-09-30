import { describe, expect, it } from "vitest";
import { detectFile, readBackupText, type ParsedFile } from "@utils/backup/detect";
import { SECTION_VERSIONS, makeEnvelope } from "@utils/backup/format";

function data(result: ReturnType<typeof detectFile>): ParsedFile {
  if (!result.ok || result.file.kind !== "data") {
    throw new Error(`expected data, got ${JSON.stringify(result)}`);
  }
  return result.file;
}

const profile = { id: "p1", name: "Main", channelName: "Skullmute", social: {}, rig: {} };

describe("readBackupText", () => {
  it("reports empty and malformed files", () => {
    expect(readBackupText("  ")).toEqual({ ok: false, error: "empty" });
    expect(readBackupText("{nope")).toEqual({ ok: false, error: "not-json" });
    expect(readBackupText("42")).toEqual({ ok: false, error: "unknown" });
    expect(readBackupText('{"hello":"world"}')).toEqual({ ok: false, error: "unknown" });
  });
});

describe("detectFile — v1.0.0 files", () => {
  it("reads every section of a backup with its version", () => {
    const file = data(
      detectFile(
        makeEnvelope("backup", 1, {
          profiles: { version: 3, items: [profile] },
          settings: { version: 12, value: { theme: "light" } },
          draft: { version: 19, value: { gameName: "Hades" } },
          bogus: { version: 1, items: [] },
        }),
      ),
    );
    expect(file.label).toBe("backup");
    expect(file.appVersion).toBeTypeOf("string");
    expect(Object.keys(file.sections)).toEqual(["profiles", "settings", "draft"]);
    expect(file.sections.profiles).toEqual({ version: 3, items: [profile], tooNew: false });
    expect(file.sections.draft?.value).toEqual({ gameName: "Hades" });
  });

  it("flags sections saved by a newer build instead of refusing the file", () => {
    const file = data(
      detectFile(
        makeEnvelope("backup", 1, {
          profiles: { version: SECTION_VERSIONS.profiles + 1, items: [profile] },
          presets: { version: 1, items: [] },
        }),
      ),
    );
    expect(file.sections.profiles?.tooNew).toBe(true);
    expect(file.sections.presets?.tooNew).toBe(false);
  });

  it("refuses a newer file format or backup container", () => {
    expect(detectFile({ _app: "ytdescgen", _format: 3, _type: "backup", data: {} })).toEqual({
      ok: false,
      error: "newer",
    });
    expect(detectFile({ ...makeEnvelope("backup", 2, {}) })).toEqual({ ok: false, error: "newer" });
  });

  it("reads a single-section export", () => {
    const file = data(detectFile(makeEnvelope("presets", 2, [{ id: "g1", gameName: "Hades" }])));
    expect(file.label).toBe("section");
    expect(file.sections.presets?.items).toHaveLength(1);
  });

  it("hands log and caption files back as what they are", () => {
    const logs = detectFile(makeEnvelope("logs", 1, []));
    expect(logs.ok && logs.file.kind).toBe("logs");
    const social = detectFile(makeEnvelope("social", 1, { posts: [] }));
    expect(social.ok && social.file.kind).toBe("social");
  });

  it("rejects a foreign app marker and a section of the wrong shape", () => {
    expect(detectFile({ _app: "other", _format: 2, _type: "profiles", data: [] }).ok).toBe(false);
    expect(detectFile(makeEnvelope("profiles", 3, { not: "a list" })).ok).toBe(false);
  });
});

describe("detectFile — files from earlier versions", () => {
  it("maps v0.15–v0.38 envelope types to sections", () => {
    const file = data(
      detectFile({ _app: "ytdescgen", _type: "profile", _schemaVersion: 2, data: [profile] }),
    );
    expect(file.sections.profiles?.version).toBe(2);
    const templates = data(
      detectFile({ _app: "ytdescgen", _type: "template", _schemaVersion: 1, data: [] }),
    );
    expect(templates.sections.templates?.items).toEqual([]);
  });

  it("tells a mislabelled log export apart from history", () => {
    const logRow = { id: "l1", level: "info", source: "app", message: "hi", timestamp: "x" };
    const logs = detectFile({ _app: "ytdescgen", _type: "history", data: [logRow] });
    expect(logs.ok && logs.file.kind).toBe("logs");
    const history = data(
      detectFile({
        _app: "ytdescgen",
        _type: "history",
        _schemaVersion: 2,
        data: [{ id: "h1", title: "T", createdAt: "2026-01-01T00:00:00Z" }],
      }),
    );
    expect(history.sections.history?.items).toHaveLength(1);
  });

  it("guesses what a bare array holds", () => {
    expect(data(detectFile([profile])).sections.profiles?.version).toBe(0);
    expect(
      data(detectFile([{ id: "t", name: "T", snapshot: {} }])).sections.templates,
    ).toBeDefined();
    expect(
      data(detectFile([{ id: "g", gameName: "Hades", storeLinks: {} }])).sections.presets,
    ).toBeDefined();
    expect(detectFile([1, 2, 3]).ok).toBe(false);
  });

  it("reads the old desktop data file in both of its layouts", () => {
    const file = data(
      detectFile({
        "ytdescgen-settings": { theme: "dark", appLanguage: "vi" },
        "ytdescgen-profiles": { profiles: [profile] },
        "ytdescgen-history": { state: { entries: [] }, version: 2 },
        "ytdescgen-editor-draft": { state: { gameName: "Hades" }, version: 18 },
      }),
    );
    expect(file.label).toBe("legacy");
    expect(file.sections.settings).toEqual({
      version: 0,
      value: { theme: "dark", appLanguage: "vi" },
      tooNew: false,
    });
    expect(file.sections.profiles?.items).toEqual([profile]);
    expect(file.sections.history?.version).toBe(2);
    expect(file.sections.draft).toEqual({
      version: 18,
      value: { gameName: "Hades" },
      tooNew: false,
    });
  });

  it("reads a bare settings object", () => {
    const file = data(detectFile({ appLanguage: "ja", theme: "light" }));
    expect(file.sections.settings?.value).toEqual({ appLanguage: "ja", theme: "light" });
  });
});
