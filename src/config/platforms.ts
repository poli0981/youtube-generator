export interface PlatformConfig {
  readonly id: string;
  readonly label: string;
  /** Shown as placeholder / hint to the user. */
  readonly urlPrefix: string;
  /** Authoritative validator. Must match the entire trimmed URL. */
  readonly urlPattern: RegExp;
  /**
   * Optional canonicaliser run on already-valid URLs before commit.
   * Useful for stripping trailing slug segments (e.g. Steam app pages
   * include the game name after the app id).
   */
  readonly normalize?: (url: string) => string;
  /**
   * How the platform appears inside tags ("Elden Ring Steam", "itch.io
   * gameplay") — the name people search for, not the store's full title.
   * Omitted where the platform isn't a searchable name (a publisher site).
   */
  readonly tagName?: string;
}

/**
 * Normaliser for Steam store URLs.
 *
 * Keeps `https://store.steampowered.com/app/<id>/<Slug>/` — the slug makes
 * the link readable in a description and is where the game's name is read
 * from — and drops what follows it (tracking `?snr=` parameters, extra
 * path segments). An `s.team/a/<id>` short link becomes the `/app/<id>` form.
 */
function normalizeSteamUrl(url: string): string {
  const short = url.match(/^https:\/\/s\.team\/a\/(\d+)\/?$/i);
  if (short) return `https://store.steampowered.com/app/${short[1]}`;
  const match = url.match(
    /^(https:\/\/store\.steampowered\.com\/(?:app|sub|bundle)\/\d+)(\/[^/?#\s]+)?/i,
  );
  if (!match) return url;
  return match[2] ? `${match[1]}${match[2]}/` : (match[1] ?? url);
}

export const PLATFORMS: readonly PlatformConfig[] = [
  {
    id: "steam",
    tagName: "Steam",
    label: "Steam",
    urlPrefix: "https://store.steampowered.com/app/",
    // /app/, /sub/ (package) or /bundle/ + <digits>, optionally followed by
    // /<slug>; or the s.team/a/<digits> short link.
    urlPattern:
      /^https:\/\/(?:store\.steampowered\.com\/(?:app|sub|bundle)\/\d+(?:\/[^\s]*)?|s\.team\/a\/\d+\/?)$/i,
    normalize: normalizeSteamUrl,
  },
  {
    id: "epic",
    tagName: "Epic Games",
    label: "Epic Games Store",
    urlPrefix: "https://store.epicgames.com/",
    urlPattern: /^https:\/\/(?:store\.epicgames\.com|www\.epicgames\.com\/store)\/[^\s]+$/i,
  },
  {
    id: "ps",
    tagName: "PlayStation",
    label: "PlayStation Store",
    urlPrefix: "https://store.playstation.com/",
    urlPattern: /^https:\/\/store\.playstation\.com\/[^\s]+$/i,
  },
  {
    id: "xbox",
    tagName: "Xbox",
    label: "Xbox / Microsoft Store",
    urlPrefix: "https://www.xbox.com/games/",
    // xbox.com (with or without www) and the Microsoft Store web pages.
    urlPattern:
      /^https:\/\/(?:(?:www\.)?xbox\.com|apps\.microsoft\.com|www\.microsoft\.com\/[a-z-]*\/?store)\/[^\s]*$/i,
  },
  {
    id: "nintendo",
    tagName: "Nintendo Switch",
    label: "Nintendo eShop",
    urlPrefix: "https://www.nintendo.com/store/",
    // Every regional site: nintendo.com/us/…, nintendo.co.uk, nintendo.de,
    // store.nintendo.co.uk, nintendo.co.jp …
    urlPattern:
      /^https:\/\/(?:[a-z0-9-]+\.)*nintendo\.(?:com|co\.[a-z]{2}|com\.[a-z]{2}|[a-z]{2})\/[^\s]+$/i,
  },
  {
    id: "gog",
    tagName: "GOG",
    label: "GOG",
    urlPrefix: "https://www.gog.com/game/",
    urlPattern: /^https:\/\/(?:www\.)?gog\.com\/[^\s]+$/i,
  },
  {
    id: "itchio",
    tagName: "itch.io",
    label: "itch.io",
    urlPrefix: "https://<dev>.itch.io/<game>",
    // itch.io games live at https://<dev>.itch.io/<game>, where <dev>
    // is a user subdomain. Reject the bare https://itch.io/... host.
    urlPattern: /^https:\/\/[a-z0-9][a-z0-9-]*\.itch\.io\/[a-z0-9][a-z0-9_-]*\/?$/i,
  },
  {
    id: "humble",
    tagName: "Humble Bundle",
    label: "Humble Bundle",
    urlPrefix: "https://www.humblebundle.com/store/",
    urlPattern: /^https:\/\/(?:www\.)?humblebundle\.com\/[^\s]+$/i,
  },
  {
    id: "amazon",
    tagName: "Amazon Luna",
    label: "Amazon Luna",
    urlPrefix: "https://luna.amazon.com/game/",
    // Luna's own site, or the game's page on any Amazon storefront.
    urlPattern: /^https:\/\/(?:luna\.amazon\.com|(?:www\.)?amazon\.[a-z.]{2,6})\/[^\s]+$/i,
  },
  {
    id: "ea",
    tagName: "EA app",
    label: "EA app",
    urlPrefix: "https://www.ea.com/games/",
    urlPattern: /^https:\/\/(?:www\.)?ea\.com\/[^\s]+$/i,
  },
  {
    id: "ubisoft",
    tagName: "Ubisoft Connect",
    label: "Ubisoft Store",
    urlPrefix: "https://store.ubisoft.com/",
    urlPattern: /^https:\/\/(?:store\.ubisoft\.com|(?:www\.)?ubisoft\.com)\/[^\s]+$/i,
  },
  {
    id: "battlenet",
    tagName: "Battle.net",
    label: "Battle.net",
    urlPrefix: "https://shop.battle.net/",
    // shop.battle.net and its regional hosts (us.shop.battle.net …).
    urlPattern: /^https:\/\/(?:[a-z0-9-]+\.)*battle\.net\/[^\s]+$/i,
  },
  {
    id: "googleplay",
    tagName: "Android",
    label: "Google Play",
    urlPrefix: "https://play.google.com/store/apps/details?id=",
    // `id=` first or after other parameters (`?hl=en&id=…`).
    urlPattern: /^https:\/\/play\.google\.com\/store\/apps\/details\?(?:[^\s]*&)?id=[\w.]+[^\s]*$/i,
  },
  {
    id: "appstore",
    tagName: "iOS",
    label: "App Store",
    urlPrefix: "https://apps.apple.com/app/",
    urlPattern: /^https:\/\/apps\.apple\.com\/[^\s]+$/i,
  },
  {
    id: "meta",
    tagName: "Meta Quest",
    label: "Meta Quest Store",
    urlPrefix: "https://www.meta.com/experiences/",
    // meta.com, and oculus.com links that still circulate.
    urlPattern: /^https:\/\/(?:www\.)?(?:meta|oculus)\.com\/[^\s]+$/i,
  },
  {
    // Catch-all for indie / niche releases distributed only from a
    // publisher's or developer's own site. Pattern is intentionally
    // loose (any HTTPS URL with a host) — these sites don't share a
    // common shape, and tightening the regex would just lock real
    // links out of the description.
    id: "publisher",
    label: "Publisher / Developer site",
    urlPrefix: "https://",
    urlPattern: /^https:\/\/[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)+(?:\/[^\s]*)?$/i,
  },
] as const;
