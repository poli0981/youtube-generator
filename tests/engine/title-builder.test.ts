import { describe, it, expect } from "vitest";
import { buildTitle, buildQualityBadge, checkTitleWarning } from "@engine/title-builder";
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

describe("buildTitle", () => {
  it("generates full gameplay title in English", () => {
    const t = createMockT("en");
    const result = buildTitle(makeInput(), t);
    expect(result).toBe("Elden Ring — Gameplay No Commentary");
  });

  it("generates part title with number", () => {
    const t = createMockT("en");
    const result = buildTitle(makeInput({ videoType: "part", partNumber: "5" }), t);
    expect(result).toBe("Elden Ring — Part 5 — Gameplay No Commentary");
  });

  it("generates boss title with boss name", () => {
    const t = createMockT("en");
    const result = buildTitle(
      makeInput({ videoType: "boss", bossName: "Margit" }),
      t,
    );
    expect(result).toBe("Elden Ring — Margit Boss Fight — Gameplay No Commentary");
  });

  it("generates boss no hit title", () => {
    const t = createMockT("en");
    const result = buildTitle(
      makeInput({ videoType: "boss_nohit", bossName: "Margit" }),
      t,
    );
    expect(result).toBe("Elden Ring — Margit Boss No Hit — Gameplay No Commentary");
  });

  it("generates ending title", () => {
    const t = createMockT("en");
    const result = buildTitle(makeInput({ videoType: "ending" }), t);
    expect(result).toBe("Elden Ring — Ending — Gameplay No Commentary");
  });

  it("generates speedrun title", () => {
    const t = createMockT("en");
    const result = buildTitle(makeInput({ videoType: "speedrun" }), t);
    expect(result).toBe("Elden Ring — Speedrun — Gameplay No Commentary");
  });

  it("generates 100% title", () => {
    const t = createMockT("en");
    const result = buildTitle(makeInput({ videoType: "100percent" }), t);
    expect(result).toBe("Elden Ring — 100% Completion — Gameplay No Commentary");
  });

  it("generates boss title in Japanese", () => {
    const t = createMockT("ja");
    const input = makeInput({
      videoType: "boss",
      bossName: "マルギット",
      gameName: "エルデンリング",
      language: "ja",
    });
    const result = buildTitle(input, t);
    expect(result).toBe("エルデンリング — マルギット ボス戦 — Gameplay No Commentary");
  });

  it("generates part title in Vietnamese", () => {
    const t = createMockT("vi");
    const result = buildTitle(
      makeInput({ videoType: "part", partNumber: "3", language: "vi" }),
      t,
    );
    expect(result).toBe("Elden Ring — Phần 3 — Gameplay No Commentary");
  });

  it("uses localized game name when available", () => {
    const t = createMockT("ja");
    const input = makeInput({
      language: "ja",
      gameName: "Elden Ring",
      gameNameLocalized: { ja: "エルデンリング" },
    });
    const result = buildTitle(input, t);
    expect(result).toBe("エルデンリング — Gameplay No Commentary");
  });

  it("appends quality badge after the video-type segment", () => {
    const t = createMockT("en");
    const result = buildTitle(
      makeInput({ videoType: "part", partNumber: "5", resolution: "1440p", fps: "60" }),
      t,
    );
    expect(result).toBe("Elden Ring — Part 5 [2K] — Gameplay No Commentary");
  });

  it("includes resolution alongside non-default FPS for clarity", () => {
    const t = createMockT("en");
    const result = buildTitle(
      makeInput({ videoType: "part", partNumber: "1", resolution: "1080p", fps: "120" }),
      t,
    );
    expect(result).toBe("Elden Ring — Part 1 [1080p 120FPS] — Gameplay No Commentary");
  });

  it("combines resolution and FPS when both are non-default", () => {
    const t = createMockT("en");
    const result = buildTitle(
      makeInput({ resolution: "4K", fps: "120" }),
      t,
    );
    // videoType "full" renders empty, so the badge becomes its own segment
    expect(result).toBe("Elden Ring — [4K 120FPS] — Gameplay No Commentary");
  });

  it("omits the quality badge at defaults", () => {
    const t = createMockT("en");
    const result = buildTitle(
      makeInput({ videoType: "part", partNumber: "2", resolution: "1080p", fps: "60" }),
      t,
    );
    expect(result).toBe("Elden Ring — Part 2 — Gameplay No Commentary");
  });

  it("respects the showQualityBadge flag", () => {
    const t = createMockT("en");
    const result = buildTitle(
      makeInput({ videoType: "boss", bossName: "Margit", resolution: "4K", fps: "60" }),
      t,
      false,
    );
    expect(result).toBe("Elden Ring — Margit Boss Fight — Gameplay No Commentary");
  });

  it("renders mods video type with mod name", () => {
    const t = createMockT("en");
    const result = buildTitle(
      makeInput({ videoType: "mods", modName: "Requiem" }),
      t,
    );
    expect(result).toBe("Elden Ring — Requiem Mods — Gameplay No Commentary");
  });

  it("renders collectibles video type", () => {
    const t = createMockT("en");
    const result = buildTitle(makeInput({ videoType: "collectibles" }), t);
    expect(result).toBe("Elden Ring — All Collectibles — Gameplay No Commentary");
  });
});

describe("buildQualityBadge", () => {
  it("returns empty at defaults (1080p 60fps)", () => {
    expect(buildQualityBadge("1080p", "60")).toBe("");
  });

  it("maps 1440p to 2K", () => {
    expect(buildQualityBadge("1440p", "60")).toBe("2K");
  });

  it("keeps 720p and 4K as-is", () => {
    expect(buildQualityBadge("720p", "60")).toBe("720p");
    expect(buildQualityBadge("4K", "60")).toBe("4K");
  });

  it("joins resolution and non-default FPS", () => {
    expect(buildQualityBadge("4K", "120")).toBe("4K 120FPS");
    expect(buildQualityBadge("1440p", "144")).toBe("2K 144FPS");
  });

  it("includes default resolution when only FPS is non-default", () => {
    expect(buildQualityBadge("1080p", "120")).toBe("1080p 120FPS");
  });

  it("falls back to defaults when inputs are undefined", () => {
    expect(buildQualityBadge(undefined, undefined)).toBe("");
  });
});

describe("checkTitleWarning", () => {
  it("returns null for title under limit", () => {
    expect(checkTitleWarning("Short title")).toBeNull();
  });

  it("returns warning for title exceeding 100 chars", () => {
    const longTitle = "A".repeat(101);
    const warning = checkTitleWarning(longTitle);
    expect(warning).not.toBeNull();
    expect(warning!.field).toBe("title");
    expect(warning!.current).toBe(101);
    expect(warning!.limit).toBe(100);
  });
});
