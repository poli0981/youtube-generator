import { forwardRef, type InputHTMLAttributes } from "react";
import clsx from "clsx";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: boolean;
  /** Inline error message shown below the input (also forces the red border). */
  errorText?: string;
  /** Inline hint shown below the input when there is no error. */
  helpText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, errorText, helpText, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
    const isError = error || Boolean(errorText);

    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-text-secondary">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={isError || undefined}
          className={clsx(
            "min-h-touch rounded-lg border bg-surface-1 px-3 py-2.5 text-base text-text-primary placeholder:text-text-muted transition-colors focus:outline-none focus:ring-2 focus:ring-accent/50 sm:text-sm",
            isError ? "border-danger" : "border-border focus:border-accent",
            className,
          )}
          {...props}
        />
        {errorText && <p className="text-xs text-danger">{errorText}</p>}
        {helpText && !errorText && <p className="text-xs text-text-muted">{helpText}</p>}
      </div>
    );
  },
);

Input.displayName = "Input";
