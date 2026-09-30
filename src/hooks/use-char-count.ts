import { useMemo } from "react";

interface CharCountResult {
  count: number;
  limit: number;
  isOver: boolean;
  percentage: number;
}

/**
 * `count` overrides `text.length` where YouTube measures differently from
 * the string we display — tags, whose limit counts quotes around multi-word
 * tags and one comma between tags (see `youtubeTagsLength`).
 */
export function useCharCount(text: string, limit: number, count?: number): CharCountResult {
  return useMemo(() => {
    const n = count ?? text.length;
    return { count: n, limit, isOver: n > limit, percentage: Math.min((n / limit) * 100, 100) };
  }, [text, limit, count]);
}
