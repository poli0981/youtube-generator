import {
  BookOpen,
  CircleCheckBig,
  Clapperboard,
  Columns2,
  Film,
  Flag,
  Gamepad2,
  Gem,
  ListOrdered,
  MapPin,
  Package,
  Puzzle,
  Radio,
  Repeat,
  Search,
  ShieldCheck,
  Star,
  Swords,
  Trophy,
  Zap,
  type LucideIcon,
} from "lucide-react";
import type { VideoTypeId } from "@config/video-types";

/**
 * One icon per video type. Kept out of `config/video-types.ts` because the
 * engine imports that module and must not pull in React components; the
 * emoji there is only a fallback for plain-text contexts.
 */
export const VIDEO_TYPE_ICONS: Record<VideoTypeId, LucideIcon> = {
  full: Gamepad2,
  part: ListOrdered,
  full_demo: Clapperboard,
  demo_part: Film,
  boss: Swords,
  boss_nohit: ShieldCheck,
  ending: Flag,
  speedrun: Zap,
  "100percent": CircleCheckBig,
  dlc: Package,
  newgame_plus: Repeat,
  challenge: Trophy,
  side_quest: MapPin,
  secret: Search,
  comparison: Columns2,
  guide: BookOpen,
  mods: Puzzle,
  collectibles: Star,
  livestream: Radio,
  gacha_quest: Gem,
};
