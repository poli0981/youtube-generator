import { CURRENT_TERMS_VERSION, LEGAL_DOCS, TERMS_COOKIE, isLegalDocId } from "../src/config/legal";
import { deriveGateKey, readCookie, signGateToken, userAgentHash, verifyGateToken } from "./cookie";
import { GATE_COOKIE, STATUS_PATH, VERIFY_PATH, gateTtlSeconds, type Deps, type Env } from "./env";
import { renderGatePage } from "./gate-page";
import { pickGateLang } from "./gate-i18n";
import {
  APP_CSP,
  BASELINE_HEADERS,
  LEGAL_CSP,
  gateCsp,
  jsonResponse,
  plainResponse,
  withSecurityHeaders,
} from "./headers";
import { evaluateSiteverify, siteverify } from "./turnstile";

/**
 * Request routing for ytgenerator.stream.
 *
 * `wrangler.jsonc` sends everything except hashed build output and a handful
 * of public files (icons, robots, security.txt …) through here first:
 *
 *   /__gate/verify   POST: check a Turnstile token, set the gate cookie
 *   /__gate/status   204 if the gate cookie is valid (cookie-blocked check)
 *   /legal, /legal/* the prerendered legal pages — always public, so the
 *                    Terms and Privacy Policy can be read before agreeing
 *   everything else  gate cookie valid → the file or the SPA shell;
 *                    otherwise → the gate page (documents) or 403
 */

const MAX_VERIFY_BODY_BYTES = 8 * 1024;
const MAX_TOKEN_LENGTH = 2048;
const TERMS_COOKIE_MAX_AGE = 365 * 86_400;

let warnedMissingSecret = false;

function hasFileExtension(pathname: string): boolean {
  const last = pathname.slice(pathname.lastIndexOf("/") + 1);
  return /\.[A-Za-z0-9]{1,8}$/.test(last);
}

/** Would a browser render this response as a page? */
function isDocumentRequest(request: Request, url: URL): boolean {
  const dest = request.headers.get("Sec-Fetch-Dest");
  if (dest) return dest === "document" || dest === "iframe";
  return !hasFileExtension(url.pathname) || url.pathname.endsWith(".html");
}

async function hasValidGateCookie(request: Request, env: Env, nowMs: number): Promise<boolean> {
  const token = readCookie(request.headers.get("Cookie"), GATE_COOKIE);
  if (!token) return false;
  const key = await deriveGateKey(env.TURNSTILE_SECRET);
  const ua = await userAgentHash(request.headers.get("User-Agent") ?? "");
  return verifyGateToken(key, token, Math.floor(nowMs / 1000), ua);
}

function acceptedTerms(request: Request): boolean {
  const raw = readCookie(request.headers.get("Cookie"), TERMS_COOKIE);
  return raw !== null && /^\d{1,4}$/.test(raw) && Number(raw) >= CURRENT_TERMS_VERSION;
}

async function handleVerify(request: Request, env: Env, deps: Deps, url: URL): Promise<Response> {
  if (request.method !== "POST") {
    return plainResponse(405, "Method Not Allowed", { Allow: "POST" });
  }
  // Same-origin only: the page that asks for verification is ours.
  if (request.headers.get("Origin") !== url.origin) {
    return jsonResponse(403, { ok: false, error: "bad-origin" });
  }
  if (!(request.headers.get("Content-Type") ?? "").includes("application/json")) {
    return jsonResponse(415, { ok: false, error: "bad-content-type" });
  }
  const raw = await request.text();
  if (raw.length > MAX_VERIFY_BODY_BYTES) {
    return jsonResponse(413, { ok: false, error: "too-large" });
  }
  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return jsonResponse(400, { ok: false, error: "bad-json" });
  }
  const record = typeof body === "object" && body !== null ? (body as Record<string, unknown>) : {};
  const token = record.token;
  if (typeof token !== "string" || token.length === 0 || token.length > MAX_TOKEN_LENGTH) {
    return jsonResponse(400, { ok: false, error: "bad-token" });
  }
  // The gate page only posts once its "I agree" box is ticked (or the visitor
  // already agreed); the flag is what makes setting `ytg_terms` honest.
  if (record.consent !== true) {
    return jsonResponse(400, { ok: false, error: "consent-required" });
  }

  const nowMs = deps.now();
  const result = await siteverify(deps.fetch, {
    secret: env.TURNSTILE_SECRET,
    token,
    remoteIp: request.headers.get("CF-Connecting-IP"),
    idempotencyKey: deps.randomId(),
  });
  const verdict = evaluateSiteverify(result, { hostname: url.hostname, nowMs });
  if (!verdict.ok) {
    console.warn("gate: verification refused", verdict.reason, result.errorCodes.join(","));
    return jsonResponse(403, { ok: false, error: verdict.reason });
  }

  const ttl = gateTtlSeconds(env);
  const key = await deriveGateKey(env.TURNSTILE_SECRET);
  const ua = await userAgentHash(request.headers.get("User-Agent") ?? "");
  const gateToken = await signGateToken(key, Math.floor(nowMs / 1000) + ttl, ua);

  const headers = new Headers();
  headers.append(
    "Set-Cookie",
    `${GATE_COOKIE}=${gateToken}; Path=/; Max-Age=${ttl}; HttpOnly; Secure; SameSite=Lax`,
  );
  // Readable by the app on purpose (see TERMS_COOKIE in src/config/legal.ts).
  headers.append(
    "Set-Cookie",
    `${TERMS_COOKIE}=${CURRENT_TERMS_VERSION}; Path=/; Max-Age=${TERMS_COOKIE_MAX_AGE}; Secure; SameSite=Lax`,
  );
  return jsonResponse(200, { ok: true }, headers);
}

/**
 * `/legal` → the index page; `/legal/<id>` → that document (`?lang=vi` → its
 * Vietnamese page, when one exists); anything else under /legal → 404; null
 * when the path is not a legal path at all.
 */
export function legalAssetPath(url: URL): string | null {
  const trimmed = url.pathname.replace(/\/+$/, "");
  if (trimmed === "/legal") return "/legal/";
  if (!trimmed.startsWith("/legal/")) return null;
  const id = /^\/legal\/([a-z-]+)$/.exec(trimmed)?.[1];
  if (id === undefined || !isLegalDocId(id)) return "/legal/not-found";
  const hasVietnamese = LEGAL_DOCS.some((doc) => doc.id === id && doc.sourceVi);
  return url.searchParams.get("lang") === "vi" && hasVietnamese
    ? `/legal/${id}.vi`
    : `/legal/${id}`;
}

async function serveLegal(request: Request, env: Env, url: URL, assetPath: string) {
  const assetUrl = new URL(assetPath, url);
  const res = await env.ASSETS.fetch(new Request(assetUrl, { method: request.method }));
  return withSecurityHeaders(res, {
    csp: LEGAL_CSP,
    cacheControl: res.ok ? "public, max-age=300" : "no-store",
  });
}

async function serveAppShell(request: Request, env: Env, url: URL): Promise<Response> {
  // Fetch "/" — not "/index.html", which `html_handling` would answer with a
  // 307 back to "/", collapsing every deep link onto the home page.
  const shell = await env.ASSETS.fetch(
    new Request(new URL("/", url), { method: request.method, headers: request.headers }),
  );
  return withSecurityHeaders(shell, { csp: APP_CSP, cacheControl: "no-cache", varyCookie: true });
}

/** Pass a file through, adding the headers `_headers` would have added. */
async function serveFile(request: Request, env: Env): Promise<Response> {
  const res = await env.ASSETS.fetch(request);
  const headers = new Headers(res.headers);
  for (const [name, value] of Object.entries(BASELINE_HEADERS)) headers.set(name, value);
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
}

function serveGate(request: Request, env: Env, deps: Deps, url: URL): Response {
  const nonce = deps.randomId().replace(/[^A-Za-z0-9]/g, "");
  const html = renderGatePage({
    lang: pickGateLang(request.headers.get("Accept-Language")),
    nonce,
    siteKey: env.TURNSTILE_SITE_KEY,
    returning: acceptedTerms(request),
    origin: url.origin,
    hours: Math.round(gateTtlSeconds(env) / 3600),
  });
  const res = new Response(request.method === "HEAD" ? null : html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
  return withSecurityHeaders(res, {
    csp: gateCsp(nonce),
    cacheControl: "no-store",
    varyCookie: true,
  });
}

export async function handleRequest(request: Request, env: Env, deps: Deps): Promise<Response> {
  const url = new URL(request.url);

  if (url.pathname === VERIFY_PATH) {
    if (!env.TURNSTILE_SECRET) return jsonResponse(503, { ok: false, error: "not-configured" });
    return handleVerify(request, env, deps, url);
  }

  const method = request.method;
  if (method !== "GET" && method !== "HEAD") {
    return plainResponse(405, "Method Not Allowed", { Allow: "GET, HEAD" });
  }

  const legal = legalAssetPath(url);
  if (legal !== null) return serveLegal(request, env, url, legal);

  // A missing secret is a deployment mistake, not an attack: keep the site
  // reachable (the app still shows its own consent screen) and say so loudly
  // in the Worker logs instead of locking every visitor out.
  if (!env.TURNSTILE_SECRET) {
    if (!warnedMissingSecret) {
      console.error("gate: TURNSTILE_SECRET is not set — serving without the Turnstile gate");
      warnedMissingSecret = true;
    }
    return hasFileExtension(url.pathname)
      ? serveFile(request, env)
      : serveAppShell(request, env, url);
  }

  const passed = await hasValidGateCookie(request, env, deps.now());

  if (url.pathname === STATUS_PATH) {
    return new Response(null, {
      status: passed ? 204 : 401,
      headers: { "Cache-Control": "no-store", ...BASELINE_HEADERS },
    });
  }

  if (passed) {
    return hasFileExtension(url.pathname)
      ? serveFile(request, env)
      : serveAppShell(request, env, url);
  }

  if (!isDocumentRequest(request, url)) return plainResponse(403, "Forbidden");
  return serveGate(request, env, deps, url);
}
