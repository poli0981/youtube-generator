import { describe, it, expect } from "vitest";
import { extractGameNameFromUrl, isLinkNameMismatch } from "@utils/url-extractors";

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

describe("extractGameNameFromUrl — Epic Games Store", () => {
  it("extracts a slug from a 5-char locale prefix and strips the product hash", () => {
    expect(
      extractGameNameFromUrl(
        "https://store.epicgames.com/en-US/p/lucky-tower-ultimate-aa04de",
      ),
    ).toBe("Lucky Tower Ultimate");
  });

  it("supports a 2-char locale prefix", () => {
    expect(
      extractGameNameFromUrl(
        "https://store.epicgames.com/de/p/alan-wake-2-49e0d3",
      ),
    ).toBe("Alan Wake 2");
  });

  it("works without a trailing product hash", () => {
    expect(
      extractGameNameFromUrl("https://store.epicgames.com/en-US/p/fortnite"),
    ).toBe("Fortnite");
  });

  it("ignores trailing path segments and query strings", () => {
    expect(
      extractGameNameFromUrl(
        "https://store.epicgames.com/en-US/p/control-c14ed6/home?lang=en",
      ),
    ).toBe("Control");
  });

  it("returns null when the locale prefix is missing (bare /p/)", () => {
    expect(
      extractGameNameFromUrl("https://store.epicgames.com/p/some-game-name"),
    ).toBeNull();
  });
});

describe("extractGameNameFromUrl — Nintendo US", () => {
  it("strips the -switch-2 platform suffix", () => {
    expect(
      extractGameNameFromUrl(
        "https://www.nintendo.com/us/store/products/mario-tennis-fever-switch-2/",
      ),
    ).toBe("Mario Tennis Fever");
  });

  it("strips a single -switch suffix", () => {
    expect(
      extractGameNameFromUrl(
        "https://www.nintendo.com/us/store/products/the-legend-of-zelda-tears-of-the-kingdom-switch",
      ),
    ).toBe("The Legend Of Zelda Tears Of The Kingdom");
  });

  it("works with no platform suffix", () => {
    expect(
      extractGameNameFromUrl(
        "https://www.nintendo.com/us/store/products/pikmin-4",
      ),
    ).toBe("Pikmin 4");
  });

  it("ignores trailing query strings", () => {
    expect(
      extractGameNameFromUrl(
        "https://www.nintendo.com/us/store/products/animal-crossing-new-horizons-switch?source=share",
      ),
    ).toBe("Animal Crossing New Horizons");
  });
});

describe("extractGameNameFromUrl — Nintendo EU", () => {
  it("strips the trailing numeric id and .html suffix", () => {
    expect(
      extractGameNameFromUrl(
        "https://www.nintendo.com/en-gb/Games/Nintendo-Switch-download-software/Teenage-Mutant-Ninja-Turtles-Splintered-Fate-2557953.html",
      ),
    ).toBe("Teenage Mutant Ninja Turtles Splintered Fate");
  });

  it("supports other locale prefixes", () => {
    expect(
      extractGameNameFromUrl(
        "https://www.nintendo.com/de-de/Games/Nintendo-Switch/Hollow-Knight-1234567.html",
      ),
    ).toBe("Hollow Knight");
  });

  it("works when the slug carries no numeric id", () => {
    expect(
      extractGameNameFromUrl(
        "https://www.nintendo.com/en-gb/Games/Nintendo-Switch/Stardew-Valley.html",
      ),
    ).toBe("Stardew Valley");
  });

  it("returns null for non-Games paths", () => {
    expect(
      extractGameNameFromUrl(
        "https://www.nintendo.com/en-gb/News/2024/December/Update.html",
      ),
    ).toBeNull();
  });
});

describe("extractGameNameFromUrl — Humble Bundle", () => {
  it("extracts a single-word slug", () => {
    expect(
      extractGameNameFromUrl("https://www.humblebundle.com/store/pragmata"),
    ).toBe("Pragmata");
  });

  it("extracts a hyphenated multi-word slug", () => {
    expect(
      extractGameNameFromUrl(
        "https://www.humblebundle.com/store/baldurs-gate-3",
      ),
    ).toBe("Baldurs Gate 3");
  });

  it("ignores trailing query strings", () => {
    expect(
      extractGameNameFromUrl(
        "https://www.humblebundle.com/store/dredge?ref=hp",
      ),
    ).toBe("Dredge");
  });

  it("returns null for non-store Humble paths", () => {
    expect(
      extractGameNameFromUrl("https://www.humblebundle.com/games"),
    ).toBeNull();
  });
});

describe("extractGameNameFromUrl — unsupported storefronts", () => {
  it("returns null for PlayStation Store", () => {
    expect(
      extractGameNameFromUrl(
        "https://store.playstation.com/en-us/product/UP9000-CUSA00000_00-XXXXXXXX",
      ),
    ).toBeNull();
  });

  it("returns null for Xbox", () => {
    expect(
      extractGameNameFromUrl("https://www.xbox.com/en-us/games/store/foo/12345"),
    ).toBeNull();
  });

  it("returns null for Amazon Luna", () => {
    expect(
      extractGameNameFromUrl("https://www.amazon.com/luna/landing"),
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

describe("isLinkNameMismatch", () => {
  it("returns false when the link's tokens are a subset of the game name's tokens", () => {
    expect(
      isLinkNameMismatch(
        "Marvel's Spider-Man Remastered",
        "https://store.steampowered.com/app/1817070/Marvels_Spider-Man_Remastered/",
      ),
    ).toBe(false);
  });

  it("returns false when the game name has extra editorial words around the link slug", () => {
    expect(
      isLinkNameMismatch(
        "Pragmata Pro",
        "https://www.humblebundle.com/store/pragmata",
      ),
    ).toBe(false);
  });

  it("returns false on an exact match", () => {
    expect(
      isLinkNameMismatch(
        "Hollow Knight",
        "https://team-cherry.itch.io/hollow-knight",
      ),
    ).toBe(false);
  });

  it("returns true when the link points at a completely different game", () => {
    expect(
      isLinkNameMismatch(
        "Pragmata",
        "https://store.epicgames.com/en-US/p/lucky-tower-ultimate-aa04de",
      ),
    ).toBe(true);
  });

  it("returns true when the link adds tokens missing from the game name", () => {
    expect(
      isLinkNameMismatch(
        "Spider-Man",
        "https://www.humblebundle.com/store/marvels-spider-man-remastered",
      ),
    ).toBe(true);
  });

  it("ignores apostrophes and punctuation when tokenising", () => {
    expect(
      isLinkNameMismatch(
        "Marvel's Spider-Man",
        "https://www.humblebundle.com/store/marvels-spider-man",
      ),
    ).toBe(false);
  });

  it("returns false when the URL is not a recognised storefront", () => {
    expect(
      isLinkNameMismatch("Pragmata", "https://example.com/whatever"),
    ).toBe(false);
  });

  it("returns false when the game name is empty", () => {
    expect(
      isLinkNameMismatch(
        "",
        "https://www.humblebundle.com/store/pragmata",
      ),
    ).toBe(false);
  });

  it("returns false when the URL is empty", () => {
    expect(isLinkNameMismatch("Pragmata", "")).toBe(false);
  });
});
