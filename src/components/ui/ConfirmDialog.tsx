import { useTranslation } from "react-i18next";
import { AlertDialog } from "radix-ui";
import { TriangleAlert } from "lucide-react";
import clsx from "clsx";
import { buttonClasses } from "./Button";

interface ConfirmDialogProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  variant?: "danger" | "default";
}

/**
 * "Are you sure?" on Radix AlertDialog: it cannot be dismissed by clicking the
 * backdrop, and focus starts on Cancel so Enter never confirms by accident.
 */
export function ConfirmDialog({
  open,
  onConfirm,
  onCancel,
  title,
  message,
  confirmLabel,
  variant = "default",
}: ConfirmDialogProps) {
  const { t } = useTranslation("ui");
  const danger = variant === "danger";
  return (
    <AlertDialog.Root open={open} onOpenChange={(next) => !next && onCancel()}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="bg-overlay animate-fade-in fixed inset-0 z-50 backdrop-blur-[2px]" />
        <AlertDialog.Content className="bg-surface-1 border-border shadow-pop animate-pop-in rounded-panel fixed top-1/2 left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 border p-5 focus:outline-none">
          <div className="flex gap-4">
            {danger && (
              <span className="bg-danger/12 text-danger flex size-10 shrink-0 items-center justify-center rounded-full">
                <TriangleAlert className="size-5" aria-hidden="true" />
              </span>
            )}
            <div className="min-w-0">
              <AlertDialog.Title className="text-text-primary text-base font-semibold">
                {title}
              </AlertDialog.Title>
              <AlertDialog.Description className="text-text-secondary mt-1.5 text-sm leading-relaxed">
                {message}
              </AlertDialog.Description>
            </div>
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <AlertDialog.Cancel className={buttonClasses("ghost")}>
              {t("common.cancel")}
            </AlertDialog.Cancel>
            <AlertDialog.Action
              className={clsx(buttonClasses(danger ? "danger" : "primary"))}
              onClick={onConfirm}
            >
              {confirmLabel ?? t("common.confirm")}
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
