import type { ReactNode } from "react";
import { Tabs as RadixTabs } from "radix-ui";
import { m } from "motion/react";
import clsx from "clsx";

export interface TabItem<T extends string> {
  value: T;
  label: ReactNode;
  /** Small trailing element — a count or a warning dot. */
  badge?: ReactNode;
}

interface TabsProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  items: readonly TabItem<T>[];
  ariaLabel: string;
  /** Scopes the sliding underline's shared layout id. */
  layoutId: string;
  children?: ReactNode;
  className?: string;
  listClassName?: string;
}

/**
 * Underlined tabs on Radix Tabs (arrow keys move between tabs, the panel is
 * labelled by its tab). Panels are passed as `<TabPanel value>` children.
 */
export function Tabs<T extends string>({
  value,
  onChange,
  items,
  ariaLabel,
  layoutId,
  children,
  className,
  listClassName,
}: TabsProps<T>) {
  return (
    <RadixTabs.Root value={value} onValueChange={(v) => onChange(v as T)} className={className}>
      <RadixTabs.List
        aria-label={ariaLabel}
        className={clsx(
          "border-border flex scrollbar-thin gap-1 overflow-x-auto overflow-y-hidden border-b",
          listClassName,
        )}
      >
        {items.map((item) => {
          const active = item.value === value;
          return (
            <RadixTabs.Trigger
              key={item.value}
              value={item.value}
              className={clsx(
                "relative inline-flex h-9 shrink-0 cursor-pointer items-center gap-1.5 px-3 text-sm font-medium whitespace-nowrap transition-colors",
                active ? "text-text-primary" : "text-text-muted hover:text-text-secondary",
              )}
            >
              {item.label}
              {item.badge}
              {active && (
                <m.span
                  layoutId={layoutId}
                  className="bg-accent absolute inset-x-2 bottom-0 h-0.5 rounded-full"
                  transition={{ type: "spring", stiffness: 500, damping: 40 }}
                  aria-hidden="true"
                />
              )}
            </RadixTabs.Trigger>
          );
        })}
      </RadixTabs.List>
      {children}
    </RadixTabs.Root>
  );
}

export function TabPanel({
  value,
  children,
  className,
}: {
  value: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <RadixTabs.Content value={value} className={clsx("focus:outline-none", className)}>
      {children}
    </RadixTabs.Content>
  );
}
