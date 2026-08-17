import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Pencil,
  FileText,
  User,
  Clock,
  Settings,
  Layers,
  Share2,
  ListVideo,
  ScrollText,
  Info,
  Bug,
  PanelLeftClose,
  PanelLeftOpen,
  type LucideIcon,
} from "lucide-react";
import clsx from "clsx";
import { useSettingsStore } from "@store/settings-store";
import { ABOUT } from "@config/about";

interface TabItem {
  to: string;
  labelKey: string;
  icon: LucideIcon;
  external?: boolean;
}

const tabs: readonly TabItem[] = [
  { to: "/", labelKey: "tabs.editor", icon: Pencil },
  { to: "/output", labelKey: "tabs.output", icon: FileText },
  { to: "/batch", labelKey: "tabs.batch", icon: Layers },
  { to: "/social", labelKey: "tabs.social", icon: Share2 },
  { to: "/profiles", labelKey: "tabs.profiles", icon: User },
  { to: "/history", labelKey: "tabs.history", icon: Clock },
  { to: "/playlist", labelKey: "tabs.playlist", icon: ListVideo },
  { to: "/logs", labelKey: "tabs.logs", icon: ScrollText },
  { to: "/settings", labelKey: "tabs.settings", icon: Settings },
  { to: "/about", labelKey: "tabs.about", icon: Info },
  { to: ABOUT.bugReportUrl, labelKey: "tabs.reportBug", icon: Bug, external: true },
] as const;

interface SidebarNavListProps {
  collapsed: boolean;
  onItemClick?: () => void;
}

export function SidebarNavList({ collapsed, onItemClick }: SidebarNavListProps) {
  const { t } = useTranslation("ui");

  return (
    <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-2">
      {tabs.map((tab) => {
        const baseClass = clsx(
          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
          collapsed && "justify-center px-0",
        );
        if (tab.external) {
          return (
            <a
              key={tab.to}
              href={tab.to}
              target="_blank"
              rel="noopener noreferrer"
              title={collapsed ? t(tab.labelKey) : undefined}
              onClick={onItemClick}
              className={clsx(
                baseClass,
                "text-text-secondary hover:bg-surface-2 hover:text-text-primary",
              )}
            >
              <tab.icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span className="truncate">{t(tab.labelKey)}</span>}
            </a>
          );
        }
        return (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.to === "/"}
            title={collapsed ? t(tab.labelKey) : undefined}
            onClick={onItemClick}
            className={({ isActive }) =>
              clsx(
                baseClass,
                isActive
                  ? "bg-accent-muted text-accent"
                  : "text-text-secondary hover:bg-surface-2 hover:text-text-primary",
              )
            }
          >
            <tab.icon className="h-4 w-4 shrink-0" />
            {!collapsed && <span className="truncate">{t(tab.labelKey)}</span>}
          </NavLink>
        );
      })}
    </nav>
  );
}

export function Sidebar() {
  const { t } = useTranslation("ui");
  const collapsed = useSettingsStore((s) => s.sidebarCollapsed);
  const setSetting = useSettingsStore((s) => s.setSetting);

  const toggle = () => setSetting("sidebarCollapsed", !collapsed);

  return (
    <aside
      className={clsx(
        "border-border bg-surface-1 hidden shrink-0 flex-col border-r transition-[width] duration-200 md:flex",
        collapsed ? "w-14" : "w-56",
      )}
    >
      <button
        type="button"
        onClick={toggle}
        aria-label={t(collapsed ? "sidebar.expand" : "sidebar.collapse")}
        title={t(collapsed ? "sidebar.expand" : "sidebar.collapse")}
        className="border-border text-text-muted hover:bg-surface-2 hover:text-text-primary flex h-12 items-center justify-center border-b transition-colors"
      >
        {collapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
      </button>
      <SidebarNavList collapsed={collapsed} />
    </aside>
  );
}
