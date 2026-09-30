import type { SupportedLanguage, TranslationFn } from "./types";

/**
 * Canonical keyword IDs recognized by the parser. Each corresponds to a
 * translation key under `timeline.keywords.*` in templates.json.
 */
type TimelineKeyword =
  "chapter" | "part" | "boss" | "final_boss" | "intro" | "ending" | "tutorial" | "credits";

export interface TimelineEntry {
  /** Timecode as written, minus brackets and frames (e.g. "0:00", "1:23:45"). */
  time: string;
  /** Entire label portion after the timecode (trimmed). */
  rawLabel: string;
  /** Keyword that the label was classified as, if any. */
  keyword?: TimelineKeyword;
  /** Ordinal number when the keyword supports one (e.g. Chapter 3 -> 3). */
  number?: number;
  /** Trailing text after the keyword+number, if any (preserved for context). */
  rest?: string;
}

/**
 * A timestamp line: an optional `[` / `(`, M:SS / MM:SS / H:MM:SS (with
 * frames `:FF` dropped, as editors export them), an optional `]` / `)`,
 * an optional separator (`-`, `–`, `—`, `:`, `|`, `•`) and the label.
 * "[0:00] Intro", "0:00 - Intro" and "00:00:00:12 Intro" all parse.
 */
const LINE_RE =
  /^\s*[[(]?((?:\d{1,2}:)?\d{1,2}:\d{2})(?::\d{2})?[\])]?\s*(?:[-–—:|•·]\s*)?(\S.*?)\s*$/u;

// Keyword patterns. Order matters — "final boss" must be tried before "boss".
// Each regex captures the optional number group when applicable.
interface KeywordPattern {
  re: RegExp;
  keyword: TimelineKeyword;
  hasNumber: boolean;
}

/**
 * After a Latin-script keyword, the next character must not be a letter:
 * "Part 2" is a part, "Party" is not; "Intro" is an intro, "Introspection"
 * is not. Scripts written without spaces (Japanese, Chinese, Korean) are
 * matched without this guard.
 */
const END = "(?!\\p{L})";

const kw = (source: string): RegExp => new RegExp(source, "iu");

const KEYWORD_PATTERNS: KeywordPattern[] = [
  // Final boss (multi-language, no number). Must come BEFORE "boss".
  {
    re: kw(
      `^((?:final\\s+boss|boss\\s+cuối\\s+cùng|boss\\s+cuối|jefe\\s+final|chefe\\s+final|bos\\s+terakhir)${END}|ラスボス|最終\\s*ボス|최종\\s*보스|最终\\s*boss|最终\\s*首领)(.*)$`,
    ),
    keyword: "final_boss",
    hasNumber: false,
  },
  // Chapter — captures various CJK/Latin forms
  {
    re: kw(
      `^(?:(?:chapter|chap\\.|chap|chương|chuong|capítulo|capitulo|bab)${END}|第\\s*(\\d+)\\s*章|제\\s*(\\d+)\\s*장|章|장)\\s*(\\d+)?(.*)$`,
    ),
    keyword: "chapter",
    hasNumber: true,
  },
  // Part
  {
    re: kw(
      `^(?:(?:part|phần|phan|parte|bagian)${END}|パート|파트|第\\s*(\\d+)\\s*部|部分)\\s*(\\d+)?(.*)$`,
    ),
    keyword: "part",
    hasNumber: true,
  },
  // Boss (single, with optional number)
  {
    re: kw(`^(?:(?:boss|jefe|chefe|bos)${END}|ボス|보스)\\s*(\\d+)?(.*)$`),
    keyword: "boss",
    hasNumber: true,
  },
  // Intro
  {
    re: kw(
      `^((?:introduction|introducción|introduccion|introdução|introducao|intro|mở\\s+đầu|mo\\s+dau|pembukaan)${END}|オープニング|인트로|开场|序幕)(.*)$`,
    ),
    keyword: "intro",
    hasNumber: false,
  },
  // Ending — captures an optional ordinal so "Ending 1" / "Ending 3: Best
  // End" can be matched back to the structured `endings[]` array. Bare
  // "Final" (Spanish / Portuguese for ending) only counts when nothing but
  // a number or punctuation follows it — "Final Fantasy VII" is a game,
  // not an ending.
  {
    re: kw(
      `^(?:(?:ending|kết\\s+thúc|ket\\s+thuc|desfecho|tamat)${END}|final(?=\\s*(?:$|\\d|[:\\-–—(]))|エンディング|엔딩|结局|结尾)\\s*(\\d+)?(.*)$`,
    ),
    keyword: "ending",
    hasNumber: true,
  },
  // Tutorial
  {
    re: kw(`^((?:tutorial|hướng\\s+dẫn|huong\\s+dan)${END}|チュートリアル|튜토리얼|教程)(.*)$`),
    keyword: "tutorial",
    hasNumber: false,
  },
  // Credits
  {
    re: kw(
      `^((?:credits|credit|créditos|creditos|kredit)${END}|クレジット|크레딧|片尾|职员表)(.*)$`,
    ),
    keyword: "credits",
    hasNumber: false,
  },
];

/**
 * Parse a raw timestamp textarea value into structured entries.
 *
 * Each non-empty line is expected to start with a timecode. Lines that
 * don't match the `time + label` shape are still preserved as entries
 * with `time: ""` so the original text isn't lost.
 */
export function parseTimeline(raw: string): TimelineEntry[] {
  const entries: TimelineEntry[] = [];
  const lines = raw.split(/\r?\n/);

  for (const line of lines) {
    if (!line.trim()) continue;

    const lineMatch = line.match(LINE_RE);
    if (!lineMatch) {
      // Not a `time label` line — keep the raw text so nothing disappears.
      entries.push({ time: "", rawLabel: line.trim() });
      continue;
    }

    const time = lineMatch[1] ?? "";
    const label = lineMatch[2] ?? "";
    const entry: TimelineEntry = { time, rawLabel: label };

    for (const pattern of KEYWORD_PATTERNS) {
      const m = label.match(pattern.re);
      if (!m) continue;

      entry.keyword = pattern.keyword;

      if (pattern.hasNumber) {
        // Scan every capture group for the first numeric one. Different
        // alternatives (e.g. "第N章" vs "Chapter N") place the number in
        // different group positions, so treat them uniformly.
        for (let i = 1; i < m.length - 1; i++) {
          const g = m[i];
          if (g && /^\d+$/.test(g)) {
            entry.number = parseInt(g, 10);
            break;
          }
        }
      }

      const rest = m[m.length - 1];
      if (rest && rest.trim()) {
        entry.rest = rest.trim();
      }
      break;
    }

    entries.push(entry);
  }

  return entries;
}

/**
 * Render parsed entries back into the timestamp block, translating
 * recognized keywords into the requested language via i18next.
 *
 * Lines without a recognized keyword keep their original label so
 * the user's free-form text is preserved.
 */
export function renderTimeline(
  entries: TimelineEntry[],
  _language: SupportedLanguage,
  t: TranslationFn,
): string {
  const rendered: string[] = [];

  for (const entry of entries) {
    if (!entry.time) {
      rendered.push(entry.rawLabel);
      continue;
    }

    if (!entry.keyword) {
      rendered.push(`${entry.time} ${entry.rawLabel}`);
      continue;
    }

    const numberVar = entry.number != null ? String(entry.number) : "";
    // Collapse the trailing whitespace that creeps in when a numbered
    // keyword pattern (`"Boss {{n}}"`) interpolates with an empty `n`.
    const translated = t(`timeline.keywords.${entry.keyword}`, { n: numberVar })
      .replace(/\s+$/u, "")
      .replace(/\s{2,}/gu, " ");
    const withRest = entry.rest ? `${translated} ${entry.rest}` : translated;
    rendered.push(`${entry.time} ${withRest}`);
  }

  return rendered.join("\n");
}

/** Seconds in a timecode ("1:02:03" → 3723), or NaN when it isn't one. */
export function timecodeSeconds(time: string): number {
  const parts = time.split(":").map((p) => Number(p));
  if (parts.length < 2 || parts.length > 3 || parts.some((p) => !Number.isInteger(p) || p < 0)) {
    return Number.NaN;
  }
  return parts.reduce((total, part) => total * 60 + part, 0);
}

/** Canonical YouTube form: "0:05", "12:34", "1:02:03". */
export function formatTimecode(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${ss}` : `${m}:${ss}`;
}

/**
 * Rewrite a timestamp list in the form YouTube reads most reliably: one
 * "M:SS label" per line, brackets / frames / separators removed, times
 * without leading zeros. Lines that aren't timestamps are kept as they are.
 */
export function normalizeTimeline(raw: string): string {
  return parseTimeline(raw)
    .map((entry) => {
      if (!entry.time) return entry.rawLabel;
      const seconds = timecodeSeconds(entry.time);
      const time = Number.isNaN(seconds) ? entry.time : formatTimecode(seconds);
      return `${time} ${entry.rawLabel}`;
    })
    .join("\n");
}

/** Why YouTube wouldn't turn a timestamp list into chapters. */
export type ChapterIssue =
  | { kind: "firstNotZero" }
  | { kind: "tooFew"; count: number }
  | { kind: "tooShort"; time: string }
  | { kind: "outOfOrder"; time: string };

/** YouTube's own rules for video chapters. */
export const CHAPTER_RULES = { minCount: 3, minSeconds: 10 } as const;

/**
 * Check a timestamp list against YouTube's chapter rules: the first
 * timestamp at 0:00, at least three of them, in ascending order, each
 * chapter at least ten seconds long. An empty list has no issues — chapters
 * are optional.
 */
export function checkChapters(entries: readonly TimelineEntry[]): ChapterIssue[] {
  const timed = entries.filter((e) => e.time);
  if (timed.length === 0) return [];

  const issues: ChapterIssue[] = [];
  const seconds = timed.map((e) => timecodeSeconds(e.time));
  if (seconds[0] !== 0) issues.push({ kind: "firstNotZero" });
  if (timed.length < CHAPTER_RULES.minCount) {
    issues.push({ kind: "tooFew", count: timed.length });
  }
  for (let i = 1; i < timed.length; i++) {
    const prev = seconds[i - 1] ?? 0;
    const cur = seconds[i] ?? 0;
    const time = timed[i]?.time ?? "";
    if (cur <= prev) issues.push({ kind: "outOfOrder", time });
    else if (cur - prev < CHAPTER_RULES.minSeconds) issues.push({ kind: "tooShort", time });
  }
  return issues;
}
