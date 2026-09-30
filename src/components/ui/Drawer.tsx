import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, VisuallyHidden } from "radix-ui";
import { X } from "lucide-react";
import clsx from "clsx";

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  /** Edge the sheet slides from. `bottom` is the mobile action sheet. */
  side?: "left" | "right" | "bottom";
  title?: string;
  children: ReactNode;
  className?: string;
  ariaLabel?: string;
}

const PANEL: Record<NonNullable<DrawerProps["side"]>, string> = {
  left: "inset-y-0 left-0 w-72 max-w-[86vw] border-r data-[state=open]:animate-[drawer-in-left_220ms_cubic-bezier(0.2,0.8,0.2,1)]",
  right:
    "inset-y-0 right-0 w-80 max-w-[90vw] border-l data-[state=open]:animate-[drawer-in-right_220ms_cubic-bezier(0.2,0.8,0.2,1)]",
  bottom:
    "inset-x-0 bottom-0 max-h-[85dvh] rounded-t-panel border-t data-[state=open]:animate-[drawer-in-bottom_240ms_cubic-bezier(0.2,0.8,0.2,1)]",
};

/**
 * Slide-in sheet on Radix Dialog. Unlike the old always-mounted drawer, a
 * closed sheet is not in the DOM, so its links can't be tabbed into while
 * hidden, and focus is trapped while it is open.
 */
export function Drawer({
  open,
  onClose,
  side = "left",
  title,
  children,
  className,
  ariaLabel,
}: DrawerProps) {
  const { t } = useTranslation("ui");
  return (
    <Dialog.Root open={open} onOpenChange={(next) => !next && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="bg-overlay animate-fade-in fixed inset-0 z-50" />
        <Dialog.Content
          aria-describedby={undefined}
          className={clsx(
            "bg-surface-1 border-border shadow-pop fixed z-50 flex flex-col focus:outline-none",
            "safe-top safe-bottom",
            PANEL[side],
            className,
          )}
        >
          {side === "bottom" && (
            <div
              className="bg-border-strong mx-auto mt-2 h-1 w-10 shrink-0 rounded-full"
              aria-hidden="true"
            />
          )}
          {title ? (
            <div className="border-border flex items-center justify-between border-b px-4 py-3">
              <Dialog.Title className="text-text-primary text-base font-semibold">
                {title}
              </Dialog.Title>
              <Dialog.Close
                className="text-text-muted hover:bg-surface-2 hover:text-text-primary flex size-8 cursor-pointer items-center justify-center rounded-lg"
                aria-label={t("common.close")}
              >
                <X className="size-4" aria-hidden="true" />
              </Dialog.Close>
            </div>
          ) : (
            <VisuallyHidden.Root>
              <Dialog.Title>{ariaLabel ?? t("common.close")}</Dialog.Title>
            </VisuallyHidden.Root>
          )}
          <div className="flex-1 scrollbar-thin overflow-y-auto">{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
