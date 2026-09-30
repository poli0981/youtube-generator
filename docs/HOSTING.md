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

## Configuration and secrets

| Name                 | Kind       | Where                                                                                                                           |
| -------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `TURNSTILE_SITE_KEY` | public var | `wrangler.jsonc`                                                                                                                |
| `GATE_TTL_SECONDS`   | public var | `wrangler.jsonc`                                                                                                                |
| `TURNSTILE_SECRET`   | **Secret** | Cloudflare dashboard (Worker › Settings › Variables and Secrets) or `npx wrangler secret put TURNSTILE_SECRET`. Never committed |

It must be a **Secret**, not a plain-text variable: `wrangler deploy` removes plain-text variables that `wrangler.jsonc` doesn't declare, and keeps secrets.

The custom domain is declared in `routes` because `wrangler deploy` detaches any custom domain that isn't listed.

## Dashboard settings (one-time)

These live in Cloudflare, not in the repository:

1. **Workers Builds** — build command empty (`wrangler.jsonc` runs `npm run build`), deploy command `npx wrangler deploy`, non-production deploy command `npx wrangler versions upload`. Root directory `/`; Node comes from `.node-version`.
2. **Turnstile widget** — hostname `ytgenerator.stream` (add the `workers.dev` subdomain if preview URLs should pass the gate).
3. **Web Analytics** — the manual beacon is used; turn off _automatic setup_ for the hostname so visits aren't counted twice.
4. **Redirect rule** — `www.ytgenerator.stream/*` → `concat("https://ytgenerator.stream", http.request.uri.path)`, 301, preserving the query string.
5. **HSTS** — enabled at the zone with `includeSubDomains` and `preload`.

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
