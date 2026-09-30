import { type ReactNode, useId } from "react";
import { Checkbox as RadixCheckbox } from "radix-ui";
import { m } from "motion/react";
import clsx from "clsx";

interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** Visible label — accepts rich content (e.g. inline links). */
  label: ReactNode;
  className?: string;
  id?: string;
  disabled?: boolean;
}

/**
 * Square checkbox with a drawn-on tick. Distinct from {@link import("./Toggle").Toggle},
 * a switch: a checkbox is the right control for "I agree" and for picking
 * items from a list.
 */
export function Checkbox({ checked, onChange, label, className, id, disabled }: CheckboxProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  return (
    <div className={clsx("flex items-start gap-3", disabled && "opacity-55", className)}>
      <RadixCheckbox.Root
        id={inputId}
        checked={checked}
        onCheckedChange={(state) => onChange(state === true)}
        disabled={disabled}
        className={clsx(
          "mt-0.5 flex size-[1.125rem] shrink-0 cursor-pointer items-center justify-center rounded-[5px] border",
          "transition-colors duration-150 disabled:cursor-not-allowed",
          "data-[state=checked]:border-accent data-[state=checked]:bg-accent",
          "data-[state=unchecked]:border-border-strong data-[state=unchecked]:bg-surface-1 hover:data-[state=unchecked]:border-accent",
        )}
      >
        <RadixCheckbox.Indicator forceMount className="text-accent-fg flex">
          <svg viewBox="0 0 16 16" className="size-3.5" fill="none" aria-hidden="true">
            <m.path
              d="M3.5 8.5l3 3 6-7"
              stroke="currentColor"
              strokeWidth={2.2}
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={false}
              animate={{ pathLength: checked ? 1 : 0, opacity: checked ? 1 : 0 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
            />
          </svg>
        </RadixCheckbox.Indicator>
      </RadixCheckbox.Root>
      <label htmlFor={inputId} className="text-text-primary cursor-pointer text-sm leading-snug">
        {label}
      </label>
    </div>
  );
}
