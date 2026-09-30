import { forwardRef, type SelectHTMLAttributes } from "react";
import { ChevronsUpDown } from "lucide-react";
import clsx from "clsx";
import { Field, controlClasses } from "./Field";

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "onChange"> {
  label?: string;
  options: readonly SelectOption[];
  onChange: (value: string) => void;
  helpText?: string;
  errorText?: string;
}

/**
 * A native <select>, styled. Native on purpose: it gets the platform picker on
 * Android and iOS, type-ahead, and full keyboard support for free — and it
 * now matches the other controls' height (it used to be ~6px shorter).
 */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, options, value, onChange, helpText, errorText, className, id, ...props }, ref) => (
    <Field label={label} help={helpText} error={errorText} id={id}>
      {(control) => (
        // `className` sizes the control box (e.g. max-w-40), so the chevron
        // stays inside the narrowed select instead of at the row's far end.
        <div className={clsx("relative", className)}>
          <select
            ref={ref}
            {...control}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={clsx(
              controlClasses(Boolean(errorText)),
              "h-control cursor-pointer appearance-none pr-9 text-base sm:text-sm",
            )}
            {...props}
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronsUpDown
            className="text-text-muted pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2"
            aria-hidden="true"
          />
        </div>
      )}
    </Field>
  ),
);

Select.displayName = "Select";
