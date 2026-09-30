import type { EndingEntry, EndingVideoRange, GeneratorInput, TranslationFn } from "./types";

/**
 * Render a single {@link EndingEntry} into its display string.
 *
 *   - both number + name → `"Ending {{number}}: {{name}}"`
 *   - number only       → `"Ending {{number}}"`
 *   - name only         → `"{{name}}"`
 *   - neither           → `null` (entry should be dropped)
 *
 * With `t` (the output language), "Ending N" comes from
 * `timeline.keywords.ending` — the same word the timestamps use — so a
 * Vietnamese description says "Kết thúc 3". Without it (the editor's live
 * preview) the English form is used.
 *
 * Pure — exported for unit tests + direct use from React components.
 */
export function formatEndingEntry(entry: EndingEntry, t?: TranslationFn): string | null {
  const num =
    typeof entry.number === "number" && Number.isFinite(entry.number) ? entry.number : null;
  const name = (entry.name ?? "").trim();
  const label = (n: number): string => {
    const key = "timeline.keywords.ending";
    const localized = t?.(key, { n: String(n) }).trim();
    return localized && localized !== key ? localized : `Ending ${n}`;
  };
  if (num !== null && name) return `${label(num)}: ${name}`;
  if (num !== null) return label(num);
  if (name) return name;
  return null;
}

/**
 * Compute the slice of an `endings[]` array that should render for a
 * given video index. Used by description-builder + title-builder when
 * a multi-video playthrough is being generated.
 *
 *   - `endingVideoCount` undefined / ≤ 1 → whole array (case A / B).
 *   - `endingVideoIndex` undefined / out-of-range → whole array. Lets
 *     a caller request the "union" view without knowing whether the
 *     creator is in single- or multi-video mode.
 *   - Otherwise pull the matching {@link EndingVideoRange} (1-indexed,
 *     inclusive) and slice. Missing range → fall through to "whole
 *     array" so a half-migrated draft still renders something.
 *
 * Pure — exported for unit tests.
 */
export function sliceEndingsForVideo(
  endings: EndingEntry[],
  input: Pick<GeneratorInput, "endingVideoCount" | "endingVideoIndex" | "endingVideoRanges">,
): EndingEntry[] {
  if (endings.length === 0) return [];
  const videoCount = input.endingVideoCount ?? 1;
  const index = input.endingVideoIndex;
  if (videoCount <= 1 || typeof index !== "number" || index < 1 || index > videoCount) {
    return endings;
  }
  const ranges = input.endingVideoRanges ?? [];
  const range = ranges[index - 1];
  if (!range) return endings;
  const { from, to } = clampRange(range, endings.length);
  return endings.slice(from - 1, to);
}

/**
 * Clamp a possibly-stale {@link EndingVideoRange} to `[1, length]` so
 * a creator who shrank `endings[]` without re-deriving ranges still
 * gets a sane slice instead of an empty / over-shot one. Pure.
 */
export function clampRange(range: EndingVideoRange, length: number): EndingVideoRange {
  const from = Math.max(1, Math.min(range.from, length));
  const to = Math.max(from, Math.min(range.to, length));
  return { from, to };
}
