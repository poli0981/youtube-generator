import { RIG_FIELDS, formatRigValue, isCustomRigValue } from "@config/rig-fields";
import type { TranslationFn } from "./types";

/**
 * The rig as "Label: value" lines, shared by the description and the
 * social captions.
 *
 * Labels come from the output language (`description.rigLabels.*`) and the
 * order is {@link RIG_FIELDS}'. Both used to come from the stored object:
 * every language printed English keys in capitals ("VIDEO EDITOR:"), in
 * whatever order the fields had first been filled in.
 *
 * v1.6.0: a field with a `customNoteKey` set to "Custom" prints that note
 * as its whole line — the LUT's "LUT applied".
 */
export function buildRigLines(
  rig: Partial<Record<string, string>> | undefined,
  t: TranslationFn,
): string[] {
  if (!rig) return [];
  const known = new Set(RIG_FIELDS.map((field) => field.id));

  const lines = RIG_FIELDS.flatMap((field) => {
    const value = formatRigValue(field.id, rig[field.id] ?? "").trim();
    if (!value) return [];
    if (field.customNoteKey && isCustomRigValue(value)) return [t(field.customNoteKey)];
    return [`${t(`description.rigLabels.${field.id}`)}: ${value}`];
  });

  // Keys that aren't rig fields any more (older versions, hand-edited
  // imports) are still printed rather than silently dropped.
  for (const [key, raw] of Object.entries(rig)) {
    const value = (raw ?? "").trim();
    if (!known.has(key) && value) lines.push(`${key.replace(/_/g, " ")}: ${value}`);
  }
  return lines;
}
