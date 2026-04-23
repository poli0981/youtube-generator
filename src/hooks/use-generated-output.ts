import { useMemo } from "react";
import i18n from "i18next";
import { useEditorStore } from "@store/editor-store";
import { useSettingsStore } from "@store/settings-store";
import { renderAll } from "@engine/template-renderer";
import type { GeneratorOutput, GeneratorInput } from "@engine/types";

export function useGeneratedOutput(): GeneratorOutput {
  const state = useEditorStore();
  const {
    includeMultilingualTags,
    includeTrendingTags,
    hashtagCount,
    showQualityBadge,
    showCopyright,
    showUsagePolicy,
  } = useSettingsStore();

  const input: GeneratorInput = useMemo(
    () => ({
      videoType: state.videoType,
      language: state.language,
      genres: state.genres,
      gameName: state.gameName,
      gameNameLocalized: state.gameNameLocalized,
      channelName: state.channelName,
      platform: state.platform,
      partNumber: state.partNumber,
      bossName: state.bossName,
      dlcName: state.dlcName,
      challengeName: state.challengeName,
      resolution: state.resolution,
      fps: state.fps,
      graphicsPreset: state.graphicsPreset,
      timestamps: state.timestamps,
      playlistLink: state.playlistLink,
      contactEmail: state.contactEmail,
      musicAttribution: state.musicAttribution,
      spoilerWarning: state.spoilerWarning,
      matureWarning: state.matureWarning,
      storeLinks: state.storeLinks,
      storeLinkTypes: state.storeLinkTypes,
      social: state.social,
      rig: state.rig,
    }),
    [
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
      state.resolution,
      state.fps,
      state.graphicsPreset,
      state.timestamps,
      state.playlistLink,
      state.contactEmail,
      state.musicAttribution,
      state.spoilerWarning,
      state.matureWarning,
      state.storeLinks,
      state.storeLinkTypes,
      state.social,
      state.rig,
    ],
  );

  const t = useMemo(() => i18n.getFixedT(state.language, "templates"), [state.language]);

  return useMemo(
    () =>
      renderAll(input, t, {
        includeMultilingualTags,
        includeTrendingTags,
        hashtagCount,
        showQualityBadge,
        showCopyright,
        showUsagePolicy,
      }),
    [
      input,
      t,
      includeMultilingualTags,
      includeTrendingTags,
      hashtagCount,
      showQualityBadge,
      showCopyright,
      showUsagePolicy,
    ],
  );
}
