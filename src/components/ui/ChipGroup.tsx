import clsx from "clsx";
import type { IconComponent } from "@components/icons/brand";

interface ChipOption {
  id: string;
  label: string;
  icon?: IconComponent;
}

interface BaseProps {
  label?: string;
  options: readonly ChipOption[];
  className?: string;
}

type SingleProps = BaseProps & {
  multiple?: false;
  value: string;
  onChange: (value: string) => void;
};

type MultiProps = BaseProps & {
  multiple: true;
  /** Ordered list of selected option ids. */
  value: readonly string[];
  onChange: (value: string[]) => void;
  /** Optional cap on total selections. When reached, unselected chips disable. */
  max?: number;
};

export type ChipGroupProps = SingleProps | MultiProps;

/** Pill toggles for picking one or several options from a short list. */
export function ChipGroup(props: ChipGroupProps) {
  const { label, options, className } = props;

  const isSelected = (id: string): boolean =>
    props.multiple ? props.value.includes(id) : props.value === id;

  const atCapacity = props.multiple && props.max != null && props.value.length >= props.max;

  const handleClick = (id: string) => {
    if (props.multiple) {
      if (props.value.includes(id)) {
        props.onChange(props.value.filter((v) => v !== id));
      } else {
        if (props.max != null && props.value.length >= props.max) return;
        props.onChange([...props.value, id]);
      }
    } else {
      props.onChange(id);
    }
  };

  const counter = props.multiple && props.max != null ? `${props.value.length}/${props.max}` : null;

  return (
    <div className={clsx("flex flex-col gap-2", className)}>
      {(label || counter) && (
        <div className="flex items-center justify-between">
          {label && <span className="text-text-secondary text-xs font-medium">{label}</span>}
          {counter && <span className="text-text-muted tabular text-xs">{counter}</span>}
        </div>
      )}
      <div className="flex flex-wrap gap-1.5" role="group" aria-label={label}>
        {options.map((option) => {
          const selected = isSelected(option.id);
          const disabled = !selected && atCapacity;
          const Icon = option.icon;
          return (
            <button
              key={option.id}
              type="button"
              disabled={disabled}
              aria-pressed={selected}
              onClick={() => handleClick(option.id)}
              className={clsx(
                "h-control-sm inline-flex items-center gap-1.5 rounded-full border px-3 text-xs font-medium",
                "transition-[background-color,border-color,color,transform] duration-150 active:scale-95",
                selected
                  ? "border-accent bg-accent-muted text-accent"
                  : disabled
                    ? "border-border text-text-muted cursor-not-allowed opacity-45"
                    : "border-border bg-surface-1 text-text-secondary hover:border-border-strong hover:text-text-primary",
              )}
            >
              {Icon && <Icon className="size-3.5 shrink-0" aria-hidden />}
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
