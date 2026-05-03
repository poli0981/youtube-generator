/**
 * Extract a humanized game name from a recognised storefront URL.
 *
 * Supported storefronts (those whose URL paths carry stable, parseable
 * name slugs):
 *   • Steam        — `https://store.steampowered.com/app/<id>/<Slug>/`
 *   • itch.io      — `https://<dev>.itch.io/<slug>`
 *   • GOG          — `https://www.gog.com/[<lang>/]game/<slug>`
 *   • Epic         — `https://store.epicgames.com/<locale>/p/<slug>[-<hash>]`
 *   • Nintendo US  — `https://www.nintendo.com/us/store/products/<slug>[-switch[-2]]/`
 *   • Nintendo EU  — `https://www.nintendo.com/<locale>/Games/<segment>/<slug>[-<id>].html`
 *   • Humble       — `https://www.humblebundle.com/store/<slug>`
 *
 * Returns `null` for every other URL shape — including PlayStation /
 * Xbox / Amazon Luna URLs, which rely on opaque product IDs rather than
 * stable name slugs and would emit garbled names.
 */

interface NameExtractor {
  pattern: RegExp;
  humanize: (slug: string) => string;
}

/**
 * Title-case a string in a way that's friendly for game names extracted
 * from URL slugs:
 *   • lowercases first to normalise ALL_CAPS slugs (`ELDEN_RING`)
 *   • capitalises the first letter of each whitespace- or hyphen-
 *     separated piece, so "counter-strike 2" → "Counter-Strike 2"
 *   • leaves leading-numeric tokens alone ("100 Orange Juice")
 */
function titleCase(s: string): string {
  return s
    .toLowerCase()
    .split(/(\s+)/)
    .map((chunk) => {
      if (/^\s+$/.test(chunk) || chunk === "") return chunk;
      return chunk
        .split("-")
        .map((piece) =>
          piece.length === 0 ? piece : piece.charAt(0).toUpperCase() + piece.slice(1),
        )
        .join("-");
    })
    .join("");
}

const PLATFORM_NAME_EXTRACTORS: readonly NameExtractor[] = [
  {
    // Steam slug sits after `/app/<digits>/`. The slug uses underscores
    // and is often ALL_CAPS — we lowercase + title-case for display.
    pattern: /^https:\/\/store\.steampowered\.com\/app\/\d+\/([^/?#\s]+)/i,
    humanize: (s) => titleCase(s.replace(/_+/g, " ")),
  },
  {
    // itch.io: <dev>.itch.io/<slug> — dev subdomain, hyphen-cased game slug.
    pattern: /^https:\/\/[^/]+\.itch\.io\/([^/?#\s]+)/i,
    humanize: (s) => titleCase(s.replace(/-+/g, " ")),
  },
  {
    // GOG canonical game URL, optionally locale-prefixed (e.g. `/en/`).
    pattern: /^https:\/\/www\.gog\.com\/(?:[a-z]{2}\/)?game\/([^/?#\s]+)/i,
    humanize: (s) => titleCase(s.replace(/_+/g, " ")),
  },
  {
    // Epic Games Store. Path is locale-prefixed (`en-US`, `de`, `fr`,
    // …) and ends with `/p/<slug>` where the slug carries a 6+-char
    // hex product hash like `-aa04de` we strip before display.
    pattern:
      /^https:\/\/store\.epicgames\.com\/[a-z]{2}(?:-[a-z]{2})?\/p\/([a-z0-9-]+)/i,
    humanize: (s) =>
      titleCase(s.replace(/-[a-f0-9]{6,}$/i, "").replace(/-+/g, " ")),
  },
  {
    // Nintendo US store (`/us/store/products/<slug>`). Slugs frequently
    // carry a `-switch` or `-switch-2` platform suffix that we strip
    // for a cleaner display name.
    pattern:
      /^https:\/\/www\.nintendo\.com\/us\/store\/products\/([^/?#\s]+)/i,
    humanize: (s) =>
      titleCase(s.replace(/-switch(?:-2)?$/i, "").replace(/-+/g, " ")),
  },
  {
    // Nintendo EU store (`/<locale>/Games/<segment>/<slug>-<id>.html`).
    // The slug ends with a numeric product id we strip before display.
    pattern:
      /^https:\/\/www\.nintendo\.com\/[a-z]{2}-[a-z]{2}\/Games\/[^/]+\/([^/?#]+?)(?:-\d+)?\.html/i,
    humanize: (s) => titleCase(s.replace(/-+/g, " ")),
  },
  {
    // Humble Bundle store. Slugs are simple hyphen-cased names.
    pattern: /^https:\/\/www\.humblebundle\.com\/store\/([^/?#\s]+)/i,
    humanize: (s) => titleCase(s.replace(/-+/g, " ")),
  },
] as const;

export function extractGameNameFromUrl(url: string): string | null {
  const trimmed = url.trim();
  if (!trimmed) return null;
  for (const ex of PLATFORM_NAME_EXTRACTORS) {
    const m = trimmed.match(ex.pattern);
    if (m?.[1]) {
      const name = ex.humanize(m[1]).trim();
      if (name) return name;
    }
  }
  return null;
}

/**
 * Lowercase + alphanumeric token set. Apostrophes are removed (not
 * spaced) so `Marvel's` tokenises to `marvels`, matching Steam slugs
 * like `Marvels_Spider-Man_Remastered` exactly.
 */
function tokenize(s: string): Set<string> {
  return new Set(
    s
      .toLowerCase()
      .replace(/['’]/g, "")
      .replace(/[^a-z0-9 ]+/g, " ")
      .split(/\s+/)
      .filter(Boolean),
  );
}

/**
 * Subset-tolerant comparison: returns true when the URL extracts to a
 * name whose tokens are NOT all present in the typed Game Name.
 *
 * Examples:
 *   • Game `Marvel's Spider-Man Remastered` + Steam link `Spider-Man`
 *     → no mismatch (link tokens ⊆ game tokens).
 *   • Game `Pragmata Pro` + Humble link `Pragmata`
 *     → no mismatch (link tokens ⊆ game tokens).
 *   • Game `Pragmata` + Humble link `Lucky Tower Ultimate`
 *     → mismatch (link has tokens absent from game name).
 *
 * Returns false when either side is empty or the URL is not a
 * recognised storefront.
 */
export function isLinkNameMismatch(gameName: string, url: string): boolean {
  if (!gameName.trim()) return false;
  const extracted = extractGameNameFromUrl(url);
  if (!extracted) return false;
  const gameTokens = tokenize(gameName);
  const linkTokens = tokenize(extracted);
  if (gameTokens.size === 0 || linkTokens.size === 0) return false;
  for (const t of linkTokens) {
    if (!gameTokens.has(t)) return true;
  }
  return false;
}
