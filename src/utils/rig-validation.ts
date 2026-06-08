import {
  parseCascadingValue,
  parseCompositeValue,
} from "@config/rig-fields";
import { GPU_CUSTOM_BRAND_ID } from "@config/gpu-catalog";

/**
 * Validation outcome for a rig field. `kind` carries the i18n key used
 * to render the badge tooltip — callers translate via the existing
 * `editor.validation.*` namespace.
 */
export interface RigValidationIssue {
  kind: "incomplete" | "invalid";
  /** i18n key under `editor.validation.*` (e.g. `editor.validation.incompleteGpu`). */
  messageKey: string;
}

/**
 * GPU cascading-dropdown validator (v0.13). Surfaces a soft warning
 * when the user picks a brand but hasn't drilled down to a concrete
 * model — partial selections cause "AMD" / "NVIDIA" to appear alone in
 * the description, which is technically valid but rarely intentional.
 *
 * Custom brand: requires a non-empty free-text value, otherwise the
 * stored `"custom||"` collapses to nothing in the description.
 *
 * Returns `null` when the value is fully blank (no selection at all is
 * a deliberate "skip rig field" state and shouldn't trip the badge).
 */
export function validateGpuValue(raw: string): RigValidationIssue | null {
  if (!raw) return null;
  const { brand, series, model, isLegacy } = parseCascadingValue(raw);
  if (isLegacy) return null;

  if (brand === GPU_CUSTOM_BRAND_ID) {
    if (!model.trim()) {
      return { kind: "incomplete", messageKey: "editor.validation.gpuCustomEmpty" };
    }
    return null;
  }

  if (brand && !series) {
    return { kind: "incomplete", messageKey: "editor.validation.gpuMissingSeries" };
  }
  if (brand && series && !model) {
    return { kind: "incomplete", messageKey: "editor.validation.gpuMissingModel" };
  }
  return null;
}

/**
 * RAM composite-dropdown validator (v0.13). Surfaces a warning when the
 * user picks a size but no DDR generation, or vice-versa — the resulting
 * description line ("32 GB" or just "DDR5") is awkward enough that we
 * nudge the creator to fill in the other half.
 *
 * Custom size with empty numeric input is also flagged so the user
 * doesn't accidentally render a `"GB"` with no number.
 */
export function validateRamValue(raw: string): RigValidationIssue | null {
  if (!raw) return null;
  const { parts, isLegacy } = parseCompositeValue(raw);
  if (isLegacy) return null;

  const [size = "", ddr = ""] = parts;

  if (size.startsWith("custom:")) {
    const txt = size.slice("custom:".length).trim();
    if (!txt) {
      return { kind: "incomplete", messageKey: "editor.validation.ramCustomEmpty" };
    }
  }

  if (size && !ddr) {
    return { kind: "incomplete", messageKey: "editor.validation.ramMissingDdr" };
  }
  if (!size && ddr) {
    return { kind: "incomplete", messageKey: "editor.validation.ramMissingSize" };
  }
  return null;
}

/**
 * Pick the right validator for a `composite_dropdown` rig field by id.
 *
 * v0.24.0 bug fix: the editor previously ran {@link validateRamValue}
 * for EVERY composite field, so selecting an OS (also a composite) ran
 * the RAM validator — `"windows||"` parses as size=`"windows"`, ddr=`""`,
 * tripping `ramMissingDdr` ("Pick a DDR generation.") on the OS field.
 * Only RAM has DDR/size semantics; the OS composite has no validator, so
 * it (and any future composite) returns `null` until one is added here.
 */
export function validateCompositeField(
  fieldId: string,
  raw: string,
): RigValidationIssue | null {
  return fieldId === "ram" ? validateRamValue(raw) : null;
}
