# Hosting — ytgenerator.stream

How the web app is built, deployed and protected. The desktop and Android apps don't use any of this.

## Overview

| Piece                 | Where                                                                                                                                                                                                                    |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Domain                | `ytgenerator.stream`, on Cloudflare (DNS, TLS, HSTS preload at the zone edge)                                                                                                                                            |
| Hosting               | Cloudflare Worker **`youtube-generator`** with static assets from `dist/`                                                                                                                                                |
| Build & deploy        | **Workers Builds**, connected to this repository in the Cloudflare dashboard. Every push to `main` builds and deploys to production; other branches get preview versions. There is **no GitHub Actions deploy workflow** |
| Configuration         | [`wrangler.jsonc`](../wrangler.jsonc) — the only Cloudflare file in the repo                                                                                                                                             |
| Worker code           | [`worker/`](../worker) — the Turnstile gate, the legal pages route, security headers                                                                                                                                     |
| Build-time web extras | [`build-plugins/web-only.ts`](../build-plugins/web-only.ts) (Web Analytics beacon, `security.txt`) and [`build-plugins/legal-docs.ts`](../build-plugins/legal-docs.ts) (legal pages)                                     |

GitHub Pages (`poli0981.github.io/youtube-generator`) is retired. Until 2026-11-29 it serves only a moving notice from [`migration-page/`](../migration-page), published by hand with the `pages-migration.yml` workflow; issue #177 tracks removing it.

## Request flow

`wrangler.jsonc` sends every request **through the Worker first**, except content-hashed build output (`/assets/*`) and the public files that browsers, crawlers and the manifest fetch without cookies (icons, `favicon`, `robots.txt`, `sitemap.xml`, `manifest.webmanifest`, `/.well-known/*`, `/licenses/*`, `theme-init.js`, `404.html`). Those are served straight from the assets with the headers in [`public/_headers`](../public/_headers).

The Worker ([`worker/router.ts`](../worker/router.ts)):

| Path                     | Response                                                                                                                                                                |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `POST /__gate/verify`    | Verifies a Turnstile token server-side with `TURNSTILE_SECRET` (success, hostname, `action === "enter"`, age ≤ 300 s), then sets the gate cookie and the terms cookie   |
| `GET /__gate/status`     | `204` when the gate cookie is valid — lets the gate page detect a browser that refuses cookies instead of looping                                                       |
| `/legal`, `/legal/<doc>` | The prerendered legal pages — always public, so the Terms and Privacy Policy can be read before agreeing (`?lang=vi` for the Vietnamese pages that exist)               |
| anything else            | Gate cookie valid → the file, or the app shell for routes (fetched as `/`, so deep links survive); otherwise → the gate page for documents and `403` for other requests |

`not_found_handling` is `404-page`, **not** the SPA fallback: with the SPA fallback, any path excluded from the Worker would be answered with `index.html` without passing the gate.

### Cookies

| Cookie            | Set by           | Purpose                                                                                                                                                                   |
| ----------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `__Host-ytg_gate` | `/__gate/verify` | `v1.<expiry>.<UA hash>.<HMAC>` — HttpOnly, Secure, SameSite=Lax, 24 h (`GATE_TTL_SECONDS`). The HMAC key is derived from `TURNSTILE_SECRET`, so there is no second secret |
| `ytg_terms`       | `/__gate/verify` | The terms version the visitor agreed to on the gate page; the app reads it so a web visitor sees one blocking screen, not two                                             |

If `TURNSTILE_SECRET` is missing the gate **fails open** (the site stays up and the Worker logs an error) rather than locking everyone out.

### Headers

`_headers` does not apply to responses the Worker creates, so [`worker/headers.ts`](../worker/headers.ts) sets them itself: a CSP per page type (the app shell allows the Web Analytics beacon; the gate page uses a nonce + `strict-dynamic`; legal pages allow no script at all), `nosniff`, `Referrer-Policy`, `Permissions-Policy`, `Cross-Origin-Opener-Policy`, `Cross-Origin-Resource-Policy` and `X-Frame-Options`. A test keeps the Worker baseline and `_headers` identical. **HSTS is not repeated** — the zone edge already sends `max-age=31536000; includeSubDomains; preload`.

### Web-only build extras

- **Cloudflare Web Analytics**: the beacon snippet is injected into `index.html` only for the web build — never in `npm run dev` or the Tauri builds.
- **`/.well-known/security.txt`** (RFC 9116) is regenerated on every build, so `Expires` is always about six months ahead.
- **Legal pages** are rendered from the repository's Markdown at build time, to static `/legal/*.html` and to a lazy chunk for the in-app Legal Center.

## Rate limiting

Two layers, cheapest first. Both count per client IP — before the gate there is no other identity — so the limits are generous enough for several people behind one shared address (mobile carrier NAT, an office, a school).

| Layer                         | Configured in                                                                                       | Counts                                                                                                                               | Limit      | Over the limit                                                                                                           |
| ----------------------------- | --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ---------- | ------------------------------------------------------------------------------------------------------------------------ |
| 1. WAF rate limiting rule     | Cloudflare dashboard, [by hand](#waf-rate-limiting-rule-one-time)                                   | Every request at the edge except `/assets/*`, per IP; verified bots (search engines) excluded                                        | 60 / 10 s  | Cloudflare's own `429` page (error 1015) for 10 s. The Worker never runs, so a blocked flood costs nothing               |
| 2. Worker `RATE_LIMIT`        | `wrangler.jsonc` › `ratelimits`, checked first in [`worker/rate-limit.ts`](../worker/rate-limit.ts) | Every request the Worker handles — the gate page, the app shell, legal pages, `/__gate/*`, any method — per IPv4 address or IPv6 /64 | 120 / 60 s | `429` plain text, `Retry-After: 60`, `Cache-Control: no-store`, the baseline headers; nothing else runs                  |
| 2. Worker `VERIFY_RATE_LIMIT` | `wrangler.jsonc` › `ratelimits`                                                                     | `POST /__gate/verify`, on top of `RATE_LIMIT`                                                                                        | 10 / 60 s  | `429` JSON `{"ok":false,"error":"rate-limited"}` before any siteverify call; the gate page shows its "try again" message |

- **Approximate, per location.** The Workers Rate Limiting API keeps its counters per Cloudflare location and updates them asynchronously, so a burst can pass the limit by a little. It turns a flood from one client into cheap `429`s; it is not a quota. Many addresses at once (a botnet) are the job of the WAF, Bot Fight Mode and the Turnstile gate itself.
- **IPv6 by /64.** One connection usually holds a whole /64, so counting single addresses would let a client rotate past the limit.
- **Fails open**, like the gate: a missing binding or a failing `limit()` call lets the request through and logs once per isolate.
- **Not counted by the Worker**: `/assets/*` and the public files that skip the Worker (see [Request flow](#request-flow)). Static-asset requests are free and are not Worker invocations; only the WAF rule sees them.
- **Changing a limit**: edit `limit` in `wrangler.jsonc` and merge. `period` may only be 10 or 60 and must equal `RATE_LIMIT_PERIOD_SECONDS` in [`worker/env.ts`](../worker/env.ts) (it is the `Retry-After`); `namespace_id` must be unique in the Cloudflare account, and changing it starts the counters from zero. `tests/worker/rate-limit.test.ts` checks the bindings against the code.
- **Seeing it work**: the bindings don't appear in the dashboard. The Worker's `429`s are in its logs (Observability); the WAF's blocks are under Security › Events.

### WAF rate limiting rule (one-time)

The zone is on the Free plan, which allows **one** rate limiting rule: counted by IP, over 10 seconds, blocking for 10 seconds, with Cloudflare's default response (a custom response needs Pro). It runs at the edge before the Worker, so it is the first layer.

1. Cloudflare dashboard › `ytgenerator.stream` › **Security** › **Security rules** › **Create rule** › **Rate limiting rules**.
2. **Rule name**: `Flood guard`.
3. **If incoming requests match** › **Edit expression**:

   ```txt
   (not http.request.uri.path contains "/assets/" and not cf.bot_management.verified_bot)
   ```

   In the builder that is _URI Path_ · _does not contain_ · `/assets/` **And** _Verified Bot_ · _equals_ · Off. Content-hashed build output is left out because a first visit fetches dozens of those files at once and a returning browser caches them for a year; verified bots so that search engines are never blocked.

4. **With the same characteristics**: IP (the only choice on Free).
5. **When rate exceeds**: **Requests** `60`, **Period** 10 seconds. A page load is about five counted requests (the page, `theme-init.js`, favicon, manifest, an icon), so 60 is a dozen reloads in ten seconds.
6. **Then take action**: **Block**; **Duration** 10 seconds.
7. **Deploy**.

If the dashboard refuses the expression, match all incoming requests instead and raise **Requests** to `100` — a first visit with an empty cache is about 40 requests once the build output counts (measured on the v1.3.2 build: the page, `theme-init.js` and 33 files under `/assets/`, plus favicon and manifest).

## Configuration and secrets

| Name                              | Kind                | Where                                                                                                                           |
| --------------------------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `TURNSTILE_SITE_KEY`              | public var          | `wrangler.jsonc`                                                                                                                |
| `GATE_TTL_SECONDS`                | public var          | `wrangler.jsonc`                                                                                                                |
| `TURNSTILE_SECRET`                | **Secret**          | Cloudflare dashboard (Worker › Settings › Variables and Secrets) or `npx wrangler secret put TURNSTILE_SECRET`. Never committed |
| `RATE_LIMIT`, `VERIFY_RATE_LIMIT` | rate limit bindings | `wrangler.jsonc` › `ratelimits` (see [Rate limiting](#rate-limiting))                                                           |

It must be a **Secret**, not a plain-text variable: `wrangler deploy` removes plain-text variables that `wrangler.jsonc` doesn't declare, and keeps secrets.

The custom domain is declared in `routes` because `wrangler deploy` detaches any custom domain that isn't listed.

## Dashboard settings (one-time)

These live in Cloudflare, not in the repository:

1. **Workers Builds** — build command empty (`wrangler.jsonc` runs `npm run build`), deploy command `npx wrangler deploy`, non-production deploy command `npx wrangler versions upload`. Root directory `/`; Node 26 comes from `.node-version`, and the build variable `NODE_VERSION=26` says the same.
2. **Turnstile widget** — hostname `ytgenerator.stream` (add the `workers.dev` subdomain if preview URLs should pass the gate).
3. **Web Analytics** — the manual beacon is used; turn off _automatic setup_ for the hostname so visits aren't counted twice.
4. **Redirect rule** — `www.ytgenerator.stream/*` → `concat("https://ytgenerator.stream", http.request.uri.path)`, 301, preserving the query string.
5. **HSTS** — enabled at the zone with `includeSubDomains` and `preload`.
6. **WAF rate limiting rule** — `Flood guard`, 60 requests per 10 s per IP outside `/assets/`; see [WAF rate limiting rule](#waf-rate-limiting-rule-one-time).

## Local development

```bash
cp .dev.vars.example .dev.vars   # Cloudflare's public Turnstile TEST keys only
npm run build
npm run cf:dev                   # wrangler dev: the Worker + dist/ on http://localhost:8787
npm run cf:check                 # wrangler deploy --dry-run: validates config and bundles the Worker
```

The test keys always pass. Never put the real secret in a file. Worker tests run with the rest (`npm run test:run`, `tests/worker/`).

## Releases, previews and rollback

- A merge to `main` is a production deploy. CI's required `check` job already ran `npm run build` and `npm run cf:check` on the pull request.
- Branch builds upload a **preview version** (`preview_urls: true`); preview URLs pass the gate only if their hostname is allowed in the Turnstile widget.
- **Rollback**: Cloudflare dashboard › the Worker › Deployments › pick an earlier version, or `npx wrangler rollback`. Rolling back the Worker also rolls back its assets.
- Each deploy posts a **Workers Builds** check run on the merge commit in GitHub; open its details link for the build log.

## Checking production

```bash
curl -sI https://ytgenerator.stream/                        # gate page (no cookie) with the gate CSP
curl -sI https://ytgenerator.stream/assets/<hash>.js        # immutable caching
curl -s  https://ytgenerator.stream/.well-known/security.txt
curl -sI https://ytgenerator.stream/legal/privacy           # public, script-free CSP
curl -sI https://www.ytgenerator.stream/x?y=1               # 301 to https://ytgenerator.stream/x?y=1
```

Rate limits: a burst from one address should turn into `429`s. This locks that address out of the site for up to a minute.

```bash
# Worker layer: about 120 × 200, then 429 with Retry-After: 60
for i in $(seq 1 130); do curl -s -o /dev/null -w "%{http_code}\n" https://ytgenerator.stream/; done | sort | uniq -c
# verify: 403 (foreign Origin) ten times, then 429 — no siteverify call is made
for i in $(seq 1 12); do curl -s -o /dev/null -w "%{http_code}\n" -X POST -H "Origin: https://example.com" -H "Content-Type: application/json" -d "{}" https://ytgenerator.stream/__gate/verify; done | sort | uniq -c
```

With the WAF rule in place, a fast enough burst (more than 60 in 10 s) is stopped at the edge first: Cloudflare's `429` (error 1015) instead of the Worker's.
