import clsx from "clsx";
import { useCharCount } from "@hooks/use-char-count";

interface CharCounterProps {
  text: string;
  limit: number;
}

/**
 * Thresholds follow the v0.5 spec:
 * - ≥100 %: red (over limit — YouTube will refuse the string).
 * - ≥80 %: yellow (close enough that the user should glance).
 * - else:  muted grey.
 */
export function CharCounter({ text, limit }: CharCounterProps) {
  const { count, isOver, percentage } = useCharCount(text, limit);
  const isWarning = !isOver && percentage >= 80;

  return (
    <span
      className={clsx(
        "text-xs font-mono font-semibold transition-colors",
        isOver && "text-danger",
        isWarning && "text-warning",
        !isOver && !isWarning && "text-text-muted font-normal",
      )}
    >
      {count}/{limit}
    </span>
  );
}
