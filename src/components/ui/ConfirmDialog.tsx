import { useTranslation } from "react-i18next";
import { Modal } from "./Modal";
import { Button } from "./Button";

interface ConfirmDialogProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  variant?: "danger" | "default";
}

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

  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      footer={
        <>
          <Button variant="ghost" onClick={onCancel}>
            {t("common.cancel")}
          </Button>
          <Button
            variant="primary"
            onClick={onConfirm}
            className={variant === "danger" ? "bg-danger hover:bg-danger/80" : ""}
          >
            {confirmLabel ?? t("common.confirm")}
          </Button>
        </>
      }
    >
      <p className="text-sm text-text-secondary">{message}</p>
    </Modal>
  );
}
