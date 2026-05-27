/**
 * Video-style era options (v0.22.0). When the user picks an era from the
 * editor's Video Style dropdown, the description renderer emits a single
 * line composed from the chosen era label and the user's `rig.video_editor`
 * field — e.g. `"Edited in 1990s VHS style using DaVinci Resolve 19.1"`.
 *
 * Empty string `""` is the sentinel for "off" — no parallel boolean toggle.
 * This mirrors the existing per-video opt-in shape used by `artStyle`,
 * `playthroughStatus`, `difficulty`, etc.
 *
 * Adding a new era: append the id below, add the editor short label to
 * `editor.videoStyleOptions.{id}` in all 6 locales, and the description
 * long label to `description.videoSettings.eraOptions.{id}` in
 * `templates.json`. The engine + form pick the new entry up automatically.
 */
export const VIDEO_STYLE_ERAS = [
  "",
  "1980s",
  "1990s",
  "2000s",
  "2010s",
  "2020s",
  "modern",
  "cinematic",
  "retro",
  "vhs",
  "film_noir",
  "anime_mv",
  "documentary",
] as const;

export type VideoStyleEra = (typeof VIDEO_STYLE_ERAS)[number];

/** Subset minus the empty sentinel — used by the form to render options. */
export const VIDEO_STYLE_ERA_IDS = VIDEO_STYLE_ERAS.filter(
  (id) => id !== "",
) as ReadonlyArray<Exclude<VideoStyleEra, "">>;

/**
 * Type guard so the engine + migration can coerce unrecognised values
 * (hand-edited blob, downgrade from a future version that added more
 * eras) back to the empty sentinel without crashing.
 */
export function isVideoStyleEra(value: unknown): value is VideoStyleEra {
  return (
    typeof value === "string" &&
    (VIDEO_STYLE_ERAS as readonly string[]).includes(value)
  );
}
