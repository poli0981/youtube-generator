import { useMemo } from "react";
import { useEditorStore } from "@store/editor-store";
import type { GeneratorInput, SupportedLanguage } from "@engine/types";

/**
 * Shapes the editor-store state into a {@link GeneratorInput} — the
 * exact blob that every engine function (title / description / tags /
 * pinned comment) consumes.
 *
 * Why a hook: four call sites (two hooks + BatchPage + OutputExtras)
 * used to hand-roll the same 25-field object. Adding a new editor
 * field meant editing every site; drift was likely. Centralising here
 * means one place to update when v0.8 adds more input fields.
 *
 * Takes an optional `language` override — BatchPage builds the same
 * input for multiple languages, so the hook supports passing a target
 * instead of reading `state.language` from the store.
 */
export function useCurrentGeneratorInput(languageOverride?: SupportedLanguage): GeneratorInput {
  const state = useEditorStore();

  return useMemo<GeneratorInput>(
    () => ({
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
      resolution: state.resolution,
      fps: state.fps,
      graphicsPreset: state.graphicsPreset,
      timestamps: state.timestamps,
      playlistLink: state.playlistLink,
      contactEmail: state.contactEmail,
      musicAttribution: state.musicAttribution,
      sponsorName: state.sponsorName,
      sponsorPlatform: state.sponsorPlatform,
      spoilerWarning: state.spoilerWarning,
      matureWarning: state.matureWarning,
      playthroughStatus: state.playthroughStatus,
      difficulty: state.difficulty,
      difficultyCustomLabel: state.difficultyCustomLabel,
      contentWarnings: state.contentWarnings,
      storeLinks: state.storeLinks,
      storeLinkTypes: state.storeLinkTypes,
      social: state.social,
      rig: state.rig,
    }),
    [
      languageOverride,
      state.videoType,
      state.language,
      state.genres,
      state.gameName,
      state.gameNameLocalized,
      state.channelName,
      state.platform,
      state.partNumber,
      state.bossName,
      state.dlcName,
      state.challengeName,
      state.modName,
      state.resolution,
      state.fps,
      state.graphicsPreset,
      state.timestamps,
      state.playlistLink,
      state.contactEmail,
      state.musicAttribution,
      state.sponsorName,
      state.sponsorPlatform,
      state.spoilerWarning,
      state.matureWarning,
      state.playthroughStatus,
      state.difficulty,
      state.difficultyCustomLabel,
      state.contentWarnings,
      state.storeLinks,
      state.storeLinkTypes,
      state.social,
      state.rig,
    ],
  );
}
