import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, VisuallyHidden } from "radix-ui";
import { X } from "lucide-react";
import clsx from "clsx";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  /** Visible sub-line under the title (also the dialog's description). */
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  /** Max width: sm 24rem · md 32rem (default) · lg 42rem · xl 56rem. */
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const SIZES = { sm: "max-w-sm", md: "max-w-lg", lg: "max-w-2xl", xl: "max-w-4xl" } as const;

/**
 * Centered dialog on Radix Dialog: focus is trapped inside and restored to the
 * trigger on close, the page behind cannot scroll, Escape and the backdrop
 * close it, and it is announced as a modal dialog with its title. The old
 * hand-rolled modal had none of that.
 */
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
  className,
}: ModalProps) {
  const { t } = useTranslation("ui");
  return (
    <Dialog.Root open={open} onOpenChange={(next) => !next && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="bg-overlay animate-fade-in fixed inset-0 z-50 backdrop-blur-[2px]" />
        <Dialog.Content
          className={clsx(
            "bg-surface-1 border-border shadow-pop animate-pop-in rounded-panel fixed top-1/2 left-1/2 z-50 flex max-h-[min(88dvh,52rem)] w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 flex-col border",
            "focus:outline-none",
            SIZES[size],
            className,
          )}
        >
          {title ? (
            <div className="border-border flex items-start justify-between gap-4 border-b px-5 py-4">
              <div className="min-w-0">
                <Dialog.Title className="text-text-primary text-base font-semibold">
                  {title}
                </Dialog.Title>
                {description ? (
                  <Dialog.Description className="text-text-muted mt-0.5 text-xs">
                    {description}
                  </Dialog.Description>
                ) : (
                  <VisuallyHidden.Root asChild>
                    <Dialog.Description>{title}</Dialog.Description>
                  </VisuallyHidden.Root>
                )}
              </div>
              <Dialog.Close
                className="text-text-muted hover:bg-surface-2 hover:text-text-primary -m-1.5 flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-lg transition-colors"
                aria-label={t("common.close")}
              >
                <X className="size-4" aria-hidden="true" />
              </Dialog.Close>
            </div>
          ) : (
            <VisuallyHidden.Root>
              <Dialog.Title>{t("common.close")}</Dialog.Title>
              <Dialog.Description>{t("common.close")}</Dialog.Description>
            </VisuallyHidden.Root>
          )}
          <div className="flex-1 scrollbar-thin overflow-y-auto px-5 py-4">{children}</div>
          {footer && (
            <div className="border-border flex flex-wrap justify-end gap-2 border-t px-5 py-3">
              {footer}
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
