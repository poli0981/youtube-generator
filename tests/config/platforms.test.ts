import { describe, it, expect } from "vitest";
import { PLATFORMS } from "@config/platforms";

const platform = (id: string) => {
  const p = PLATFORMS.find((x) => x.id === id);
  if (!p) throw new Error(`no platform ${id}`);
  return p;
};

describe("store URL patterns (v1.0.0)", () => {
  it("accepts Steam apps, packages, bundles and short links", () => {
    const steam = platform("steam");
    for (const url of [
      "https://store.steampowered.com/app/1245620/ELDEN_RING/",
      "https://store.steampowered.com/sub/469080/",
      "https://store.steampowered.com/bundle/5699/Portal_Bundle/",
      "https://s.team/a/1245620",
    ]) {
      expect(steam.urlPattern.test(url), url).toBe(true);
    }
    expect(steam.urlPattern.test("https://store.steampowered.com/search/?term=elden")).toBe(false);
  });

  it("normalises Steam links to the canonical page", () => {
    const normalize = platform("steam").normalize;
    expect(normalize?.("https://store.steampowered.com/app/1245620/ELDEN_RING/")).toBe(
      "https://store.steampowered.com/app/1245620",
    );
    expect(normalize?.("https://s.team/a/1245620")).toBe(
      "https://store.steampowered.com/app/1245620",
    );
    expect(normalize?.("https://store.steampowered.com/sub/469080/")).toBe(
      "https://store.steampowered.com/sub/469080",
    );
  });

  it("accepts store hosts with or without www", () => {
    expect(platform("gog").urlPattern.test("https://gog.com/en/game/cyberpunk_2077")).toBe(true);
    expect(platform("humble").urlPattern.test("https://humblebundle.com/store/hades")).toBe(true);
    expect(
      platform("xbox").urlPattern.test("https://xbox.com/en-US/games/store/x/9NBLGGH4R315"),
    ).toBe(true);
  });

  it("accepts the Microsoft Store and every regional Nintendo site", () => {
    expect(platform("xbox").urlPattern.test("https://apps.microsoft.com/detail/9nblggh4r315")).toBe(
      true,
    );
    for (const url of [
      "https://www.nintendo.com/us/store/products/hades-switch/",
      "https://www.nintendo.co.uk/Games/Nintendo-Switch-download-software/Hades-1839136.html",
      "https://www.nintendo.de/Spiele/Hades-1839136.html",
      "https://store.nintendo.co.uk/en_gb/hades",
      "https://www.nintendo.co.jp/switch/aqfta/",
    ]) {
      expect(platform("nintendo").urlPattern.test(url), url).toBe(true);
    }
  });

  it("accepts Amazon Luna's own site", () => {
    expect(platform("amazon").urlPattern.test("https://luna.amazon.com/game/fortnite/B0C1")).toBe(
      true,
    );
  });

  it("gives every searchable platform a tag name", () => {
    for (const p of PLATFORMS) {
      if (p.id !== "publisher") expect(p.tagName, p.id).toBeTruthy();
    }
  });
});
