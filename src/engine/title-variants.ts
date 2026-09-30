import type { GeneratorInput, TitleBadgePosition, TitleOrder, TranslationFn } from "./types";
import { buildTitle, type BuildTitleOptions } from "./title-builder";

type TitleVariantId = "default" | "typeFirst" | "qualityFirst";

export interface TitleVariant {
  id: TitleVariantId;
  /** i18n key under `output.variants.*`. */
  labelKey: string;
  title: string;
  /** The title format that produces this variant — what "Apply" saves. */
  format: { order: TitleOrder; badgePosition: TitleBadgePosition };
}

const SHAPES: ReadonlyArray<{ id: TitleVariantId; format: TitleVariant["format"] }> = [
  { id: "default", format: { order: "gameFirst", badgePosition: "middle" } },
  { id: "typeFirst", format: { order: "typeFirst", badgePosition: "middle" } },
  { id: "qualityFirst", format: { order: "gameFirst", badgePosition: "prefix" } },
];

/**
 * Three alternative title shapes so a creator can A/B test the same video.
 * Each is the real title builder with a different order / badge position —
 * the user's separator and badge case still apply — so applying one makes
 * the Output title identical to what was shown here.
 *
 *  - default:      Game — Type [2K 60FPS] — Gameplay No Commentary
 *  - typeFirst:    Type — Game [2K 60FPS] — Gameplay No Commentary
 *  - qualityFirst: [2K 60FPS] Game — Type — Gameplay No Commentary
 *
 * Without a badge (1080p 60fps, or the badge turned off) `qualityFirst`
 * reads exactly like the default.
 */
export function buildTitleVariants(
  input: GeneratorInput,
  t: TranslationFn,
  options: BuildTitleOptions | boolean = true,
): TitleVariant[] {
  const base: BuildTitleOptions =
    typeof options === "boolean" ? { showQualityBadge: options } : options;
  return SHAPES.map(({ id, format }) => ({
    id,
    labelKey: `output.variants.${id}`,
    title: buildTitle(input, t, { ...base, ...format }),
    format,
  }));
}
