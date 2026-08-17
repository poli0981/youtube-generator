import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";
import clsx from "clsx";

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  side?: "left" | "right";
  title?: string;
  children: ReactNode;
  className?: string;
  ariaLabel?: string;
}

export function Drawer({
  open,
  onClose,
  side = "left",
  title,
  children,
  className,
  ariaLabel,
}: DrawerProps) {
  useEffect(() => {
    if (!open) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEsc);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  return (
    <div
      className={clsx(
        "fixed inset-0 z-50 transition-opacity duration-200",
        open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
      )}
      aria-hidden={!open}
    >
      <div className="absolute inset-0 bg-black/60" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel ?? title}
        className={clsx(
          "absolute bottom-0 top-0 flex w-64 max-w-[85vw] flex-col bg-surface-1 shadow-2xl transition-transform duration-200",
          side === "left" ? "left-0 border-r border-border" : "right-0 border-l border-border",
          open ? "translate-x-0" : side === "left" ? "-translate-x-full" : "translate-x-full",
          className,
        )}
        style={{
          paddingTop: "env(safe-area-inset-top)",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        {title && (
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h2 className="text-base font-semibold text-text-primary">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-text-muted hover:bg-surface-2 hover:text-text-primary"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
