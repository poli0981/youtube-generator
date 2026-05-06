import { describe, it, expect } from "vitest";
import { migrateEditorState } from "@store/editor-store";

/**
 * Regression tests for the editor-store v9 → v10 migration introduced
 * in v0.12. The migration is purely additive: existing fields
 * (`playthroughStatus`, `difficulty`, `contentWarnings`, …) must
 * round-trip unchanged, while the new Playthrough Notes structured
 * fields (`endingsShown`, `languagePatch`, `gameVersion`, …) and the
 * `techNotes` checklist must back-fill to safe defaults.
 */

function makeV9Persisted(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    videoType: "full",
    language: "en",
    genres: ["action"],
    gameName: "Elden Ring",
    channelName: "TestChannel",
    platform: "steam",
    partNumber: "",
    bossName: "",
    dlcName: "",
    challengeName: "",
    modName: "",
    modList: "",
    liveUrl: "",
    scheduledTime: "",
    gachaQuestType: "main_story",
    chapterName: "",
    questName: "",
    resolution: "1080p",
    fps: "60",
    graphicsPreset: "medium",
    graphicsPresetCustom: "",
    skipGraphicsSettings: false,
    rayTracingModes: [],
    frameGenVendor: "none",
    frameGenMultiplier: "none",
    upscaleQuality: "none",
    artStyle: "none",
    versionInfo: "",
    timestamps: "",
    playlistLink: "",
    contactEmail: "",
    musicAttribution: "",
    sponsorName: "",
    sponsorPlatform: "",
    pubDevName: "",
    thirdPartyAdText: "",
    thumbnailText: "",
    pinnedComment: "",
    spoilerWarning: false,
    matureWarning: false,
    playthroughStatus: "none",
    difficulty: "none",
    difficultyCustomLabel: "",
    contentWarnings: [],
    storeLinks: {},
    storeLinkTypes: {},
    social: {},
    rig: {},
    vnBankName: "",
    vnBankAccount: "",
    vnBankHolder: "",
    vnMomo: "",
    vnZalopay: "",
    ...overrides,
  };
}

describe("migrateEditorState — v9 → v10 (v0.12)", () => {
  it("back-fills new Playthrough Notes fields with safe defaults", () => {
    const result = migrateEditorState(makeV9Persisted(), 9);
    expect(result.endingsShown).toBe("");
    expect(result.languagePatch).toBe("none");
    expect(result.languagePatchCustom).toBe("");
    expect(result.gameVersion).toBe("full_release");
    expect(result.gameVersionCustom).toBe("");
    expect(result.techNotes).toEqual([]);
  });

  it("preserves existing playthroughStatus and difficulty values", () => {
    const result = migrateEditorState(
      makeV9Persisted({
        playthroughStatus: "blind",
        difficulty: "hard",
        difficultyCustomLabel: "Lethal",
      }),
      9,
    );
    expect(result.playthroughStatus).toBe("blind");
    expect(result.difficulty).toBe("hard");
    expect(result.difficultyCustomLabel).toBe("Lethal");
    // New fields still get defaults.
    expect(result.endingsShown).toBe("");
    expect(result.languagePatch).toBe("none");
  });

  it("preserves existing contentWarnings and adds empty techNotes", () => {
    const result = migrateEditorState(
      makeV9Persisted({
        contentWarnings: ["spoiler_story", "flashing_lights"],
      }),
      9,
    );
    expect(result.contentWarnings).toEqual(["spoiler_story", "flashing_lights"]);
    expect(result.techNotes).toEqual([]);
  });

  it("coerces an invalid persisted languagePatch to 'none'", () => {
    const result = migrateEditorState(
      makeV9Persisted({ languagePatch: "not_a_real_option" }),
      9,
    );
    expect(result.languagePatch).toBe("none");
  });

  it("coerces an invalid persisted gameVersion to 'full_release'", () => {
    const result = migrateEditorState(
      makeV9Persisted({ gameVersion: "definitely_not_valid" }),
      9,
    );
    expect(result.gameVersion).toBe("full_release");
  });

  it("filters out unknown techNotes ids (defensive against hand-edited blobs)", () => {
    const result = migrateEditorState(
      makeV9Persisted({
        techNotes: ["copyright_muted_sections", "ghost_id_xyz", "fps_drops_hardware"],
      }),
      9,
    );
    expect(result.techNotes).toEqual([
      "copyright_muted_sections",
      "fps_drops_hardware",
    ]);
  });

  it("preserves valid techNotes values when migrating from a manually-bumped v10 blob", () => {
    const result = migrateEditorState(
      makeV9Persisted({ techNotes: ["loading_cut", "support_developers"] }),
      9,
    );
    // v10 doesn't strip valid ids — only filters unknowns.
    expect(result.techNotes).toEqual(["loading_cut", "support_developers"]);
  });

  it("returns a fresh initial state when persistedState is null/undefined", () => {
    const fromNull = migrateEditorState(null, 9);
    const fromUndefined = migrateEditorState(undefined, 9);
    expect(fromNull.endingsShown).toBe("");
    expect(fromUndefined.endingsShown).toBe("");
    expect(fromNull.techNotes).toEqual([]);
    expect(fromUndefined.techNotes).toEqual([]);
  });

  it("is idempotent — running the migration twice produces the same result", () => {
    const once = migrateEditorState(makeV9Persisted(), 9);
    const twice = migrateEditorState(once, 10);
    expect(twice).toEqual(once);
  });
});
