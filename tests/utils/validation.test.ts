import { describe, it, expect } from "vitest";
import { validateUrlWithPattern, validatePlaylistUrl } from "@utils/validation";
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

describe("validateUrlWithPattern — Publisher / Developer site", () => {
  const publisher = platform("publisher");

  it("accepts a generic publisher HTTPS URL", () => {
    expect(
      validateUrlWithPattern(
        "https://playmygame.com/buy",
        publisher.urlPattern,
      ).valid,
    ).toBe(true);
  });

  it("accepts a bare host without path", () => {
    expect(
      validateUrlWithPattern("https://playmygame.com", publisher.urlPattern).valid,
    ).toBe(true);
  });

  it("rejects http (non-https) URLs", () => {
    expect(
      validateUrlWithPattern("http://playmygame.com", publisher.urlPattern).valid,
    ).toBe(false);
  });

  it("accepts empty input (not an error)", () => {
    expect(validateUrlWithPattern("", publisher.urlPattern).valid).toBe(true);
  });
});

describe("validatePlaylistUrl", () => {
  it("accepts a canonical playlist URL", () => {
    const result = validatePlaylistUrl(
      "https://www.youtube.com/playlist?list=PLrAXtmRdnEQy6nuLMHjMZOz59Oq8B1X22",
    );
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it("accepts a short playlist id", () => {
    expect(
      validatePlaylistUrl("https://www.youtube.com/playlist?list=abc_DEF-123").valid,
    ).toBe(true);
  });

  it("rejects a watch?v= URL (most common mistake)", () => {
    const result = validatePlaylistUrl(
      "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    );
    expect(result.valid).toBe(false);
    expect(result.error).toBe("validation.playlistUrlInvalid");
    expect(result.errorParams?.expected).toBe(
      "https://www.youtube.com/playlist?list=[id]",
    );
  });

  it("rejects a watch URL with both v= and list= params", () => {
    expect(
      validatePlaylistUrl(
        "https://www.youtube.com/watch?v=abc&list=PLrAXtmRdnEQy6nuLMHj",
      ).valid,
    ).toBe(false);
  });

  it("rejects a youtu.be short URL", () => {
    expect(
      validatePlaylistUrl("https://youtu.be/dQw4w9WgXcQ").valid,
    ).toBe(false);
  });

  it("rejects an http (non-https) URL", () => {
    expect(
      validatePlaylistUrl("http://www.youtube.com/playlist?list=abc").valid,
    ).toBe(false);
  });

  it("rejects a playlist URL with no id", () => {
    expect(
      validatePlaylistUrl("https://www.youtube.com/playlist?list=").valid,
    ).toBe(false);
  });

  it("accepts empty input (not an error)", () => {
    expect(validatePlaylistUrl("").valid).toBe(true);
    expect(validatePlaylistUrl("   ").valid).toBe(true);
  });

  it("rejects a totally unrelated URL", () => {
    expect(validatePlaylistUrl("https://example.com/playlist").valid).toBe(false);
  });
});
