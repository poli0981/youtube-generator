/**
 * Brand constants shared by the app, the build plugins and the Cloudflare
 * Worker. The canonical artwork lives in `assets/brand/logo.svg`; this inline
 * copy is for places that cannot load a file (the Worker's gate page, the
 * prerendered legal pages, the static 404) and must stay visually identical.
 */

export const SITE_ORIGIN = "https://ytgenerator.stream";

export const BRAND_GRADIENT = { from: "#6366F1", to: "#A855F7" } as const;

/** The app mark as an inline SVG string (`aria-hidden`; pair it with text). */
export const LOGO_SVG = `<svg viewBox="0 0 512 512" aria-hidden="true" focusable="false"><defs><linearGradient id="ytg-g" x1="40" y1="24" x2="472" y2="488" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${BRAND_GRADIENT.from}"/><stop offset="1" stop-color="${BRAND_GRADIENT.to}"/></linearGradient></defs><rect width="512" height="512" rx="120" fill="url(#ytg-g)"/><path d="M176 118c0-17.9 19.4-29.1 34.9-20.1l128.2 74c15.5 9 15.5 31.2 0 40.2l-128.2 74C195.4 295.1 176 283.9 176 266z" fill="#fff"/><rect x="136" y="322" width="240" height="32" rx="16" fill="#fff" fill-opacity=".92"/><rect x="136" y="374" width="160" height="32" rx="16" fill="#fff" fill-opacity=".6"/></svg>`;
