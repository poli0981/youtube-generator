import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Pencil, FileText } from "lucide-react";
import clsx from "clsx";

const tabs = [
  { to: "/", labelKey: "tabs.editor", icon: Pencil },
  { to: "/output", labelKey: "tabs.output", icon: FileText },
] as const;

export function TabBar() {
  const { t } = useTranslation("ui");

  return (
    <nav className="flex border-b border-border bg-surface-1 px-6">
      {tabs.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.to === "/"}
          className={({ isActive }) =>
            clsx(
              "flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors",
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
