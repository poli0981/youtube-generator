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
}

/**
 * Normaliser for Steam store URLs.
 *
 * Valid shape: `https://store.steampowered.com/app/<id>` with an optional
 * trailing slug such as `/ELDEN_RING/`. This strips everything after the
 * numeric id, yielding the canonical `.../app/<id>` form.
 */
function normalizeSteamUrl(url: string): string {
  const match = url.match(
    /^(https:\/\/store\.steampowered\.com\/app\/\d+)(?:\/.*)?$/i,
  );
  return match?.[1] ?? url;
}

export const PLATFORMS: readonly PlatformConfig[] = [
  {
    id: "steam",
    label: "Steam",
    urlPrefix: "https://store.steampowered.com/app/",
    // /app/<digits>, optionally followed by /<slug> or trailing slash.
    urlPattern: /^https:\/\/store\.steampowered\.com\/app\/\d+(?:\/[^\s]*)?$/i,
    normalize: normalizeSteamUrl,
  },
  {
    id: "epic",
    label: "Epic Games Store",
    urlPrefix: "https://store.epicgames.com/",
    urlPattern: /^https:\/\/store\.epicgames\.com\/[^\s]+$/i,
  },
  {
    id: "ps",
    label: "PlayStation Store",
    urlPrefix: "https://store.playstation.com/",
    urlPattern: /^https:\/\/store\.playstation\.com\/[^\s]+$/i,
  },
  {
    id: "xbox",
    label: "Xbox / Microsoft Store",
    urlPrefix: "https://www.xbox.com/games/",
    urlPattern: /^https:\/\/www\.xbox\.com\/[^\s]+$/i,
  },
  {
    id: "nintendo",
    label: "Nintendo eShop",
    urlPrefix: "https://www.nintendo.com/store/",
    urlPattern: /^https:\/\/www\.nintendo\.com\/[^\s]+$/i,
  },
  {
    id: "gog",
    label: "GOG",
    urlPrefix: "https://www.gog.com/game/",
    urlPattern: /^https:\/\/www\.gog\.com\/[^\s]+$/i,
  },
  {
    id: "itchio",
    label: "itch.io",
    urlPrefix: "https://<dev>.itch.io/<game>",
    // itch.io games live at https://<dev>.itch.io/<game>, where <dev>
    // is a user subdomain. Reject the bare https://itch.io/... host.
    urlPattern:
      /^https:\/\/[a-z0-9][a-z0-9-]*\.itch\.io\/[a-z0-9][a-z0-9_-]*\/?$/i,
  },
  {
    id: "humble",
    label: "Humble Bundle",
    urlPrefix: "https://www.humblebundle.com/store/",
    urlPattern: /^https:\/\/www\.humblebundle\.com\/[^\s]+$/i,
  },
  {
    id: "amazon",
    label: "Amazon Luna",
    urlPrefix: "https://www.amazon.com/luna/",
    urlPattern: /^https:\/\/www\.amazon\.com\/[^\s]+$/i,
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
