import type { GeneratorInput, TranslationFn, CharLimitWarning } from "./types";
import { YT_LIMITS } from "./types";

/**
 * Compact "[2K 60FPS]" badge appended to the video-type segment when the
 * recording quality is above the defaults (1080p / 60fps).
 *
 * Rules:
 * - 1080p + 60fps → empty string (no badge, keeps the title short).
 * - Resolution above 1080p → map 1440p to "2K"; 720p/4K pass through.
 * - Non-default FPS → include the resolution alongside (e.g. "1080p 120FPS")
 *   so a lonely FPS number isn't ambiguous.
 */
export function buildQualityBadge(resolution?: string, fps?: string): string {
  const res = resolution || "1080p";
  const fpsValue = fps || "60";
  const resDefault = res === "1080p";
  const fpsDefault = fpsValue === "60";
  if (resDefault && fpsDefault) return "";

  const resLabel = res === "1440p" ? "2K" : res;
  return fpsDefault ? resLabel : `${resLabel} ${fpsValue}FPS`;
}

export function buildTitle(
  input: GeneratorInput,
  t: TranslationFn,
  showQualityBadge = true,
): string {
  const separator = t("title.separator");
  const suffix = t("title.suffix");

  const videoTypeLabel = t(`title.videoType.${input.videoType}`, {
    partNumber: input.partNumber ?? "",
    bossName: input.bossName ?? "",
    dlcName: input.dlcName ?? "",
    challengeName: input.challengeName ?? "",
    modName: input.modName ?? "",
  });

  const gameName =
    input.gameNameLocalized?.[input.language] ?? input.gameName;

  const qualityBadge = showQualityBadge ? buildQualityBadge(input.resolution, input.fps) : "";

  const parts = [gameName];
  if (videoTypeLabel) {
    parts.push(qualityBadge ? `${videoTypeLabel} [${qualityBadge}]` : videoTypeLabel);
  } else if (qualityBadge) {
    // Edge case: some video types render to empty string (e.g. "full").
    // Still surface the quality badge as its own segment so viewers see it.
    parts.push(`[${qualityBadge}]`);
  }
  parts.push(suffix);

  return parts.join(separator);
}

export function checkTitleWarning(title: string): CharLimitWarning | null {
  if (title.length > YT_LIMITS.TITLE_MAX) {
    return {
      field: "title",
      current: title.length,
      limit: YT_LIMITS.TITLE_MAX,
      message: `Title exceeds ${YT_LIMITS.TITLE_MAX} characters (${title.length}/${YT_LIMITS.TITLE_MAX})`,
    };
  }
  return null;
}
