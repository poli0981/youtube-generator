import type { ReactNode } from "react";
import clsx from "clsx";
import type { IconComponent } from "@components/icons/brand";

interface EmptyStateProps {
  icon?: IconComponent;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
  /** Tighter padding for use inside cards. */
  compact?: boolean;
}

/** What a list or page shows when there is nothing in it yet. */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  compact,
}: EmptyStateProps) {
  return (
    <div
      className={clsx(
        "border-border rounded-card flex flex-col items-center justify-center border border-dashed text-center",
        compact ? "gap-2 px-4 py-6" : "gap-3 px-6 py-12",
        className,
      )}
    >
      {Icon && (
        <span className="bg-surface-2 text-text-muted flex size-11 items-center justify-center rounded-full">
          <Icon className="size-5" aria-hidden />
        </span>
      )}
      <p className="text-text-primary text-sm font-medium">{title}</p>
      {description && (
        <p className="text-text-muted max-w-sm text-xs leading-relaxed">{description}</p>
      )}
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}
