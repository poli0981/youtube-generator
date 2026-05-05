import { describe, it, expect } from "vitest";
import {
  generateTags,
  formatTagString,
  tagFriendlyGameName,
} from "@engine/tag-generator";
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

  it("includes video type tags for mods", () => {
    const tags = generateTags(makeInput({ videoType: "mods" }));
    expect(tags.some((t) => t.toLowerCase().includes("mod"))).toBe(true);
    expect(tags).toContain("modded gameplay no commentary");
  });

  it("includes video type tags for collectibles", () => {
    const tags = generateTags(makeInput({ videoType: "collectibles" }));
    expect(tags.some((t) => t.toLowerCase().includes("collectibles"))).toBe(true);
    expect(tags).toContain("Elden Ring all collectibles");
  });

  it("includes video type tags for livestream", () => {
    const tags = generateTags(makeInput({ videoType: "livestream" }));
    expect(tags).toContain("livestream");
    expect(tags).toContain("live gameplay");
    expect(tags.some((t) => /elden ring (live|stream)/i.test(t))).toBe(true);
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

describe("tagFriendlyGameName", () => {
  it("returns the input unchanged when it already fits", () => {
    expect(tagFriendlyGameName("Elden Ring", 30)).toBe("Elden Ring");
  });

  it("strips a trailing 'Definitive Edition' qualifier", () => {
    expect(tagFriendlyGameName("Some Game: Definitive Edition", 30)).toBe(
      "Some Game",
    );
  });

  it("iteratively strips multiple trailing qualifiers", () => {
    expect(
      tagFriendlyGameName(
        "Tony Hawk's Pro Skater 1+2 Remastered: Definitive Edition",
        30,
      ),
    ).toBe("Tony Hawk's Pro Skater 1+2");
  });

  it("strips trademark marks", () => {
    expect(tagFriendlyGameName("Halo™ Infinite", 30)).toBe("Halo Infinite");
  });

  it("falls back to the head before a colon when stripping qualifiers isn't enough", () => {
    expect(
      tagFriendlyGameName(
        "A Very Long Subtitle: That Keeps Going Forever Indeed",
        25,
      ),
    ).toBe("A Very Long Subtitle");
  });

  it("falls back to leading-words truncation for unstoppably long names", () => {
    expect(
      tagFriendlyGameName(
        "An Extremely Verbose Name Without Any Qualifiers Whatsoever",
        20,
      ),
    ).toBe("An Extremely Verbose");
  });
});

describe("generateTags — long game names (regression for v0.7 silent drop)", () => {
  it("includes a friendly form of long game names in the tag list", () => {
    const longName =
      "Tony Hawk's Pro Skater 1+2 Remastered: Definitive Edition";
    const tags = generateTags(makeInput({ gameName: longName }));
    const lowered = tags.map((t) => t.toLowerCase());

    // Some form of the game name appears
    expect(lowered.some((t) => t.includes("tony hawk"))).toBe(true);
    // At least one composite mentions the friendly name
    expect(lowered.some((t) => /tony hawk.*gameplay/.test(t))).toBe(true);
    // Per-tag char limit is still respected
    expect(tags.every((t) => t.length <= 30)).toBe(true);
  });

  it("preserves the original full game name when it fits ≤ 30 chars", () => {
    const tags = generateTags(makeInput({ gameName: "Elden Ring" }));
    expect(tags).toContain("Elden Ring");
  });

  it("emits both the long-form bare tag and the short composite form", () => {
    // Bare-name budget = 30, compose budget = 21. A 25-char name falls
    // between these so the two friendly forms differ.
    const longName = "Some Lengthy Game Title XX"; // 26 chars, no qualifier match
    const tags = generateTags(makeInput({ gameName: longName }));
    expect(tags).toContain(longName);
    // Composite must be present and ≤ 30 chars
    expect(tags.some((t) => /gameplay/i.test(t))).toBe(true);
    expect(tags.every((t) => t.length <= 30)).toBe(true);
  });

  it("emits pubDevName as a bare tag when set (v0.10)", () => {
    const tags = generateTags(makeInput({ pubDevName: "FromSoftware" }));
    expect(tags).toContain("FromSoftware");
  });

  it("does not emit a pubDev tag when pubDevName is empty", () => {
    const baseline = generateTags(makeInput());
    const withEmpty = generateTags(makeInput({ pubDevName: "" }));
    const withWhitespace = generateTags(makeInput({ pubDevName: "   " }));
    expect(withEmpty).toEqual(baseline);
    expect(withWhitespace).toEqual(baseline);
  });

  it("dedups pubDevName against sponsorName case-insensitively", () => {
    // sponsorName itself isn't tagged, so this guards against future
    // reintroduction: a user typing the same publisher in both fields
    // should see exactly one bare tag for that name.
    const tags = generateTags(
      makeInput({ sponsorName: "Acme Inc", pubDevName: "ACME INC" }),
    );
    const acme = tags.filter((t) => t.toLowerCase() === "acme inc");
    expect(acme.length).toBe(1);
  });

  it("trims an over-long pubDevName to fit the 30-char per-tag limit", () => {
    const long = "PlatinumGames International Holdings Limited";
    const tags = generateTags(makeInput({ pubDevName: long }));
    expect(tags.every((t) => t.length <= 30)).toBe(true);
    // The trimmed form must start with the original first word so the
    // tag remains a recognisable publisher anchor.
    expect(tags.some((t) => t.startsWith("Platinum"))).toBe(true);
  });
});
