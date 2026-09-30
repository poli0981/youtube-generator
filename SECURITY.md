# Security Policy

## Supported Versions

Only the latest released version of YTDescGen receives security updates, and the web app at https://ytgenerator.stream always runs the latest `main`. This is a solo open-source project; there are no LTS branches.

| Version | Supported |
| ------- | --------- |
| 1.0.x   | ✅ |
| < 1.0   | ❌ |

## Reporting a Vulnerability

Please report security issues **privately**. Do not open a public issue.

**Preferred channels (in order):**

1. **GitHub Security Advisory** — [open a draft advisory](https://github.com/poli0981/youtube-generator/security/advisories/new) in this repository.
2. **Email** — **security@poli0981.dev** with the subject prefix `[SECURITY]`.

The same contacts are published in [`/.well-known/security.txt`](https://ytgenerator.stream/.well-known/security.txt) (RFC 9116).

Include:

- A description of the issue and its potential impact.
- Steps to reproduce, ideally a minimal proof-of-concept.
- The affected version (About page, or `node -p "require('./package.json').version"`) or URL.
- Whether the issue is already public.

## Response Timeline

- **Initial reply**: within 7 days.
- **Triage + planned fix**: within 30 days for high-severity issues.
- **Disclosure**: coordinated with the reporter after a fix ships, or at most 90 days from initial reply.

## Scope

In scope:

- The web app at `ytgenerator.stream`, including its Cloudflare Worker (`worker/`): the Turnstile gate, its cookies, and the security headers.
- The desktop binaries (Windows, macOS, Linux) and the Android APK published on the GitHub releases page, including the Tauri commands in `src-tauri/`.
- CI/CD workflows in `.github/workflows/`.

Out of scope:

- Vulnerabilities in third-party dependencies — report those upstream and we'll bump.
- Cloudflare's own platform (Turnstile, Workers, the CDN) — report to [Cloudflare](https://www.cloudflare.com/disclosure/).
- Volumetric denial-of-service, rate-limit or spam findings, and automated scanner output without a demonstrated impact.
- Issues requiring physical access to the user's device, or a malicious browser extension.
- Self-XSS in user-supplied template content (the app deliberately renders user input as plain text in the preview).

## Safe Harbour

Good-faith research that follows this policy — no data destruction, no privacy violations of other users, no service degradation, and private reporting — will not be pursued.

## No Bounty

This is a solo open-source project. Credit in release notes and a thank-you in `MAINTAINERS.md` is the only reward we can offer.
