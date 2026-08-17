import { forwardRef, type ButtonHTMLAttributes } from "react";
import clsx from "clsx";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
}

const variantClasses = {
  primary: "bg-accent text-white hover:bg-accent-hover",
  secondary: "bg-surface-2 text-text-primary border border-border hover:bg-surface-3",
  ghost: "text-text-secondary hover:text-text-primary hover:bg-surface-2",
};

const sizeClasses = {
  sm: "px-2.5 py-1 text-xs min-h-[36px]",
  md: "px-4 py-2 text-sm min-h-touch",
  lg: "px-6 py-2.5 text-base min-h-touch",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", className, children, ...props }, ref) => (
    <button
      ref={ref}
      className={clsx(
        "focus:ring-accent/50 inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors focus:ring-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50",
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  ),
);

Button.displayName = "Button";
