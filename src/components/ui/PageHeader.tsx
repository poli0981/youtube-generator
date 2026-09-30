import type { ReactNode } from "react";
import clsx from "clsx";

interface PageHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  /** Buttons on the right (they wrap under the title on narrow screens). */
  actions?: ReactNode;
  /** Small element after the title (version pill, count). */
  meta?: ReactNode;
  className?: string;
}

/**
 * The one <h1> of a page. The top bar carries no heading, so every screen has
 * exactly one — before v1.0.0 most pages had two (the app name in the header
 * plus their own) and Editor, Output and Profiles had none of their own.
 */
export function PageHeader({ title, description, actions, meta, className }: PageHeaderProps) {
  return (
    <header className={clsx("flex flex-wrap items-end justify-between gap-x-4 gap-y-3", className)}>
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <h1 className="text-text-primary text-xl font-semibold tracking-tight">{title}</h1>
          {meta}
        </div>
        {description && <p className="text-text-muted mt-1 text-sm">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

/** Standard page width + padding, so every page lines up. */
export function PageContainer({
  children,
  width = "default",
  className,
}: {
  children: ReactNode;
  width?: "narrow" | "default" | "wide";
  className?: string;
}) {
  return (
    <div
      className={clsx(
        "mx-auto flex w-full flex-col gap-6 px-4 py-6 sm:px-6 lg:py-8",
        width === "narrow" && "max-w-3xl",
        width === "default" && "max-w-5xl",
        width === "wide" && "max-w-7xl",
        className,
      )}
    >
      {children}
    </div>
  );
}
