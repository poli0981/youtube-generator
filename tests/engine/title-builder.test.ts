import { describe, it, expect } from "vitest";
import { buildTitle, checkTitleWarning } from "@engine/title-builder";
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
