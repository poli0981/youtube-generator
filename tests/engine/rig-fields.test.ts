import { describe, it, expect } from "vitest";
import { formatRigValue, RIG_FIELDS } from "@config/rig-fields";

describe("formatRigValue", () => {
  it("passes text fields through unchanged", () => {
    expect(formatRigValue("cpu", "Ryzen 9 7950X")).toBe("Ryzen 9 7950X");
  });

  it("formats dropdown_with_version with both parts", () => {
    expect(formatRigValue("video_editor", "davinci_resolve_studio|19.1")).toBe(
      "DaVinci Resolve Studio 19.1",
    );
  });

  it("formats dropdown_with_version with no version", () => {
    expect(formatRigValue("video_editor", "capcut|")).toBe("CapCut");
  });

  it("formats dropdown_with_version with only version", () => {
    // Only a version with an empty option renders just the version —
    // this is technically malformed input but we shouldn't crash.
    expect(formatRigValue("video_editor", "|1.0")).toBe("1.0");
  });

  it("returns empty string when the whole value is blank", () => {
    expect(formatRigValue("video_editor", "")).toBe("");
    expect(formatRigValue("video_editor", "|")).toBe("");
  });

  it("falls back to the raw option id when unknown", () => {
    expect(formatRigValue("video_editor", "unknown_tool|1.0")).toBe(
      "unknown_tool 1.0",
    );
  });

  it("includes a video_editor entry in RIG_FIELDS", () => {
    const field = RIG_FIELDS.find((f) => f.id === "video_editor");
    expect(field?.type).toBe("dropdown_with_version");
    expect(field?.options?.length).toBeGreaterThan(3);
  });
});
