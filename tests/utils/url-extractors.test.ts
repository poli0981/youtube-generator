import { describe, it, expect } from "vitest";
import { extractGameNameFromUrl } from "@utils/url-extractors";

describe("extractGameNameFromUrl — Steam", () => {
  it("extracts and humanises an ALL_CAPS slug", () => {
    expect(
      extractGameNameFromUrl(
        "https://store.steampowered.com/app/1245620/ELDEN_RING/",
      ),
    ).toBe("Elden Ring");
  });

  it("works without a trailing slash", () => {
    expect(
      extractGameNameFromUrl(
        "https://store.steampowered.com/app/1091500/Cyberpunk_2077",
      ),
    ).toBe("Cyberpunk 2077");
  });

  it("preserves hyphens within slug words", () => {
    expect(
      extractGameNameFromUrl(
        "https://store.steampowered.com/app/2358720/Marvels_Spider-Man_Remastered/",
      ),
    ).toBe("Marvels Spider-Man Remastered");
  });

  it("ignores trailing query strings", () => {
    expect(
      extractGameNameFromUrl(
        "https://store.steampowered.com/app/1245620/ELDEN_RING/?utm_source=test",
      ),
    ).toBe("Elden Ring");
  });

  it("returns null when the slug is missing (canonical bare URL)", () => {
    expect(
      extractGameNameFromUrl("https://store.steampowered.com/app/1245620"),
    ).toBeNull();
  });
});

describe("extractGameNameFromUrl — itch.io", () => {
  it("extracts a hyphenated slug from a dev subdomain", () => {
    expect(
      extractGameNameFromUrl("https://team-cherry.itch.io/hollow-knight"),
    ).toBe("Hollow Knight");
  });

  it("works with single-word slugs", () => {
    expect(extractGameNameFromUrl("https://maddymakesgames.itch.io/celeste")).toBe(
      "Celeste",
    );
  });

  it("returns null for the bare itch.io host", () => {
    expect(extractGameNameFromUrl("https://itch.io/games")).toBeNull();
  });

  it("returns null when no game slug follows the dev subdomain", () => {
    expect(extractGameNameFromUrl("https://team-cherry.itch.io/")).toBeNull();
  });
});

describe("extractGameNameFromUrl — GOG", () => {
  it("extracts a slug from the canonical /game/ path", () => {
    expect(
      extractGameNameFromUrl("https://www.gog.com/game/cyberpunk_2077"),
    ).toBe("Cyberpunk 2077");
  });

  it("supports a locale prefix", () => {
    expect(
      extractGameNameFromUrl("https://www.gog.com/en/game/baldurs_gate_3"),
    ).toBe("Baldurs Gate 3");
  });

  it("returns null for non-game GOG paths", () => {
    expect(extractGameNameFromUrl("https://www.gog.com/news/123")).toBeNull();
  });
});

describe("extractGameNameFromUrl — unsupported storefronts", () => {
  it("returns null for Epic Games Store", () => {
    expect(
      extractGameNameFromUrl(
        "https://store.epicgames.com/p/some-game-name",
      ),
    ).toBeNull();
  });

  it("returns null for Xbox", () => {
    expect(
      extractGameNameFromUrl("https://www.xbox.com/en-us/games/store/foo/12345"),
    ).toBeNull();
  });

  it("returns null for empty or whitespace input", () => {
    expect(extractGameNameFromUrl("")).toBeNull();
    expect(extractGameNameFromUrl("   ")).toBeNull();
  });

  it("returns null for non-store URLs", () => {
    expect(extractGameNameFromUrl("https://example.com/whatever")).toBeNull();
  });
});
