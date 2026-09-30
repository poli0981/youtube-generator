import type { ComponentType } from "react";
import {
  siBluesky,
  siBuymeacoffee,
  siDiscord,
  siFacebook,
  siGithub,
  siInstagram,
  siKofi,
  siMastodon,
  siPatreon,
  siPaypal,
  siSteam,
  siTelegram,
  siThreads,
  siTiktok,
  siX,
  siYoutube,
  type SimpleIcon,
} from "simple-icons";

/**
 * Brand marks from Simple Icons (CC0-1.0). lucide-react 1.0 removed its brand
 * icons; these replace them. The marks themselves remain their owners'
 * trademarks and are used only to label links to those services.
 */

/** Any icon component the UI accepts — lucide icons and these alike. */
export type IconComponent = ComponentType<{ className?: string; "aria-hidden"?: boolean }>;

function brandIcon(icon: SimpleIcon): IconComponent {
  function BrandIcon({ className }: { className?: string }) {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
        focusable="false"
        className={className}
      >
        <path d={icon.path} />
      </svg>
    );
  }
  BrandIcon.displayName = `BrandIcon(${icon.title})`;
  return BrandIcon;
}

export const YoutubeIcon = brandIcon(siYoutube);
export const XIcon = brandIcon(siX);
export const BlueskyIcon = brandIcon(siBluesky);
export const MastodonIcon = brandIcon(siMastodon);
export const DiscordIcon = brandIcon(siDiscord);
export const SteamIcon = brandIcon(siSteam);
export const TelegramIcon = brandIcon(siTelegram);
export const GithubIcon = brandIcon(siGithub);
export const KofiIcon = brandIcon(siKofi);
export const BuyMeACoffeeIcon = brandIcon(siBuymeacoffee);
export const PatreonIcon = brandIcon(siPatreon);
export const PaypalIcon = brandIcon(siPaypal);
export const FacebookIcon = brandIcon(siFacebook);
export const InstagramIcon = brandIcon(siInstagram);
export const TiktokIcon = brandIcon(siTiktok);
export const ThreadsIcon = brandIcon(siThreads);
