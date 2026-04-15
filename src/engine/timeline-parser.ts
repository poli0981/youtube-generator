import type { SupportedLanguage, TranslationFn } from "./types";

/**
 * Canonical keyword IDs recognized by the parser. Each corresponds to a
 * translation key under `timeline.keywords.*` in templates.json.
 */
export type TimelineKeyword =
  | "chapter"
  | "part"
  | "boss"
  | "final_boss"
  | "intro"
  | "ending"
  | "tutorial"
  | "credits";

export interface TimelineEntry {
  /** Raw timecode as it appeared in the input (e.g. "0:00", "1:23:45"). */
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

// Regex for extracting time + label from a line. Accepts MM:SS or HH:MM:SS.
const LINE_RE = /^\s*((?:\d{1,2}:)?\d{1,2}:\d{2})\s+(.+?)\s*$/;

// Keyword patterns. Order matters — "final boss" must be tried before "boss".
// Each regex captures the optional number group when applicable.
interface KeywordPattern {
  re: RegExp;
  keyword: TimelineKeyword;
  hasNumber: boolean;
}

const KEYWORD_PATTERNS: KeywordPattern[] = [
  // Final boss (multi-language, no number). Must come BEFORE "boss".
  {
    re: /^(final\s+boss|boss\s+cuối\s+cùng|boss\s+cuối|ラスボス|最終\s*ボス|jefe\s+final|최종\s*보스|最终\s*boss|最终\s*首领)(.*)$/i,
    keyword: "final_boss",
    hasNumber: false,
  },
  // Chapter — captures various CJK/Latin forms
  {
    re: /^(?:chapter|chap\.?|chương|chuong|capítulo|capitulo|第\s*(\d+)\s*章|제\s*(\d+)\s*장|章|장)\s*(\d+)?(.*)$/i,
    keyword: "chapter",
    hasNumber: true,
  },
  // Part
  {
    re: /^(?:part|phần|phan|パート|parte|파트|第\s*(\d+)\s*部|部分)\s*(\d+)?(.*)$/i,
    keyword: "part",
    hasNumber: true,
  },
  // Boss (single, with optional number)
  {
    re: /^(?:boss|ボス|jefe|보스)\s*(\d+)?(.*)$/i,
    keyword: "boss",
    hasNumber: true,
  },
  // Intro
  {
    re: /^(intro|introduction|mở\s+đầu|mo\s+dau|オープニング|オープン|introducción|introduccion|인트로|开场|序幕)(.*)$/i,
    keyword: "intro",
    hasNumber: false,
  },
  // Ending
  {
    re: /^(ending|kết\s+thúc|ket\s+thuc|エンディング|final|엔딩|结局|结尾)(.*)$/i,
    keyword: "ending",
    hasNumber: false,
  },
  // Tutorial
  {
    re: /^(tutorial|hướng\s+dẫn|huong\s+dan|チュートリアル|튜토리얼|教程)(.*)$/i,
    keyword: "tutorial",
    hasNumber: false,
  },
  // Credits
  {
    re: /^(credits|credit|クレジット|créditos|creditos|크레딧|片尾|职员表)(.*)$/i,
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
    const translated = t(`timeline.keywords.${entry.keyword}`, { n: numberVar });
    const withRest = entry.rest ? `${translated} ${entry.rest}` : translated;
    rendered.push(`${entry.time} ${withRest}`);
  }

  return rendered.join("\n");
}
