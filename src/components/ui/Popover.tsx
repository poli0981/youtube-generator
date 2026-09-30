import type { ReactNode } from "react";
import { Popover as RadixPopover } from "radix-ui";
import clsx from "clsx";

export const PopoverRoot = RadixPopover.Root;
export const PopoverTrigger = RadixPopover.Trigger;

/** Floating panel anchored to its trigger (Radix Popover: focus-managed, Escape closes). */
export function PopoverContent({
  children,
  align = "start",
  className,
  ariaLabel,
}: {
  children: ReactNode;
  align?: "start" | "center" | "end";
  className?: string;
  ariaLabel?: string;
}) {
  return (
    <RadixPopover.Portal>
      <RadixPopover.Content
        align={align}
        sideOffset={6}
        collisionPadding={12}
        aria-label={ariaLabel}
        className={clsx(
          "bg-surface-1 border-border shadow-pop animate-pop-in rounded-card z-[60] w-[var(--radix-popover-trigger-width)] min-w-64 overflow-hidden border focus:outline-none",
          className,
        )}
      >
        {children}
      </RadixPopover.Content>
    </RadixPopover.Portal>
  );
}
