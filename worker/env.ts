/**
 * Bindings and constants for the Cloudflare Worker that fronts
 * https://ytgenerator.stream.
 *
 * The Worker only uses standard Web APIs (fetch, Request, Response, Web
 * Crypto), so it type-checks against the DOM lib and runs unchanged under
 * Vitest in Node. The static-assets binding is described structurally rather
 * than through `@cloudflare/workers-types`.
 */

/** The `ASSETS` binding from `wrangler.jsonc` — serves files out of `dist/`. */
export interface AssetsBinding {
  fetch(request: Request): Promise<Response>;
}

export interface Env {
  ASSETS: AssetsBinding;
  /** Public Turnstile sitekey (`vars` in wrangler.jsonc). */
  TURNSTILE_SITE_KEY: string;
  /** Turnstile secret — a dashboard Secret, never committed. */
  TURNSTILE_SECRET: string;
  /** How long a passed check lasts, in seconds (string, from `vars`). */
  GATE_TTL_SECONDS?: string;
}

/** Everything the router needs from the outside world, injectable in tests. */
export interface Deps {
  /** Current time in milliseconds since the epoch. */
  now(): number;
  fetch: typeof fetch;
  /** A fresh random string: CSP nonces and siteverify idempotency keys. */
  randomId(): string;
}

export const GATE_COOKIE = "__Host-ytg_gate";
export const VERIFY_PATH = "/__gate/verify";
/** 204 when the request carries a valid gate cookie — lets the gate page
 *  detect a browser that silently refused to store it. */
export const STATUS_PATH = "/__gate/status";
export const TURNSTILE_ACTION = "enter";
export const SITEVERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

/** Turnstile tokens are valid for 300 s; anything older is refused. */
export const MAX_TOKEN_AGE_SECONDS = 300;

const DEFAULT_GATE_TTL_SECONDS = 86_400;
const MIN_GATE_TTL_SECONDS = 300;
const MAX_GATE_TTL_SECONDS = 30 * 86_400;

/** The configured gate lifetime, clamped to [5 min, 30 days]. */
export function gateTtlSeconds(env: Env): number {
  const parsed = Number.parseInt(env.GATE_TTL_SECONDS ?? "", 10);
  if (!Number.isFinite(parsed)) return DEFAULT_GATE_TTL_SECONDS;
  return Math.min(MAX_GATE_TTL_SECONDS, Math.max(MIN_GATE_TTL_SECONDS, parsed));
}
