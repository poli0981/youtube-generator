import { describe, it, expect } from "vitest";
import { buildDescription, checkDescriptionWarning } from "@engine/description-builder";
import { createMockT } from "../helpers/mock-t";
import type { GeneratorInput } from "@engine/types";

function makeInput(overrides: Partial<GeneratorInput> = {}): GeneratorInput {
  return {
    videoType: "full",
    language: "en",
    genre: "action",
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

  it("includes store links when provided", () => {
    const t = createMockT("en");
    const result = buildDescription(
      makeInput({ storeLinks: { Steam: "https://store.steampowered.com/app/123" } }),
      t,
    );
    expect(result).toContain("GET THE GAME");
    expect(result).toContain("Steam: https://store.steampowered.com/app/123");
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
    expect(result).toContain("twitter: https://x.com/test");
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
