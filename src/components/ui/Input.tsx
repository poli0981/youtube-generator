import type { ComponentProps, ReactNode } from "react";
import clsx from "clsx";
import { Field, controlClasses } from "./Field";

interface InputProps extends ComponentProps<"input"> {
  label?: string;
  error?: boolean;
  /** Inline error message shown below the input (also forces the red border). */
  errorText?: string;
  /** Inline hint shown below the input when there is no error. */
  helpText?: string;
  /** Right side of the label row — e.g. a character counter. */
  labelExtra?: ReactNode;
  /** Icon or text inside the field, before the value. */
  leading?: ReactNode;
}

export function Input({
  label,
  error,
  errorText,
  helpText,
  labelExtra,
  leading,
  className,
  id,
  ref,
  ...props
}: InputProps) {
  const isError = Boolean(error) || Boolean(errorText);
  return (
    <Field label={label} error={errorText} help={helpText} labelExtra={labelExtra} id={id}>
      {(control) => (
        <div className="relative">
          {leading && (
            <span className="text-text-muted pointer-events-none absolute inset-y-0 left-3 flex items-center [&_svg]:size-4">
              {leading}
            </span>
          )}
          <input
            ref={ref}
            {...control}
            aria-invalid={isError || undefined}
            className={clsx(
              controlClasses(isError),
              "h-control text-base sm:text-sm",
              leading ? "pl-9" : undefined,
              className,
            )}
            {...props}
          />
        </div>
      )}
    </Field>
  );
}
