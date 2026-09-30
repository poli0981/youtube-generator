import { useId, type ReactNode } from "react";
import clsx from "clsx";

/** Props a Field hands to the control it wraps. */
export interface FieldControlProps {
  id: string;
  "aria-invalid"?: true;
  "aria-describedby"?: string;
}

interface FieldProps {
  label?: ReactNode;
  /** Inline error (takes precedence over the hint). */
  error?: ReactNode;
  /** Hint shown under the control when there is no error. */
  help?: ReactNode;
  /** Right-aligned extra in the label row (counter, action). */
  labelExtra?: ReactNode;
  /** Explicit control id; generated otherwise. */
  id?: string;
  className?: string;
  children: (control: FieldControlProps) => ReactNode;
}

/**
 * Label + control + hint/error, wired for assistive tech: the label points at
 * the control, and the hint or error is its description. Ids are generated
 * with useId — the old primitives derived them from the label text, which
 * collided (ten "Type" selects all got id="type") and produced non-ASCII ids.
 */
export function Field({ label, error, help, labelExtra, id, className, children }: FieldProps) {
  const autoId = useId();
  const controlId = id ?? autoId;
  const messageId = `${controlId}-message`;
  const message = error ?? help;

  return (
    <div className={clsx("flex min-w-0 flex-col gap-1.5", className)}>
      {(label || labelExtra) && (
        <div className="flex min-h-5 items-center justify-between gap-2">
          {label && (
            <label htmlFor={controlId} className="text-text-secondary text-xs font-medium">
              {label}
            </label>
          )}
          {labelExtra}
        </div>
      )}
      {children({
        id: controlId,
        ...(error ? { "aria-invalid": true as const } : {}),
        ...(message ? { "aria-describedby": messageId } : {}),
      })}
      {message && (
        <p
          id={messageId}
          className={clsx("text-xs leading-snug", error ? "text-danger" : "text-text-muted")}
        >
          {message}
        </p>
      )}
    </div>
  );
}

/** Shared look of every text-like control. */
export const controlClasses = (invalid: boolean) =>
  clsx(
    "w-full min-w-0 rounded-control border bg-surface-1 px-3 text-text-primary",
    "placeholder:text-text-muted transition-[border-color,box-shadow] duration-150",
    "focus:outline-none focus-visible:outline-none focus:ring-3 focus:ring-accent/25",
    "disabled:cursor-not-allowed disabled:opacity-55",
    invalid
      ? "border-danger focus:border-danger"
      : "border-border hover:border-border-strong focus:border-accent",
  );
