import { describe, it, expect } from "vitest";
import { upscaleSourcesFor, validUpscaleSource } from "@engine/upscale";
import { isUpscaledFrom, UPSCALED_FROM_OPTIONS } from "@config/graphics-settings";

describe("validUpscaleSource", () => {
  it("keeps a source below the video's resolution", () => {
    expect(validUpscaleSource("4K", "1440p")).toBe("1440p");
    expect(validUpscaleSource("4K", "720p")).toBe("720p");
    expect(validUpscaleSource("1440p", "1080p")).toBe("1080p");
  });

  it("reads an unset resolution as 1080p, the editor's default", () => {
    expect(validUpscaleSource(undefined, "720p")).toBe("720p");
    expect(validUpscaleSource("", "1440p")).toBe("");
  });

  it("drops a source that is not below the resolution", () => {
    expect(validUpscaleSource("1440p", "1440p")).toBe("");
    expect(validUpscaleSource("1080p", "1440p")).toBe("");
    expect(validUpscaleSource("720p", "720p")).toBe("");
  });

  it("drops empty and unknown values on either side", () => {
    expect(validUpscaleSource("4K", "")).toBe("");
    expect(validUpscaleSource("4K", undefined)).toBe("");
    expect(validUpscaleSource("4K", "480p")).toBe("");
    expect(validUpscaleSource("8K", "1440p")).toBe("");
  });
});

describe("upscaleSourcesFor", () => {
  it("lists every lower resolution, lowest first", () => {
    expect(upscaleSourcesFor("4K")).toEqual(["720p", "1080p", "1440p"]);
    expect(upscaleSourcesFor("1440p")).toEqual(["720p", "1080p"]);
    expect(upscaleSourcesFor("1080p")).toEqual(["720p"]);
    expect(upscaleSourcesFor(undefined)).toEqual(["720p"]);
  });

  it("has nothing below 720p or for an unknown resolution", () => {
    expect(upscaleSourcesFor("720p")).toEqual([]);
    expect(upscaleSourcesFor("8K")).toEqual([]);
  });
});

describe("isUpscaledFrom", () => {
  it("accepts every option, the empty one included", () => {
    for (const option of UPSCALED_FROM_OPTIONS) expect(isUpscaledFrom(option)).toBe(true);
  });

  it("rejects anything else", () => {
    expect(isUpscaledFrom("4K")).toBe(false);
    expect(isUpscaledFrom("2K")).toBe(false);
    expect(isUpscaledFrom(1440)).toBe(false);
    expect(isUpscaledFrom(null)).toBe(false);
  });
});
