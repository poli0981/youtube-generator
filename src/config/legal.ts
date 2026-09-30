/**
 * Legal documents, served in-site since v1.0.0.
 *
 * The Markdown/plain-text files at the repo root stay the single source of
 * truth. At build time `build-plugins/legal-docs.ts` renders each one twice:
 * into the lazily-loaded `virtual:legal-docs` module the in-app Legal Center
 * reads (so the desktop and Android builds carry them offline), and into a
 * static `dist/legal/<id>.html` page that the Cloudflare Worker serves to
 * visitors who have not passed the Turnstile gate yet — the Terms and Privacy
 * Policy must be readable *before* anyone is asked to agree to them.
 *
 * This module is imported by the app, the Vite plugin and the Worker, so it
 * must stay free of browser- or React-only imports.
 */

export type LegalDocId =
  | "terms"
  | "privacy"
  | "disclaimer"
  | "license"
  | "third-party"
  | "security"
  | "notice"
  | "conduct";

export interface LegalDoc {
  readonly id: LegalDocId;
  /** i18n key (ui namespace) for the document's display name. */
  readonly labelKey: string;
  /** Repo-relative source file rendered at build time. */
  readonly source: string;
  /** Repo-relative Vietnamese translation, when one exists. */
  readonly sourceVi?: string;
  /** Listed on the first-run consent gate (the documents a user agrees to). */
  readonly consent: boolean;
}

/** Display order = array order, in the Legal Center and on the consent gate. */
export const LEGAL_DOCS: readonly LegalDoc[] = [
  { id: "terms", labelKey: "legal.docs.terms", source: "TERMS.md", consent: true },
  { id: "privacy", labelKey: "legal.docs.privacy", source: "PRIVACY.md", consent: true },
  {
    id: "disclaimer",
    labelKey: "legal.docs.disclaimer",
    source: "DISCLAIMER.md",
    sourceVi: "docs/i18n/vi/DISCLAIMER.md",
    consent: true,
  },
  { id: "license", labelKey: "legal.docs.license", source: "LICENSE", consent: true },
  {
    id: "third-party",
    labelKey: "legal.docs.thirdParty",
    source: "THIRD_PARTY_NOTICES.md",
    consent: false,
  },
  { id: "security", labelKey: "legal.docs.security", source: "SECURITY.md", consent: false },
  { id: "notice", labelKey: "legal.docs.notice", source: "NOTICE", consent: false },
  { id: "conduct", labelKey: "legal.docs.conduct", source: "CODE_OF_CONDUCT.md", consent: false },
];

export const LEGAL_DOC_IDS: readonly LegalDocId[] = LEGAL_DOCS.map((d) => d.id);

export function isLegalDocId(value: string): value is LegalDocId {
  return (LEGAL_DOC_IDS as readonly string[]).includes(value);
}

/** In-site path of a document — the same URL on the static page and in the app. */
export function legalDocPath(id: LegalDocId): string {
  return `/legal/${id}`;
}

/**
 * The legal-terms version the user must accept. Bump this whenever the
 * Terms / Privacy / Disclaimer change materially — every user whose stored
 * `legalConsentVersion` is below this re-sees the first-run consent gate.
 *
 *   1 — v0.28.0: first gate (documents dated 2026-05-14).
 *   2 — v1.0.0: web hosting moved to Cloudflare (Turnstile + Web Analytics
 *       added to the Privacy Policy).
 */
export const CURRENT_TERMS_VERSION = 2;

/**
 * Cookie the Cloudflare Worker sets when a visitor ticks "I agree" on the
 * Turnstile gate page. Deliberately readable from JavaScript: the web app uses
 * it to record the same acceptance locally, so a web visitor meets one
 * blocking screen instead of two. Never set in the desktop / Android builds.
 */
export const TERMS_COOKIE = "ytg_terms";

/** Parse the accepted terms version out of a `document.cookie`-style string. */
export function termsVersionFromCookie(cookieHeader: string | null | undefined): number | null {
  if (!cookieHeader) return null;
  for (const part of cookieHeader.split(";")) {
    const eq = part.indexOf("=");
    if (eq < 0 || part.slice(0, eq).trim() !== TERMS_COOKIE) continue;
    const raw = part.slice(eq + 1).trim();
    if (!/^\d{1,4}$/.test(raw)) return null;
    return Number(raw);
  }
  return null;
}

/**
 * True when the consent gate must be shown — the user has not yet accepted the
 * current terms version. A non-finite value (NaN / Infinity / non-number from a
 * corrupt or legacy payload) is treated as "not accepted" so a bad value
 * re-shows the gate rather than slipping past `<` comparison.
 */
export function needsConsent(acceptedVersion: number): boolean {
  return !Number.isFinite(acceptedVersion) || acceptedVersion < CURRENT_TERMS_VERSION;
}
