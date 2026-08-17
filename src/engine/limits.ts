import type { GeneratorOutput, CharLimitWarning } from "./types";

/**
 * Whether a generated output may be copied, derived from the engine's own
 * over-limit warnings.
 *
 * `renderAll` has always returned `warnings: CharLimitWarning[]` — and until
 * v0.35.0 **nothing in the UI read it.** Instead, three separate ad-hoc
 * over-limit checks had grown up in the components, each with a different
 * blind spot: `CopyButton` coloured itself red but stayed clickable,
 * `CopyAllBar` checked title and description but not tags *and* skipped every
 * check on the multi-language path, and BatchPage passed no limits at all, so
 * a 6000-character description copied silently.
 *
 * This module is the single derivation. Pure, no React — the same rule applies
 * on the Output tab and in Batch.
 *
 * Note the engine's `checkTitleWarning` / `checkDescriptionWarning` only fire
 * when a field is *strictly over* its limit, never at the 80% "getting close"
 * threshold the character counter colours yellow. So a non-empty `warnings`
 * array is an exact "YouTube will reject this" signal, safe to block on.
 */

export type LimitedField = CharLimitWarning["field"];

export interface LimitOverflow {
  field: LimitedField;
  current: number;
  limit: number;
}

export interface OutputLimitStatus {
  /** True when at least one field is over its limit. */
  blocked: boolean;
  /** One entry per offending field, deduped, in title → description → tags order. */
  overflows: readonly LimitOverflow[];
}

export const EMPTY_LIMIT_STATUS: OutputLimitStatus = { blocked: false, overflows: [] };

/** Stable display order, independent of the order warnings were pushed. */
const FIELD_ORDER: readonly LimitedField[] = ["title", "description", "tags"];

function byFieldOrder(a: LimitOverflow, b: LimitOverflow): number {
  return FIELD_ORDER.indexOf(a.field) - FIELD_ORDER.indexOf(b.field);
}

/**
 * Read one output's over-limit state.
 *
 * Deliberately ignores `CharLimitWarning.message`, which is a hardcoded
 * English sentence built inside the engine and therefore unusable in a
 * localized UI. The UI renders `output.limits.*` keys from the numbers instead.
 */
export function getOutputLimitStatus(output: Pick<GeneratorOutput, "warnings">): OutputLimitStatus {
  if (output.warnings.length === 0) return EMPTY_LIMIT_STATUS;
  const overflows = output.warnings
    .map(({ field, current, limit }) => ({ field, current, limit }))
    .sort(byFieldOrder);
  return { blocked: true, overflows };
}

/**
 * Combine several outputs into one status — the multi-language Output tabs and
 * the Copy-All-Batch blob, both of which concatenate text that may come from
 * any of them.
 *
 * Deduped by field, keeping the worst offender, so five Batch rows all over on
 * description produce one banner line rather than five.
 */
export function mergeLimitStatus(statuses: readonly OutputLimitStatus[]): OutputLimitStatus {
  const worst = new Map<LimitedField, LimitOverflow>();
  for (const status of statuses) {
    for (const overflow of status.overflows) {
      const existing = worst.get(overflow.field);
      if (!existing || overflow.current > existing.current) {
        worst.set(overflow.field, overflow);
      }
    }
  }
  if (worst.size === 0) return EMPTY_LIMIT_STATUS;
  return { blocked: true, overflows: [...worst.values()].sort(byFieldOrder) };
}
