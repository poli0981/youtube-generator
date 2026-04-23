import { describe, it, expect } from "vitest";
import { sanitizeHashtag, humanizeId } from "@utils/sanitize";

describe("sanitizeHashtag", () => {
  it("drops spaces", () => {
    expect(sanitizeHashtag("Elden Ring")).toBe("EldenRing");
  });

  it("drops periods and colons", () => {
    expect(sanitizeHashtag("S.T.A.L.K.E.R. 2")).toBe("STALKER2");
    expect(sanitizeHashtag("Yakuza: Like a Dragon")).toBe("YakuzaLikeaDragon");
  });

  it("drops apostrophes, hyphens, ampersands, parentheses", () => {
    expect(sanitizeHashtag("Assassin's Creed")).toBe("AssassinsCreed");
    expect(sanitizeHashtag("Spider-Man")).toBe("SpiderMan");
    expect(sanitizeHashtag("Sonic & Knuckles")).toBe("SonicKnuckles");
    expect(sanitizeHashtag("Prey (2017)")).toBe("Prey2017");
  });

  it("drops underscores (fixes #visual_novel bug)", () => {
    expect(sanitizeHashtag("visual_novel")).toBe("visualnovel");
    expect(sanitizeHashtag("survival_craft")).toBe("survivalcraft");
    expect(sanitizeHashtag("tower_defense")).toBe("towerdefense");
  });

  it("keeps digits and letters intact", () => {
    expect(sanitizeHashtag("Cyberpunk 2077")).toBe("Cyberpunk2077");
    expect(sanitizeHashtag("100% Orange Juice")).toBe("100OrangeJuice");
  });

  it("preserves non-Latin scripts", () => {
    expect(sanitizeHashtag("仁王 2")).toBe("仁王2");
    expect(sanitizeHashtag("プレイ動画")).toBe("プレイ動画");
    expect(sanitizeHashtag("게임 플레이")).toBe("게임플레이");
  });

  it("preserves accented characters", () => {
    expect(sanitizeHashtag("Pokémon Violet")).toBe("PokémonViolet");
    expect(sanitizeHashtag("Café World")).toBe("CaféWorld");
  });

  it("handles empty input", () => {
    expect(sanitizeHashtag("")).toBe("");
    expect(sanitizeHashtag("   ")).toBe("");
    expect(sanitizeHashtag("!!!")).toBe("");
  });

  it("drops emojis", () => {
    expect(sanitizeHashtag("🎮 Elden Ring 🔥")).toBe("EldenRing");
  });
});

describe("humanizeId", () => {
  it("replaces underscores with spaces", () => {
    expect(humanizeId("visual_novel")).toBe("visual novel");
    expect(humanizeId("survival_craft")).toBe("survival craft");
    expect(humanizeId("tower_defense")).toBe("tower defense");
  });

  it("leaves single-word ids untouched", () => {
    expect(humanizeId("action")).toBe("action");
    expect(humanizeId("rpg")).toBe("rpg");
  });

  it("handles multiple underscores", () => {
    expect(humanizeId("a_b_c_d")).toBe("a b c d");
  });
});
