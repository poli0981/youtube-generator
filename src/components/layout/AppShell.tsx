import { useRef, useState } from "react";
import { Outlet } from "react-router-dom";
import { Header } from "./Header";
import { Sidebar, SidebarNavList } from "./Sidebar";
import { ScrollToTopButton } from "./ScrollToTopButton";
import { Drawer } from "@components/ui/Drawer";
import { ShortcutHelpModal } from "@components/ui/ShortcutHelpModal";
import { useKeyboardShortcuts } from "@hooks/use-keyboard-shortcuts";
import { useGlobalErrorHandler } from "@hooks/use-global-error-handler";
import { useSettingsStore } from "@store/settings-store";

export function AppShell() {
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const mainRef = useRef<HTMLElement>(null);
  const setSetting = useSettingsStore((s) => s.setSetting);
  const collapsed = useSettingsStore((s) => s.sidebarCollapsed);

  useKeyboardShortcuts({
    onToggleHelp: () => setShowShortcuts((v) => !v),
    onToggleSidebar: () => setSetting("sidebarCollapsed", !collapsed),
  });
  useGlobalErrorHandler();

  return (
    <div className="bg-surface-0 flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header onOpenMobileNav={() => setMobileNavOpen(true)} />
        <main ref={mainRef} className="min-h-0 flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
      <Drawer
        open={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
        side="left"
        ariaLabel="Navigation"
      >
        <SidebarNavList collapsed={false} onItemClick={() => setMobileNavOpen(false)} />
      </Drawer>
      <ShortcutHelpModal open={showShortcuts} onClose={() => setShowShortcuts(false)} />
      <ScrollToTopButton scrollRef={mainRef} />
    </div>
  );
}
