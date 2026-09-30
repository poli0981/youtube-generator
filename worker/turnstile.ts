import { MAX_TOKEN_AGE_SECONDS, SITEVERIFY_URL, TURNSTILE_ACTION } from "./env";

/** The subset of Turnstile's siteverify response the gate relies on. */
export interface SiteverifyResult {
  success: boolean;
  hostname?: string;
  action?: string;
  challengeTs?: string;
  errorCodes: string[];
  /** Cloudflare's dummy test secret answered (local `wrangler dev` only). */
  testing: boolean;
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
}

/** Narrow siteverify's JSON without trusting its shape. */
export function parseSiteverify(json: unknown): SiteverifyResult {
  if (typeof json !== "object" || json === null) {
    return { success: false, errorCodes: ["bad-response"], testing: false };
  }
  const record = json as Record<string, unknown>;
  const metadata =
    typeof record.metadata === "object" && record.metadata !== null
      ? (record.metadata as Record<string, unknown>)
      : {};
  return {
    success: record.success === true,
    hostname: typeof record.hostname === "string" ? record.hostname : undefined,
    action: typeof record.action === "string" ? record.action : undefined,
    challengeTs: typeof record.challenge_ts === "string" ? record.challenge_ts : undefined,
    errorCodes: asStringArray(record["error-codes"]),
    testing: metadata.result_with_testing_key === true,
  };
}

/**
 * Validate a Turnstile token server-side. Network and HTTP failures resolve to
 * `success: false` with an explanatory code rather than throwing, so the
 * caller has one path to handle.
 */
export async function siteverify(
  fetchImpl: typeof fetch,
  params: { secret: string; token: string; remoteIp: string | null; idempotencyKey: string },
): Promise<SiteverifyResult> {
  const body = new URLSearchParams({
    secret: params.secret,
    response: params.token,
    idempotency_key: params.idempotencyKey,
  });
  if (params.remoteIp) body.set("remoteip", params.remoteIp);
  try {
    const res = await fetchImpl(SITEVERIFY_URL, { method: "POST", body });
    if (!res.ok) return { success: false, errorCodes: [`http-${res.status}`], testing: false };
    return parseSiteverify(await res.json());
  } catch {
    return { success: false, errorCodes: ["network-error"], testing: false };
  }
}

export type VerdictReason =
  "not-success" | "hostname-mismatch" | "action-mismatch" | "token-too-old" | "missing-timestamp";

/**
 * The checks Cloudflare recommends on top of `success`: the token was minted
 * for this hostname and this action, and it is not older than its 300 s life.
 */
export function evaluateSiteverify(
  result: SiteverifyResult,
  expected: { hostname: string; nowMs: number },
): { ok: true } | { ok: false; reason: VerdictReason } {
  if (!result.success) return { ok: false, reason: "not-success" };
  // Cloudflare's published test secret (used by `npm run cf:dev`) answers for
  // "example.com" with no action. Only that secret can produce this flag, so a
  // production deployment with its real secret is never relaxed.
  if (!result.testing) {
    if (result.hostname !== expected.hostname) return { ok: false, reason: "hostname-mismatch" };
    if (result.action !== TURNSTILE_ACTION) return { ok: false, reason: "action-mismatch" };
  }
  const solvedAt = result.challengeTs ? Date.parse(result.challengeTs) : Number.NaN;
  if (!Number.isFinite(solvedAt)) return { ok: false, reason: "missing-timestamp" };
  if (expected.nowMs - solvedAt > MAX_TOKEN_AGE_SECONDS * 1000) {
    return { ok: false, reason: "token-too-old" };
  }
  return { ok: true };
}
