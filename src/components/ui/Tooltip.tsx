import type { ReactNode } from "react";
import { Tooltip as RadixTooltip } from "radix-ui";
import clsx from "clsx";

/** Mount once near the root; every Tooltip below shares its delay. */
export function TooltipProvider({ children }: { children: ReactNode }) {
  return (
    <RadixTooltip.Provider delayDuration={350} skipDelayDuration={200}>
      {children}
    </RadixTooltip.Provider>
  );
}

interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  /** Skip the tooltip entirely (e.g. when a label is already visible). */
  disabled?: boolean;
}

/**
 * Hover/focus label for a control. The trigger keeps its own accessible name
 * (aria-label); the tooltip only adds the visible hint.
 */
export function Tooltip({ content, children, side = "top", disabled = false }: TooltipProps) {
  if (disabled) return <>{children}</>;
  return (
    <RadixTooltip.Root>
      <RadixTooltip.Trigger asChild>{children}</RadixTooltip.Trigger>
      <RadixTooltip.Portal>
        <RadixTooltip.Content
          side={side}
          sideOffset={6}
          className={clsx(
            "z-[70] max-w-xs rounded-lg px-2.5 py-1.5 text-xs font-medium",
            "bg-text-primary text-surface-0 shadow-pop animate-fade-in",
          )}
        >
          {content}
        </RadixTooltip.Content>
      </RadixTooltip.Portal>
    </RadixTooltip.Root>
  );
}
