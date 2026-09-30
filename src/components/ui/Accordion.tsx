import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import clsx from "clsx";
import type { IconComponent } from "@components/icons/brand";

interface AccordionProps {
  /** Unique id — the section's DOM anchor (`section-<id>`) and React key. */
  id: string;
  /** Header label. */
  title: string;
  /** Leading icon. */
  icon?: IconComponent;
  /** Short line under the title while collapsed (e.g. a summary). */
  summary?: ReactNode;
  /** Optional trailing badge — e.g. a count or status chip. */
  badge?: ReactNode;
  /** Controlled open state. */
  open: boolean;
  /** Called when the user clicks the header to toggle. */
  onToggle: () => void;
  children: ReactNode;
}

/**
 * A collapsible card section. Controlled — the parent decides which sections
 * are open and persists that choice. Collapsed content is `inert`, so it can
 * no longer be tabbed into or read out while hidden (it used to be).
 */
export function Accordion({
  id,
  title,
  icon,
  summary,
  badge,
  open,
  onToggle,
  children,
}: AccordionProps) {
  const panelId = `section-${id}-panel`;
  const Icon = icon;
  return (
    <section
      id={`section-${id}`}
      data-accordion-id={id}
      className="border-border bg-surface-1 shadow-card rounded-card scroll-mt-24 overflow-hidden border"
    >
      <h2 className="m-0">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          aria-controls={panelId}
          className="group hover:bg-surface-2/60 flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-left transition-colors"
        >
          {Icon && (
            <span className="bg-accent-muted text-accent flex size-8 shrink-0 items-center justify-center rounded-lg">
              <Icon className="size-4" aria-hidden />
            </span>
          )}
          <span className="min-w-0 flex-1">
            <span className="text-text-primary block text-sm font-semibold">{title}</span>
            {summary && !open && (
              <span className="text-text-muted block truncate text-xs">{summary}</span>
            )}
          </span>
          {badge}
          <ChevronDown
            className={clsx(
              "text-text-muted size-4 shrink-0 transition-transform duration-200",
              open && "rotate-180",
            )}
            aria-hidden="true"
          />
        </button>
      </h2>
      <div
        id={panelId}
        inert={!open}
        className={clsx(
          "grid transition-[grid-template-rows] duration-200 ease-out",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div className="overflow-hidden">
          <div className="border-border flex flex-col gap-4 border-t px-4 py-4">{children}</div>
        </div>
      </div>
    </section>
  );
}
