import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Modal } from "./Modal";

interface ShortcutHelpModalProps {
  open: boolean;
  onClose: () => void;
}

const SHORTCUTS = [
  { keys: "Ctrl + G", labelKey: "shortcuts.generate" },
  { keys: "Ctrl + Enter", labelKey: "shortcuts.generate" },
  { keys: "Ctrl + Shift + C", labelKey: "shortcuts.copyAll" },
  { keys: "Ctrl + S", labelKey: "shortcuts.saveDraft" },
  { keys: "Ctrl + B", labelKey: "shortcuts.toggleSidebar" },
  { keys: "Ctrl + /", labelKey: "shortcuts.help" },
  { keys: "?", labelKey: "shortcuts.help" },
  { keys: "Escape", labelKey: "shortcuts.close" },
] as const;

export function ShortcutHelpModal({ open, onClose }: ShortcutHelpModalProps) {
  const { t } = useTranslation("ui");
  const [query, setQuery] = useState("");

  // Reset the filter every time the modal closes so a re-open starts
  // fresh — otherwise the previous filter persists invisibly.
  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const filtered = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return SHORTCUTS;
    return SHORTCUTS.filter((s) => {
      const label = t(s.labelKey).toLowerCase();
      return label.includes(trimmed) || s.keys.toLowerCase().includes(trimmed);
    });
  }, [query, t]);

  return (
    <Modal open={open} onClose={onClose} title={t("shortcuts.title")}>
      <div className="flex flex-col gap-3">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("shortcuts.searchPlaceholder")}
          className="rounded-lg border border-border bg-surface-1 px-3 py-2 text-sm text-text-primary placeholder:text-text-muted transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/50"
          autoFocus
        />
        {filtered.length === 0 ? (
          <p className="py-2 text-sm text-text-muted">
            {t("shortcuts.noResults")}
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {filtered.map((s) => (
              <div
                key={`${s.keys}-${s.labelKey}`}
                className="flex items-center justify-between py-1"
              >
                <span className="text-sm text-text-secondary">
                  {t(s.labelKey)}
                </span>
                <kbd className="rounded bg-surface-2 px-2 py-0.5 font-mono text-xs text-text-primary">
                  {s.keys}
                </kbd>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}
