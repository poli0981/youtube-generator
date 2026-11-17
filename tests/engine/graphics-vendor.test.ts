import { describe, it, expect } from "vitest";
import {
  coerceDlssNeuralRendering,
  coerceFrameGenMultiplier,
  coerceUpscaleQuality,
  getValidFrameGenMultipliers,
  getValidUpscaleQualities,
} from "@engine/graphics-vendor";
import {
  FRAMEGEN_MULTIPLIERS,
  FRAMEGEN_VENDORS,
  UPSCALE_QUALITIES,
} from "@config/graphics-settings";
import { normalizeEditorPatch } from "@store/editor-store";
import { compareCodeUnits } from "@utils/sort";
import { schemaKeys } from "../helpers/locale-schema";

const VENDORS = FRAMEGEN_VENDORS.filter((vendor) => vendor !== "none");
const sorted = (list: readonly string[]) => [...list].sort(compareCodeUnits);

describe("getValidFrameGenMultipliers", () => {
  it("offers NVIDIA x6, Dynamic and Custom (v1.6.0)", () => {
    expect(getValidFrameGenMultipliers("nvidia")).toEqual([
      "none",
      "x2",
      "x3",
      "x4",
      "x6",
      "dynamic",
      "custom",
    ]);
  });

  it("offers Custom to AMD and Intel too, and only `none` without a vendor", () => {
    expect(getValidFrameGenMultipliers("amd")).toEqual(["none", "x2", "x3", "custom"]);
    expect(getValidFrameGenMultipliers("intel")).toEqual(["none", "x2", "custom"]);
    expect(getValidFrameGenMultipliers("none")).toEqual(["none"]);
  });

  it("offers only values the stored lists know", () => {
    for (const vendor of FRAMEGEN_VENDORS) {
      for (const multiplier of getValidFrameGenMultipliers(vendor)) {
        expect(FRAMEGEN_MULTIPLIERS).toContain(multiplier);
      }
      for (const quality of getValidUpscaleQualities(vendor)) {
        expect(UPSCALE_QUALITIES).toContain(quality);
      }
    }
  });
});

describe("coercion", () => {
  it("keeps a value the vendor offers and falls back to `none` otherwise", () => {
    expect(coerceFrameGenMultiplier("nvidia", "dynamic")).toBe("dynamic");
    expect(coerceFrameGenMultiplier("amd", "dynamic")).toBe("none");
    expect(coerceFrameGenMultiplier("amd", "custom")).toBe("custom");
    expect(coerceFrameGenMultiplier("none", "custom")).toBe("none");
    expect(coerceFrameGenMultiplier("intel", undefined)).toBe("none");
    expect(coerceUpscaleQuality("nvidia", "dlaa")).toBe("dlaa");
    expect(coerceUpscaleQuality("amd", "dlaa")).toBe("none");
    expect(coerceUpscaleQuality("intel", undefined)).toBe("none");
  });

  it("keeps DLSS 5 Neural Rendering for NVIDIA only", () => {
    expect(coerceDlssNeuralRendering("nvidia", true)).toBe(true);
    expect(coerceDlssNeuralRendering("nvidia", false)).toBe(false);
    for (const vendor of ["amd", "intel", "none"] as const) {
      expect(coerceDlssNeuralRendering(vendor, true)).toBe(false);
    }
  });

  it("applies the same rules to a profile, preset or template patch", () => {
    expect(
      normalizeEditorPatch({
        frameGenVendor: "amd",
        frameGenMultiplier: "custom",
        frameGenCustom: "Lossless Scaling x3",
        dlssNeuralRendering: true,
      }),
    ).toMatchObject({
      frameGenMultiplier: "custom",
      frameGenCustom: "Lossless Scaling x3",
      dlssNeuralRendering: false,
    });
    expect(
      normalizeEditorPatch({
        frameGenVendor: "nvidia",
        frameGenMultiplier: "dynamic",
        dlssNeuralRendering: true,
      }),
    ).toMatchObject({ frameGenMultiplier: "dynamic", dlssNeuralRendering: true });
  });
});

/**
 * The editor and the description read their labels from vendor-keyed keys
 * that `_schema.json` lists for all eight locales (`validate:locales`). The
 * mock `t` prints a missing key as-is, so without this a new option could
 * ship with no label and every test still pass.
 */
describe("a label for every option", () => {
  it("has an editor label for each vendor's multipliers and qualities", () => {
    for (const vendor of VENDORS) {
      expect(schemaKeys("ui", `editor.frameGenMultiplier.${vendor}`)).toEqual(
        sorted(getValidFrameGenMultipliers(vendor)),
      );
      expect(schemaKeys("ui", `editor.upscaleQuality.${vendor}`)).toEqual(
        sorted(getValidUpscaleQualities(vendor)),
      );
    }
    expect(schemaKeys("ui", "editor.frameGenMultiplierOptions")).toEqual(
      sorted(FRAMEGEN_MULTIPLIERS),
    );
  });

  it("has a description label for each vendor's options but the typed custom one", () => {
    for (const vendor of VENDORS) {
      expect(schemaKeys("templates", `description.graphics.frameGen.${vendor}`)).toEqual(
        sorted(getValidFrameGenMultipliers(vendor).filter((m) => m !== "custom")),
      );
      expect(schemaKeys("templates", `description.graphics.upscale.${vendor}`)).toEqual(
        sorted(getValidUpscaleQualities(vendor)),
      );
    }
  });
});
