import clsx from "clsx";
import { useCharCount } from "@hooks/use-char-count";

interface CharCounterProps {
  text: string;
  limit: number;
}

export function CharCounter({ text, limit }: CharCounterProps) {
  const { count, isOver, percentage } = useCharCount(text, limit);

  return (
    <span
      className={clsx(
        "text-xs font-mono",
        isOver ? "text-danger" : percentage > 80 ? "text-warning" : "text-text-muted",
      )}
    >
      {count}/{limit}
    </span>
  );
}
