import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Header } from "./Header";
import { TabBar } from "./TabBar";
import { ShortcutHelpModal } from "@components/ui/ShortcutHelpModal";
import { useKeyboardShortcuts } from "@hooks/use-keyboard-shortcuts";

export function AppShell() {
  const [showShortcuts, setShowShortcuts] = useState(false);

  useKeyboardShortcuts({
    onToggleHelp: () => setShowShortcuts((v) => !v),
  });

  return (
    <div className="flex min-h-screen flex-col bg-surface-0">
      <Header />
      <TabBar />
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
      <ShortcutHelpModal open={showShortcuts} onClose={() => setShowShortcuts(false)} />
    </div>
  );
}
