import { beforeEach, describe, expect, it } from "vitest";
import {
  dedupeHistory,
  historyKey,
  useHistoryStore,
  type HistoryEntry,
} from "@store/history-store";

const base = {
  gameName: "Elden Ring",
  videoType: "part" as const,
  language: "en" as const,
  genres: ["action" as const],
  title: "Elden Ring Part 1 — Gameplay No Commentary",
  description: "first",
  tags: "a, b",
};

describe("history store (v1.0.0 dedupe)", () => {
  beforeEach(() => useHistoryStore.setState({ entries: [] }));

  it("records one entry per video however often it is generated", () => {
    const { addEntry } = useHistoryStore.getState();
    addEntry(base);
    addEntry(base);
    addEntry({ ...base, description: "second" });
    const { entries } = useHistoryStore.getState();
    expect(entries).toHaveLength(1);
    expect(entries[0]?.description).toBe("second");
  });

  it("keeps the entry id and moves the video to the top", () => {
    const { addEntry } = useHistoryStore.getState();
    addEntry(base);
    const id = useHistoryStore.getState().entries[0]?.id;
    addEntry({ ...base, title: "Elden Ring Part 2 — Gameplay No Commentary" });
    addEntry(base);
    const { entries } = useHistoryStore.getState();
    expect(entries.map((e) => e.title)).toEqual([
      base.title,
      "Elden Ring Part 2 — Gameplay No Commentary",
    ]);
    expect(entries[0]?.id).toBe(id);
  });

  it("clamps a bad limit instead of trusting it", () => {
    const { addEntry } = useHistoryStore.getState();
    for (let i = 0; i < 15; i++) addEntry({ ...base, title: `T${i}` }, 3);
    expect(useHistoryStore.getState().entries).toHaveLength(10);
  });

  it("treats a different language or type as a different video", () => {
    expect(historyKey(base)).not.toBe(historyKey({ ...base, language: "vi" }));
    expect(historyKey(base)).not.toBe(historyKey({ ...base, videoType: "boss" }));
    expect(historyKey(base)).toBe(historyKey({ ...base, gameName: " elden ring " }));
  });

  it("folds old duplicates keeping the newest", () => {
    const entry = (id: string, createdAt: string): HistoryEntry => ({ ...base, id, createdAt });
    const folded = dedupeHistory([
      entry("new", "2026-09-30T00:00:00Z"),
      entry("old", "2026-09-01T00:00:00Z"),
    ]);
    expect(folded.map((e) => e.id)).toEqual(["new"]);
  });
});
