import type { GeneratorInput, TranslationFn } from "./types";
import { buildQualityBadge } from "./title-builder";

export type TitleVariantId = "default" | "typeFirst" | "qualityFirst";

export interface TitleVariant {
  id: TitleVariantId;
  /** i18n key under `output.variants.*`. */
  labelKey: string;
  title: string;
}

/**
 * Builds three alternative title phrasings so a creator can A/B test
 * the same video. Reuses `buildQualityBadge` for consistency with the
 * primary title builder — a title with the badge off in
 * `useGeneratedOutput` will produce variants without the badge too.
 *
 *  - default:      Game — Type [2K 60FPS] — Gameplay No Commentary
 *  - typeFirst:    Type — Game [2K 60FPS] — Gameplay No Commentary
 *  - qualityFirst: [2K 60FPS] Game — Type — Gameplay No Commentary
 *
 * When the badge is empty (1080p 60fps or toggle off), `qualityFirst`
 * collapses to the default shape so callers don't see a duplicate.
 */
export function buildTitleVariants(
  input: GeneratorInput,
  t: TranslationFn,
  showQualityBadge = true,
): TitleVariant[] {
  const separator = t("title.separator");
  const suffix = t("title.suffix");

  const videoTypeLabel = t(`title.videoType.${input.videoType}`, {
    partNumber: input.partNumber ?? "",
    bossName: input.bossName ?? "",
    dlcName: input.dlcName ?? "",
    challengeName: input.challengeName ?? "",
    modName: input.modName ?? "",
  });

  const gameName = input.gameNameLocalized?.[input.language] ?? input.gameName;
  const badge = showQualityBadge ? buildQualityBadge(input.resolution, input.fps) : "";
  const typeWithBadge = videoTypeLabel && badge ? `${videoTypeLabel} [${badge}]` : videoTypeLabel;
  const gameWithBadge = badge ? `${gameName} [${badge}]` : gameName;

  const joinNonEmpty = (parts: string[]): string =>
    parts.filter((p) => p.length > 0).join(separator);

  // Variant 1 — default (game [badge after type])
  const defaultParts: string[] = [gameName];
  if (typeWithBadge) defaultParts.push(typeWithBadge);
  defaultParts.push(suffix);

  // Variant 2 — type first, keeps the badge attached to the game name
  const typeFirstParts: string[] = [];
  if (videoTypeLabel) typeFirstParts.push(videoTypeLabel);
  typeFirstParts.push(gameWithBadge);
  typeFirstParts.push(suffix);

  // Variant 3 — quality badge up front; falls back to default when
  // there is no badge so we never render two identical variants.
  const qualityFirstTitle = badge
    ? joinNonEmpty([`[${badge}] ${gameName}`, videoTypeLabel, suffix])
    : joinNonEmpty(defaultParts);

  return [
    { id: "default", labelKey: "output.variants.default", title: joinNonEmpty(defaultParts) },
    { id: "typeFirst", labelKey: "output.variants.typeFirst", title: joinNonEmpty(typeFirstParts) },
    { id: "qualityFirst", labelKey: "output.variants.qualityFirst", title: qualityFirstTitle },
  ];
}
