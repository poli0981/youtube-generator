import { describe, it, expect, beforeEach } from "vitest";
import { legacyGraphicsPresetToEnum, useEditorStore, type EditorData } from "@store/editor-store";
import { FIELD_LIMITS } from "@config/field-limits";

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

describe("clamping on import (v0.35.0)", () => {
  // `maxLength` on an <input> only constrains typing and pasting. Values that
  // arrive from a profile / preset / template — including one saved before the
  // caps existed — never pass through an input at all, so the store has to
  // clamp them or the cap is decorative for exactly the path most likely to
  // violate it.

  beforeEach(() => {
    useEditorStore.getState().reset();
  });

  it("clamps an oversized game name from a profile", () => {
    useEditorStore.getState().loadProfile({ gameName: "G".repeat(500) });
    expect(useEditorStore.getState().gameName).toHaveLength(FIELD_LIMITS.SHORT_NAME);
  });

  it("clamps an oversized URL from a preset", () => {
    useEditorStore.getState().loadPreset({ playlistLink: `https://x.test/${"a".repeat(500)}` });
    expect(useEditorStore.getState().playlistLink).toHaveLength(FIELD_LIMITS.URL);
  });

  it("clamps oversized values inside the nested storeLinks map", () => {
    useEditorStore.getState().loadPreset({
      storeLinks: { steam: `https://store.steampowered.com/app/${"1".repeat(500)}` },
    });
    expect(useEditorStore.getState().storeLinks.steam).toHaveLength(FIELD_LIMITS.URL);
  });

  it("clamps oversized values inside the nested social map", () => {
    useEditorStore.getState().loadProfile({
      social: { twitch: `https://twitch.tv/${"a".repeat(500)}` },
    });
    expect(useEditorStore.getState().social.twitch).toHaveLength(FIELD_LIMITS.URL);
  });

  it("leaves values under the cap untouched", () => {
    useEditorStore.getState().loadProfile({ gameName: "Silent Hill 2" });
    expect(useEditorStore.getState().gameName).toBe("Silent Hill 2");
  });

  it("leaves non-string values in the nested maps alone", () => {
    // Hand-edited files can carry anything; clamping must not coerce a
    // non-string into "" and quietly destroy it.
    useEditorStore
      .getState()
      .loadProfile({ social: { twitch: "https://twitch.tv/ok" } } as Partial<EditorData>);
    expect(useEditorStore.getState().social.twitch).toBe("https://twitch.tv/ok");
  });
});
