import { forwardRef, type TextareaHTMLAttributes } from "react";
import clsx from "clsx";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={inputId} className="text-text-secondary text-sm font-medium">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          className={clsx(
            "focus:ring-accent/50 bg-surface-1 text-text-primary placeholder:text-text-muted min-h-[96px] resize-y rounded-lg border px-3 py-2.5 text-base transition-colors focus:ring-2 focus:outline-none sm:text-sm",
            error ? "border-danger" : "border-border focus:border-accent",
            className,
          )}
          {...props}
        />
      </div>
    );
  },
);

Textarea.displayName = "Textarea";
