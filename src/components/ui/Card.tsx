import type { HTMLAttributes, ReactNode } from "react";
import clsx from "clsx";

/** Surface for a self-contained block of content. */
export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx("border-border bg-surface-1 shadow-card rounded-card border", className)}
      {...props}
    />
  );
}

interface CardHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  actions?: ReactNode;
  className?: string;
  /** Heading level for the title (default h2). */
  as?: "h2" | "h3";
}

export function CardHeader({
  title,
  description,
  icon,
  actions,
  className,
  as = "h2",
}: CardHeaderProps) {
  const Heading = as;
  return (
    <div className={clsx("flex items-start gap-3 px-4 pt-4", className)}>
      {icon && (
        <span className="bg-accent-muted text-accent flex size-8 shrink-0 items-center justify-center rounded-lg [&_svg]:size-4">
          {icon}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <Heading className="text-text-primary text-sm font-semibold">{title}</Heading>
        {description && (
          <p className="text-text-muted mt-0.5 text-xs leading-snug">{description}</p>
        )}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-1">{actions}</div>}
    </div>
  );
}
