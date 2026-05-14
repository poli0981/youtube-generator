# Security Policy

## Supported Versions

Only the latest released version of YTDescGen receives security updates. This is a solo open-source project; there are no LTS branches.

| Version | Supported |
| ------- | --------- |
| 0.13.x  | ✅ |
| < 0.13  | ❌ |

## Reporting a Vulnerability

Please report security issues **privately**. Do not open a public issue.

**Preferred channels (in order):**

1. **GitHub Security Advisory** — open a draft advisory in this repository's `Security` tab.
2. **Email** — `lopop05905@proton.me` with subject prefix `[SECURITY]`.

Include:

- A description of the issue and its potential impact.
- Steps to reproduce, ideally a minimal proof-of-concept.
- The affected version (`node -p "require('./package.json').version"`).
- Whether the issue is already public.

## Response Timeline

- **Initial reply**: within 7 days.
- **Triage + planned fix**: within 30 days for high-severity issues.
- **Disclosure**: coordinated with the reporter after a fix ships, or at most 90 days from initial reply.

## Scope

In scope:

- The web bundle deployed to GitHub Pages.
- The Tauri desktop binaries (Windows, macOS, Linux).
- CI/CD workflows in `.github/workflows/`.

Out of scope:

- Vulnerabilities in third-party dependencies — report those upstream and we'll bump.
- Issues requiring physical access to the user's device.
- Self-XSS in user-supplied template content (the app deliberately renders user input as plain text in the preview).

## No Bounty

This is a solo open-source project. Credit in release notes and a thank-you in `MAINTAINERS.md` is the only reward we can offer.
