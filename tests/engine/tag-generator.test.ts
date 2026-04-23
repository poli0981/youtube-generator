import { describe, it, expect } from "vitest";
import { generateTags, formatTagString } from "@engine/tag-generator";
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

describe("generateTags", () => {
  it("includes core tags", () => {
    const tags = generateTags(makeInput());
    expect(tags).toContain("Elden Ring gameplay");
    expect(tags).toContain("Elden Ring no commentary");
    expect(tags).toContain("gameplay no commentary");
  });

  it("includes genre-specific tags for action", () => {
    const tags = generateTags(makeInput({ genres: ["action"] }));
    expect(tags.some((t) => t.toLowerCase().includes("action"))).toBe(true);
  });

  it("includes genre-specific tags for horror", () => {
    const tags = generateTags(makeInput({ genres: ["horror"] }));
    expect(tags.some((t) => t.toLowerCase().includes("horror"))).toBe(true);
  });

  it("includes genre-specific tags for rpg", () => {
    const tags = generateTags(makeInput({ genres: ["rpg"] }));
    expect(tags.some((t) => t.toLowerCase().includes("rpg"))).toBe(true);
  });

  it("includes video type tags for boss", () => {
    const tags = generateTags(makeInput({ videoType: "boss" }));
    expect(tags.some((t) => t.toLowerCase().includes("boss"))).toBe(true);
  });

  it("humanises snake_case genres in trending tags (fixes visual_novel leak)", () => {
    const tags = generateTags(
      makeInput({ genres: ["visual_novel"] }),
      { includeTrendingTags: true },
    );
    // No tag should contain the raw underscore form
    expect(tags.every((t) => !t.includes("visual_novel"))).toBe(true);
    // The humanised form should be present in the trending tags
    const year = new Date().getFullYear().toString();
    expect(tags.some((t) => t === `best visual novel games ${year}`)).toBe(true);
    expect(tags.some((t) => t === `visual novel gameplay ${year}`)).toBe(true);
  });

  it("includes video type tags for speedrun", () => {
    const tags = generateTags(makeInput({ videoType: "speedrun" }));
    expect(tags.some((t) => t.toLowerCase().includes("speedrun"))).toBe(true);
  });

  it("includes multilingual tags only for the selected language (Japanese)", () => {
    const tags = generateTags(makeInput({ language: "ja" }));
    expect(tags.some((t) => t.includes("ゲームプレイ"))).toBe(true);
    // Should NOT leak other languages
    expect(tags.some((t) => t.includes("không bình luận"))).toBe(false);
    expect(tags.some((t) => t.includes("게임플레이"))).toBe(false);
  });

  it("includes multilingual tags only for the selected language (Vietnamese)", () => {
    const tags = generateTags(makeInput({ language: "vi" }));
    expect(tags.some((t) => t.includes("không bình luận"))).toBe(true);
    expect(tags.some((t) => t.includes("ゲームプレイ"))).toBe(false);
    expect(tags.some((t) => t.includes("游戏实况"))).toBe(false);
  });

  it("includes visual novel tags for visual_novel genre", () => {
    const tags = generateTags(makeInput({ genres: ["visual_novel"] }));
    expect(tags.some((t) => t.toLowerCase().includes("visual novel"))).toBe(true);
  });

  it("includes full_demo tags for full_demo video type", () => {
    const tags = generateTags(makeInput({ videoType: "full_demo" }));
    expect(tags.some((t) => t.toLowerCase().includes("demo"))).toBe(true);
  });

  it("has no duplicate tags (case-insensitive)", () => {
    const tags = generateTags(makeInput());
    const lowerTags = tags.map((t) => t.toLowerCase());
    const unique = new Set(lowerTags);
    expect(lowerTags.length).toBe(unique.size);
  });

  it("does not exceed 500 character limit for tag string", () => {
    const tags = generateTags(makeInput());
    const tagString = formatTagString(tags);
    expect(tagString.length).toBeLessThanOrEqual(500);
  });

  it("each tag does not exceed 30 characters", () => {
    const tags = generateTags(makeInput());
    for (const tag of tags) {
      expect(tag.length).toBeLessThanOrEqual(30);
    }
  });

  it("includes trending tags with current year", () => {
    const tags = generateTags(makeInput());
    const year = new Date().getFullYear().toString();
    expect(tags.some((t) => t.includes(year))).toBe(true);
  });

  it("includes platform tags", () => {
    const tags = generateTags(makeInput({ platform: "steam" }));
    expect(tags.some((t) => t.toLowerCase().includes("steam"))).toBe(true);
  });
});

describe("formatTagString", () => {
  it("joins tags with comma and space", () => {
    expect(formatTagString(["a", "b", "c"])).toBe("a, b, c");
  });

  it("returns empty string for empty array", () => {
    expect(formatTagString([])).toBe("");
  });
});
