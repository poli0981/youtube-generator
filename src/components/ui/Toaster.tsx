import { Toaster as Sonner } from "sonner";
import { useSettingsStore } from "@store/settings-store";

/**
 * App-wide toasts (sonner). Bottom-center, clear of the scroll-to-top button
 * (bottom-left) and page actions (right); on phones they sit above the
 * bottom navigation bar. The old bottom-right corner was shared by four
 * floating elements.
 */
export function Toaster() {
  const theme = useSettingsStore((s) => s.theme);
  return (
    <Sonner
      theme={theme}
      position="bottom-center"
      closeButton
      // globals.css switches this at the md breakpoint, where the bar goes.
      offset={{ bottom: "var(--toast-offset-bottom)" }}
      mobileOffset={{ bottom: "var(--toast-offset-bottom)" }}
      toastOptions={{
        classNames: {
          toast:
            "!bg-surface-1 !border-border !text-text-primary !rounded-card !shadow-pop !font-sans",
          description: "!text-text-secondary",
          actionButton: "!bg-accent !text-accent-fg !rounded-lg !font-medium",
          cancelButton: "!bg-surface-2 !text-text-secondary !rounded-lg",
          closeButton: "!bg-surface-2 !border-border !text-text-secondary",
        },
      }}
    />
  );
}
