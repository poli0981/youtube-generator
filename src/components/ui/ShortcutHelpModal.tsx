import { useMemo, useState } from "react";
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

  // A closed modal has no filter. Deriving this rather than resetting `query`
  // in an effect means a re-open always starts fresh without an extra render
  // pass on every parent update while the modal is closed.
  const activeQuery = open ? query : "";

  const filtered = useMemo(() => {
    const trimmed = activeQuery.trim().toLowerCase();
    if (!trimmed) return SHORTCUTS;
    return SHORTCUTS.filter((s) => {
      const label = t(s.labelKey).toLowerCase();
      return label.includes(trimmed) || s.keys.toLowerCase().includes(trimmed);
    });
  }, [activeQuery, t]);

  return (
    <Modal open={open} onClose={onClose} title={t("shortcuts.title")}>
      <div className="flex flex-col gap-3">
        <input
          type="text"
          value={activeQuery}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("shortcuts.searchPlaceholder")}
          className="focus:ring-accent/50 border-border bg-surface-1 text-text-primary placeholder:text-text-muted focus:border-accent rounded-lg border px-3 py-2 text-sm transition-colors focus:ring-2 focus:outline-none"
          autoFocus
        />
        {filtered.length === 0 ? (
          <p className="text-text-muted py-2 text-sm">{t("shortcuts.noResults")}</p>
        ) : (
          <div className="flex flex-col gap-2">
            {filtered.map((s) => (
              <div
                key={`${s.keys}-${s.labelKey}`}
                className="flex items-center justify-between py-1"
              >
                <span className="text-text-secondary text-sm">{t(s.labelKey)}</span>
                <kbd className="bg-surface-2 text-text-primary rounded px-2 py-0.5 font-mono text-xs">
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
