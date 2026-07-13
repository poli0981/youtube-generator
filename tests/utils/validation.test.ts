import { describe, it, expect } from "vitest";
import {
  validateUrlWithPattern,
  validatePlaylistUrl,
  validateMessengerUrl,
  validateZaloGroupUrl,
  validateSignalGroupUrl,
  validateInstagramInviteUrl,
  validateFacebookGroupUrl,
  validateIntegerInRange,
  validateBatchRange,
} from "@utils/validation";
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

  it("accepts a bare youtube.com host without the www. subdomain (v0.8.1 fix)", () => {
    expect(
      validatePlaylistUrl(
        "https://youtube.com/playlist?list=PLrAXtmRdnEQy6nuLMHjMZOz59Oq8B1X22",
      ).valid,
    ).toBe(true);
  });

  it("accepts an extra trailing query parameter alongside list= (v0.8.1 fix)", () => {
    expect(
      validatePlaylistUrl(
        "https://www.youtube.com/playlist?list=PLabc&si=xyz123",
      ).valid,
    ).toBe(true);
  });

  it("accepts a list= param sitting after another query param (v0.8.1 fix)", () => {
    expect(
      validatePlaylistUrl(
        "https://www.youtube.com/playlist?si=foo&list=PLabc",
      ).valid,
    ).toBe(true);
  });

  it("accepts a trailing fragment (v0.8.1 fix)", () => {
    expect(
      validatePlaylistUrl(
        "https://www.youtube.com/playlist?list=PLabc#bookmark",
      ).valid,
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

describe("validateMessengerUrl", () => {
  it("accepts a canonical m.me/ch community link", () => {
    const result = validateMessengerUrl("https://m.me/ch/mychannel");
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it("accepts the community link with or without a trailing slash", () => {
    expect(
      validateMessengerUrl("https://m.me/ch/Abb1hmBhU_97UMCF/").valid,
    ).toBe(true);
    expect(validateMessengerUrl("https://m.me/ch/Abb1hmBhU_97UMCF").valid).toBe(
      true,
    );
  });

  it("accepts a numeric id", () => {
    expect(validateMessengerUrl("https://m.me/ch/100123456789").valid).toBe(
      true,
    );
  });

  it("accepts ids with dots, dashes and underscores", () => {
    expect(validateMessengerUrl("https://m.me/ch/my.page_name-1").valid).toBe(
      true,
    );
  });

  it("rejects the old bare m.me link without the /ch/ segment", () => {
    const result = validateMessengerUrl("https://m.me/mychannel");
    expect(result.valid).toBe(false);
    expect(result.error).toBe("validation.messengerUrlInvalid");
    expect(result.errorParams?.expected).toBe("https://m.me/ch/[id]");
  });

  it("rejects a non-m.me host", () => {
    const result = validateMessengerUrl("https://messenger.com/ch/mychannel");
    expect(result.valid).toBe(false);
    expect(result.error).toBe("validation.messengerUrlInvalid");
    expect(result.errorParams?.expected).toBe("https://m.me/ch/[id]");
  });

  it("rejects the bare host and the /ch/ path with no id", () => {
    expect(validateMessengerUrl("https://m.me/").valid).toBe(false);
    expect(validateMessengerUrl("https://m.me").valid).toBe(false);
    expect(validateMessengerUrl("https://m.me/ch/").valid).toBe(false);
  });

  it("rejects an http (non-https) link", () => {
    expect(validateMessengerUrl("http://m.me/ch/mychannel").valid).toBe(false);
  });

  it("accepts empty input (not an error)", () => {
    expect(validateMessengerUrl("").valid).toBe(true);
    expect(validateMessengerUrl("   ").valid).toBe(true);
  });
});

describe("validateZaloGroupUrl", () => {
  it("accepts a canonical zalo.me group link", () => {
    const result = validateZaloGroupUrl("https://zalo.me/g/abc123");
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it("rejects a personal zalo.me profile (no /g/ path)", () => {
    const result = validateZaloGroupUrl("https://zalo.me/0901234567");
    expect(result.valid).toBe(false);
    expect(result.error).toBe("validation.zaloUrlInvalid");
    expect(result.errorParams?.expected).toBe("https://zalo.me/g/[id]");
  });

  it("rejects the bare group path with no code", () => {
    expect(validateZaloGroupUrl("https://zalo.me/g/").valid).toBe(false);
  });

  it("rejects a non-zalo.me host", () => {
    expect(validateZaloGroupUrl("https://example.com/g/abc123").valid).toBe(false);
  });

  it("rejects an http (non-https) link", () => {
    expect(validateZaloGroupUrl("http://zalo.me/g/abc123").valid).toBe(false);
  });

  it("accepts empty input (not an error)", () => {
    expect(validateZaloGroupUrl("").valid).toBe(true);
    expect(validateZaloGroupUrl("   ").valid).toBe(true);
  });
});

describe("validateSignalGroupUrl", () => {
  it("accepts a canonical signal.group link with a # payload", () => {
    const result = validateSignalGroupUrl("https://signal.group/#CjQKIAbc123_-def");
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it("accepts a base64 payload with + / = characters", () => {
    expect(
      validateSignalGroupUrl("https://signal.group/#CjQKIA+b/c=").valid,
    ).toBe(true);
  });

  it("rejects a signal.group link with no fragment", () => {
    const result = validateSignalGroupUrl("https://signal.group/");
    expect(result.valid).toBe(false);
    expect(result.error).toBe("validation.signalUrlInvalid");
    expect(result.errorParams?.expected).toBe("https://signal.group/#[id]");
  });

  it("rejects an empty fragment", () => {
    expect(validateSignalGroupUrl("https://signal.group/#").valid).toBe(false);
  });

  it("rejects a non-signal host", () => {
    expect(validateSignalGroupUrl("https://example.com/#abc").valid).toBe(false);
  });

  it("rejects an http (non-https) link", () => {
    expect(validateSignalGroupUrl("http://signal.group/#abc").valid).toBe(false);
  });

  it("accepts empty input (not an error)", () => {
    expect(validateSignalGroupUrl("").valid).toBe(true);
    expect(validateSignalGroupUrl("   ").valid).toBe(true);
  });
});

describe("validateInstagramInviteUrl", () => {
  it("accepts the www.instagram.com/j/ form", () => {
    const result = validateInstagramInviteUrl("https://www.instagram.com/j/AbCdEf123");
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it("accepts the short ig.me/j/ form", () => {
    expect(validateInstagramInviteUrl("https://ig.me/j/AbCdEf123").valid).toBe(true);
  });

  it("accepts a trailing slash", () => {
    expect(validateInstagramInviteUrl("https://ig.me/j/AbCdEf123/").valid).toBe(true);
  });

  it("rejects a plain Instagram profile link (no /j/ path)", () => {
    const result = validateInstagramInviteUrl("https://www.instagram.com/myhandle");
    expect(result.valid).toBe(false);
    expect(result.error).toBe("validation.instagramInviteUrlInvalid");
    expect(result.errorParams?.expected).toBe("https://www.instagram.com/j/[id]");
  });

  it("rejects the bare /j/ path with no id", () => {
    expect(validateInstagramInviteUrl("https://ig.me/j/").valid).toBe(false);
  });

  it("rejects a non-Instagram host", () => {
    expect(validateInstagramInviteUrl("https://example.com/j/abc").valid).toBe(false);
  });

  it("accepts empty input (not an error)", () => {
    expect(validateInstagramInviteUrl("").valid).toBe(true);
    expect(validateInstagramInviteUrl("   ").valid).toBe(true);
  });
});

describe("validateFacebookGroupUrl", () => {
  it("accepts a canonical facebook.com/groups link", () => {
    const result = validateFacebookGroupUrl("https://facebook.com/groups/mygroup");
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it("accepts www., m. and web. subdomains and a trailing slash", () => {
    expect(validateFacebookGroupUrl("https://www.facebook.com/groups/mygroup").valid).toBe(true);
    expect(validateFacebookGroupUrl("https://m.facebook.com/groups/123456/").valid).toBe(true);
    expect(validateFacebookGroupUrl("https://web.facebook.com/groups/my.group").valid).toBe(true);
  });

  it("rejects a plain Facebook profile / page link (no /groups/ path)", () => {
    const result = validateFacebookGroupUrl("https://facebook.com/mypage");
    expect(result.valid).toBe(false);
    expect(result.error).toBe("validation.facebookGroupUrlInvalid");
    expect(result.errorParams?.expected).toBe("https://facebook.com/groups/[id]");
  });

  it("rejects the bare /groups/ path with no id", () => {
    expect(validateFacebookGroupUrl("https://facebook.com/groups/").valid).toBe(false);
  });

  it("rejects an http (non-https) link", () => {
    expect(validateFacebookGroupUrl("http://facebook.com/groups/mygroup").valid).toBe(false);
  });

  it("accepts empty input (not an error)", () => {
    expect(validateFacebookGroupUrl("").valid).toBe(true);
    expect(validateFacebookGroupUrl("   ").valid).toBe(true);
  });
});

describe("validateIntegerInRange", () => {
  it("accepts a whole number within range", () => {
    expect(validateIntegerInRange("5", { min: 1, max: 10 }).valid).toBe(true);
    expect(validateIntegerInRange("1", { min: 1, max: 10 }).valid).toBe(true);
    expect(validateIntegerInRange("10", { min: 1, max: 10 }).valid).toBe(true);
  });

  it("rejects a blank value when allowEmpty is off", () => {
    const result = validateIntegerInRange("", { min: 1, max: 10 });
    expect(result.valid).toBe(false);
    expect(result.error).toBe("validation.numberRequired");
  });

  it("accepts a blank value when allowEmpty is on", () => {
    expect(validateIntegerInRange("", { min: 1, max: 10, allowEmpty: true }).valid).toBe(true);
    expect(validateIntegerInRange("   ", { min: 1, max: 10, allowEmpty: true }).valid).toBe(true);
  });

  it("rejects non-numeric input", () => {
    const result = validateIntegerInRange("abc", { min: 1, max: 10 });
    expect(result.valid).toBe(false);
    expect(result.error).toBe("validation.numberInvalid");
  });

  it("rejects a decimal / non-integer value", () => {
    const result = validateIntegerInRange("2.5", { min: 1, max: 10 });
    expect(result.valid).toBe(false);
    expect(result.error).toBe("validation.numberNotInteger");
  });

  it("rejects a negative value below the minimum", () => {
    const result = validateIntegerInRange("-3", { min: 1, max: 10 });
    expect(result.valid).toBe(false);
    expect(result.error).toBe("validation.numberOutOfRange");
    expect(result.errorParams).toEqual({ min: 1, max: 10 });
  });

  it("rejects zero when the minimum is 1", () => {
    expect(validateIntegerInRange("0", { min: 1, max: 10 }).valid).toBe(false);
  });

  it("rejects a value above the maximum", () => {
    const result = validateIntegerInRange("11", { min: 1, max: 10 });
    expect(result.valid).toBe(false);
    expect(result.error).toBe("validation.numberOutOfRange");
  });
});

describe("validateBatchRange", () => {
  it("accepts a valid ascending range within the span", () => {
    expect(validateBatchRange("1", "5", { maxSpan: 100 }).valid).toBe(true);
    expect(validateBatchRange("3", "3", { maxSpan: 100 }).valid).toBe(true);
  });

  it("accepts a range exactly at the max span", () => {
    expect(validateBatchRange("1", "100", { maxSpan: 100 }).valid).toBe(true);
  });

  it("rejects an end part before the start", () => {
    const result = validateBatchRange("5", "2", { maxSpan: 100 });
    expect(result.valid).toBe(false);
    expect(result.error).toBe("validation.rangeEndBeforeStart");
    expect(result.errorParams).toEqual({ start: 5, end: 2 });
  });

  it("rejects a range that exceeds the max span", () => {
    const result = validateBatchRange("1", "101", { maxSpan: 100 });
    expect(result.valid).toBe(false);
    expect(result.error).toBe("validation.rangeTooLarge");
    expect(result.errorParams).toEqual({ maxSpan: 100 });
  });

  it("rejects a decimal endpoint", () => {
    const result = validateBatchRange("1", "5.5", { maxSpan: 100 });
    expect(result.valid).toBe(false);
    expect(result.error).toBe("validation.numberNotInteger");
  });

  it("rejects a non-positive start", () => {
    expect(validateBatchRange("-1", "5", { maxSpan: 100 }).valid).toBe(false);
    expect(validateBatchRange("0", "5", { maxSpan: 100 }).valid).toBe(false);
  });

  it("rejects a blank endpoint", () => {
    const result = validateBatchRange("", "5", { maxSpan: 100 });
    expect(result.valid).toBe(false);
    expect(result.error).toBe("validation.numberRequired");
  });
});
