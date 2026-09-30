# 🎮 YTDescGen

**YouTube Gameplay Description Generator** — a template engine for Gameplay No Commentary YouTube channels.

**Use it at [ytgenerator.stream](https://ytgenerator.stream)**, or install the desktop app (Windows / macOS / Linux, 2–5 MB installers) or the Android app from [Releases](https://github.com/poli0981/youtube-generator/releases). One codebase: React + Tauri 2.

Generate YouTube titles, descriptions and tags in eight languages. Save your channel as a profile and each game as a preset, and every new video is a few clicks.

[![License](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](./LICENSE)
[![Node](https://img.shields.io/badge/node-%E2%89%A522-brightgreen)](./docs/DEVELOPMENT.md)
[![Latest release](https://img.shields.io/github/v/release/poli0981/youtube-generator?include_prereleases)](https://github.com/poli0981/youtube-generator/releases)
[![Last commit](https://img.shields.io/github/last-commit/poli0981/youtube-generator)](https://github.com/poli0981/youtube-generator/commits)

> **Moved from GitHub Pages?** Data saved at the old `poli0981.github.io/youtube-generator` address stays in that browser. Open the old address once — it offers your data as a backup file — then restore it in **Settings › Backup & restore**. Details: [Moving from GitHub Pages](https://github.com/poli0981/youtube-generator/wiki/Moving-from-GitHub-Pages).

---

## What is YTDescGen

YTDescGen does **one** job: turn a small set of structured fields (video type, game, genres, rig, social links, content warnings, …) into a publish-ready YouTube title, description and tag set.

It doesn't talk to the YouTube API and has no account. Your work — profiles, presets, templates, history, drafts — stays on your device. See [Privacy](#privacy).

Built for the gameplay no-commentary niche — especially horror / scary games — by someone running the [@SkullMute](https://www.youtube.com/@SkullMute) channel who got tired of pasting the same boilerplate into every video. Released under Apache 2.0 in case it's useful to anyone else.

## Features

- **20 video types** — Full Gameplay, Part, Boss Fight, Boss No-Hit, Ending, Speedrun, 100%, DLC, NG+, Challenge, Side Quest, Secret, Comparison, Guide, Mods, Collectibles, Livestream, Gacha Quest, Demo, Demo Part.
- **8 languages** — English, Vietnamese, Japanese, Spanish, Korean, Chinese, Portuguese (Brazil), Indonesian — for the interface and the generated text. _(Vietnamese is native-reviewed; the others are AI-translated — see [DISCLAIMER.md](./DISCLAIMER.md).)_
- **40+ genres** and **248 content warnings** in 12 groups, so viewers know what to expect before they press play.
- **Quick start** — pick your channel profile and the game's preset at the top of the editor; **Next part**, **New video, same game** and **Start over** clear exactly what belonged to the last video.
- **Paste a store link anywhere** — it lands in the right store field and names the game (Steam, Epic, GOG, PlayStation, Xbox, Nintendo, itch.io, Humble, EA app, Ubisoft, Battle.net, Google Play, App Store, Meta Quest, Amazon Luna).
- **Live preview** beside the form and a **YouTube preview** (where search results cut the title, what shows above "…more").
- **Tags counted the way YouTube counts them**, **chapter check** for timestamps, and per-field character limits (title 100, description 5000, tags 500) — only the field that is over can't be copied.
- **Correct hardware names** — "NVIDIA GeForce RTX 5080", "AMD Radeon RX 9070 XT", "Apple M4 Pro" — from a searchable GPU picker.
- **Backup & restore** — one file with everything, a preview of what's new or different before anything changes, merge or replace, and Undo. The desktop app also keeps automatic backups.
- **Batch mode** — every part of a series in one pass, in several languages.
- **Cross-post captions** — TikTok, YouTube Shorts, Instagram Reels, Facebook Reels, X, Threads and Bluesky, each within its own limit.
- **Command palette** (Ctrl/⌘ + K) and keyboard shortcuts.
- **Guardrails** — length caps on every field and an opt-in **Strict Mode** that blocks copy and export while a field has an error.
- **Desktop app** — Windows, macOS & Linux via Tauri; **Android app** — Android 11+, sideloaded from [Releases](https://github.com/poli0981/youtube-generator/releases).

## Quick Start

Use the web app: **<https://ytgenerator.stream>** — a quick bot check runs on your first visit each day.

Build it yourself:

```bash
git clone https://github.com/poli0981/youtube-generator.git
cd youtube-generator
npm install
npm run dev        # web dev server at http://localhost:5173
```

Desktop build (Windows / macOS / Linux):

```bash
npm run tauri:build
# Output: src-tauri/target/release/bundle/{msi,nsis,deb,rpm,appimage,dmg,app}
```

Android build (`.apk`) — requires the Android SDK + NDK + a JDK:

```bash
cargo tauri android init          # one-time; generates src-tauri/gen/android
cargo tauri android build --apk
# Output: src-tauri/gen/android/app/build/outputs/apk/universal/release/
```

See [`docs/PACKAGING.md`](./docs/PACKAGING.md#android-apk-packaging) for the SDK/NDK setup and signing, [`docs/DEVELOPMENT.md`](./docs/DEVELOPMENT.md) for the full toolchain (Vietnamese: [`docs/i18n/vi/DEVELOPMENT.md`](./docs/i18n/vi/DEVELOPMENT.md)), and [`docs/HOSTING.md`](./docs/HOSTING.md) for how the web app is hosted.

## Use Cases

- **Gameplay no-commentary channels** — the primary target. Default templates assume no voice-over and lean on visual hooks, music attribution and timestamps.
- **Horror / scary-game channels** — the content-warning system is especially deep here (analog horror, liminal spaces, pursuit / chase, entity / SCP-style, body horror, …).
- **Demo / Early Access playthroughs** — dedicated video types and language-patch / game-version disclosure fields.
- **Speedrunners and 100% completionists** — playstyle disclosures, run-type metadata and difficulty fields.
- **Solo creators tired of copy-paste** — profiles, presets and templates exist to eliminate repetitive data entry.

## Privacy

- **Your work stays on your device**: the browser's storage for `ytgenerator.stream`, or the app's own folders on desktop and Android. No account, no YouTube access, nothing sold or shared.
- **The web app** is delivered by **Cloudflare**, which runs a **Turnstile** bot check once a day and provides **cookieless** visit statistics (Web Analytics). Two first-party cookies remember the check and the terms you accepted.
- **The desktop and Android apps** have no analytics, no bot check and no telemetry.

Full details: [PRIVACY.md](./PRIVACY.md), also at [ytgenerator.stream/legal/privacy](https://ytgenerator.stream/legal/privacy).

## Tech Stack

React 19 · TypeScript (strict) · Vite 8 · Tailwind CSS 4 · Radix · Motion · Zustand 5 · i18next · Tauri 2 (Rust) · Cloudflare Workers.

Architecture overview: [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md).

## Documentation

| Document                                                       | What's in it                                                                                                                                                                    |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **[Wiki](https://github.com/poli0981/youtube-generator/wiki)** | **User documentation** — quick start, backup & restore, every field and its limit, shortcuts, troubleshooting, FAQ. Start here if you're using the app rather than building it. |
| [Development Guide](./docs/DEVELOPMENT.md)                     | Toolchain, IDE setup, build commands, troubleshooting. _(Also: [Vietnamese](./docs/i18n/vi/DEVELOPMENT.md).)_                                                                   |
| [Hosting](./docs/HOSTING.md)                                   | How ytgenerator.stream is built, deployed and protected.                                                                                                                        |
| [Architecture](./docs/ARCHITECTURE.md)                         | Layer model, data flow, engine design.                                                                                                                                          |
| [Features](./docs/FEATURES.md)                                 | Full feature matrix.                                                                                                                                                            |
| [Content Inventory](./docs/CONTENT-INVENTORY.md)               | Every video type, genre and content warning the editor surfaces. _(Also: [Vietnamese](./docs/i18n/vi/CONTENT-INVENTORY.md).)_                                                   |
| [Roadmap](./docs/ROADMAP.md)                                   | What shipped and what's next.                                                                                                                                                   |
| [Tech Spec](./docs/TECH-SPEC.md)                               | Implementation details and configs.                                                                                                                                             |
| [i18n Guide](./docs/I18N.md)                                   | Adding new locales.                                                                                                                                                             |
| [Packaging](./docs/PACKAGING.md)                               | Tauri desktop + Android release builds and signing.                                                                                                                             |
| [Contributing](./CONTRIBUTING.md)                              | PR process, commit conventions, required checks.                                                                                                                                |
| [Security](./SECURITY.md)                                      | Reporting vulnerabilities.                                                                                                                                                      |
| [Privacy](./PRIVACY.md)                                        | What is stored where, and what Cloudflare processes.                                                                                                                            |
| [Terms of Use](./TERMS.md)                                     | Acceptable use, license compliance, DMCA.                                                                                                                                       |
| [Disclaimer](./DISCLAIMER.md)                                  | AI-assistance and translation-quality disclosure. _(Also: [Vietnamese](./docs/i18n/vi/DISCLAIMER.md).)_                                                                         |
| [Code of Conduct](./CODE_OF_CONDUCT.md)                        | Contributor Covenant v2.1.                                                                                                                                                      |
| [Maintainers](./MAINTAINERS.md)                                | Who runs this.                                                                                                                                                                  |
| [Third-Party Notices](./THIRD_PARTY_NOTICES.md)                | Dependency attribution.                                                                                                                                                         |
| [Changelog](./CHANGELOG.md)                                    | Per-release notes.                                                                                                                                                              |

## Contributing

PRs welcome — read [CONTRIBUTING.md](./CONTRIBUTING.md) first. Native-speaker corrections to the AI-translated locales (JA / ES / KO / ZH / PT-BR / ID) are especially appreciated.

## License

Licensed under the **[Apache License 2.0](./LICENSE)**. See [`NOTICE`](./NOTICE) for the copyright statement and [`THIRD_PARTY_NOTICES.md`](./THIRD_PARTY_NOTICES.md) for dependency licenses.

## AI Disclosure

This project was co-authored with **Anthropic's Claude Code** (Claude Opus models; most recently Claude Opus 5.5). Source code, locale translations, documentation and CI workflows were generated or edited with AI assistance, then reviewed by the human maintainer (`@poli0981`) before being merged. See [DISCLAIMER.md](./DISCLAIMER.md) for the full disclosure.

## Contact

| For                          | Where                                                                                                                                                  |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Anything general             | `contact@poli0981.dev`                                                                                                                                 |
| Security vulnerabilities     | [GitHub advisory](https://github.com/poli0981/youtube-generator/security/advisories/new) or `security@poli0981.dev` — see [SECURITY.md](./SECURITY.md) |
| Privacy and data requests    | `privacy@poli0981.dev`                                                                                                                                 |
| Terms, legal                 | `legal@poli0981.dev`                                                                                                                                   |
| Copyright / DMCA notices     | `dmca@poli0981.dev`                                                                                                                                    |
| Licensing and attribution    | `copyright@poli0981.dev`                                                                                                                               |
| Code, contributions, conduct | `code@poli0981.dev`                                                                                                                                    |
| Sponsorship                  | `sponsor@poli0981.dev`                                                                                                                                 |

Maintainer: [poli0981.dev](https://poli0981.dev/) · every channel at [poli0981.dev/links](https://poli0981.dev/links/).

## Channel & Socials

- **YouTube**: [@SkullMute](https://www.youtube.com/@SkullMute)
- **X**: [@SkullMute0011](https://x.com/SkullMute0011)
- **Bluesky**: [skullmute0011.bsky.social](https://bsky.app/profile/skullmute0011.bsky.social)
- **Mastodon**: [@skullmute1122@mastodon.social](https://mastodon.social/@skullmute1122)
- **Discord**: [join](https://discord.gg/kDM9GMu5vm)
- **Steam**: [profile](https://steamcommunity.com/profiles/76561199544666292/)
- **Patreon / Ko-fi**: `skullmute`
- **Telegram**: `@SkullMute0011` (bot: `@my_skull_bot`)
