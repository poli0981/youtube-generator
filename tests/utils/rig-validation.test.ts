import { describe, it, expect } from "vitest";
import { validateRamValue, validateGpuValue, validateCompositeField } from "@utils/rig-validation";

describe("validateRamValue", () => {
  it("flags a size with no DDR generation", () => {
    expect(validateRamValue("32|")?.messageKey).toBe("editor.validation.ramMissingDdr");
  });

  it("flags a DDR generation with no size", () => {
    expect(validateRamValue("|DDR5")?.messageKey).toBe("editor.validation.ramMissingSize");
  });

  it("flags an empty custom size", () => {
    expect(validateRamValue("custom:|DDR5")?.messageKey).toBe("editor.validation.ramCustomEmpty");
  });

  it("passes a complete size + DDR", () => {
    expect(validateRamValue("16|DDR5")).toBeNull();
  });

  it("passes a fully blank value (deliberate skip)", () => {
    expect(validateRamValue("")).toBeNull();
  });

  it("passes legacy pipeless free-text", () => {
    expect(validateRamValue("32GB DDR5-6000")).toBeNull();
  });
});

describe("validateGpuValue", () => {
  it("flags a brand with no series", () => {
    expect(validateGpuValue("nvidia||")?.messageKey).toBe("editor.validation.gpuMissingSeries");
  });

  it("flags an empty custom GPU", () => {
    expect(validateGpuValue("custom||")?.messageKey).toBe("editor.validation.gpuCustomEmpty");
  });

  it("passes a complete brand + series + model", () => {
    expect(validateGpuValue("nvidia|rtx_40|RTX 4090")).toBeNull();
  });
});

describe("validateCompositeField (v0.24.0 — per-field validator selection)", () => {
  it("validates the RAM composite", () => {
    expect(validateCompositeField("ram", "32|")?.messageKey).toBe(
      "editor.validation.ramMissingDdr",
    );
    expect(validateCompositeField("ram", "16|DDR5")).toBeNull();
  });

  it("does NOT run the RAM validator on the OS composite (the bug)", () => {
    // Regression guard: "windows||" (OS name selected, no version) parses
    // as size="windows", ddr="" under the RAM parser → previously tripped
    // "Pick a DDR generation." on the OS field. The OS composite has no
    // validator, so every shape must return null.
    expect(validateCompositeField("os", "windows||")).toBeNull();
    expect(validateCompositeField("os", "macos|15 Sequoia|")).toBeNull();
    expect(validateCompositeField("os", "linux|ubuntu|22.04 LTS")).toBeNull();
    expect(validateCompositeField("os", "")).toBeNull();
  });

  it("returns null for any unknown composite id", () => {
    expect(validateCompositeField("future_field", "a|b")).toBeNull();
  });
});
