import { useMemo } from "react";

interface CharCountResult {
  count: number;
  limit: number;
  isOver: boolean;
  percentage: number;
}

export function useCharCount(text: string, limit: number): CharCountResult {
  return useMemo(
    () => ({
      count: text.length,
      limit,
      isOver: text.length > limit,
      percentage: Math.min((text.length / limit) * 100, 100),
    }),
    [text, limit],
  );
}
