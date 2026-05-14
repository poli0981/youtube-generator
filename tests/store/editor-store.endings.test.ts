import { describe, it, expect } from "vitest";
import {
  liftLegacyEndingString,
  computeContiguousRanges,
  migrateEditorState,
} from "@store/editor-store";

describe("liftLegacyEndingString", () => {
  it("returns an empty array for empty / whitespace input", () => {
    expect(liftLegacyEndingString("")).toEqual([]);
    expect(liftLegacyEndingString("   ")).toEqual([]);
  });

  it("parses 'Ending N: Name' into a structured entry", () => {
    expect(liftLegacyEndingString("Ending 3: Best End")).toEqual([
      { number: 3, name: "Best End" },
    ]);
  });

  it("parses 'Ending N' (number only) into a structured entry", () => {
    expect(liftLegacyEndingString("Ending 7")).toEqual([
      { number: 7, name: "" },
    ]);
  });

  it("recognises localised 'Kết thúc N' (Vietnamese)", () => {
    expect(liftLegacyEndingString("Kết thúc 2: Hậu trung dung")).toEqual([
      { number: 2, name: "Hậu trung dung" },
    ]);
  });

  it("recognises Japanese 'エンディング3'", () => {
    expect(liftLegacyEndingString("エンディング3: 真エンド")).toEqual([
      { number: 3, name: "真エンド" },
    ]);
  });

  it("falls through to a name-only row for unparseable input", () => {
    expect(liftLegacyEndingString("True ending only")).toEqual([
      { number: null, name: "True ending only" },
    ]);
    expect(liftLegacyEndingString("1 of 3")).toEqual([
      { number: null, name: "1 of 3" },
    ]);
  });
});

describe("computeContiguousRanges", () => {
  it("returns empty when either input is non-positive", () => {
    expect(computeContiguousRanges(0, 2)).toEqual([]);
    expect(computeContiguousRanges(5, 0)).toEqual([]);
  });

  it("returns a single full-range row for videoCount = 1", () => {
    expect(computeContiguousRanges(5, 1)).toEqual([{ from: 1, to: 5 }]);
  });

  it("splits 6 endings into 2 even videos", () => {
    expect(computeContiguousRanges(6, 2)).toEqual([
      { from: 1, to: 3 },
      { from: 4, to: 6 },
    ]);
  });

  it("spills the remainder into the LAST video (climactic-final convention)", () => {
    // 7 / 3 = 2 remainder 1; last video gets size 3.
    expect(computeContiguousRanges(7, 3)).toEqual([
      { from: 1, to: 2 },
      { from: 3, to: 4 },
      { from: 5, to: 7 },
    ]);
  });

  it("clamps videoCount to endings.length when over-asked", () => {
    // Asking for more videos than endings → only `endings.length` rows.
    expect(computeContiguousRanges(3, 5)).toEqual([
      { from: 1, to: 1 },
      { from: 2, to: 2 },
      { from: 3, to: 3 },
    ]);
  });
});

describe("migrateEditorState v11 → v12 (endings)", () => {
  it("lifts a legacy endingsShown freeform into a single-row endings entry", () => {
    const persisted = { endingsShown: "Ending 5: Bad End" };
    const result = migrateEditorState(persisted, 11);
    expect(result.endings).toEqual([{ number: 5, name: "Bad End" }]);
    expect(result.endingVideoCount).toBe(1);
    expect(result.endingVideoRanges).toEqual([{ from: 1, to: 1 }]);
  });

  it("leaves endings empty when legacy string is empty", () => {
    const result = migrateEditorState({ endingsShown: "" }, 11);
    expect(result.endings).toEqual([]);
    expect(result.endingVideoCount).toBe(1);
    expect(result.endingVideoRanges).toEqual([]);
  });

  it("preserves an already-structured endings array on later migration runs", () => {
    const persisted = {
      endingsShown: "irrelevant — should not be re-lifted",
      endings: [
        { number: 1, name: "A" },
        { number: 2, name: "B" },
      ],
      endingVideoCount: 2,
      endingVideoRanges: [
        { from: 1, to: 1 },
        { from: 2, to: 2 },
      ],
    };
    const result = migrateEditorState(persisted, 11);
    expect(result.endings).toHaveLength(2);
    expect(result.endings[0]).toEqual({ number: 1, name: "A" });
  });

  it("clamps endingVideoCount > endings.length down on rehydrate", () => {
    const persisted = {
      endings: [{ number: 1, name: "A" }],
      endingVideoCount: 5,
    };
    const result = migrateEditorState(persisted, 11);
    // Single ending → videoCount cannot exceed 1.
    expect(result.endingVideoCount).toBe(1);
    expect(result.endingVideoRanges).toEqual([{ from: 1, to: 1 }]);
  });

  it("re-derives ranges when count doesn't match", () => {
    const persisted = {
      endings: [
        { number: 1, name: "A" },
        { number: 2, name: "B" },
        { number: 3, name: "C" },
      ],
      endingVideoCount: 2,
      // Bogus 1-row ranges array — should be recomputed because length
      // !== endingVideoCount.
      endingVideoRanges: [{ from: 1, to: 3 }],
    };
    const result = migrateEditorState(persisted, 11);
    expect(result.endingVideoRanges).toEqual([
      { from: 1, to: 1 },
      { from: 2, to: 3 },
    ]);
  });
});
