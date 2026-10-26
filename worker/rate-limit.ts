import { RATE_LIMIT_PERIOD_SECONDS, type Env, type RateLimitBinding } from "./env";
import { jsonResponse, plainResponse } from "./headers";

/**
 * Per-client rate limiting with the Workers Rate Limiting API — the second
 * layer, behind the zone's WAF rate limiting rule (docs/HOSTING.md).
 *
 * The limits live in `wrangler.jsonc` (`ratelimits`). Cloudflare keeps the
 * counters per location and they are approximate: they turn a flood from one
 * client into cheap 429s before any siteverify call, HMAC check or asset
 * fetch; they are not a quota.
 */

const IPV4_MAPPED_PREFIX = "::ffff:";
const HEX_GROUP = /^[0-9a-f]{1,4}$/;

let warnedMissingBinding = false;
let warnedFailedLimit = false;

/** The first four groups of an IPv6 address, or null when it doesn't parse. */
function ipv6Prefix64(address: string): string[] | null {
  const halves = address.split("::");
  if (halves.length > 2) return null;
  const [before = "", after] = halves;
  const head = before === "" ? [] : before.split(":");
  const tail = after === undefined || after === "" ? [] : after.split(":");
  // A trailing dotted quad ("…:1.2.3.4") fills two groups.
  const width = head.length + tail.length + (address.includes(".") ? 1 : 0);
  const missing = 8 - width;
  if (after === undefined ? missing !== 0 : missing < 1) return null;
  const groups = [...head, ...Array<string>(missing).fill("0"), ...tail].slice(0, 4);
  if (!groups.every((group) => HEX_GROUP.test(group))) return null;
  return groups.map((group) => Number.parseInt(group, 16).toString(16));
}

/**
 * The counter key for a client (`CF-Connecting-IP`): an IPv4 address as is,
 * an IPv6 address as its /64 — one connection usually holds a whole /64, so
 * counting single addresses would let a client rotate past the limit.
 */
export function rateLimitKey(ip: string | null): string {
  const raw = (ip ?? "").trim().toLowerCase();
  if (raw === "") return "unknown";
  if (!raw.includes(":")) return raw;
  if (raw.startsWith(IPV4_MAPPED_PREFIX) && raw.includes(".")) {
    return raw.slice(IPV4_MAPPED_PREFIX.length);
  }
  const prefix = ipv6Prefix64(raw);
  return prefix === null ? raw : `${prefix.join(":")}::/64`;
}

/**
 * Has this client gone over the limit? Fails open — with no binding, or when
 * the call throws, the request goes through: a broken limiter must not take
 * the site down. Each problem is logged once per isolate, not per request.
 */
async function overLimit(binding: RateLimitBinding | undefined, key: string): Promise<boolean> {
  if (!binding) {
    if (!warnedMissingBinding) {
      console.warn("rate-limit: a ratelimits binding is missing — not limiting");
      warnedMissingBinding = true;
    }
    return false;
  }
  try {
    const { success } = await binding.limit({ key });
    return !success;
  } catch (err) {
    if (!warnedFailedLimit) {
      console.error("rate-limit: limit() failed — letting requests through", err);
      warnedFailedLimit = true;
    }
    return false;
  }
}

/**
 * Every request counts against `RATE_LIMIT`; a verify request also against
 * `VERIFY_RATE_LIMIT` (only while the first one still lets it through).
 */
export async function isRateLimited(
  request: Request,
  env: Env,
  isVerify: boolean,
): Promise<boolean> {
  const key = rateLimitKey(request.headers.get("CF-Connecting-IP"));
  if (await overLimit(env.RATE_LIMIT, key)) return true;
  return isVerify && (await overLimit(env.VERIFY_RATE_LIMIT, key));
}

/** The 429 itself: JSON for the gate page's verify call, plain text otherwise. */
export function tooManyRequests(isVerify: boolean): Response {
  const extra = { "Retry-After": String(RATE_LIMIT_PERIOD_SECONDS) };
  return isVerify
    ? jsonResponse(429, { ok: false, error: "rate-limited" }, extra)
    : plainResponse(429, "Too many requests. Wait a minute, then reload the page.", extra);
}
