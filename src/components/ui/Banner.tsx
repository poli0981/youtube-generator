import type { ReactNode } from "react";
import { CircleAlert, Info, TriangleAlert, CircleCheck, X } from "lucide-react";
import clsx from "clsx";

type Tone = "info" | "warning" | "danger" | "success" | "accent";

const TONES: Record<Tone, { box: string; icon: typeof Info }> = {
  info: { box: "border-info/30 bg-info/8 text-info", icon: Info },
  accent: { box: "border-accent/30 bg-accent-muted text-accent", icon: Info },
  warning: { box: "border-warning/35 bg-warning/10 text-warning", icon: TriangleAlert },
  danger: { box: "border-danger/35 bg-danger/10 text-danger", icon: CircleAlert },
  success: { box: "border-success/30 bg-success/10 text-success", icon: CircleCheck },
};

interface BannerProps {
  tone?: Tone;
  title?: ReactNode;
  children?: ReactNode;
  action?: ReactNode;
  onDismiss?: () => void;
  dismissLabel?: string;
  /** Announce to screen readers when it appears (errors, blocking notices). */
  alert?: boolean;
  className?: string;
}

/** Inline notice: warnings, limits, strict-mode blocks, tips. */
export function Banner({
  tone = "info",
  title,
  children,
  action,
  onDismiss,
  dismissLabel,
  alert,
  className,
}: BannerProps) {
  const { box, icon: Icon } = TONES[tone];
  return (
    <div
      role={alert ? "alert" : undefined}
      className={clsx(
        "rounded-card flex gap-3 border px-3.5 py-3 text-xs leading-relaxed",
        box,
        className,
      )}
    >
      <Icon className="mt-px size-4 shrink-0" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        {title && <p className="text-[0.8125rem] font-semibold">{title}</p>}
        {children && (
          <div className={clsx("text-text-secondary", title && "mt-0.5")}>{children}</div>
        )}
        {action && <div className="mt-2">{action}</div>}
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label={dismissLabel}
          className="-m-1 flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-md opacity-70 hover:opacity-100"
        >
          <X className="size-3.5" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
