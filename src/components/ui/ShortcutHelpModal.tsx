import { useTranslation } from "react-i18next";
import { Modal } from "./Modal";

interface ShortcutHelpModalProps {
  open: boolean;
  onClose: () => void;
}

const shortcuts = [
  { keys: "Ctrl + Enter", labelKey: "shortcuts.generate" },
  { keys: "Ctrl + Shift + C", labelKey: "shortcuts.copyAll" },
  { keys: "Ctrl + S", labelKey: "shortcuts.saveDraft" },
  { keys: "Ctrl + /", labelKey: "shortcuts.help" },
  { keys: "Escape", labelKey: "shortcuts.close" },
] as const;

export function ShortcutHelpModal({ open, onClose }: ShortcutHelpModalProps) {
  const { t } = useTranslation("ui");

  return (
    <Modal open={open} onClose={onClose} title={t("shortcuts.title")}>
      <div className="flex flex-col gap-2">
        {shortcuts.map((s) => (
          <div key={s.keys} className="flex items-center justify-between py-1">
            <span className="text-sm text-text-secondary">{t(s.labelKey)}</span>
            <kbd className="rounded bg-surface-2 px-2 py-0.5 font-mono text-xs text-text-primary">
              {s.keys}
            </kbd>
          </div>
        ))}
      </div>
    </Modal>
  );
}
