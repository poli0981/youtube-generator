import { forwardRef, type ButtonHTMLAttributes } from "react";
import { Slot } from "radix-ui";
import clsx from "clsx";
import { Spinner } from "@components/icons/animated";

export type ButtonVariant = "primary" | "brand" | "secondary" | "outline" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg" | "icon" | "icon-sm";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Shows a spinner, disables the button and keeps its width. */
  loading?: boolean;
  /** Render the child element (e.g. a router Link) with button styling. */
  asChild?: boolean;
}

const VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-accent text-accent-fg shadow-sm hover:bg-accent-hover",
  brand: "bg-brand-gradient text-white shadow-sm hover:brightness-110",
  secondary:
    "border border-border bg-surface-2 text-text-primary hover:border-border-strong hover:bg-surface-3",
  outline: "border border-border text-text-primary hover:bg-surface-2",
  ghost: "text-text-secondary hover:bg-surface-2 hover:text-text-primary",
  danger: "bg-danger text-white shadow-sm hover:brightness-110",
};

const SIZES: Record<ButtonSize, string> = {
  sm: "h-control-sm gap-1.5 px-2.5 text-xs",
  md: "h-control gap-2 px-3.5 text-sm",
  lg: "h-11 gap-2 px-5 text-sm",
  icon: "size-control",
  "icon-sm": "size-control-sm",
};

export const buttonClasses = (variant: ButtonVariant = "primary", size: ButtonSize = "md") =>
  clsx(
    "inline-flex shrink-0 cursor-pointer items-center justify-center rounded-control font-medium whitespace-nowrap select-none",
    "transition-[background-color,border-color,color,filter,transform] duration-150 active:scale-[0.97]",
    "disabled:pointer-events-none disabled:opacity-45 [&_svg]:size-4 [&_svg]:shrink-0",
    VARIANTS[variant],
    SIZES[size],
  );

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      asChild = false,
      className,
      children,
      disabled,
      type,
      ...props
    },
    ref,
  ) => {
    if (asChild) {
      return (
        <Slot.Root ref={ref} className={clsx(buttonClasses(variant, size), className)} {...props}>
          {children}
        </Slot.Root>
      );
    }
    return (
      <button
        ref={ref}
        // A button inside a <form> defaults to submit — make every other one explicit.
        type={type ?? "button"}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        className={clsx(buttonClasses(variant, size), className)}
        {...props}
      >
        {loading && <Spinner />}
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";
