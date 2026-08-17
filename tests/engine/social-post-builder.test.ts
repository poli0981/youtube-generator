import { describe, it, expect } from "vitest";
import { buildSocialPost, buildAllSocialPosts } from "@engine/social-post-builder";
import { SOCIAL_PLATFORMS } from "@config/social-platforms";
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

const baseOpts = {
  charLimit: 4000,
  popularHashtags: ["#fyp", "#gaming"],
};

describe("buildSocialPost", () => {
  it("includes the title and the derived + popular hashtags", () => {
    const t = createMockT("en");
    const { text } = buildSocialPost(makeInput(), t, baseOpts);
    expect(text).toContain("Elden Ring");
    expect(text).toContain("#EldenRing");
    expect(text).toContain("#GameplayNoCommentary");
    expect(text).toContain("#action");
    expect(text).toContain("#fyp");
    expect(text).toContain("#gaming");
  });

  it("suppresses the quality badge (short-form title)", () => {
    const t = createMockT("en");
    const { text } = buildSocialPost(makeInput({ resolution: "4K", fps: "120" }), t, baseOpts);
    expect(text).not.toContain("[4K");
    expect(text).not.toContain("120FPS");
  });

  it("sanitizes hashtags for special characters and snake_case genres", () => {
    const t = createMockT("en");
    const { text } = buildSocialPost(
      makeInput({ gameName: "S.T.A.L.K.E.R. 2", genres: ["visual_novel"] }),
      t,
      baseOpts,
    );
    expect(text).toContain("#STALKER2");
    expect(text).toContain("#visualnovel");
  });

  it("uses only the first genre for the hashtag", () => {
    const t = createMockT("en");
    const { text } = buildSocialPost(makeInput({ genres: ["hack_slash", "action"] }), t, baseOpts);
    expect(text).toContain("#hackslash");
    expect(text).not.toContain("#action");
  });

  it("dedupes a popular hashtag that matches a derived one (case-insensitive)", () => {
    const t = createMockT("en");
    const { text } = buildSocialPost(makeInput({ genres: ["action"] }), t, {
      charLimit: 4000,
      popularHashtags: ["#Action", "#gaming"],
    });
    const matches = text.match(/#action/gi) ?? [];
    expect(matches).toHaveLength(1);
  });

  it("includes the MY RIG block when rig fields are set", () => {
    const t = createMockT("en");
    const { text } = buildSocialPost(
      makeInput({ rig: { ram: "16|DDR5", cpu: "Ryzen 9 7950X" } }),
      t,
      baseOpts,
    );
    expect(text).toContain("RAM: 16 GB DDR5");
    expect(text).toContain("CPU: Ryzen 9 7950X");
  });

  it("omits the rig block when no rig fields are set", () => {
    const t = createMockT("en");
    const { text } = buildSocialPost(makeInput({ rig: {} }), t, baseOpts);
    expect(text).not.toContain("MY RIG");
  });

  it("renders content warnings bilingually (vi + tEn)", () => {
    const t = createMockT("vi");
    const tEn = createMockT("en");
    const { text } = buildSocialPost(
      makeInput({ language: "vi", contentWarnings: ["flashing_lights"] }),
      t,
      { ...baseOpts, tEn },
    );
    // `• EN · LOCAL` bullet — English label + middot separator.
    expect(text).toContain("·");
    expect(text.toLowerCase()).toContain("flashing");
  });

  it("adds the copyright line only when enabled and channelName is set", () => {
    const t = createMockT("en");
    const on = buildSocialPost(makeInput(), t, {
      ...baseOpts,
      showCopyright: true,
    });
    expect(on.text).toContain("TestChannel");
    const off = buildSocialPost(makeInput(), t, {
      ...baseOpts,
      showCopyright: false,
    });
    expect(off.text).not.toContain("TestChannel");
  });

  it("adds the sponsor thanks only when enabled and both fields are set", () => {
    const t = createMockT("en");
    const on = buildSocialPost(makeInput({ sponsorName: "Ubisoft", sponsorPlatform: "Steam" }), t, {
      ...baseOpts,
      showSponsorCredit: true,
    });
    expect(on.text).toContain("Ubisoft");
    const partial = buildSocialPost(makeInput({ sponsorName: "Ubisoft", sponsorPlatform: "" }), t, {
      ...baseOpts,
      showSponsorCredit: true,
    });
    expect(partial.text).not.toContain("Thanks to Ubisoft");
  });

  it("drops optional blocks (warnings first) to fit a tight limit, keeping title + hashtags", () => {
    const t = createMockT("en");
    const tEn = createMockT("en");
    const result = buildSocialPost(
      makeInput({
        contentWarnings: ["flashing_lights", "loud_noises"],
        rig: { cpu: "Ryzen 9 7950X" },
      }),
      t,
      { charLimit: 120, popularHashtags: ["#fyp"], showCopyright: true, tEn },
    );
    expect(result.droppedBlocks[0]).toBe("warnings");
    expect(result.text).toContain("Elden Ring");
    expect(result.text).toContain("#EldenRing");
  });

  it("flags isOver when even the minimal caption exceeds the limit", () => {
    const t = createMockT("en");
    const { isOver } = buildSocialPost(makeInput(), t, {
      charLimit: 5,
      popularHashtags: [],
    });
    expect(isOver).toBe(true);
  });
});

describe("buildAllSocialPosts", () => {
  it("returns one caption per platform, each carrying the game hashtag", () => {
    const t = createMockT("en");
    const all = buildAllSocialPosts(makeInput(), t, SOCIAL_PLATFORMS, {});
    for (const p of SOCIAL_PLATFORMS) {
      expect(all[p.id]).toBeDefined();
      expect(all[p.id]!.text).toContain("#EldenRing");
    }
  });
});
