/**
 * Extract a humanized game name from a recognised storefront URL.
 *
 * Supported storefronts (those whose URL paths carry stable, parseable
 * name slugs):
 *   • Steam     — `https://store.steampowered.com/app/<id>/<Slug>/`
 *   • itch.io   — `https://<dev>.itch.io/<slug>`
 *   • GOG       — `https://www.gog.com/[<lang>/]game/<slug>`
 *
 * Returns `null` for every other URL shape. Epic / PlayStation / Xbox /
 * Nintendo / Humble / Amazon Luna do not expose stable name slugs in
 * their canonical URLs (most use product IDs or URL-encoded blobs), so
 * we deliberately skip them rather than emit garbled names.
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
