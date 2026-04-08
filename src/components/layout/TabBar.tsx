import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Pencil, FileText, User, Clock, Settings, Layers, ListVideo, ScrollText } from "lucide-react";
import clsx from "clsx";

const tabs = [
  { to: "/", labelKey: "tabs.editor", icon: Pencil },
  { to: "/output", labelKey: "tabs.output", icon: FileText },
  { to: "/batch", labelKey: "tabs.batch", icon: Layers },
  { to: "/profiles", labelKey: "tabs.profiles", icon: User },
  { to: "/history", labelKey: "tabs.history", icon: Clock },
  { to: "/playlist", labelKey: "tabs.playlist", icon: ListVideo },
  { to: "/logs", labelKey: "tabs.logs", icon: ScrollText },
  { to: "/settings", labelKey: "tabs.settings", icon: Settings },
] as const;

export function TabBar() {
  const { t } = useTranslation("ui");

  return (
    <nav className="flex overflow-x-auto border-b border-border bg-surface-1 px-6">
      {tabs.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.to === "/"}
          className={({ isActive }) =>
            clsx(
              "flex shrink-0 items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors",
              isActive
                ? "border-accent text-accent"
                : "border-transparent text-text-muted hover:text-text-secondary",
            )
          }
        >
          <tab.icon className="h-4 w-4" />
          {t(tab.labelKey)}
        </NavLink>
      ))}
    </nav>
  );
}
