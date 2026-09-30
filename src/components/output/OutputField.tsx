import type { ReactNode } from "react";
import { Card } from "@components/ui/Card";
import type { IconComponent } from "@components/icons/brand";

interface OutputFieldProps {
  title: ReactNode;
  icon?: IconComponent;
  /** Right side of the header: counter, copy button. */
  actions?: ReactNode;
  children: ReactNode;
}

/** One generated artefact (title, description, tags, pinned comment…) as a card. */
export function OutputField({ title, icon: Icon, actions, children }: OutputFieldProps) {
  return (
    <Card>
      <div className="flex min-h-12 flex-wrap items-center gap-x-3 gap-y-1 px-4 pt-2.5 pb-1.5">
        {Icon && <Icon className="text-text-muted size-4 shrink-0" aria-hidden />}
        <h2 className="text-text-primary min-w-0 flex-1 text-sm font-semibold">{title}</h2>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      <div className="px-4 pb-4">{children}</div>
    </Card>
  );
}

/** Pre-formatted generated text, scrollable when long. */
export function OutputText({ children, tall }: { children: ReactNode; tall?: boolean }) {
  return (
    <pre
      className={
        tall
          ? "bg-surface-0 border-border text-text-secondary max-h-[60dvh] scrollbar-thin overflow-y-auto rounded-lg border p-3 font-sans text-sm leading-relaxed whitespace-pre-wrap sm:max-h-[28rem]"
          : "bg-surface-0 border-border text-text-secondary rounded-lg border p-3 font-sans text-sm leading-relaxed whitespace-pre-wrap"
      }
    >
      {children}
    </pre>
  );
}
