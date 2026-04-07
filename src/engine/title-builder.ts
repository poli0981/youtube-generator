import type { GeneratorInput, TranslationFn, CharLimitWarning } from "./types";
import { YT_LIMITS } from "./types";

export function buildTitle(input: GeneratorInput, t: TranslationFn): string {
  const separator = t("title.separator");
  const suffix = t("title.suffix");

  const videoTypeLabel = t(`title.videoType.${input.videoType}`, {
    partNumber: input.partNumber ?? "",
    bossName: input.bossName ?? "",
    dlcName: input.dlcName ?? "",
    challengeName: input.challengeName ?? "",
  });

  const gameName =
    input.gameNameLocalized?.[input.language] ?? input.gameName;

  const parts = [gameName];
  if (videoTypeLabel) {
    parts.push(videoTypeLabel);
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
