import { NavLink, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { m } from "motion/react";
import { Ellipsis } from "lucide-react";
import clsx from "clsx";
import { MOBILE_PRIMARY_PATHS, NAV_ITEMS } from "@config/navigation";
import { HoverIcon, hoverParent } from "@components/icons/animated";

const PRIMARY = NAV_ITEMS.filter((item) => MOBILE_PRIMARY_PATHS.includes(item.to));

/**
 * Bottom tab bar below `md`: the four pages a phone user needs most, plus
 * "More" for the rest (the navigation sheet). Replaces the hamburger-only
 * drawer, which hid every page behind a tap. It is the last row of the shell's
 * column rather than `position: fixed`, so the page area ends above it and
 * nothing sticky inside a page can slide underneath.
 */
export function MobileNav({
  onOpenMore,
  moreActive,
}: {
  onOpenMore: () => void;
  moreActive: boolean;
}) {
  const { t } = useTranslation("ui");
  const { pathname } = useLocation();
  const onPrimaryPage = PRIMARY.some((item) =>
    item.to === "/" ? pathname === "/" : pathname.startsWith(item.to),
  );

  const cell =
    "relative flex h-14 flex-1 flex-col items-center justify-center gap-0.5 text-[0.6875rem] font-medium";

  return (
    <nav
      aria-label={t("nav.main")}
      className="border-border bg-surface-1 safe-bottom shrink-0 border-t md:hidden"
    >
      <div className="flex">
        {PRIMARY.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) => clsx(cell, isActive ? "text-accent" : "text-text-muted")}
          >
            {({ isActive }) => (
              <m.span {...hoverParent} className="flex flex-col items-center gap-0.5">
                {isActive && (
                  <m.span
                    layoutId="nav-active-mobile"
                    className="bg-accent absolute top-0 h-0.5 w-8 rounded-full"
                    aria-hidden="true"
                  />
                )}
                <HoverIcon icon={item.icon} motion={item.motion} className="size-5" />
                <span className="max-w-full truncate px-1">{t(item.labelKey)}</span>
              </m.span>
            )}
          </NavLink>
        ))}
        <button
          type="button"
          onClick={onOpenMore}
          aria-expanded={moreActive}
          className={clsx(
            cell,
            "cursor-pointer",
            !onPrimaryPage || moreActive ? "text-accent" : "text-text-muted",
          )}
        >
          <Ellipsis className="size-5" aria-hidden="true" />
          <span>{t("nav.more")}</span>
        </button>
      </div>
    </nav>
  );
}
