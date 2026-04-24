import { describe, it, expect } from "vitest";
import { healSettings } from "@store/settings-heal";

describe("healSettings", () => {
  it("returns a full defaults object when given null / undefined / non-object input", () => {
    const fromNull = healSettings(null);
    const fromUndefined = healSettings(undefined);
    const fromString = healSettings("not an object");

    // All three should have the full required shape with default-ish values.
    for (const healed of [fromNull, fromUndefined, fromString]) {
      expect(healed.theme).toBe("dark");
      expect(healed.showCharCount).toBe(true);
      expect(healed.compactTagDisplay).toBe(false);
      expect(healed.hashtagCount).toBe(3);
      expect(healed.showQualityBadge).toBe(true);
      expect(healed.showCopyright).toBe(true);
      expect(healed.showUsagePolicy).toBe(false);
      expect(healed.defaultGenres).toEqual(["action"]);
      expect(healed.editorAccordionState).toEqual(
        expect.objectContaining({ gameInfo: true }),
      );
    }
  });

  it("back-fills missing keys with defaults but keeps user-set values", () => {
    const healed = healSettings({
      theme: "light",
      hashtagCount: 1,
      // showCharCount, compactTagDisplay, etc. all missing
    });

    expect(healed.theme).toBe("light");
    expect(healed.hashtagCount).toBe(1);
    // Back-filled:
    expect(healed.showCharCount).toBe(true);
    expect(healed.compactTagDisplay).toBe(false);
    expect(healed.showQualityBadge).toBe(true);
    expect(healed.editorAccordionState).toBeDefined();
  });

  it("strips the removed `autoSaveDraft` key even if persisted", () => {
    const healed = healSettings({ autoSaveDraft: true, theme: "dark" }) as Record<
      string,
      unknown
    >;
    expect(healed.autoSaveDraft).toBeUndefined();
  });

  it("upgrades the legacy `defaultGenre: string` shape to `defaultGenres: string[]`", () => {
    const healed = healSettings({ defaultGenre: "rpg" }) as Record<string, unknown>;
    expect(healed.defaultGenre).toBeUndefined();
    expect(healed.defaultGenres).toEqual(["rpg"]);
  });

  it("keeps explicit `defaultGenres` when both legacy and new keys are present", () => {
    const healed = healSettings({
      defaultGenre: "rpg",
      defaultGenres: ["horror", "action"],
    }) as Record<string, unknown>;
    expect(healed.defaultGenre).toBeUndefined();
    expect(healed.defaultGenres).toEqual(["horror", "action"]);
  });

  it("preserves all keys when given a complete payload", () => {
    const complete = {
      appLanguage: "vi" as const,
      defaultOutputLanguage: "en" as const,
      defaultGenres: ["rpg" as const],
      theme: "light" as const,
      showCharCount: false,
      compactTagDisplay: true,
      historyLimit: 50,
      includeMultilingualTags: false,
      includeTrendingTags: false,
      hashtagCount: 2,
      showQualityBadge: false,
      showCopyright: false,
      showUsagePolicy: true,
      showSponsorCredit: true,
      editorAccordionState: { gameInfo: false, videoSettings: true },
    };
    const healed = healSettings(complete);
    expect(healed).toEqual(complete);
  });

  it("back-fills showSponsorCredit default when the key is absent (v3 → v4 payload)", () => {
    // Simulates a settings file written in v0.6 phase 1 where the new
    // sponsor toggle hadn't been introduced yet.
    const healed = healSettings({
      theme: "dark" as const,
      showCopyright: true,
    });
    expect(healed.showSponsorCredit).toBe(false);
  });
});
