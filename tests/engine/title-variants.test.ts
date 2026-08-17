import { describe, it, expect } from "vitest";
import { buildTitleVariants } from "@engine/title-variants";
import { createMockT } from "../helpers/mock-t";
import type { GeneratorInput } from "@engine/types";

function makeInput(overrides: Partial<GeneratorInput> = {}): GeneratorInput {
  return {
    videoType: "part",
    language: "en",
    genres: ["action"],
    gameName: "Elden Ring",
    channelName: "TestChannel",
    platform: "steam",
    partNumber: "1",
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

describe("buildTitleVariants", () => {
  it("returns exactly 3 variants with the expected ids", () => {
    const t = createMockT("en");
    const variants = buildTitleVariants(makeInput(), t);
    expect(variants).toHaveLength(3);
    expect(variants.map((v) => v.id)).toEqual(["default", "typeFirst", "qualityFirst"]);
  });

  it("default variant matches the primary buildTitle output", () => {
    const t = createMockT("en");
    const [defaultVariant] = buildTitleVariants(makeInput(), t);
    expect(defaultVariant!.title).toBe("Elden Ring — Part 1 [2K] — Gameplay No Commentary");
  });

  it("typeFirst swaps game name and video type, keeps badge on game", () => {
    const t = createMockT("en");
    const [, typeFirst] = buildTitleVariants(makeInput(), t);
    expect(typeFirst!.title).toBe("Part 1 — Elden Ring [2K] — Gameplay No Commentary");
  });

  it("qualityFirst puts the badge at the start", () => {
    const t = createMockT("en");
    const [, , qualityFirst] = buildTitleVariants(makeInput(), t);
    expect(qualityFirst!.title).toBe("[2K] Elden Ring — Part 1 — Gameplay No Commentary");
  });

  it("drops the badge entirely when showQualityBadge is false", () => {
    const t = createMockT("en");
    const variants = buildTitleVariants(makeInput(), t, false);
    for (const v of variants) {
      expect(v.title).not.toContain("[");
    }
  });

  it("qualityFirst falls back to default when the badge is empty (1080p 60fps)", () => {
    const t = createMockT("en");
    const variants = buildTitleVariants(makeInput({ resolution: "1080p", fps: "60" }), t);
    const defaultTitle = variants.find((v) => v.id === "default")!.title;
    const qualityFirstTitle = variants.find((v) => v.id === "qualityFirst")!.title;
    expect(qualityFirstTitle).toBe(defaultTitle);
  });

  it("renders the mod name in the type-first variant", () => {
    const t = createMockT("en");
    const [, typeFirst] = buildTitleVariants(
      makeInput({ videoType: "mods", modName: "Requiem", resolution: "1080p", fps: "60" }),
      t,
    );
    expect(typeFirst!.title).toContain("Requiem Mods");
  });
});
