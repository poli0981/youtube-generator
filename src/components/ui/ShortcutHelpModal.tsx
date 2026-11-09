import { useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Search } from "lucide-react";
import { useSettingsStore } from "@store/settings-store";
import { Modal } from "./Modal";
import { ShortcutKeys, keyName } from "./Badge";

interface ShortcutHelpModalProps {
  open: boolean;
  onClose: () => void;
}

const SHORTCUTS = [
  { keys: ["mod", "K"], labelKey: "command.open" },
  { keys: ["mod", "G"], labelKey: "shortcuts.generate" },
  { keys: ["mod", "enter"], labelKey: "shortcuts.generate" },
  { keys: ["mod", "shift", "C"], labelKey: "shortcuts.copyAll" },
  { keys: ["mod", "S"], labelKey: "shortcuts.saveToHistory" },
  { keys: ["mod", "B"], labelKey: "shortcuts.toggleSidebar" },
  // sonner's hotkey: focuses the notifications while any are on screen.
  { keys: ["alt", "T"], labelKey: "shortcuts.notifications" },
  { keys: ["mod", "/"], labelKey: "shortcuts.help" },
  { keys: ["?"], labelKey: "shortcuts.help" },
  { keys: ["esc"], labelKey: "shortcuts.close" },
] as const;

export function ShortcutHelpModal({ open, onClose }: ShortcutHelpModalProps) {
  const { t } = useTranslation("ui");
  const [query, setQuery] = useState("");
  const singleKey = useSettingsStore((s) => s.singleKeyShortcuts);
  // The search box gets focus when the modal opens (through Radix, not an
  // `autoFocus` attribute).
  const searchRef = useRef<HTMLInputElement>(null);

  // A closed modal has no filter. Deriving this rather than resetting `query`
  // in an effect means a re-open always starts fresh without an extra render
  // pass on every parent update while the modal is closed.
  const activeQuery = open ? query : "";

  const filtered = useMemo(() => {
    // The bare `?` row goes when Settings turned single-key shortcuts off.
    const available = singleKey ? SHORTCUTS : SHORTCUTS.filter((s) => s.keys[0] !== "?");
    const trimmed = activeQuery.trim().toLowerCase();
    if (!trimmed) return available;
    return available.filter((s) => {
      const label = t(s.labelKey).toLowerCase();
      const keys = s.keys.map(keyName).join(" ").toLowerCase();
      return label.includes(trimmed) || keys.includes(trimmed);
    });
  }, [activeQuery, singleKey, t]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t("shortcuts.title")}
      size="sm"
      initialFocusRef={searchRef}
    >
      <div className="flex flex-col gap-3">
        <label className="border-border bg-surface-0 focus-within:border-accent focus-within:ring-accent/25 h-control rounded-control flex items-center gap-2 border px-3 transition-colors focus-within:ring-2">
          <Search className="text-text-muted size-4 shrink-0" aria-hidden="true" />
          <input
            ref={searchRef}
            type="search"
            value={activeQuery}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("shortcuts.searchPlaceholder")}
            aria-label={t("shortcuts.searchPlaceholder")}
            className="text-text-primary placeholder:text-text-muted w-full bg-transparent text-sm outline-hidden"
          />
        </label>
        {filtered.length === 0 ? (
          <p className="text-text-muted py-4 text-center text-sm">{t("shortcuts.noResults")}</p>
        ) : (
          <ul className="divide-border flex flex-col divide-y">
            {filtered.map((s) => (
              <li key={s.keys.join("+")} className="flex items-center justify-between gap-4 py-2">
                <span className="text-text-secondary text-sm">{t(s.labelKey)}</span>
                <ShortcutKeys keys={s.keys} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </Modal>
  );
}
