import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Header } from "./Header";
import { Sidebar, NavList, NavFooterLinks } from "./Sidebar";
import { MobileNav } from "./MobileNav";
import { ScrollToTopButton } from "./ScrollToTopButton";
import { Drawer } from "@components/ui/Drawer";
import { useKeyboardShortcuts, type ShortcutHandlers } from "@hooks/use-keyboard-shortcuts";
import { useGlobalErrorHandler } from "@hooks/use-global-error-handler";
import { useSettingsStore } from "@store/settings-store";

// Both download on first use — neither is needed to render a page.
const CommandPalette = lazy(() =>
  import("./CommandPalette").then((m) => ({ default: m.CommandPalette })),
);
const ShortcutHelpModal = lazy(() =>
  import("@components/ui/ShortcutHelpModal").then((m) => ({ default: m.ShortcutHelpModal })),
);

/**
 * Renders nothing. The shortcut hook reads the generated output, which
 * changes on every keystroke in the editor — isolating it here means only
 * this empty component re-renders, not the whole shell.
 */
function GlobalShortcuts(props: ShortcutHandlers) {
  useKeyboardShortcuts(props);
  return null;
}

export function AppShell() {
  const { t } = useTranslation("ui");
  const { pathname } = useLocation();
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  // Once opened, stay mounted so closing can animate and reopening is instant.
  const [paletteUsed, setPaletteUsed] = useState(false);
  const [shortcutsUsed, setShortcutsUsed] = useState(false);
  const mainRef = useRef<HTMLElement>(null);
  useGlobalErrorHandler();

  // The same <main> scrolls every page, so a new page would otherwise open
  // wherever the previous one was scrolled to.
  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0 });
  }, [pathname]);

  const toggleHelp = useCallback(() => {
    setShortcutsUsed(true);
    setShowShortcuts((v) => !v);
  }, []);
  const togglePalette = useCallback(() => {
    setPaletteUsed(true);
    setPaletteOpen((v) => !v);
  }, []);
  const openPalette = useCallback(() => {
    setPaletteUsed(true);
    setPaletteOpen(true);
  }, []);
  const toggleSidebar = useCallback(() => {
    const { sidebarCollapsed, setSetting } = useSettingsStore.getState();
    setSetting("sidebarCollapsed", !sidebarCollapsed);
  }, []);

  return (
    <div className="bg-surface-0 flex h-dvh overflow-hidden">
      {/* Not an href="#main": under HashRouter (desktop) that is a route. */}
      <a
        href="#main"
        onClick={(e) => {
          e.preventDefault();
          mainRef.current?.focus();
        }}
        className="bg-accent text-accent-fg rounded-control sr-only z-[60] px-3 py-2 text-sm font-medium focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        {t("nav.skipToContent")}
      </a>

      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <Header onOpenCommandPalette={openPalette} />
        <div className="relative min-h-0 flex-1">
          <main
            id="main"
            ref={mainRef}
            tabIndex={-1}
            className="h-full scrollbar-thin overflow-y-auto focus:outline-none"
          >
            <Outlet />
          </main>
          <ScrollToTopButton scrollRef={mainRef} />
        </div>
        <MobileNav onOpenMore={() => setMoreOpen(true)} moreActive={moreOpen} />
      </div>

      <Drawer
        open={moreOpen}
        onClose={() => setMoreOpen(false)}
        side="bottom"
        title={t("nav.more")}
      >
        <nav aria-label={t("nav.main")} className="flex flex-col gap-4 p-3">
          <NavList
            collapsed={false}
            layoutId="nav-active-sheet"
            onNavigate={() => setMoreOpen(false)}
          />
          <div className="border-border border-t pt-3">
            <NavFooterLinks collapsed={false} onNavigate={() => setMoreOpen(false)} />
          </div>
        </nav>
      </Drawer>

      <Suspense fallback={null}>
        {paletteUsed && (
          <CommandPalette
            open={paletteOpen}
            onOpenChange={setPaletteOpen}
            onShowShortcuts={() => {
              setShortcutsUsed(true);
              setShowShortcuts(true);
            }}
          />
        )}
        {shortcutsUsed && (
          <ShortcutHelpModal open={showShortcuts} onClose={() => setShowShortcuts(false)} />
        )}
      </Suspense>
      <GlobalShortcuts
        onToggleHelp={toggleHelp}
        onToggleSidebar={toggleSidebar}
        onTogglePalette={togglePalette}
      />
    </div>
  );
}
