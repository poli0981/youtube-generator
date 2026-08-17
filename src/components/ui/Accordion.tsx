import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";
import clsx from "clsx";

interface AccordionProps {
  /** Unique id for the section — used as React key in lists. */
  id: string;
  /** Header label. */
  title: string;
  /** Optional leading icon (emoji or single-char string). */
  icon?: string;
  /** Optional trailing badge — e.g. a count or status chip. */
  badge?: ReactNode;
  /** Controlled open state. */
  open: boolean;
  /** Called when the user clicks the header to toggle. */
  onToggle: () => void;
  children: ReactNode;
}

/**
 * Single-section accordion. Controlled only — the parent decides which
 * sections are open and persists that choice. Height animates via a
 * grid-rows trick so content can be any height without measurement.
 */
export function Accordion({ id, title, icon, badge, open, onToggle, children }: AccordionProps) {
  return (
    <section
      data-accordion-id={id}
      className="overflow-hidden rounded-lg border border-border bg-surface-1"
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-2"
      >
        <div className="flex items-center gap-2">
          {icon && <span className="text-base leading-none">{icon}</span>}
          <span className="text-sm font-semibold text-text-primary">{title}</span>
          {badge}
        </div>
        <ChevronDown
          className={clsx(
            "h-4 w-4 text-text-muted transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </button>
      <div
        className={clsx(
          "grid transition-[grid-template-rows] duration-200 ease-out",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div className="overflow-hidden">
          <div className="flex flex-col gap-3 border-t border-border px-4 py-4">{children}</div>
        </div>
      </div>
    </section>
  );
}
