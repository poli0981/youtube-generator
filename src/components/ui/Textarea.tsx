import { forwardRef, type ReactNode, type TextareaHTMLAttributes } from "react";
import clsx from "clsx";
import { Field, controlClasses } from "./Field";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: boolean;
  errorText?: string;
  helpText?: string;
  labelExtra?: ReactNode;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, errorText, helpText, labelExtra, className, id, ...props }, ref) => {
    const isError = Boolean(error) || Boolean(errorText);
    return (
      <Field label={label} error={errorText} help={helpText} labelExtra={labelExtra} id={id}>
        {(control) => (
          <textarea
            ref={ref}
            {...control}
            aria-invalid={isError || undefined}
            className={clsx(
              controlClasses(isError),
              "min-h-24 resize-y py-2 text-base leading-relaxed sm:text-sm",
              className,
            )}
            {...props}
          />
        )}
      </Field>
    );
  },
);

Textarea.displayName = "Textarea";
