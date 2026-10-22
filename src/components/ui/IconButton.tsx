import type { ReactNode } from "react";
import { Button, type ButtonProps } from "./Button";
import { Tooltip } from "./Tooltip";

interface IconButtonProps extends Omit<ButtonProps, "size" | "children" | "aria-label"> {
  /** Accessible name AND tooltip text — an icon-only control needs both. */
  label: string;
  children: ReactNode;
  size?: "icon" | "icon-sm";
  /** Hide the hover tooltip (the name stays for screen readers). */
  noTooltip?: boolean;
  tooltipSide?: "top" | "right" | "bottom" | "left";
}

/**
 * A square, icon-only button that cannot be rendered without a name. A `ref`
 * reaches the button through `props`.
 */
export function IconButton({
  label,
  children,
  variant = "ghost",
  size = "icon",
  noTooltip,
  tooltipSide,
  ...props
}: IconButtonProps) {
  return (
    <Tooltip content={label} disabled={noTooltip} side={tooltipSide}>
      <Button variant={variant} size={size} aria-label={label} {...props}>
        {children}
      </Button>
    </Tooltip>
  );
}
