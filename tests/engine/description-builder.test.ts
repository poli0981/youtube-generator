import { describe, it, expect } from "vitest";
import { buildDescription, checkDescriptionWarning } from "@engine/description-builder";
import { createMockT } from "../helpers/mock-t";
import type { GeneratorInput } from "@engine/types";

function makeInput(overrides: Partial<GeneratorInput> = {}): GeneratorInput {
  return {
    videoType: "full",
    language: "en",
    genres: ["action"],
    gameName: "Elden Ring",
    channelName: "TestChannel",
    platform: "steam",
    spoilerWarning: false,
    matureWarning: false,
    storeLinks: {},
    social: {},
    rig: {},
    ...overrides,
  };
}

describe("buildDescription", () => {
  it("generates minimal description with only required fields", () => {
    const t = createMockT("en");
    const result = buildDescription(makeInput(), t);

    expect(result).toContain("full gameplay of Elden Ring on TestChannel");
    expect(result).toContain("No Commentary");
    expect(result).toContain("Like | 🔔 Subscribe");
    expect(result).toContain("#EldenRing");
  });

  it("sanitises hashtags for game names with special characters", () => {
    const t = createMockT("en");
    const result = buildDescription(
      makeInput({ gameName: "S.T.A.L.K.E.R. 2" }),
      t,
    );
    expect(result).toContain("#STALKER2");
    expect(result).not.toMatch(/#\s?S\./);
  });

  it("sanitises hashtags for snake_case genre ids (fixes #visual_novel bug)", () => {
    const t = createMockT("en");
    const result = buildDescription(makeInput({ genres: ["visual_novel"] }), t);
    expect(result).toContain("#visualnovel");
    expect(result).not.toContain("#visual_novel");
  });

  it("uses the first genre for the hashtag when multiple are selected", () => {
    const t = createMockT("en");
    const result = buildDescription(
      makeInput({ genres: ["hack_slash", "action", "soulslike"] }),
      t,
    );
    expect(result).toContain("#hackslash");
    expect(result).not.toContain("#action");
    expect(result).not.toContain("#soulslike");
  });

  it("includes timestamps when provided", () => {
    const t = createMockT("en");
    const result = buildDescription(
      makeInput({ timestamps: "0:00 Intro\n5:30 Boss" }),
      t,
    );
    expect(result).toContain("TIMESTAMPS");
    expect(result).toContain("0:00 Intro");
    expect(result).toContain("5:30 Boss");
  });

  it("includes store links when provided (paid default → Buy heading)", () => {
    const t = createMockT("en");
    const result = buildDescription(
      makeInput({ storeLinks: { Steam: "https://store.steampowered.com/app/123" } }),
      t,
    );
    expect(result).toContain("GET THE GAME (if you want to buy)");
    expect(result).toContain("Steam: https://store.steampowered.com/app/123");
    expect(result).not.toContain("DOWNLOAD THE GAME");
  });

  it("switches to Download heading when majority of links are free/demo", () => {
    const t = createMockT("en");
    const result = buildDescription(
      makeInput({
        storeLinks: {
          steam: "https://store.steampowered.com/app/1",
          itchio: "https://dev.itch.io/demo",
          epic: "https://store.epicgames.com/freegame",
        },
        storeLinkTypes: {
          steam: "paid",
          itchio: "demo",
          epic: "free",
        },
      }),
      t,
    );
    expect(result).toContain("DOWNLOAD THE GAME (if you want to play)");
    expect(result).not.toContain("GET THE GAME");
  });

  it("ties favour the Buy heading", () => {
    const t = createMockT("en");
    const result = buildDescription(
      makeInput({
        storeLinks: {
          steam: "https://store.steampowered.com/app/1",
          itchio: "https://dev.itch.io/game",
        },
        storeLinkTypes: { steam: "paid", itchio: "free" },
      }),
      t,
    );
    // 1 paid, 1 free → nonPaid (1) is NOT > entries.length/2 (1) → Buy
    expect(result).toContain("GET THE GAME (if you want to buy)");
  });

  it("adds (free demo) suffix to demo links", () => {
    const t = createMockT("en");
    const result = buildDescription(
      makeInput({
        storeLinks: { itchio: "https://dev.itch.io/demo" },
        storeLinkTypes: { itchio: "demo" },
      }),
      t,
    );
    expect(result).toContain("(free demo)");
  });

  it("adds (free) suffix to free links but not paid ones", () => {
    const t = createMockT("en");
    const result = buildDescription(
      makeInput({
        storeLinks: {
          steam: "https://store.steampowered.com/app/1",
          itchio: "https://dev.itch.io/game",
        },
        storeLinkTypes: { steam: "paid", itchio: "free" },
      }),
      t,
    );
    // Find the itchio line and make sure it has (free), Steam line does not
    const lines = result.split("\n");
    const itchLine = lines.find((l) => l.includes("itch.io"));
    const steamLine = lines.find((l) => l.includes("steampowered"));
    expect(itchLine).toContain("(free)");
    expect(steamLine).not.toContain("(free)");
  });

  it("defaults unspecified link types to paid", () => {
    const t = createMockT("en");
    const result = buildDescription(
      makeInput({
        storeLinks: { steam: "https://store.steampowered.com/app/1" },
        // storeLinkTypes omitted entirely
      }),
      t,
    );
    expect(result).toContain("GET THE GAME (if you want to buy)");
    expect(result).not.toContain("(free)");
  });

  it("includes video settings", () => {
    const t = createMockT("en");
    const result = buildDescription(
      makeInput({ resolution: "4K", fps: "60", graphicsPreset: "Ultra" }),
      t,
    );
    expect(result).toContain("VIDEO SETTINGS");
    expect(result).toContain("4K | 60 FPS | Ultra");
  });

  it("includes rig info when provided", () => {
    const t = createMockT("en");
    const result = buildDescription(
      makeInput({ rig: { CPU: "i9-14900K", GPU: "RTX 4090" } }),
      t,
    );
    expect(result).toContain("MY RIG");
    expect(result).toContain("CPU: i9-14900K");
    expect(result).toContain("GPU: RTX 4090");
  });

  it("humanises snake_case rig keys (e.g. video_editor → VIDEO EDITOR)", () => {
    const t = createMockT("en");
    const result = buildDescription(
      makeInput({ rig: { video_editor: "davinci_resolve_studio|19.1" } }),
      t,
    );
    expect(result).toContain("VIDEO EDITOR: DaVinci Resolve Studio 19.1");
    expect(result).not.toContain("VIDEO_EDITOR");
  });

  it("includes spoiler warning when enabled", () => {
    const t = createMockT("en");
    const result = buildDescription(makeInput({ spoilerWarning: true }), t);
    expect(result).toContain("SPOILER WARNING");
  });

  it("includes mature warning when enabled", () => {
    const t = createMockT("en");
    const result = buildDescription(makeInput({ matureWarning: true }), t);
    expect(result).toContain("MATURE CONTENT");
  });

  it("includes social links when provided", () => {
    const t = createMockT("en");
    const result = buildDescription(
      makeInput({ social: { twitter: "https://x.com/test", discord: "https://discord.gg/test" } }),
      t,
    );
    expect(result).toContain("FOLLOW ME");
    expect(result).toContain("Twitter / X: https://x.com/test");
  });

  it("includes playlist link when provided", () => {
    const t = createMockT("en");
    const result = buildDescription(
      makeInput({ playlistLink: "https://youtube.com/playlist?list=abc" }),
      t,
    );
    expect(result).toContain("Watch the full series: https://youtube.com/playlist?list=abc");
  });

  it("includes contact email when provided", () => {
    const t = createMockT("en");
    const result = buildDescription(
      makeInput({ contactEmail: "test@example.com" }),
      t,
    );
    expect(result).toContain("Business inquiries: test@example.com");
  });

  it("generates part description correctly", () => {
    const t = createMockT("en");
    const result = buildDescription(
      makeInput({ videoType: "part", partNumber: "5" }),
      t,
    );
    expect(result).toContain("Part 5 of Elden Ring");
  });

  it("generates boss description correctly", () => {
    const t = createMockT("en");
    const result = buildDescription(
      makeInput({ videoType: "boss", bossName: "Margit" }),
      t,
    );
    expect(result).toContain("Margit boss fight");
  });

  it("generates description in Vietnamese", () => {
    const t = createMockT("vi");
    const result = buildDescription(makeInput({ language: "vi" }), t);
    expect(result).toContain("full gameplay của Elden Ring");
    expect(result).toContain("Không bình luận");
  });
});

describe("checkDescriptionWarning", () => {
  it("returns null for description under limit", () => {
    expect(checkDescriptionWarning("Short description")).toBeNull();
  });

  it("returns warning for description exceeding 5000 chars", () => {
    const longDesc = "A".repeat(5001);
    const warning = checkDescriptionWarning(longDesc);
    expect(warning).not.toBeNull();
    expect(warning!.field).toBe("description");
    expect(warning!.limit).toBe(5000);
  });
});
