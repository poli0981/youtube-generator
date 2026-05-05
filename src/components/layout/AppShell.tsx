import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { ShortcutHelpModal } from "@components/ui/ShortcutHelpModal";
import { useKeyboardShortcuts } from "@hooks/use-keyboard-shortcuts";
import { useGlobalErrorHandler } from "@hooks/use-global-error-handler";
import { useSettingsStore } from "@store/settings-store";

export function AppShell() {
  const [showShortcuts, setShowShortcuts] = useState(false);
  const setSetting = useSettingsStore((s) => s.setSetting);
  const collapsed = useSettingsStore((s) => s.sidebarCollapsed);

  useKeyboardShortcuts({
    onToggleHelp: () => setShowShortcuts((v) => !v),
    onToggleSidebar: () => setSetting("sidebarCollapsed", !collapsed),
  });
  useGlobalErrorHandler();

  return (
    <div className="flex min-h-screen bg-surface-0">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
      <ShortcutHelpModal open={showShortcuts} onClose={() => setShowShortcuts(false)} />
    </div>
  );
}
