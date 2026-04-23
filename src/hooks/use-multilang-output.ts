import { useMemo } from "react";
import i18n from "i18next";
import { useEditorStore } from "@store/editor-store";
import { useSettingsStore } from "@store/settings-store";
import { renderAll } from "@engine/template-renderer";
import type { GeneratorInput, GeneratorOutput, SupportedLanguage } from "@engine/types";

export function useMultilangOutput(
  languages: SupportedLanguage[],
): Record<string, GeneratorOutput> {
  const state = useEditorStore();
  const { includeMultilingualTags, includeTrendingTags, hashtagCount, showQualityBadge } =
    useSettingsStore();

  return useMemo(() => {
    const results: Record<string, GeneratorOutput> = {};
    for (const lang of languages) {
      const tFn = i18n.getFixedT(lang, "templates");
      const input: GeneratorInput = {
        videoType: state.videoType,
        language: lang,
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
      };
      results[lang] = renderAll(input, tFn, {
        includeMultilingualTags,
        includeTrendingTags,
        hashtagCount,
        showQualityBadge,
      });
    }
    return results;
  }, [
    languages,
    state.videoType,
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
    includeMultilingualTags,
    includeTrendingTags,
    hashtagCount,
    showQualityBadge,
  ]);
}
