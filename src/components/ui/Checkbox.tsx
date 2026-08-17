import { type ReactNode, useId } from "react";
import { Check } from "lucide-react";
import clsx from "clsx";

interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** Visible label — accepts rich content (e.g. inline links). */
  label: ReactNode;
  className?: string;
  id?: string;
}

/**
 * Accessible square checkbox. A real `<input type="checkbox">` (visually
 * hidden as a `peer`) keeps native keyboard + screen-reader semantics, while
 * the styled box mirrors its state. Tailwind tokens only, so it tracks the
 * dark/light theme. Distinct from {@link import("./Toggle").Toggle}, which is
 * a `role="switch"` on/off pill — a checkbox is the right control for a
 * one-time "I agree" acknowledgement.
 */
export function Checkbox({ checked, onChange, label, className, id }: CheckboxProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  return (
    <label
      htmlFor={inputId}
      className={clsx(
        "group min-h-touch flex cursor-pointer items-start gap-3 text-left",
        className,
      )}
    >
      <input
        id={inputId}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="peer sr-only"
      />
      <span
        aria-hidden
        className={clsx(
          "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors",
          "peer-focus-visible:ring-accent/50 peer-focus-visible:ring-2",
          checked
            ? "border-accent bg-accent text-white"
            : "border-border bg-surface-1 group-hover:border-border-strong text-transparent",
        )}
      >
        <Check className="h-3.5 w-3.5" strokeWidth={3} />
      </span>
      <span className="text-text-primary text-sm leading-snug">{label}</span>
    </label>
  );
}
