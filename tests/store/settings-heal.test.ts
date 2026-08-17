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
      expect(healed.titleFormat).toEqual({
        badgePosition: "middle",
        separator: "emDash",
        badgeCase: "upper",
      });
      expect(healed.showPinnedCommentTemplate).toBe(false);
      expect(healed.pinnedCommentIncludeAskNextGame).toBe(true);
      expect(healed.editorAccordionState).toEqual(expect.objectContaining({ gameInfo: true }));
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
    const healed = healSettings({ autoSaveDraft: true, theme: "dark" }) as unknown as Record<
      string,
      unknown
    >;
    expect(healed.autoSaveDraft).toBeUndefined();
  });

  it("strips both legacy `defaultGenre` (v1) and `defaultGenres` (v2-v0.21) — both removed in v0.22.0", () => {
    const healed = healSettings({
      defaultGenre: "rpg",
      defaultGenres: ["horror", "action"],
    }) as unknown as Record<string, unknown>;
    expect(healed.defaultGenre).toBeUndefined();
    expect(healed.defaultGenres).toBeUndefined();
  });

  it("preserves all keys when given a complete payload", () => {
    const complete = {
      appLanguage: "vi" as const,
      defaultOutputLanguage: "en" as const,
      theme: "light" as const,
      showCharCount: false,
      compactTagDisplay: true,
      historyLimit: 50,
      includeMultilingualTags: false,
      includeTrendingTags: false,
      hashtagCount: 2,
      showQualityBadge: false,
      showCopyright: false,
      showGameCopyright: false,
      showUsagePolicy: true,
      showSponsorCredit: true,
      showThirdPartyAds: false,
      showTranslationQuality: true,
      splitContactEmail: true,
      titleFormat: {
        badgePosition: "prefix" as const,
        separator: "hyphen" as const,
        badgeCase: "lower" as const,
      },
      showPinnedCommentTemplate: true,
      pinnedCommentIncludeAskNextGame: false,
      pinnedCommentIncludeGenrePlaylist: true,
      genrePlaylists: { horror: "https://www.youtube.com/playlist?list=abc" },
      editorAccordionState: { gameInfo: false, videoSettings: true },
      sidebarCollapsed: true,
      logRetentionDays: 14,
      legalConsentVersion: 1,
      legalConsentAt: "2026-06-13T00:00:00.000Z",
    };
    const healed = healSettings(complete);
    expect(healed).toEqual(complete);
  });

  it("back-fills logRetentionDays to 7 when absent (pre-v0.17 payload)", () => {
    const healed = healSettings({ theme: "dark" as const });
    expect(healed.logRetentionDays).toBe(7);
  });

  it("clamps logRetentionDays to [1, 90]", () => {
    expect(healSettings({ logRetentionDays: 0 } as unknown).logRetentionDays).toBe(1);
    expect(healSettings({ logRetentionDays: -5 } as unknown).logRetentionDays).toBe(1);
    expect(healSettings({ logRetentionDays: 1000 } as unknown).logRetentionDays).toBe(90);
    expect(healSettings({ logRetentionDays: 30.7 } as unknown).logRetentionDays).toBe(30);
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

  it("back-fills titleFormat default when the key is absent (v4 → v5 payload)", () => {
    // Simulates a settings file written in v0.6 where titleFormat did
    // not exist yet.
    const healed = healSettings({
      theme: "dark" as const,
      showCopyright: true,
    });
    expect(healed.titleFormat).toEqual({
      badgePosition: "middle",
      separator: "emDash",
      badgeCase: "upper",
    });
  });

  it("merges partial titleFormat, filling missing sub-keys with defaults", () => {
    const healed = healSettings({
      titleFormat: { badgePosition: "prefix" },
    });
    // User-set value preserved:
    expect(healed.titleFormat.badgePosition).toBe("prefix");
    // Missing sub-keys back-filled from defaults:
    expect(healed.titleFormat.separator).toBe("emDash");
    expect(healed.titleFormat.badgeCase).toBe("upper");
  });

  it("replaces a non-object titleFormat value with defaults", () => {
    // A corrupt on-disk file might have `titleFormat: null` or a string.
    const healedFromNull = healSettings({ titleFormat: null });
    const healedFromString = healSettings({ titleFormat: "bogus" });
    for (const healed of [healedFromNull, healedFromString]) {
      expect(healed.titleFormat).toEqual({
        badgePosition: "middle",
        separator: "emDash",
        badgeCase: "upper",
      });
    }
  });

  it("back-fills pinned-comment toggles when the keys are absent (v5 → v6 payload)", () => {
    // Simulates a settings file written in v0.7 phase 1, before the
    // pinned-comment template feature existed.
    const healed = healSettings({
      theme: "dark" as const,
      titleFormat: {
        badgePosition: "middle",
        separator: "emDash",
        badgeCase: "upper",
      },
    });
    expect(healed.showPinnedCommentTemplate).toBe(false);
    expect(healed.pinnedCommentIncludeAskNextGame).toBe(true);
  });

  it("preserves user-set pinned-comment toggles when they differ from defaults", () => {
    const healed = healSettings({
      showPinnedCommentTemplate: true,
      pinnedCommentIncludeAskNextGame: false,
    });
    expect(healed.showPinnedCommentTemplate).toBe(true);
    expect(healed.pinnedCommentIncludeAskNextGame).toBe(false);
  });

  it("back-fills genre-playlist defaults when the keys are absent (v6 → v7 payload)", () => {
    // Simulates a settings file written in v0.7 phase 2, before the
    // pinned-comment genre-playlist feature existed.
    const healed = healSettings({
      theme: "dark" as const,
      showPinnedCommentTemplate: true,
    });
    expect(healed.pinnedCommentIncludeGenrePlaylist).toBe(false);
    expect(healed.genrePlaylists).toEqual({});
  });

  it("preserves user-set genrePlaylists map", () => {
    const healed = healSettings({
      genrePlaylists: {
        horror: "https://www.youtube.com/playlist?list=horror",
        rpg: "https://www.youtube.com/playlist?list=rpg",
      },
      pinnedCommentIncludeGenrePlaylist: true,
    });
    expect(healed.genrePlaylists).toEqual({
      horror: "https://www.youtube.com/playlist?list=horror",
      rpg: "https://www.youtube.com/playlist?list=rpg",
    });
    expect(healed.pinnedCommentIncludeGenrePlaylist).toBe(true);
  });

  it("replaces a non-object genrePlaylists value with the empty default", () => {
    const healedFromNull = healSettings({ genrePlaylists: null });
    const healedFromString = healSettings({ genrePlaylists: "bogus" });
    for (const healed of [healedFromNull, healedFromString]) {
      expect(healed.genrePlaylists).toEqual({});
    }
  });

  it("back-fills legalConsentVersion 0 + legalConsentAt null for a legacy payload (pre-v0.28)", () => {
    // A settings file written before the consent gate existed has neither
    // key — it must heal to "never accepted" so the gate shows on first run.
    const healed = healSettings({ theme: "dark" as const, hashtagCount: 3 });
    expect(healed.legalConsentVersion).toBe(0);
    expect(healed.legalConsentAt).toBeNull();
  });

  it("preserves a stored legalConsentVersion and coerces malformed/negative values to 0", () => {
    expect(healSettings({ legalConsentVersion: 1 }).legalConsentVersion).toBe(1);
    expect(
      healSettings({ legalConsentVersion: "nope" as unknown as number }).legalConsentVersion,
    ).toBe(0);
    expect(healSettings({ legalConsentVersion: -3 }).legalConsentVersion).toBe(0);
    expect(healSettings({ legalConsentVersion: 2.9 }).legalConsentVersion).toBe(2);
  });
});
