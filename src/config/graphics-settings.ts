import type { GenreId } from "./genres";

/**
 * Graphics-quality preset ladder. Mirrors the most common in-game preset
 * names across Unreal/Unity/proprietary engines. `"custom"` reveals a
 * free-form text field for games whose preset names don't fit the ladder
 * (e.g. "Epic", "Maximum", "Insane") — same escape-hatch pattern as the
 * v0.7 difficulty `"custom"` option.
 *
 * Default: `"medium"` (a sensible neutral starting point for new drafts).
 */
export const GRAPHICS_PRESETS = [
  "low",
  "medium",
  "high",
  "very_high",
  "cinematic",
  "ultra",
  "extreme",
  "custom",
] as const;
export type GraphicsPreset = (typeof GRAPHICS_PRESETS)[number];

/**
 * Ray-tracing modes. Multi-select — modern AAA games can ship with several
 * of these layered (e.g. Path Tracing + Ray Reconstruction + Frame
 * Generation). Empty array → no RT clause in the description.
 */
export const RT_MODES = [
  "ray_tracing",
  "full_rt",
  "path_tracing",
  "ray_reconstruction",
] as const;
export type RTMode = (typeof RT_MODES)[number];

/**
 * GPU vendor whose upscaling / frame-gen tech the creator used. Single
 * vendor field on purpose — most builds run a single vendor's stack
 * (NVIDIA → DLSS, AMD → FSR, Intel → XeSS). `"none"` skips the modifier
 * entirely.
 */
export const FRAMEGEN_VENDORS = ["none", "nvidia", "amd", "intel"] as const;
export type FrameGenVendor = (typeof FRAMEGEN_VENDORS)[number];

/**
 * Frame-generation multiplier — DLSS 4 supports up to x4, FSR 3 up to x3,
 * Intel XeFG is ramping up. `"none"` means upscaling is in use but frame
 * generation isn't; useful for builds where DLSS Quality is enabled but
 * FG was left off.
 */
export const FRAMEGEN_MULTIPLIERS = ["none", "x2", "x3", "x4", "x6"] as const;
export type FrameGenMultiplier = (typeof FRAMEGEN_MULTIPLIERS)[number];

/**
 * Upscaling-quality preset across DLSS Super Resolution / FSR / XeSS.
 * The actual brand name is rendered from {@link FRAMEGEN_VENDORS}; this
 * enum carries only the quality dimension.
 */
export const UPSCALE_QUALITIES = [
  "none",
  "native_aa",
  "quality",
  "balanced",
  "performance",
  "ultra_performance",
] as const;
export type UpscaleQuality = (typeof UPSCALE_QUALITIES)[number];

/**
 * High-level visual style of the game. Optional context for viewers
 * scanning the description — particularly useful for indie titles where
 * "Pixel Art" or "Hand-drawn" is part of the appeal. `"none"` skips the
 * art-style line.
 */
export const ART_STYLES = [
  "none",
  "realistic",
  "stylized",
  "anime",
  "cel_shaded",
  "low_poly",
  "voxel",
  "pixel_art",
  "hand_drawn",
  "comic",
  "photorealistic",
] as const;
export type ArtStyle = (typeof ART_STYLES)[number];

/**
 * Genres where in-game graphics settings are typically absent — used by
 * the editor to surface a one-time "Hide graphics settings?" suggestion
 * chip. The user always has the final say via the manual `skipGraphicsSettings`
 * toggle; this list only seeds the hint.
 */
export const GENRES_WITHOUT_GRAPHICS_SETTINGS: readonly GenreId[] = [
  "visual_novel",
  "fmv",
  "rhythm",
] as const;
