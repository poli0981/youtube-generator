import { useMemo } from "react";
import { useEditorStore, type EditorData } from "@store/editor-store";
import type { GeneratorInput, SupportedLanguage } from "@engine/types";

/**
 * Shapes an editor-store snapshot into a {@link GeneratorInput} — the
 * exact blob that every engine function (title / description / tags /
 * pinned comment) consumes. Pure function so it's directly testable
 * without React rendering; the hook below wraps it in `useMemo` for
 * referential stability.
 *
 * Why split: a v0.12.0 regression silently dropped the new Playthrough
 * Notes / Tech Notes fields here when the input shape gained them but
 * this mapping wasn't kept in sync — symptom was the editor's checkbox
 * state being correct but the description preview never reflecting it.
 * Pulling the mapping into a pure function lets tests assert parity
 * between {@link EditorData} fields and the resulting `GeneratorInput`,
 * so the next field add can't slip through unnoticed.
 */
export function buildGeneratorInputFromEditor(
  state: EditorData,
  languageOverride?: SupportedLanguage,
): GeneratorInput {
  return {
    videoType: state.videoType,
    language: languageOverride ?? state.language,
    genres: state.genres,
    gameName: state.gameName,
    gameNameLocalized: state.gameNameLocalized,
    channelName: state.channelName,
    platform: state.platform,
    partNumber: state.partNumber,
    bossName: state.bossName,
    dlcName: state.dlcName,
    challengeName: state.challengeName,
    modName: state.modName,
    modList: state.modList,
    liveUrl: state.liveUrl,
    scheduledTime: state.scheduledTime,
    gachaQuestType: state.gachaQuestType,
    chapterName: state.chapterName,
    questName: state.questName,
    characterName: state.characterName,
    anniversaryYear: state.anniversaryYear,
    gachaVersion: state.gachaVersion,
    resolution: state.resolution,
    fps: state.fps,
    graphicsPreset: state.graphicsPreset,
    graphicsPresetCustom: state.graphicsPresetCustom,
    skipGraphicsSettings: state.skipGraphicsSettings,
    rayTracingModes: state.rayTracingModes,
    frameGenVendor: state.frameGenVendor,
    frameGenMultiplier: state.frameGenMultiplier,
    upscaleQuality: state.upscaleQuality,
    artStyle: state.artStyle,
    videoStyleEra: state.videoStyleEra,
    versionInfo: state.versionInfo,
    timestamps: state.timestamps,
    playlistLink: state.playlistLink,
    contactEmail: state.contactEmail,
    musicAttribution: state.musicAttribution,
    sponsorName: state.sponsorName,
    sponsorPlatform: state.sponsorPlatform,
    pubDevName: state.pubDevName,
    thirdPartyAdText: state.thirdPartyAdText,
    spoilerWarning: state.spoilerWarning,
    matureWarning: state.matureWarning,
    playthroughStatus: state.playthroughStatus,
    difficulty: state.difficulty,
    difficultyCustomLabel: state.difficultyCustomLabel,
    endingsShown: state.endingsShown,
    endings: state.endings,
    endingVideoCount: state.endingVideoCount,
    endingVideoRanges: state.endingVideoRanges,
    // v0.17.1: only forward the index when the playthrough is
    // actually split across multiple videos. Single-video mode
    // means the engine should see the union (the slice helpers
    // already short-circuit on `videoCount <= 1`, but skipping the
    // pass-through here keeps the input cleaner for tests).
    endingVideoIndex:
      state.endingVideoCount > 1 ? state.endingVideoIndex : undefined,
    languagePatch: state.languagePatch,
    languagePatchCustom: state.languagePatchCustom,
    gameVersion: state.gameVersion,
    gameVersionCustom: state.gameVersionCustom,
    contentWarnings: state.contentWarnings,
    techNotes: state.techNotes,
    storeLinks: state.storeLinks,
    storeLinkTypes: state.storeLinkTypes,
    social: state.social,
    rig: state.rig,
    vnBankName: state.vnBankName,
    vnBankAccount: state.vnBankAccount,
    vnBankHolder: state.vnBankHolder,
    vnMomo: state.vnMomo,
    vnZalopay: state.vnZalopay,
    playtestLink: state.playtestLink,
    playtestPlatform: state.playtestPlatform,
    playtestInvites: state.playtestInvites,
    messengerCommunityLink: state.messengerCommunityLink,
    zaloGroupLink: state.zaloGroupLink,
    signalGroupLink: state.signalGroupLink,
    instagramGroupLink: state.instagramGroupLink,
    facebookGroupLink: state.facebookGroupLink,
  };
}

/**
 * Memoised editor-state → GeneratorInput hook used by every engine
 * caller (description / title / tags / pinned-comment / batch).
 *
 * Takes an optional `language` override — BatchPage builds the same
 * input for multiple languages, so the hook supports passing a target
 * instead of reading `state.language` from the store.
 */
export function useCurrentGeneratorInput(languageOverride?: SupportedLanguage): GeneratorInput {
  const state = useEditorStore();

  return useMemo<GeneratorInput>(
    // `useEditorStore()` (no selector) returns a fresh `state` reference
    // on every store update, so depending on `state` alone captures every
    // field change without enumerating each one — same memoisation
    // behaviour as the old per-field deps list, minus the v0.12.0 footgun
    // (any field added to EditorData but missing from the deps list would
    // silently stop participating in the memo invalidation).
    () => buildGeneratorInputFromEditor(state, languageOverride),
    [state, languageOverride],
  );
}
