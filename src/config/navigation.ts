import {
  CircleHelp,
  FileText,
  History,
  Layers,
  ListVideo,
  PenLine,
  ScrollText,
  Settings,
  Share2,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import type { IconMotion } from "@components/icons/animated";

/**
 * The app's pages, grouped the way the sidebar shows them. One list drives the
 * sidebar, the mobile bottom bar, the command palette and the page titles, so
 * adding a page is one entry here plus its route in App.tsx.
 */
export interface NavItem {
  to: string;
  labelKey: string;
  icon: LucideIcon;
  /** Micro-animation the icon plays on hover / focus. */
  motion: IconMotion;
}

export interface NavGroup {
  id: "create" | "library" | "system";
  labelKey: string;
  items: readonly NavItem[];
}

export const NAV_GROUPS: readonly NavGroup[] = [
  {
    id: "create",
    labelKey: "nav.create",
    items: [
      { to: "/", labelKey: "tabs.editor", icon: PenLine, motion: "wiggle" },
      { to: "/output", labelKey: "tabs.output", icon: FileText, motion: "bounce" },
      { to: "/batch", labelKey: "tabs.batch", icon: Layers, motion: "pop" },
      { to: "/social", labelKey: "tabs.social", icon: Share2, motion: "tilt" },
      { to: "/playlist", labelKey: "tabs.playlist", icon: ListVideo, motion: "nudge" },
    ],
  },
  {
    id: "library",
    labelKey: "nav.library",
    items: [
      { to: "/profiles", labelKey: "tabs.profiles", icon: UserRound, motion: "pop" },
      { to: "/history", labelKey: "tabs.history", icon: History, motion: "spin" },
    ],
  },
  {
    id: "system",
    labelKey: "nav.system",
    items: [
      { to: "/settings", labelKey: "tabs.settings", icon: Settings, motion: "spin" },
      { to: "/logs", labelKey: "tabs.logs", icon: ScrollText, motion: "bounce" },
      { to: "/about", labelKey: "tabs.about", icon: CircleHelp, motion: "pop" },
    ],
  },
];

export const NAV_ITEMS: readonly NavItem[] = NAV_GROUPS.flatMap((g) => g.items);

/** The four pages that get their own slot in the mobile bottom bar. */
export const MOBILE_PRIMARY_PATHS: readonly string[] = ["/", "/output", "/batch", "/profiles"];
