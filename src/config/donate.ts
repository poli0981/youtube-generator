/**
 * Donate / support links surfaced on the About page and via the persistent
 * Donate button in the Header.
 *
 * Mirrors `.github/FUNDING.yml` so GitHub's "Sponsor this project" picker
 * and the in-app surface stay aligned. Update both files together.
 */
export const DONATE = {
  githubSponsors: "https://github.com/sponsors/poli0981",
  kofi: "https://ko-fi.com/skullmute",
  buyMeACoffee: "https://buymeacoffee.com/skullmute",
  patreon: "https://www.patreon.com/skullmute",
  paypal: "https://paypal.me/DungDang212",
} as const;

export type DonateId = keyof typeof DONATE;

/**
 * Single "primary" link the Header button points at. Ko-fi has no account
 * gate and lowest friction — change here to swap the Header default.
 */
export const PRIMARY_DONATE_URL = DONATE.kofi;
