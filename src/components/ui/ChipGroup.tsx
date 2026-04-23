import clsx from "clsx";

interface ChipOption {
  id: string;
  label: string;
  icon?: string;
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

export function ChipGroup(props: ChipGroupProps) {
  const { label, options, className } = props;

  const isSelected = (id: string): boolean => {
    if (props.multiple) return props.value.includes(id);
    return props.value === id;
  };

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

  const counter =
    props.multiple && props.max != null ? `${props.value.length}/${props.max}` : null;

  return (
    <div className={clsx("flex flex-col gap-2", className)}>
      {(label || counter) && (
        <div className="flex items-center justify-between">
          {label && <span className="text-sm font-medium text-text-secondary">{label}</span>}
          {counter && <span className="text-xs text-text-muted">{counter}</span>}
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const selected = isSelected(option.id);
          const disabled = !selected && atCapacity;
          return (
            <button
              key={option.id}
              type="button"
              disabled={disabled}
              onClick={() => handleClick(option.id)}
              className={clsx(
                "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                selected
                  ? "bg-accent text-white"
                  : disabled
                    ? "cursor-not-allowed bg-surface-2 text-text-muted opacity-40"
                    : "bg-surface-2 text-text-secondary hover:bg-surface-3 hover:text-text-primary",
              )}
            >
              {option.icon && <span>{option.icon}</span>}
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
