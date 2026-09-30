import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { m } from "motion/react";
import { Bug, PanelLeftClose, PanelLeftOpen, Scale } from "lucide-react";
import clsx from "clsx";
import { useSettingsStore } from "@store/settings-store";
import { ABOUT } from "@config/about";
import { NAV_GROUPS, type NavItem } from "@config/navigation";
import { Logo } from "@components/brand/Logo";
import { HoverIcon, hoverParent } from "@components/icons/animated";
import { IconButton } from "@components/ui/IconButton";
import { Tooltip } from "@components/ui/Tooltip";

interface NavListProps {
  collapsed: boolean;
  onNavigate?: () => void;
  /** Scopes the sliding highlight — the drawer copy needs its own. */
  layoutId: string;
}

function NavRow({ item, collapsed, onNavigate, layoutId }: { item: NavItem } & NavListProps) {
  const { t } = useTranslation("ui");
  const label = t(item.labelKey);
  return (
    <Tooltip content={label} side="right" disabled={!collapsed}>
      <NavLink
        to={item.to}
        end={item.to === "/"}
        onClick={onNavigate}
        aria-label={collapsed ? label : undefined}
        className={({ isActive }) =>
          clsx(
            "relative block rounded-lg text-sm font-medium outline-offset-0",
            isActive ? "text-text-primary" : "text-text-secondary hover:text-text-primary",
          )
        }
      >
        {({ isActive }) => (
          <m.span
            {...hoverParent}
            className={clsx(
              "relative flex h-9 items-center gap-3 rounded-lg transition-colors",
              collapsed ? "justify-center px-0" : "px-3",
              !isActive && "hover:bg-surface-2",
            )}
          >
            {isActive && (
              <m.span
                layoutId={layoutId}
                className="bg-accent-muted absolute inset-0 rounded-lg"
                transition={{ type: "spring", stiffness: 500, damping: 38 }}
                aria-hidden="true"
              >
                <span className="bg-accent absolute top-2 bottom-2 -left-2 w-1 rounded-full" />
              </m.span>
            )}
            <span className={clsx("relative flex", isActive && "text-accent")}>
              <HoverIcon icon={item.icon} motion={item.motion} className="size-[1.125rem]" />
            </span>
            {!collapsed && <span className="relative truncate">{label}</span>}
          </m.span>
        )}
      </NavLink>
    </Tooltip>
  );
}

/** The grouped page list — shared by the desktop sidebar and the mobile sheet. */
export function NavList({ collapsed, onNavigate, layoutId }: NavListProps) {
  const { t } = useTranslation("ui");
  return (
    <div className="flex flex-col gap-4">
      {NAV_GROUPS.map((group) => (
        <div key={group.id} className="flex flex-col gap-0.5">
          {collapsed ? (
            <div className="bg-border mx-3 my-1 h-px first:hidden" aria-hidden="true" />
          ) : (
            <p className="text-text-muted px-3 pb-1 text-[0.6875rem] font-semibold tracking-wider uppercase">
              {t(group.labelKey)}
            </p>
          )}
          {group.items.map((item) => (
            <NavRow
              key={item.to}
              item={item}
              collapsed={collapsed}
              onNavigate={onNavigate}
              layoutId={layoutId}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

/** Secondary links under the page list: legal centre and bug reports. */
export function NavFooterLinks({
  collapsed,
  onNavigate,
}: {
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const { t } = useTranslation("ui");
  const row = clsx(
    "text-text-muted hover:bg-surface-2 hover:text-text-primary flex h-8 items-center gap-3 rounded-lg text-xs font-medium transition-colors",
    collapsed ? "justify-center" : "px-3",
  );
  return (
    <div className="flex flex-col gap-0.5">
      <Tooltip content={t("legal.title")} side="right" disabled={!collapsed}>
        <NavLink
          to="/legal"
          onClick={onNavigate}
          className={row}
          aria-label={collapsed ? t("legal.title") : undefined}
        >
          <Scale className="size-4 shrink-0" aria-hidden="true" />
          {!collapsed && t("legal.title")}
        </NavLink>
      </Tooltip>
      <Tooltip content={t("tabs.reportBug")} side="right" disabled={!collapsed}>
        <a
          href={ABOUT.bugReportUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={onNavigate}
          className={row}
          aria-label={collapsed ? t("tabs.reportBug") : undefined}
        >
          <Bug className="size-4 shrink-0" aria-hidden="true" />
          {!collapsed && t("tabs.reportBug")}
        </a>
      </Tooltip>
    </div>
  );
}

/** Desktop sidebar (md and up): full width or a 68px icon rail. */
export function Sidebar() {
  const { t } = useTranslation("ui");
  const collapsed = useSettingsStore((s) => s.sidebarCollapsed);
  const setSetting = useSettingsStore((s) => s.setSetting);

  return (
    <aside
      className={clsx(
        "border-border bg-surface-1 hidden shrink-0 flex-col border-r transition-[width] duration-200 ease-out md:flex",
        collapsed ? "w-[4.25rem]" : "w-60",
      )}
    >
      <div
        className={clsx(
          "flex h-14 shrink-0 items-center gap-2.5",
          collapsed ? "justify-center" : "px-4",
        )}
      >
        <Logo className="size-8" />
        {!collapsed && (
          <div className="min-w-0 leading-tight">
            <p className="text-text-primary truncate text-sm font-bold tracking-tight">
              {ABOUT.appName}
            </p>
            <p className="text-text-muted tabular text-[0.6875rem]">v{ABOUT.version}</p>
          </div>
        )}
      </div>

      <nav aria-label={t("nav.main")} className="flex-1 scrollbar-thin overflow-y-auto px-2.5 py-3">
        <NavList collapsed={collapsed} layoutId="nav-active-desktop" />
      </nav>

      <div className="border-border flex flex-col gap-1 border-t px-2.5 py-3">
        <NavFooterLinks collapsed={collapsed} />
        <div className={clsx("flex", collapsed ? "justify-center" : "justify-end px-1")}>
          <IconButton
            label={t(collapsed ? "sidebar.expand" : "sidebar.collapse")}
            tooltipSide="right"
            size="icon-sm"
            onClick={() => setSetting("sidebarCollapsed", !collapsed)}
          >
            {collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
          </IconButton>
        </div>
      </div>
    </aside>
  );
}
