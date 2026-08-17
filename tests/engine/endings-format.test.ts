import { describe, it, expect } from "vitest";
import { formatEndingEntry, sliceEndingsForVideo, clampRange } from "@engine/endings-format";
import type { EndingEntry } from "@engine/types";

describe("formatEndingEntry", () => {
  it("renders 'Ending {n}: {name}' when both are filled", () => {
    expect(formatEndingEntry({ number: 3, name: "Best End" })).toBe("Ending 3: Best End");
  });

  it("renders 'Ending {n}' when only the number is filled", () => {
    expect(formatEndingEntry({ number: 7, name: "" })).toBe("Ending 7");
  });

  it("renders just the name when only the name is filled", () => {
    expect(formatEndingEntry({ number: null, name: "True Ending" })).toBe("True Ending");
  });

  it("returns null when neither is filled (drop signal)", () => {
    expect(formatEndingEntry({ number: null, name: "" })).toBeNull();
    expect(formatEndingEntry({ number: null, name: "   " })).toBeNull();
  });

  it("trims whitespace from the name", () => {
    expect(formatEndingEntry({ number: 2, name: "  Bad End  " })).toBe("Ending 2: Bad End");
  });

  it("rejects NaN / Infinity numbers as if missing", () => {
    expect(formatEndingEntry({ number: NaN, name: "True End" })).toBe("True End");
    expect(formatEndingEntry({ number: Infinity, name: "X" })).toBe("X");
  });
});

describe("sliceEndingsForVideo", () => {
  const endings: EndingEntry[] = [
    { number: 1, name: "A" },
    { number: 2, name: "B" },
    { number: 3, name: "C" },
    { number: 4, name: "D" },
  ];

  it("returns the whole array when videoCount <= 1", () => {
    expect(sliceEndingsForVideo(endings, { endingVideoCount: 1 })).toEqual(endings);
    expect(sliceEndingsForVideo(endings, { endingVideoCount: 0 })).toEqual(endings);
    expect(sliceEndingsForVideo(endings, {})).toEqual(endings);
  });

  it("returns the whole array when videoIndex is missing or out of range", () => {
    const input = {
      endingVideoCount: 2,
      endingVideoRanges: [
        { from: 1, to: 2 },
        { from: 3, to: 4 },
      ],
    };
    expect(sliceEndingsForVideo(endings, input)).toEqual(endings);
    expect(sliceEndingsForVideo(endings, { ...input, endingVideoIndex: 99 })).toEqual(endings);
  });

  it("returns the slice for video 1 when indexed", () => {
    const sliced = sliceEndingsForVideo(endings, {
      endingVideoCount: 2,
      endingVideoIndex: 1,
      endingVideoRanges: [
        { from: 1, to: 2 },
        { from: 3, to: 4 },
      ],
    });
    expect(sliced).toEqual([endings[0], endings[1]]);
  });

  it("returns the slice for video 2 when indexed", () => {
    const sliced = sliceEndingsForVideo(endings, {
      endingVideoCount: 2,
      endingVideoIndex: 2,
      endingVideoRanges: [
        { from: 1, to: 2 },
        { from: 3, to: 4 },
      ],
    });
    expect(sliced).toEqual([endings[2], endings[3]]);
  });

  it("returns empty when endings is empty", () => {
    expect(sliceEndingsForVideo([], { endingVideoCount: 2, endingVideoIndex: 1 })).toEqual([]);
  });

  it("falls back to whole array when the matching range is missing", () => {
    expect(
      sliceEndingsForVideo(endings, {
        endingVideoCount: 2,
        endingVideoIndex: 1,
        endingVideoRanges: [],
      }),
    ).toEqual(endings);
  });
});

describe("clampRange", () => {
  it("clamps from below to 1 and to above to length", () => {
    expect(clampRange({ from: 0, to: 100 }, 5)).toEqual({ from: 1, to: 5 });
  });

  it("ensures from <= to (clamps to single index when reversed)", () => {
    // from=4, to=2 → clamp from to length=3 (4 > 3 → from=3), to becomes max(from, ...) = 3
    expect(clampRange({ from: 4, to: 2 }, 3)).toEqual({ from: 3, to: 3 });
  });

  it("passes valid ranges through unchanged", () => {
    expect(clampRange({ from: 2, to: 4 }, 5)).toEqual({ from: 2, to: 4 });
  });
});
