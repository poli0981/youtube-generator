import { useMemo } from "react";
import { getOutputLimitStatus, mergeLimitStatus, type OutputLimitStatus } from "@engine/limits";
import type { GeneratorOutput } from "@engine/types";

/**
 * Over-limit status for one output, or the merge of several.
 *
 * Pass a memoized array — an inline `[a, b]` literal changes identity every
 * render and defeats the memo. Several outputs are merged when the copy target
 * concatenates them (multi-language Copy All, Copy All Batch), because the
 * resulting blob contains the offending text either way.
 */
export function useOutputLimits(outputs: readonly GeneratorOutput[]): OutputLimitStatus {
  return useMemo(() => mergeLimitStatus(outputs.map(getOutputLimitStatus)), [outputs]);
}
