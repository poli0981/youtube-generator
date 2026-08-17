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
          "bg-surface-1 absolute top-0 bottom-0 flex w-64 max-w-[85vw] flex-col shadow-2xl transition-transform duration-200",
          side === "left" ? "border-border left-0 border-r" : "border-border right-0 border-l",
          open ? "translate-x-0" : side === "left" ? "-translate-x-full" : "translate-x-full",
          className,
        )}
        style={{
          paddingTop: "env(safe-area-inset-top)",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        {title && (
          <div className="border-border flex items-center justify-between border-b px-4 py-3">
            <h2 className="text-text-primary text-base font-semibold">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              className="text-text-muted hover:bg-surface-2 hover:text-text-primary rounded-lg p-2"
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
