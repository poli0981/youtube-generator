import { describe, it, expect } from "vitest";
import {
  checkChapters,
  formatTimecode,
  normalizeTimeline,
  parseTimeline,
  timecodeSeconds,
} from "@engine/timeline-parser";

const first = (line: string) => parseTimeline(line)[0];

describe("keyword matching respects word boundaries (v1.0.0)", () => {
  it("does not read a game title as a keyword", () => {
    expect(first("1:00 Final Fantasy VII")?.keyword).toBeUndefined();
    expect(first("1:00 Party time")?.keyword).toBeUndefined();
    expect(first("1:00 Bossa nova")?.keyword).toBeUndefined();
    expect(first("1:00 Introspection")?.keyword).toBeUndefined();
    expect(first("1:00 Creditors")?.keyword).toBeUndefined();
  });

  it("still recognises the keywords themselves", () => {
    expect(first("1:00 Introduction")).toMatchObject({ keyword: "intro" });
    expect(first("1:00 Introduction")?.rest).toBeUndefined();
    expect(first("1:00 Part 2")).toMatchObject({ keyword: "part", number: 2 });
    expect(first("1:00 Boss: Malenia")).toMatchObject({ keyword: "boss", rest: ": Malenia" });
  });

  it("keeps Spanish 'Final' as an ending when it stands alone", () => {
    expect(first("1:00 Final")).toMatchObject({ keyword: "ending" });
    expect(first("1:00 Final 2")).toMatchObject({ keyword: "ending", number: 2 });
    expect(first("1:00 Final: el mejor")).toMatchObject({ keyword: "ending" });
  });

  it("recognises Portuguese and Indonesian keywords", () => {
    expect(first("0:00 Introdução")).toMatchObject({ keyword: "intro" });
    expect(first("5:00 Chefe final")).toMatchObject({ keyword: "final_boss" });
    expect(first("5:00 Bab 3")).toMatchObject({ keyword: "chapter", number: 3 });
    expect(first("5:00 Bagian 2")).toMatchObject({ keyword: "part", number: 2 });
    expect(first("9:00 Bos terakhir")).toMatchObject({ keyword: "final_boss" });
  });

  it("keeps matching CJK keywords written without spaces", () => {
    expect(first("1:00 第3章森")).toMatchObject({ keyword: "chapter", number: 3 });
    expect(first("1:00 オープンワールド探索")?.keyword).toBeUndefined();
  });
});

describe("timestamp formats (v1.0.0)", () => {
  it("accepts brackets, separators and frame counts", () => {
    expect(first("[0:00] Intro")).toMatchObject({ time: "0:00", rawLabel: "Intro" });
    expect(first("(1:23) Boss")).toMatchObject({ time: "1:23", rawLabel: "Boss" });
    expect(first("0:00 - Start")).toMatchObject({ time: "0:00", rawLabel: "Start" });
    expect(first("0:00 – Start")).toMatchObject({ time: "0:00", rawLabel: "Start" });
    expect(first("00:01:02:15 Cutscene")).toMatchObject({ time: "00:01:02", rawLabel: "Cutscene" });
  });

  it("converts timecodes to and from seconds", () => {
    expect(timecodeSeconds("0:00")).toBe(0);
    expect(timecodeSeconds("12:34")).toBe(754);
    expect(timecodeSeconds("1:02:03")).toBe(3723);
    expect(timecodeSeconds("abc")).toBeNaN();
    expect(formatTimecode(5)).toBe("0:05");
    expect(formatTimecode(3723)).toBe("1:02:03");
  });

  it("normalises a list to YouTube's form", () => {
    expect(normalizeTimeline("[00:00] Intro\n00:01:30:10 - Part 1\nnotes")).toBe(
      "0:00 Intro\n1:30 Part 1\nnotes",
    );
  });
});

describe("checkChapters", () => {
  it("accepts a valid chapter list", () => {
    expect(checkChapters(parseTimeline("0:00 Intro\n0:30 Part 1\n5:00 Ending"))).toEqual([]);
  });

  it("has nothing to say about an empty list", () => {
    expect(checkChapters([])).toEqual([]);
  });

  it("reports every rule YouTube enforces", () => {
    const issues = checkChapters(parseTimeline("0:05 Intro\n0:10 Part 1"));
    expect(issues).toContainEqual({ kind: "firstNotZero" });
    expect(issues).toContainEqual({ kind: "tooFew", count: 2 });
    expect(issues).toContainEqual({ kind: "tooShort", time: "0:10" });
  });

  it("flags timestamps out of order", () => {
    const issues = checkChapters(parseTimeline("0:00 A\n2:00 B\n1:00 C"));
    expect(issues).toContainEqual({ kind: "outOfOrder", time: "1:00" });
  });
});
