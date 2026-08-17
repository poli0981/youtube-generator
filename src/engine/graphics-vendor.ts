import type { FrameGenVendor, FrameGenMultiplier, UpscaleQuality } from "@config/graphics-settings";

/**
 * Vendor-aware filtering for upscaling-quality and frame-generation
 * multiplier dropdowns. Each vendor exposes only the quality / multiplier
 * tiers it actually ships:
 *
 * - NVIDIA: DLAA (anti-aliasing-only) + 4 quality bins. DLSS 4 supports
 *   multi-frame-gen up to x4.
 * - AMD: FSR Native AA + 4 quality bins. FSR 3.1 caps at x3.
 * - Intel: XeSS Native AA + Ultra Quality + 4 quality bins. Intel XeFG
 *   has only shipped x2.
 * - none: vendor-agnostic legacy ladder (no DLAA, no Ultra Quality) —
 *   keeps pre-v0.11 presets / templates rendering without coercion loss.
 *
 * Pure functions — used by VideoSettingsForm to filter Select options
 * and by description-builder / editor-store / template-store to coerce
 * invalid vendor×quality combos back to `"none"` on rehydrate.
 */
export function getValidUpscaleQualities(vendor: FrameGenVendor): readonly UpscaleQuality[] {
  switch (vendor) {
    case "nvidia":
      return ["none", "dlaa", "quality", "balanced", "performance", "ultra_performance"] as const;
    case "amd":
      return [
        "none",
        "native_aa",
        "quality",
        "balanced",
        "performance",
        "ultra_performance",
      ] as const;
    case "intel":
      return [
        "none",
        "native_aa",
        "ultra_quality",
        "quality",
        "balanced",
        "performance",
        "ultra_performance",
      ] as const;
    case "none":
      return [
        "none",
        "native_aa",
        "quality",
        "balanced",
        "performance",
        "ultra_performance",
      ] as const;
  }
}

export function getValidFrameGenMultipliers(vendor: FrameGenVendor): readonly FrameGenMultiplier[] {
  switch (vendor) {
    case "nvidia":
      return ["none", "x2", "x3", "x4"] as const;
    case "amd":
      return ["none", "x2", "x3"] as const;
    case "intel":
      return ["none", "x2"] as const;
    case "none":
      return ["none"] as const;
  }
}

/** Returns `current` if it's valid for the vendor, else `"none"`. */
export function coerceUpscaleQuality(
  vendor: FrameGenVendor,
  current: UpscaleQuality | undefined,
): UpscaleQuality {
  const valid = getValidUpscaleQualities(vendor);
  if (current && (valid as readonly string[]).includes(current)) return current;
  return "none";
}

/** Returns `current` if it's valid for the vendor, else `"none"`. */
export function coerceFrameGenMultiplier(
  vendor: FrameGenVendor,
  current: FrameGenMultiplier | undefined,
): FrameGenMultiplier {
  const valid = getValidFrameGenMultipliers(vendor);
  if (current && (valid as readonly string[]).includes(current)) return current;
  return "none";
}
