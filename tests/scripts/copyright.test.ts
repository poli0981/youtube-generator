import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";
import { COPYRIGHT_START_YEAR, copyrightYears } from "@config/brand";
import { NOTICES, checkNotices, withYears, type Notice } from "../../scripts/lib/copyright";

function noticeFor(file: string): Notice {
  const notice = NOTICES.find((n) => n.file === file);
  if (!notice) throw new Error(`no notice for ${file}`);
  return notice;
}

describe("copyrightYears", () => {
  it.each([
    [2026, "2026"],
    [2027, "2026-2027"],
    [2031, "2026-2031"],
    // A clock or a commit dated before the start never makes a backwards range.
    [2025, "2026"],
  ])("%i → %s", (year, expected) => {
    expect(copyrightYears(year)).toBe(expected);
  });

  it("starts in the year of the first commit", () => {
    expect(COPYRIGHT_START_YEAR).toBe(2026);
  });
});

describe("the notices in the repository", () => {
  // Deliberately independent of today's date: `npm run check:copyright` in CI
  // holds them to HEAD's year. This catches a file reformatted so the pattern
  // no longer finds its notice, or one notice drifting from the others.
  it("are all found and all state the same years", () => {
    const found = checkNotices(COPYRIGHT_START_YEAR).map((check) => check.found);
    expect(found).toHaveLength(3);
    expect(found).not.toContain(null);
    expect(new Set(found).size).toBe(1);
  });

  it("include the installers' copyright string", () => {
    const conf = JSON.parse(readFileSync(resolve("src-tauri/tauri.conf.json"), "utf8")) as {
      bundle: { copyright?: string };
    };
    expect(conf.bundle.copyright).toMatch(/^Copyright [0-9]{4}(-[0-9]{4})? poli0981 /);
  });
});

describe("checkNotices", () => {
  it("reports a notice whose years are behind", () => {
    const read = (file: string) =>
      file === "NOTICE"
        ? "YTDescGen\nCopyright 2026 poli0981 (https://github.com/poli0981)\n"
        : "nothing here";
    const [notice, reuse] = checkNotices(2027, read);
    expect(notice).toMatchObject({ found: "2026", expected: "2026-2027" });
    expect(reuse).toMatchObject({ found: null, expected: "2026-2027" });
  });
});

describe("withYears", () => {
  it.each(NOTICES.map((n) => [n.file]))("rewrites only the years in %s", (file) => {
    const notice = noticeFor(file);
    const raw = readFileSync(resolve(file), "utf8");
    const current = notice.pattern.exec(raw)?.[1];
    expect(current).toBeDefined();

    const updated = withYears(raw, notice, "2026-2099");
    expect(notice.pattern.exec(updated)?.[1]).toBe("2026-2099");
    // Swapping the years back restores the file byte for byte.
    expect(withYears(updated, notice, current ?? "")).toBe(raw);
  });
});
