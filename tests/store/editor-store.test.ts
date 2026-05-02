import { describe, it, expect } from "vitest";
import { legacyGraphicsPresetToEnum } from "@store/editor-store";

describe("legacyGraphicsPresetToEnum (v4 → v5 graphicsPreset migration)", () => {
  it("maps the canonical defaults that were the seeded v0.7 placeholder", () => {
    expect(legacyGraphicsPresetToEnum("Ultra")).toEqual({
      preset: "ultra",
      custom: "",
    });
  });

  it("is case-insensitive", () => {
    expect(legacyGraphicsPresetToEnum("MEDIUM")).toEqual({
      preset: "medium",
      custom: "",
    });
    expect(legacyGraphicsPresetToEnum("high")).toEqual({
      preset: "high",
      custom: "",
    });
  });

  it("maps multi-word labels like 'Very High' to their snake_case enum", () => {
    expect(legacyGraphicsPresetToEnum("Very High")).toEqual({
      preset: "very_high",
      custom: "",
    });
    expect(legacyGraphicsPresetToEnum("very high")).toEqual({
      preset: "very_high",
      custom: "",
    });
  });

  it("maps 'Cinematic' / 'Extreme' / 'Low'", () => {
    expect(legacyGraphicsPresetToEnum("Cinematic")).toEqual({
      preset: "cinematic",
      custom: "",
    });
    expect(legacyGraphicsPresetToEnum("Extreme")).toEqual({
      preset: "extreme",
      custom: "",
    });
    expect(legacyGraphicsPresetToEnum("Low")).toEqual({
      preset: "low",
      custom: "",
    });
  });

  it("routes unrecognised labels into the Custom slot", () => {
    expect(legacyGraphicsPresetToEnum("Epic")).toEqual({
      preset: "custom",
      custom: "Epic",
    });
    expect(legacyGraphicsPresetToEnum("Maximum")).toEqual({
      preset: "custom",
      custom: "Maximum",
    });
  });

  it("trims whitespace before lookup", () => {
    expect(legacyGraphicsPresetToEnum("  Ultra  ")).toEqual({
      preset: "ultra",
      custom: "",
    });
  });

  it("falls back to the Medium default when the legacy value is empty", () => {
    expect(legacyGraphicsPresetToEnum("")).toEqual({
      preset: "medium",
      custom: "",
    });
    expect(legacyGraphicsPresetToEnum("   ")).toEqual({
      preset: "medium",
      custom: "",
    });
  });
});
