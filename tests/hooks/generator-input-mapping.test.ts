import { describe, it, expect } from "vitest";
import { buildGeneratorInputFromEditor } from "@hooks/use-current-generator-input";
import { DEFAULTS } from "@config/defaults";
import type { EditorData } from "@store/editor-store";
import type {
  PlaythroughStatus,
  DifficultyLevel,
  ContentWarning,
  LanguagePatch,
  GameVersion,
  TechNote,
  GraphicsPreset,
  RTMode,
  FrameGenVendor,
  FrameGenMultiplier,
  UpscaleQuality,
  ArtStyle,
  VideoType,
  Genre,
  SupportedLanguage,
  StoreLinkType,
} from "@engine/types";
import type { GachaQuestType } from "@config/gacha-quest-types";

/**
 * Regression suite for the v0.12.0 bug where six new editor fields
 * (`endingsShown`, `languagePatch`, `languagePatchCustom`, `gameVersion`,
 * `gameVersionCustom`, `techNotes`) were added to {@link EditorData} +
 * `GeneratorInput` but the editor → engine mapping in
 * `useCurrentGeneratorInput` wasn't kept in sync. Symptom: ticking a
 * tech-note checkbox didn't propagate into the description preview
 * because the engine never saw the field.
 *
 * The pure helper `buildGeneratorInputFromEditor` is now unit-testable
 * without React rendering — these tests assert it carries every editor
 * field across, with a parity check that fails loudly if a future field
 * is added to EditorData but skipped here.
 */

function makeEditorData(overrides: Partial<EditorData> = {}): EditorData {
  return {
    videoType: DEFAULTS.editor.videoType as VideoType,
    language: DEFAULTS.editor.language as SupportedLanguage,
    genres: [...DEFAULTS.editor.genres] as Genre[],
    gameName: DEFAULTS.editor.gameName,
    gameNameLocalized: { ...DEFAULTS.editor.gameNameLocalized },
    channelName: DEFAULTS.editor.channelName,
    platform: DEFAULTS.editor.platform,
    partNumber: DEFAULTS.editor.partNumber,
    bossName: DEFAULTS.editor.bossName,
    dlcName: DEFAULTS.editor.dlcName,
    challengeName: DEFAULTS.editor.challengeName,
    modName: DEFAULTS.editor.modName,
    modList: DEFAULTS.editor.modList,
    liveUrl: DEFAULTS.editor.liveUrl,
    scheduledTime: DEFAULTS.editor.scheduledTime,
    gachaQuestType: DEFAULTS.editor.gachaQuestType as GachaQuestType,
    chapterName: DEFAULTS.editor.chapterName,
    questName: DEFAULTS.editor.questName,
    characterName: DEFAULTS.editor.characterName,
    anniversaryYear: DEFAULTS.editor.anniversaryYear,
    gachaVersion: DEFAULTS.editor.gachaVersion,
    resolution: DEFAULTS.editor.resolution,
    fps: DEFAULTS.editor.fps,
    graphicsPreset: DEFAULTS.editor.graphicsPreset as GraphicsPreset,
    graphicsPresetCustom: DEFAULTS.editor.graphicsPresetCustom,
    skipGraphicsSettings: DEFAULTS.editor.skipGraphicsSettings,
    rayTracingModes: [...DEFAULTS.editor.rayTracingModes] as RTMode[],
    frameGenVendor: DEFAULTS.editor.frameGenVendor as FrameGenVendor,
    frameGenMultiplier: DEFAULTS.editor.frameGenMultiplier as FrameGenMultiplier,
    upscaleQuality: DEFAULTS.editor.upscaleQuality as UpscaleQuality,
    artStyle: DEFAULTS.editor.artStyle as ArtStyle,
    videoStyleEra: DEFAULTS.editor.videoStyleEra,
    versionInfo: DEFAULTS.editor.versionInfo,
    timestamps: DEFAULTS.editor.timestamps,
    playlistLink: DEFAULTS.editor.playlistLink,
    contactEmail: DEFAULTS.editor.contactEmail,
    adEmail: DEFAULTS.editor.adEmail,
    gameKeyEmail: DEFAULTS.editor.gameKeyEmail,
    musicAttribution: DEFAULTS.editor.musicAttribution,
    sponsorName: DEFAULTS.editor.sponsorName,
    sponsorPlatform: DEFAULTS.editor.sponsorPlatform,
    pubDevName: DEFAULTS.editor.pubDevName,
    thirdPartyAdText: DEFAULTS.editor.thirdPartyAdText,
    thumbnailText: DEFAULTS.editor.thumbnailText,
    pinnedComment: DEFAULTS.editor.pinnedComment,
    spoilerWarning: DEFAULTS.editor.spoilerWarning,
    matureWarning: DEFAULTS.editor.matureWarning,
    playthroughStatus: DEFAULTS.editor.playthroughStatus as PlaythroughStatus,
    difficulty: DEFAULTS.editor.difficulty as DifficultyLevel,
    difficultyCustomLabel: DEFAULTS.editor.difficultyCustomLabel,
    endingsShown: DEFAULTS.editor.endingsShown,
    endings: [...DEFAULTS.editor.endings],
    endingVideoCount: DEFAULTS.editor.endingVideoCount,
    endingVideoRanges: [...DEFAULTS.editor.endingVideoRanges],
    endingVideoIndex: DEFAULTS.editor.endingVideoIndex,
    languagePatch: DEFAULTS.editor.languagePatch as LanguagePatch,
    languagePatchCustom: DEFAULTS.editor.languagePatchCustom,
    gameVersion: DEFAULTS.editor.gameVersion as GameVersion,
    gameVersionCustom: DEFAULTS.editor.gameVersionCustom,
    contentWarnings: [...DEFAULTS.editor.contentWarnings] as ContentWarning[],
    techNotes: [...DEFAULTS.editor.techNotes] as TechNote[],
    storeLinks: { ...DEFAULTS.editor.storeLinks },
    storeLinkTypes: { ...DEFAULTS.editor.storeLinkTypes } as Record<string, StoreLinkType>,
    social: { ...DEFAULTS.editor.social },
    rig: { ...DEFAULTS.editor.rig },
    vnBankName: DEFAULTS.editor.vnBankName,
    vnBankAccount: DEFAULTS.editor.vnBankAccount,
    vnBankHolder: DEFAULTS.editor.vnBankHolder,
    vnMomo: DEFAULTS.editor.vnMomo,
    vnZalopay: DEFAULTS.editor.vnZalopay,
    playtestLink: DEFAULTS.editor.playtestLink,
    playtestPlatform: DEFAULTS.editor.playtestPlatform,
    playtestInvites: DEFAULTS.editor.playtestInvites,
    messengerCommunityLink: DEFAULTS.editor.messengerCommunityLink,
    zaloGroupLink: DEFAULTS.editor.zaloGroupLink,
    signalGroupLink: DEFAULTS.editor.signalGroupLink,
    instagramGroupLink: DEFAULTS.editor.instagramGroupLink,
    facebookGroupLink: DEFAULTS.editor.facebookGroupLink,
    ...overrides,
  };
}

describe("buildGeneratorInputFromEditor — v0.12 fields propagation (regression)", () => {
  it("passes through endingsShown to GeneratorInput", () => {
    const input = buildGeneratorInputFromEditor(
      makeEditorData({ endingsShown: "True ending only" }),
    );
    expect(input.endingsShown).toBe("True ending only");
  });

  it("passes through languagePatch + languagePatchCustom", () => {
    const input = buildGeneratorInputFromEditor(
      makeEditorData({
        languagePatch: "official_other",
        languagePatchCustom: "Official KR",
      }),
    );
    expect(input.languagePatch).toBe("official_other");
    expect(input.languagePatchCustom).toBe("Official KR");
  });

  it("passes through gameVersion + gameVersionCustom", () => {
    const input = buildGeneratorInputFromEditor(
      makeEditorData({
        gameVersion: "custom",
        gameVersionCustom: "Kickstarter backer build",
      }),
    );
    expect(input.gameVersion).toBe("custom");
    expect(input.gameVersionCustom).toBe("Kickstarter backer build");
  });

  it("passes through techNotes preserving selection order", () => {
    const input = buildGeneratorInputFromEditor(
      makeEditorData({
        techNotes: ["copyright_muted_sections", "fps_drops_hardware", "loading_cut"],
      }),
    );
    expect(input.techNotes).toEqual([
      "copyright_muted_sections",
      "fps_drops_hardware",
      "loading_cut",
    ]);
  });

  it("passes through the playtest fields (v0.30.0)", () => {
    const input = buildGeneratorInputFromEditor(
      makeEditorData({
        playtestLink: "https://store.steampowered.com/app/1245620",
        playtestPlatform: "steam",
        playtestInvites: 25,
      }),
    );
    expect(input.playtestLink).toBe("https://store.steampowered.com/app/1245620");
    expect(input.playtestPlatform).toBe("steam");
    expect(input.playtestInvites).toBe(25);
  });

  it("passes through the community invite links (v0.32.0 + v0.33.0)", () => {
    const input = buildGeneratorInputFromEditor(
      makeEditorData({
        messengerCommunityLink: "https://m.me/ch/mychannel",
        zaloGroupLink: "https://zalo.me/g/abc123",
        signalGroupLink: "https://signal.group/#abc123",
        instagramGroupLink: "https://ig.me/j/xyz789",
        facebookGroupLink: "https://facebook.com/groups/mygroup",
      }),
    );
    expect(input.messengerCommunityLink).toBe("https://m.me/ch/mychannel");
    expect(input.zaloGroupLink).toBe("https://zalo.me/g/abc123");
    expect(input.signalGroupLink).toBe("https://signal.group/#abc123");
    expect(input.instagramGroupLink).toBe("https://ig.me/j/xyz789");
    expect(input.facebookGroupLink).toBe("https://facebook.com/groups/mygroup");
  });

  it("respects languageOverride for batch / multi-language rendering", () => {
    const input = buildGeneratorInputFromEditor(makeEditorData({ language: "en" }), "vi");
    expect(input.language).toBe("vi");
  });

  /**
   * Parity guard. Lists every key on EditorData that does NOT end up in
   * GeneratorInput on purpose (`thumbnailText` / `pinnedComment` feed
   * the pinned-comment builder via a separate code path; `spoiler-`
   * and `matureWarning` are deprecated v0.7 booleans kept on persisted
   * shapes only). Anything else added to EditorData but not surfaced in
   * the input shape will trip this assertion — preventing a silent
   * repeat of the v0.12.0 bug.
   */
  it("forwards every non-excluded EditorData field into GeneratorInput", () => {
    const editorOnlyKeys = new Set<keyof EditorData>(["thumbnailText", "pinnedComment"]);

    const editor = makeEditorData();
    const input = buildGeneratorInputFromEditor(editor);
    const inputKeys = new Set(Object.keys(input));

    const missing: string[] = [];
    for (const key of Object.keys(editor) as (keyof EditorData)[]) {
      if (editorOnlyKeys.has(key)) continue;
      if (!inputKeys.has(key)) missing.push(key);
    }

    expect(
      missing,
      `EditorData fields ${JSON.stringify(missing)} are not surfaced in ` +
        `GeneratorInput. If a field is intentionally engine-irrelevant, add ` +
        `it to the editorOnlyKeys allowlist; otherwise add it to ` +
        `buildGeneratorInputFromEditor.`,
    ).toEqual([]);
  });
});
