import { describe, expect, it } from "vitest";
import {
  IdKeeper,
  portableSettings,
  sanitizeEditorFields,
  sanitizeHistoryEntry,
  sanitizePreset,
  sanitizeProfile,
  sanitizeSections,
  sanitizeSettings,
  sanitizeTemplate,
} from "@utils/backup/sanitize";
import { initialSettings } from "@store/settings-heal";

const NOW = "2026-09-30T12:00:00.000Z";

describe("sanitizeEditorFields", () => {
  it("keeps known fields with valid values only", () => {
    const out = sanitizeEditorFields({
      gameName: "Hades",
      videoType: "part",
      language: "xx",
      genres: ["rpg", "not-a-genre", "rpg"],
      graphicsPreset: "high",
      frameGenVendor: "nvidia",
      upscaleQuality: "native_aa",
      anniversaryYear: 99,
      endings: [{ number: 2, name: "True" }, "junk"],
      storeLinks: { steam: "https://store.steampowered.com/app/1145360", "bad key!": "x", epic: 5 },
      storeLinkTypes: { steam: "paid", epic: "stolen" },
      skipGraphicsSettings: "yes",
      set: "overwrites an action",
      unknownField: 1,
    });
    expect(out).toEqual({
      gameName: "Hades",
      videoType: "part",
      genres: ["rpg"],
      graphicsPreset: "high",
      frameGenVendor: "nvidia",
      // Not a DLSS option: coerced by the same rule applying a template uses.
      upscaleQuality: "none",
      endings: [{ number: 2, name: "True" }],
      storeLinks: { steam: "https://store.steampowered.com/app/1145360" },
      storeLinkTypes: { steam: "paid" },
    });
    expect(out).not.toHaveProperty("set");
  });

  it("never copies prototype keys", () => {
    const raw = JSON.parse('{"__proto__": {"polluted": true}, "social": {"__proto__": "x"}}');
    const out = sanitizeEditorFields(raw);
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
    expect(out.social).toEqual({});
  });

  it("maps legacy values the way applying an old template does", () => {
    const out = sanitizeEditorFields({
      graphicsPreset: "Very High",
      rig: { gpu: "nvidia|rtx_50|RTX 5080" },
      spoilerWarning: true,
    });
    expect(out.graphicsPreset).toBe("very_high");
    expect(out.rig?.gpu).toBe("gpu:nvidia-rtx-5080");
    expect(out.contentWarnings).toEqual(["spoiler_story"]);
  });

  it("limits the result to the given fields", () => {
    const out = sanitizeEditorFields({ gameName: "Hades", channelName: "Me" }, ["channelName"]);
    expect(out).toEqual({ channelName: "Me" });
  });
});

describe("row sanitizers", () => {
  it("gives unsafe or repeated ids a new one", () => {
    const keeper = new IdKeeper();
    expect(keeper.take("abc-1")).toBe("abc-1");
    expect(keeper.take("abc-1")).not.toBe("abc-1");
    expect(keeper.take("../../etc")).not.toBe("../../etc");
    expect(keeper.take(42)).toMatch(/^[0-9a-f-]{36}$/);
  });

  it("builds a complete profile from a partial one", () => {
    const profile = sanitizeProfile(
      { id: "p1", name: "  ", channelName: "Skullmute", rig: null, vnMomo: "0900", junk: 1 },
      new IdKeeper(),
      NOW,
    );
    expect(profile).toMatchObject({
      id: "p1",
      name: "Skullmute",
      channelName: "Skullmute",
      rig: {},
      social: {},
      vnMomo: "0900",
      createdAt: NOW,
      updatedAt: NOW,
    });
    expect(profile).not.toHaveProperty("junk");
    expect(sanitizeProfile("nope", new IdKeeper(), NOW)).toBeNull();
  });

  it("drops presets without a game name and keeps per-game fields", () => {
    const keeper = new IdKeeper();
    expect(sanitizePreset({ id: "g0", gameName: " " }, keeper, NOW)).toBeNull();
    const preset = sanitizePreset(
      {
        id: "g1",
        gameName: "Hades",
        genres: ["roguelike"],
        storeLinkTypes: { steam: "free" },
        playlistLink: "https://youtube.com/playlist?list=PL1",
        showGameCopyright: true,
        partNumber: "7",
      },
      keeper,
      NOW,
    );
    expect(preset).toMatchObject({
      gameName: "Hades",
      storeLinkTypes: { steam: "free" },
      playlistLink: "https://youtube.com/playlist?list=PL1",
      showGameCopyright: true,
    });
    expect(preset).not.toHaveProperty("partNumber");
  });

  it("requires a template snapshot object and cleans it", () => {
    expect(sanitizeTemplate({ id: "t0", snapshot: null }, new IdKeeper(), NOW)).toBeNull();
    const template = sanitizeTemplate(
      { id: "t1", name: "Boss run", snapshot: { gameName: "Hades", reset: "x", rig: null } },
      new IdKeeper(),
      NOW,
    );
    expect(template?.snapshot).toEqual({ gameName: "Hades", rig: {} });
  });

  it("falls back to safe choices in history rows", () => {
    const entry = sanitizeHistoryEntry(
      { id: "h1", title: "T", videoType: "???", language: "vi", genres: ["rpg", 1] },
      new IdKeeper(),
      NOW,
    );
    expect(entry).toMatchObject({ title: "T", language: "vi", genres: ["rpg"], createdAt: NOW });
    expect(entry?.videoType).not.toBe("???");
    expect(sanitizeHistoryEntry({ id: "h2" }, new IdKeeper(), NOW)).toBeNull();
  });
});

describe("settings", () => {
  it("never exports or imports consent and panel state", () => {
    const current = {
      ...initialSettings,
      legalConsentVersion: 2,
      legalConsentAt: "2026-09-01T00:00:00Z",
      sidebarCollapsed: true,
    };
    expect(portableSettings(current)).not.toHaveProperty("legalConsentVersion");
    expect(portableSettings(current)).not.toHaveProperty("editorAccordionState");
    const imported = sanitizeSettings(
      { theme: "light", legalConsentVersion: 0, sidebarCollapsed: false, historyLimit: 99999 },
      current,
    );
    expect(imported.theme).toBe("light");
    expect(imported.legalConsentVersion).toBe(2);
    expect(imported.sidebarCollapsed).toBe(true);
    expect(imported.historyLimit).toBe(500);
  });
});

describe("sanitizeSections", () => {
  it("migrates, cleans and counts what it drops", () => {
    const result = sanitizeSections(
      {
        presets: {
          version: 1,
          tooNew: false,
          items: [{ id: "g1", gameName: "Hades", genre: "roguelike", storeLinks: {} }, 7],
        },
        history: {
          version: 2,
          tooNew: false,
          items: [
            {
              id: "a",
              gameName: "G",
              videoType: "part",
              language: "en",
              title: "T",
              createdAt: NOW,
            },
            {
              id: "b",
              gameName: "G",
              videoType: "part",
              language: "en",
              title: "T",
              createdAt: NOW,
            },
          ],
        },
        draft: {
          version: 18,
          tooNew: false,
          value: { gameName: "Hades", rig: { gpu: "amd|rx_9000|RX 9070 XT" } },
        },
        profiles: { version: 99, tooNew: true, items: [{ id: "p" }] },
      },
      initialSettings,
      NOW,
    );
    expect(result.presets?.map((p) => p.genres)).toEqual([["roguelike"]]);
    expect(result.dropped.presets).toBe(1);
    // The history migration folds the duplicate video into one entry.
    expect(result.history).toHaveLength(1);
    expect(result.draft?.gameName).toBe("Hades");
    expect(result.draft?.rig.gpu).toBe("gpu:amd-rx-9070-xt");
    expect(result.profiles).toBeUndefined();
  });
});
