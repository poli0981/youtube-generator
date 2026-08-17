/**
 * Playtest platform catalogue (v0.30.0).
 *
 * Drives the editor's Playtest section: the creator picks ONE platform
 * their playtest signup lives on, pastes the link, and optionally records
 * how many invites they have to give away. Mirrors the {@link PlatformConfig}
 * shape from `@config/platforms` (id / label / urlPrefix / urlPattern) and
 * adds a per-platform `maxInvites`.
 *
 * Why per-platform caps: a playtest's invite budget varies by storefront
 * (Steam Playtest grants, itch.io download keys, Discord closed-beta seats…),
 * so the editor's invite-count input maxes out at the selected platform's
 * cap rather than one flat number. The absolute ceiling is
 * {@link PLAYTEST_MAX_INVITES_CAP} (100) — no platform may exceed it.
 *
 * The `maxInvites` numbers below are sensible starting points, NOT hard
 * facts — they're plain constants and meant to be tuned freely.
 */

/** Absolute hard cap on playtest invites, regardless of platform. */
export const PLAYTEST_MAX_INVITES_CAP = 100;

export interface PlaytestPlatformConfig {
  readonly id: string;
  readonly label: string;
  /** Shown as the link input's placeholder / hint. */
  readonly urlPrefix: string;
  /** Authoritative validator. Must match the entire trimmed URL. */
  readonly urlPattern: RegExp;
  /** Per-platform invite ceiling. Always ≤ {@link PLAYTEST_MAX_INVITES_CAP}. */
  readonly maxInvites: number;
}

export const PLAYTEST_PLATFORMS: readonly PlaytestPlatformConfig[] = [
  {
    id: "steam",
    label: "Steam Playtest",
    urlPrefix: "https://store.steampowered.com/app/",
    urlPattern: /^https:\/\/store\.steampowered\.com\/app\/\d+(?:\/[^\s]*)?$/i,
    maxInvites: 100,
  },
  {
    id: "epic",
    label: "Epic Games Store",
    urlPrefix: "https://store.epicgames.com/",
    urlPattern: /^https:\/\/store\.epicgames\.com\/[^\s]+$/i,
    maxInvites: 100,
  },
  {
    id: "itchio",
    label: "itch.io",
    urlPrefix: "https://<dev>.itch.io/<game>",
    urlPattern: /^https:\/\/[a-z0-9][a-z0-9-]*\.itch\.io\/[a-z0-9][a-z0-9_-]*\/?$/i,
    maxInvites: 50,
  },
  {
    id: "discord",
    label: "Discord / Community",
    urlPrefix: "https://discord.gg/",
    urlPattern: /^https:\/\/(?:discord\.gg|discord\.com\/invite)\/[^\s]+$/i,
    maxInvites: 100,
  },
  {
    // Catch-all for signup forms, publisher beta pages, Google Forms, etc.
    // Pattern is intentionally loose (any HTTPS URL with a host).
    id: "other",
    label: "Other / Signup form",
    urlPrefix: "https://",
    urlPattern: /^https:\/\/[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)+(?:\/[^\s]*)?$/i,
    maxInvites: 100,
  },
] as const;

/** Default platform id used by a fresh draft / migration back-fill. */
export const DEFAULT_PLAYTEST_PLATFORM = PLAYTEST_PLATFORMS[0]?.id ?? "steam";

/**
 * Invite ceiling for a platform id, capped at the absolute maximum.
 * Unknown ids (e.g. a hand-edited blob) fall back to the absolute cap.
 */
export function maxInvitesForPlatform(id: string): number {
  const found = PLAYTEST_PLATFORMS.find((p) => p.id === id);
  return Math.min(found?.maxInvites ?? PLAYTEST_MAX_INVITES_CAP, PLAYTEST_MAX_INVITES_CAP);
}
