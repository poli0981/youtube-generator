import { describe, it, expect } from "vitest";
import { buildPinnedComment } from "@engine/pinned-comment-builder";
import { createMockT } from "../helpers/mock-t";
import type { GeneratorInput, TranslationFn } from "@engine/types";

function makeInput(overrides: Partial<GeneratorInput> = {}): GeneratorInput {
  return {
    videoType: "part",
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

describe("buildPinnedComment", () => {
  it("generates a non-empty string for the default `part` video type", () => {
    const t = createMockT("en");
    const result = buildPinnedComment(makeInput(), t);
    expect(result).not.toBe("");
    expect(result).toContain("Welcome back to Elden Ring on TestChannel");
    expect(result).toContain("Thanks for watching");
    expect(result).toContain("like & subscribe");
    expect(result).toContain("What game should I play next?");
  });

  it("uses the livestream-specific greeting when videoType is livestream", () => {
    const t = createMockT("en");
    const result = buildPinnedComment(
      makeInput({ videoType: "livestream", gameName: "Elden Ring" }),
      t,
    );
    expect(result).toContain("Welcome to the stream of Elden Ring");
    expect(result).toContain("Drop a hello in the chat");
  });

  it("includes the genre-playlist suggestion when option + URL + label all present", () => {
    const t = createMockT("en");
    const result = buildPinnedComment(
      makeInput({ genres: ["horror"] }),
      t,
      {
        includeGenrePlaylist: true,
        genrePlaylists: {
          horror: "https://www.youtube.com/playlist?list=PLhorror",
        },
        genreLabels: { horror: "Horror" },
      },
    );
    expect(result).toContain(
      "📺 More Horror gameplay on the channel: https://www.youtube.com/playlist?list=PLhorror",
    );
  });

  it("omits the genre-playlist line when the option is off", () => {
    const t = createMockT("en");
    const result = buildPinnedComment(
      makeInput({ genres: ["horror"] }),
      t,
      {
        includeGenrePlaylist: false,
        genrePlaylists: {
          horror: "https://www.youtube.com/playlist?list=PLhorror",
        },
        genreLabels: { horror: "Horror" },
      },
    );
    expect(result).not.toContain("More Horror gameplay");
  });

  it("omits the genre-playlist line when no URL is configured for the primary genre", () => {
    const t = createMockT("en");
    const result = buildPinnedComment(
      makeInput({ genres: ["rpg"] }),
      t,
      {
        includeGenrePlaylist: true,
        genrePlaylists: {
          horror: "https://www.youtube.com/playlist?list=PLhorror",
        },
        genreLabels: { horror: "Horror", rpg: "RPG" },
      },
    );
    expect(result).not.toContain("More");
    expect(result).not.toContain("playlist?list=PLhorror");
  });

  it("uses the primary (first) genre, ignoring secondary genres", () => {
    const t = createMockT("en");
    const result = buildPinnedComment(
      makeInput({ genres: ["action", "horror"] }),
      t,
      {
        includeGenrePlaylist: true,
        genrePlaylists: {
          action: "https://www.youtube.com/playlist?list=PLaction",
          horror: "https://www.youtube.com/playlist?list=PLhorror",
        },
        genreLabels: { action: "Action", horror: "Horror" },
      },
    );
    expect(result).toContain("More Action gameplay");
    expect(result).not.toContain("More Horror gameplay");
  });

  it("interpolates localized game name when present", () => {
    const t = createMockT("ja");
    const result = buildPinnedComment(
      makeInput({
        language: "ja",
        gameName: "Elden Ring",
        gameNameLocalized: { ja: "エルデンリング" },
      }),
      t,
    );
    expect(result).toContain("エルデンリング");
    expect(result).not.toContain("Elden Ring の");
  });

  it("includes the playlistPrompt line when playlistLink is set", () => {
    const t = createMockT("en");
    const result = buildPinnedComment(
      makeInput({ playlistLink: "https://youtube.com/playlist?list=abc" }),
      t,
    );
    expect(result).toContain("Watch the full series here");
    expect(result).toContain("https://youtube.com/playlist?list=abc");
  });

  it("omits the playlistPrompt line when playlistLink is empty", () => {
    const t = createMockT("en");
    const result = buildPinnedComment(makeInput(), t);
    expect(result).not.toContain("Watch the full series");
  });

  it("omits the playlistPrompt line when includePlaylistLink is false", () => {
    const t = createMockT("en");
    const result = buildPinnedComment(
      makeInput({ playlistLink: "https://youtube.com/playlist?list=abc" }),
      t,
      { includePlaylistLink: false },
    );
    expect(result).not.toContain("Watch the full series");
  });

  it("omits the askNextGame line when includeAskNextGame is false", () => {
    const t = createMockT("en");
    const result = buildPinnedComment(makeInput(), t, {
      includeAskNextGame: false,
    });
    expect(result).not.toContain("What game should I play next?");
    // Other lines still present:
    expect(result).toContain("Thanks for watching");
  });

  it("picks the per-video-type greeting when available", () => {
    const t = createMockT("en");
    const bossResult = buildPinnedComment(makeInput({ videoType: "boss" }), t);
    const speedrunResult = buildPinnedComment(
      makeInput({ videoType: "speedrun" }),
      t,
    );
    expect(bossResult).toContain("boss was a ride");
    expect(speedrunResult).toContain("Speedrun attempt complete");
  });

  it("falls back to the `part` greeting when the per-type key is missing", () => {
    // Custom mock that only defines the `part` greeting, mimicking a
    // future video type the locale hasn't added yet.
    const sparseT: TranslationFn = (key, vars) => {
      if (key === "pinnedComment.greetings.part") {
        return `Welcome back to ${vars?.gameName ?? ""}.`;
      }
      if (key === "pinnedComment.thanksForWatching") return "Thanks!";
      if (key === "pinnedComment.engagementPrompt") return "Like & subscribe.";
      if (key === "pinnedComment.askNextGame") return "Next game?";
      return key;
    };
    const result = buildPinnedComment(
      makeInput({ videoType: "boss_nohit", gameName: "Sekiro" }),
      sparseT,
    );
    expect(result).toContain("Welcome back to Sekiro.");
    expect(result).toContain("Thanks!");
  });

  it("drops the greeting line entirely when neither the per-type key nor the fallback exists", () => {
    // Mock that returns the key (mock-t's signal for missing) for every
    // greeting key but still provides the non-greeting lines.
    const noGreetingT: TranslationFn = (key) => {
      if (key === "pinnedComment.thanksForWatching") return "Thanks!";
      if (key === "pinnedComment.engagementPrompt") return "Like & subscribe.";
      if (key === "pinnedComment.askNextGame") return "Next game?";
      return key;
    };
    const result = buildPinnedComment(
      makeInput({ videoType: "part" }),
      noGreetingT,
    );
    // Ensure no raw "pinnedComment.greetings.…" key leaks into the
    // output — we drop the line rather than render the key.
    expect(result).not.toContain("pinnedComment.greetings");
    expect(result).toContain("Thanks!");
  });

  it("interpolates channelName into the part greeting", () => {
    const t = createMockT("en");
    const result = buildPinnedComment(
      makeInput({ channelName: "NoCommentarySan" }),
      t,
    );
    expect(result).toContain("NoCommentarySan");
  });

  it("returns empty string when every sub-key is missing", () => {
    const emptyT: TranslationFn = (key) => key; // every lookup "fails"
    const result = buildPinnedComment(makeInput(), emptyT);
    expect(result).toBe("");
  });
});
