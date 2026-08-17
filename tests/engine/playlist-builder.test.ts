import { describe, it, expect } from "vitest";
import {
  buildPlaylistTitle,
  buildPlaylistDescription,
  buildPlaylistComment,
  type PlaylistInput,
} from "@engine/playlist-builder";
import { createMockT } from "../helpers/mock-t";

function makeInput(overrides: Partial<PlaylistInput> = {}): PlaylistInput {
  return {
    gameName: "Elden Ring",
    channelName: "TestChannel",
    status: "completed",
    contentType: "full_gameplay",
    ...overrides,
  };
}

describe("buildPlaylistTitle", () => {
  const t = createMockT("en");

  it("prefixes the game name with the localized status label", () => {
    expect(buildPlaylistTitle(makeInput({ status: "completed" }), t)).toBe(
      "✅ Completed - Elden Ring",
    );
    expect(buildPlaylistTitle(makeInput({ status: "dropped" }), t)).toBe("❌ Dropped - Elden Ring");
    expect(buildPlaylistTitle(makeInput({ status: "incomplete" }), t)).toBe(
      "🔄 Incomplete - Elden Ring",
    );
    expect(buildPlaylistTitle(makeInput({ status: "in_progress" }), t)).toBe(
      "▶️ In Progress - Elden Ring",
    );
  });
});

describe("buildPlaylistDescription", () => {
  const t = createMockT("en");

  it("renders the content-type line and footer for a minimal playlist", () => {
    const out = buildPlaylistDescription(makeInput(), t);
    expect(out).toContain("full gameplay of Elden Ring on TestChannel");
    expect(out).toContain("👍 Like | 🔔 Subscribe");
  });

  it("includes a video-count line when totalVideos is set", () => {
    expect(buildPlaylistDescription(makeInput({ totalVideos: 25 }), t)).toContain("📹 25 video(s)");
    expect(buildPlaylistDescription(makeInput(), t)).not.toContain("📹");
  });

  it("includes store links and a custom note when provided", () => {
    const out = buildPlaylistDescription(
      makeInput({
        storeLinks: { steam: "https://store.steampowered.com/app/1245620" },
        playlistNote: "Recorded on PC.",
      }),
      t,
    );
    expect(out).toContain("🎮 Get the game:");
    expect(out).toContain("https://store.steampowered.com/app/1245620");
    expect(out).toContain("Recorded on PC.");
  });

  it("renders dropped reasons only when status is dropped", () => {
    const dropped = buildPlaylistDescription(
      makeInput({ status: "dropped", droppedReasons: ["boring", "performance"] }),
      t,
    );
    expect(dropped).toContain("⚠️ Why this series was dropped:");
    expect(dropped).toContain("• Game got boring / lost interest");
    expect(dropped).toContain("• Performance issues (lag, low FPS)");

    // Same reasons, non-dropped status → no dropped block.
    const completed = buildPlaylistDescription(
      makeInput({ status: "completed", droppedReasons: ["boring"] }),
      t,
    );
    expect(completed).not.toContain("⚠️ Why this series was dropped:");
  });

  it("appends the free-text custom reason after the predefined ones", () => {
    const out = buildPlaylistDescription(
      makeInput({
        status: "dropped",
        droppedReasons: ["bugs"],
        droppedReasonCustom: "Servers shut down",
      }),
      t,
    );
    expect(out).toContain("• Too many bugs / crashes");
    expect(out).toContain("• Servers shut down");
  });

  it("omits the dropped block when no reason is selected", () => {
    const out = buildPlaylistDescription(makeInput({ status: "dropped" }), t);
    expect(out).not.toContain("⚠️ Why this series was dropped:");
  });

  it("skips unknown reason ids rather than printing the raw key", () => {
    const out = buildPlaylistDescription(
      makeInput({ status: "dropped", droppedReasons: ["does_not_exist"] }),
      t,
    );
    expect(out).not.toContain("playlist.droppedReasons");
    expect(out).not.toContain("⚠️ Why this series was dropped:");
  });
});

describe("buildPlaylistComment", () => {
  const t = createMockT("en");

  it("adapts the opening line to the playlist status", () => {
    expect(buildPlaylistComment(makeInput({ status: "completed" }), t)).toContain(
      "series is complete",
    );
    expect(buildPlaylistComment(makeInput({ status: "in_progress" }), t)).toContain("part is live");
    expect(buildPlaylistComment(makeInput({ status: "incomplete" }), t)).toContain(
      "playthrough continues",
    );
    expect(buildPlaylistComment(makeInput({ status: "dropped" }), t)).toContain("decided to drop");
  });

  it("always ends with the engagement call-to-action", () => {
    expect(buildPlaylistComment(makeInput(), t)).toContain("subscribe for more");
  });

  it("includes the playlist link line only when a link is set", () => {
    const withLink = buildPlaylistComment(
      makeInput({ playlistLink: "https://youtube.com/playlist?list=abc" }),
      t,
    );
    expect(withLink).toContain("Watch the full playlist here:");
    expect(withLink).toContain("https://youtube.com/playlist?list=abc");

    expect(buildPlaylistComment(makeInput(), t)).not.toContain("Watch the full playlist here:");
  });

  it("includes the video-count line only when totalVideos is set", () => {
    expect(buildPlaylistComment(makeInput({ totalVideos: 12 }), t)).toContain("📹 12 video(s)");
    expect(buildPlaylistComment(makeInput(), t)).not.toContain("📹");
  });

  it("lists dropped reasons only for a dropped playlist", () => {
    const dropped = buildPlaylistComment(
      makeInput({
        status: "dropped",
        droppedReasons: ["boring"],
        droppedReasonCustom: "Save file corrupted",
      }),
      t,
    );
    expect(dropped).toContain("Here's why:");
    expect(dropped).toContain("• Game got boring / lost interest");
    expect(dropped).toContain("• Save file corrupted");

    const completed = buildPlaylistComment(
      makeInput({ status: "completed", droppedReasons: ["boring"] }),
      t,
    );
    expect(completed).not.toContain("Here's why:");
  });

  it("returns a non-empty comment for a minimal playlist", () => {
    expect(buildPlaylistComment(makeInput(), t).trim().length).toBeGreaterThan(0);
  });
});

describe("playlist builder localization (vi)", () => {
  const t = createMockT("vi");

  it("renders the dropped heading and reasons in Vietnamese", () => {
    const out = buildPlaylistDescription(
      makeInput({ status: "dropped", droppedReasons: ["performance"] }),
      t,
    );
    expect(out).toContain("⚠️ Vì sao series này bị dừng:");
    expect(out).toContain("• Vấn đề hiệu năng (lag, FPS thấp)");
  });

  it("renders the comment opening and CTA in Vietnamese", () => {
    const out = buildPlaylistComment(makeInput({ status: "completed" }), t);
    expect(out).toContain("đã hoàn thành");
    expect(out).toContain("đăng ký kênh");
  });
});
