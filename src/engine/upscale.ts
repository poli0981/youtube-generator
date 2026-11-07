import {
  UPSCALED_FROM_OPTIONS,
  VIDEO_RESOLUTIONS,
  type UpscaledFrom,
} from "@config/graphics-settings";

/**
 * Upscaling in the video editor (v1.5.0): footage recorded at one resolution
 * and exported at a higher one, e.g. 1440p → 4K. The title badge, the
 * description's "Upscale:" line and the automatic tech note all go through
 * {@link validUpscaleSource}, so a pair that isn't an upscale (same or higher
 * source, unknown value) changes nothing anywhere.
 */

function rank(resolution: string): number {
  return (VIDEO_RESOLUTIONS as readonly string[]).indexOf(resolution);
}

/**
 * `from` when it is a known resolution below `resolution` (the video's own,
 * 1080p when unset — the editor's default); otherwise `""`.
 */
export function validUpscaleSource(
  resolution: string | undefined,
  from: string | undefined,
): string {
  if (!from) return "";
  const source = rank(from);
  const target = rank(resolution || "1080p");
  return source >= 0 && target >= 0 && source < target ? from : "";
}

/** The sources a video at `resolution` can be upscaled from, lowest first. */
export function upscaleSourcesFor(resolution: string | undefined): Exclude<UpscaledFrom, "">[] {
  return UPSCALED_FROM_OPTIONS.filter(
    (from): from is Exclude<UpscaledFrom, ""> =>
      from !== "" && validUpscaleSource(resolution, from) !== "",
  );
}
