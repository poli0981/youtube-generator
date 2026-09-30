import type { ReactNode } from "react";
import { ToggleGroup } from "radix-ui";
import { m } from "motion/react";
import clsx from "clsx";

export interface SegmentOption<T extends string> {
  value: T;
  label: ReactNode;
  /** Accessible name when `label` is an icon. */
  ariaLabel?: string;
}

interface SegmentedControlProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: readonly SegmentOption<T>[];
  /** Names the group for screen readers. */
  ariaLabel: string;
  size?: "sm" | "md";
  className?: string;
  /** Unique per page — scopes the sliding highlight's shared layout id. */
  layoutId?: string;
}

/**
 * One-of-N switch with a highlight that slides between segments. Replaces the
 * five hand-rolled segmented button rows (Profiles tabs, Social platform,
 * Log levels …), which had no ARIA state.
 */
export function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
  ariaLabel,
  size = "md",
  className,
  layoutId = "segmented",
}: SegmentedControlProps<T>) {
  return (
    <ToggleGroup.Root
      type="single"
      value={value}
      onValueChange={(next) => {
        if (next) onChange(next as T);
      }}
      aria-label={ariaLabel}
      className={clsx(
        "bg-surface-2 border-border rounded-control inline-flex max-w-full items-center gap-0.5 overflow-x-auto border p-0.5",
        className,
      )}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <ToggleGroup.Item
            key={option.value}
            value={option.value}
            aria-label={option.ariaLabel}
            className={clsx(
              "relative inline-flex shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-[0.5rem] font-medium whitespace-nowrap",
              "transition-colors duration-150 [&_svg]:size-4",
              size === "sm" ? "h-7 px-2.5 text-xs" : "h-8 px-3 text-sm",
              active ? "text-text-primary" : "text-text-secondary hover:text-text-primary",
            )}
          >
            {active && (
              <m.span
                layoutId={layoutId}
                className="bg-surface-0 border-border absolute inset-0 rounded-[0.5rem] border shadow-sm"
                transition={{ type: "spring", stiffness: 500, damping: 38 }}
                aria-hidden="true"
              />
            )}
            <span className="relative inline-flex items-center gap-1.5">{option.label}</span>
          </ToggleGroup.Item>
        );
      })}
    </ToggleGroup.Root>
  );
}
