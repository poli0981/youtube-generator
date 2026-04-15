import { describe, it, expect } from "vitest";
import { validateUrlWithPattern } from "@utils/validation";
import { PLATFORMS } from "@config/platforms";

function platform(id: string) {
  const p = PLATFORMS.find((x) => x.id === id);
  if (!p) throw new Error(`unknown platform ${id}`);
  return p;
}

describe("validateUrlWithPattern — Steam", () => {
  const steam = platform("steam");

  it("accepts canonical app URL without trailing slash", () => {
    const result = validateUrlWithPattern(
      "https://store.steampowered.com/app/1245620",
      steam.urlPattern,
    );
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it("accepts app URL with trailing slug", () => {
    const result = validateUrlWithPattern(
      "https://store.steampowered.com/app/1245620/ELDEN_RING/",
      steam.urlPattern,
    );
    expect(result.valid).toBe(true);
  });

  it("rejects URLs without /app/<id>", () => {
    expect(
      validateUrlWithPattern(
        "https://store.steampowered.com/",
        steam.urlPattern,
      ).valid,
    ).toBe(false);
    expect(
      validateUrlWithPattern(
        "https://store.steampowered.com/news/app/123",
        steam.urlPattern,
      ).valid,
    ).toBe(false);
  });

  it("rejects totally unrelated URLs", () => {
    expect(
      validateUrlWithPattern("https://example.com", steam.urlPattern).valid,
    ).toBe(false);
  });

  it("accepts empty input (not an error)", () => {
    expect(validateUrlWithPattern("", steam.urlPattern).valid).toBe(true);
  });
});

describe("Steam normalize", () => {
  const steam = platform("steam");

  it("strips trailing slug from canonical URL", () => {
    expect(
      steam.normalize?.(
        "https://store.steampowered.com/app/1245620/ELDEN_RING/",
      ),
    ).toBe("https://store.steampowered.com/app/1245620");
  });

  it("is a no-op on an already-normalized URL", () => {
    expect(
      steam.normalize?.("https://store.steampowered.com/app/1245620"),
    ).toBe("https://store.steampowered.com/app/1245620");
  });

  it("leaves unrelated URLs alone", () => {
    expect(steam.normalize?.("https://example.com/app/123")).toBe(
      "https://example.com/app/123",
    );
  });
});

describe("validateUrlWithPattern — itch.io", () => {
  const itch = platform("itchio");

  it("accepts dev subdomain URL", () => {
    expect(
      validateUrlWithPattern(
        "https://devname.itch.io/my-game",
        itch.urlPattern,
      ).valid,
    ).toBe(true);
  });

  it("accepts trailing slash", () => {
    expect(
      validateUrlWithPattern(
        "https://devname.itch.io/my-game/",
        itch.urlPattern,
      ).valid,
    ).toBe(true);
  });

  it("rejects the bare itch.io host", () => {
    expect(
      validateUrlWithPattern("https://itch.io/games", itch.urlPattern).valid,
    ).toBe(false);
  });

  it("rejects missing game slug", () => {
    expect(
      validateUrlWithPattern("https://devname.itch.io/", itch.urlPattern).valid,
    ).toBe(false);
  });

  it("accepts empty input (not an error)", () => {
    expect(validateUrlWithPattern("", itch.urlPattern).valid).toBe(true);
  });
});
