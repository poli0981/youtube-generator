const DOC_BASE = "https://github.com/poli0981/youtube-generator/blob/main";

export interface LegalDoc {
  readonly id: "terms" | "privacy" | "disclaimer" | "license";
  /** i18n key under the `consentGate` ui section. */
  readonly labelKey: string;
  /** Absolute GitHub blob URL — opens in the system browser via target="_blank". */
  readonly url: string;
}

/**
 * The legal-terms version the user must accept. Bump this whenever the
 * Terms / Privacy / Disclaimer change materially — every user whose stored
 * `legalConsentVersion` is below this re-sees the first-run consent gate.
 *
 * v0.28.0 ships the first gate at version 1 (docs dated 2026-05-14).
 */
export const CURRENT_TERMS_VERSION = 1;

/**
 * The documents surfaced on the consent gate and the About → Legal section.
 * Stored at the repo root and served from GitHub so they are always current;
 * the in-app links open them in the browser (Tauri routes target="_blank" to
 * the system browser). Order = display order.
 */
export const LEGAL_DOCS: readonly LegalDoc[] = [
  { id: "terms", labelKey: "consentGate.docTerms", url: `${DOC_BASE}/TERMS.md` },
  { id: "privacy", labelKey: "consentGate.docPrivacy", url: `${DOC_BASE}/PRIVACY.md` },
  { id: "disclaimer", labelKey: "consentGate.docDisclaimer", url: `${DOC_BASE}/DISCLAIMER.md` },
  { id: "license", labelKey: "consentGate.docLicense", url: `${DOC_BASE}/LICENSE` },
];

/**
 * True when the consent gate must be shown — the user has not yet accepted the
 * current terms version. A non-finite value (NaN / Infinity / non-number from a
 * corrupt or legacy payload) is treated as "not accepted" so a bad value
 * re-shows the gate rather than slipping past `<` comparison.
 */
export function needsConsent(acceptedVersion: number): boolean {
  return !Number.isFinite(acceptedVersion) || acceptedVersion < CURRENT_TERMS_VERSION;
}
