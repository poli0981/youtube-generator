import { describe, it, expect } from "vitest";
import { parseTimeline, renderTimeline } from "@engine/timeline-parser";
import type { TranslationFn } from "@engine/types";

// Minimal translation lookup keyed by (language, keyword id).
// Mirrors the shape of the real templates.json entries.
const DICT: Record<string, Record<string, string>> = {
  en: {
    chapter: "Chapter {{n}}",
    part: "Part {{n}}",
    boss: "Boss {{n}}",
    final_boss: "Final Boss",
    intro: "Intro",
    ending: "Ending",
    tutorial: "Tutorial",
    credits: "Credits",
  },
  vi: {
    chapter: "Chương {{n}}",
    part: "Phần {{n}}",
    boss: "Boss {{n}}",
    final_boss: "Boss cuối",
    intro: "Mở đầu",
    ending: "Kết thúc",
    tutorial: "Hướng dẫn",
    credits: "Credits",
  },
  ja: {
    chapter: "第{{n}}章",
    part: "パート{{n}}",
    boss: "ボス{{n}}",
    final_boss: "ラスボス",
    intro: "オープニング",
    ending: "エンディング",
    tutorial: "チュートリアル",
    credits: "クレジット",
  },
};

function makeT(lang: "en" | "vi" | "ja"): TranslationFn {
  return (key, opts) => {
    const id = key.replace("timeline.keywords.", "");
    const template = DICT[lang][id] ?? id;
    if (!opts) return template;
    return template.replace(/\{\{(\w+)\}\}/g, (_, k) => opts[k] ?? "");
  };
}

describe("parseTimeline", () => {
  it("parses time + label into entries", () => {
    const entries = parseTimeline("0:00 Intro\n5:30 Chapter 1\n15:00 Boss 2");
    expect(entries).toHaveLength(3);
    expect(entries[0].time).toBe("0:00");
    expect(entries[0].keyword).toBe("intro");
    expect(entries[1].keyword).toBe("chapter");
    expect(entries[1].number).toBe(1);
    expect(entries[2].keyword).toBe("boss");
    expect(entries[2].number).toBe(2);
  });

  it("supports HH:MM:SS timecodes", () => {
    const entries = parseTimeline("1:23:45 Chapter 7");
    expect(entries[0].time).toBe("1:23:45");
    expect(entries[0].keyword).toBe("chapter");
    expect(entries[0].number).toBe(7);
  });

  it("recognizes final boss before boss", () => {
    const entries = parseTimeline("10:00 Final Boss");
    expect(entries[0].keyword).toBe("final_boss");
  });

  it("recognizes Vietnamese keywords", () => {
    const entries = parseTimeline("0:00 Mở đầu\n5:00 Chương 3\n20:00 Boss cuối");
    expect(entries[0].keyword).toBe("intro");
    expect(entries[1].keyword).toBe("chapter");
    expect(entries[1].number).toBe(3);
    expect(entries[2].keyword).toBe("final_boss");
  });

  it("recognizes Japanese keywords", () => {
    const entries = parseTimeline("0:00 オープニング\n5:00 パート 2\n20:00 ラスボス");
    expect(entries[0].keyword).toBe("intro");
    expect(entries[1].keyword).toBe("part");
    expect(entries[1].number).toBe(2);
    expect(entries[2].keyword).toBe("final_boss");
  });

  it("preserves lines that don't match a known keyword", () => {
    const entries = parseTimeline("0:00 Random Stuff");
    expect(entries[0].time).toBe("0:00");
    expect(entries[0].keyword).toBeUndefined();
    expect(entries[0].rawLabel).toBe("Random Stuff");
  });

  it("preserves lines without a time prefix", () => {
    const entries = parseTimeline("Just a note");
    expect(entries[0].time).toBe("");
    expect(entries[0].rawLabel).toBe("Just a note");
  });

  it("skips blank lines", () => {
    const entries = parseTimeline("\n0:00 Intro\n\n5:00 Chapter 1\n");
    expect(entries).toHaveLength(2);
  });
});

describe("renderTimeline", () => {
  it("translates English input to Vietnamese", () => {
    const entries = parseTimeline("0:00 Intro\n5:30 Chapter 1\n10:00 Boss 2\n20:00 Final Boss");
    const out = renderTimeline(entries, "vi", makeT("vi"));
    expect(out).toBe("0:00 Mở đầu\n5:30 Chương 1\n10:00 Boss 2\n20:00 Boss cuối");
  });

  it("translates English input to Japanese", () => {
    const entries = parseTimeline("0:00 Intro\n5:30 Chapter 1");
    const out = renderTimeline(entries, "ja", makeT("ja"));
    expect(out).toBe("0:00 オープニング\n5:30 第1章");
  });

  it("keeps unrecognized labels verbatim", () => {
    const entries = parseTimeline("0:00 Intro\n7:00 Random Stuff");
    const out = renderTimeline(entries, "vi", makeT("vi"));
    expect(out).toBe("0:00 Mở đầu\n7:00 Random Stuff");
  });

  it("renders English (identity) correctly", () => {
    const entries = parseTimeline("0:00 Intro\n5:30 Chapter 1\n10:00 Boss 2");
    const out = renderTimeline(entries, "en", makeT("en"));
    expect(out).toBe("0:00 Intro\n5:30 Chapter 1\n10:00 Boss 2");
  });
});
