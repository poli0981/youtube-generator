/**
 * Copyright years, kept current.
 *
 *   npm run check:copyright    fail if a notice states the wrong years
 *   npm run update:copyright   rewrite them to the expected years
 *
 * The years are written by hand in three files — NOTICE, REUSE.toml and the
 * installers' copyright string in src-tauri/tauri.conf.json — and nothing
 * used to keep them current. Each must state `copyrightYears(year)` from
 * src/config/brand.ts: "2026", then "2026-2027" from the first commit made in
 * 2027, and so on.
 *
 * "This year" is the year HEAD was committed, not the clock: re-running CI on
 * an old commit stays green, and the first new work in a new year is what asks
 * for the bump. Without git (a source tarball) it falls back to the UTC year.
 *
 * Deliberately left alone: the `[yyyy]` placeholder in the Apache-2.0
 * appendix (LICENSE, LICENSES/Apache-2.0.txt), the Gradle wrapper's own 2015
 * notice, CHANGELOG history and the `{{year}}` of generated descriptions.
 */
import { execFileSync } from "child_process";
import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";
import { copyrightYears } from "../../src/config/brand.ts";

const ROOT = resolve(import.meta.dirname, "../..");

export interface Notice {
  /** Repo-relative path. */
  file: string;
  /** Finds the notice; capture group 1 is its years ("2026", "2026-2027"). */
  pattern: RegExp;
}

export const NOTICES: readonly Notice[] = [
  { file: "NOTICE", pattern: /^Copyright ([0-9]{4}(?:-[0-9]{4})?) poli0981 /m },
  {
    file: "REUSE.toml",
    pattern: /^SPDX-FileCopyrightText = "([0-9]{4}(?:-[0-9]{4})?) poli0981 /m,
  },
  {
    file: "src-tauri/tauri.conf.json",
    pattern: /"copyright": "Copyright ([0-9]{4}(?:-[0-9]{4})?) poli0981 /,
  },
];

export interface NoticeCheck {
  notice: Notice;
  /** The years the file states now, or null when the notice is not found. */
  found: string | null;
  expected: string;
}

function readRepoFile(file: string): string {
  return readFileSync(resolve(ROOT, file), "utf8");
}

/** The year HEAD was committed, or this UTC year when git is unavailable. */
export function headCommitYear(): number {
  try {
    const iso = execFileSync("git", ["log", "-1", "--format=%cI"], {
      cwd: ROOT,
      encoding: "utf8",
    });
    const year = Number(iso.trim().slice(0, 4));
    if (Number.isInteger(year) && year >= 2000) return year;
  } catch {
    // Not a git checkout.
  }
  return new Date().getUTCFullYear();
}

/** Every notice's current years against the ones `year` calls for. */
export function checkNotices(year: number, read = readRepoFile): NoticeCheck[] {
  const expected = copyrightYears(year);
  return NOTICES.map((notice) => ({
    notice,
    found: notice.pattern.exec(read(notice.file))?.[1] ?? null,
    expected,
  }));
}

/** `raw` with the notice's years swapped for `years`; nothing else changes. */
export function withYears(raw: string, notice: Notice, years: string): string {
  return raw.replace(notice.pattern, (match, current: string) => match.replace(current, years));
}

export function main(): void {
  const write = process.argv.includes("--write");
  let failed = false;
  for (const { notice, found, expected } of checkNotices(headCommitYear())) {
    if (found === expected) {
      console.log(`✓ ${notice.file}: ${found}`);
    } else if (found === null) {
      failed = true;
      console.error(`✗ ${notice.file}: no copyright notice found (expected ${expected}).`);
    } else if (write) {
      writeFileSync(
        resolve(ROOT, notice.file),
        withYears(readRepoFile(notice.file), notice, expected),
      );
      console.log(`✎ ${notice.file}: ${found} → ${expected}`);
    } else {
      failed = true;
      console.error(
        `✗ ${notice.file}: ${found}, expected ${expected}. Run: npm run update:copyright`,
      );
    }
  }
  if (failed) process.exit(1);
}
