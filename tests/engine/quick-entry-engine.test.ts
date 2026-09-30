import { describe, expect, it } from "vitest";
import { buildTitle } from "@engine/title-builder";
import { buildTitleVariants } from "@engine/title-variants";
import { buildSocialPost, xWeightedLength } from "@engine/social-post-builder";
import { copyAllText, isCopyAllBlocked } from "@engine/limits";
import { SOCIAL_PLATFORMS } from "@config/social-platforms";
import type { GeneratorInput } from "@engine/types";
import { createMockT } from "../helpers/mock-t";

function input(overrides: Partial<GeneratorInput> = {}): GeneratorInput {
  return {
    videoType: "part",
    language: "en",
    genres: ["action"],
    gameName: "Hades",
    channelName: "Skullmute",
    platform: "steam",
    partNumber: "3",
    resolution: "1440p",
    fps: "60",
    spoilerWarning: false,
    matureWarning: false,
    storeLinks: {},
    social: {},
    rig: {},
    ...overrides,
  };
}

describe("title order", () => {
  const t = createMockT("en");

  it("puts the video first when asked, with every badge position", () => {
    expect(buildTitle(input(), t, { order: "typeFirst" })).toBe(
      "Part 3 — Hades [2K] — Gameplay No Commentary",
    );
    expect(buildTitle(input(), t, { order: "typeFirst", badgePosition: "prefix" })).toBe(
      "[2K] Part 3 — Hades — Gameplay No Commentary",
    );
    expect(buildTitle(input(), t, { order: "typeFirst", badgePosition: "suffix" })).toBe(
      "Part 3 — Hades — [2K] Gameplay No Commentary",
    );
  });

  it("treats a missing option as the default instead of undefined", () => {
    expect(buildTitle(input(), t, { order: undefined, badgePosition: undefined })).toBe(
      buildTitle(input(), t),
    );
  });

  it("builds variants with the user's separator, and says which format each is", () => {
    const variants = buildTitleVariants(input(), t, { separator: "pipe", showQualityBadge: true });
    expect(variants.map((v) => v.format)).toEqual([
      { order: "gameFirst", badgePosition: "middle" },
      { order: "typeFirst", badgePosition: "middle" },
      { order: "gameFirst", badgePosition: "prefix" },
    ]);
    for (const v of variants) expect(v.title).toContain(" | ");
  });
});

describe("X's weighted length", () => {
  it("counts Latin once and CJK, Vietnamese diacritics and emoji twice", () => {
    expect(xWeightedLength("Hades")).toBe(5);
    expect(xWeightedLength("日本")).toBe(4);
    expect(xWeightedLength("Việt")).toBe(5); // ệ is in Latin Extended Additional
    expect(xWeightedLength("🎮")).toBe(2);
    expect(xWeightedLength("👩‍🚀")).toBe(2);
    expect(xWeightedLength("“quotes”")).toBe(8);
  });
});

describe("social posts for the new platforms", () => {
  const t = createMockT("en");
  const platform = (id: string) => {
    const found = SOCIAL_PLATFORMS.find((p) => p.id === id);
    if (!found) throw new Error(id);
    return found;
  };

  it("caps hashtags per platform", () => {
    const threads = platform("threads");
    const post = buildSocialPost(input(), t, {
      charLimit: threads.charLimit,
      popularHashtags: threads.popularHashtags,
      maxHashtags: threads.maxHashtags,
    });
    const tags = post.text.split(/\s+/).filter((w) => w.startsWith("#"));
    expect(tags).toEqual(["#Hades"]);
  });

  it("fits X with its own count", () => {
    const x = platform("x");
    const post = buildSocialPost(input({ rig: { cpu: "AMD Ryzen 7 9800X3D" } }), t, {
      charLimit: x.charLimit,
      popularHashtags: x.popularHashtags,
      maxHashtags: x.maxHashtags,
      countMode: x.countMode,
    });
    expect(post.charCount).toBe(xWeightedLength(post.text));
    expect(post.isOver).toBe(false);
  });
});

describe("Copy All", () => {
  const output = { title: "T", description: "D", tagString: "a, b" };
  const over = (field: "title" | "description" | "tags") => ({
    overflows: [{ field, current: 999, limit: 1 }],
  });

  it("adds the tags only when asked", () => {
    expect(copyAllText(output, false)).toBe("T\n\nD");
    expect(copyAllText(output, true)).toBe("T\n\nD\n\na, b");
    expect(copyAllText({ ...output, tagString: "" }, true)).toBe("T\n\nD");
  });

  it("is blocked by the tags only when it includes them", () => {
    expect(isCopyAllBlocked(over("tags") as never, false)).toBe(false);
    expect(isCopyAllBlocked(over("tags") as never, true)).toBe(true);
    expect(isCopyAllBlocked(over("title") as never, false)).toBe(true);
  });
});
