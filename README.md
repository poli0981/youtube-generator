# 🎮 YTDescGen

**YouTube Gameplay Description Generator** — an offline-first template engine for Gameplay No Commentary YouTube channels.

Generate YouTube titles, descriptions, and tags in six languages with one click. Save channel, rig, and game presets to skip repetitive data entry. Works in the browser (GitHub Pages) or as a ~8 MB native desktop app (Tauri).

[![License](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](./LICENSE)
[![Node](https://img.shields.io/badge/node-%E2%89%A522-brightgreen)](./docs/DEVELOPMENT.md)
[![Latest release](https://img.shields.io/github/v/release/poli0981/youtube-generator?include_prereleases)](https://github.com/poli0981/youtube-generator/releases)
[![Last commit](https://img.shields.io/github/last-commit/poli0981/youtube-generator)](https://github.com/poli0981/youtube-generator/commits)

---

## What is YTDescGen

YTDescGen is a single-purpose template engine. It does **one** job: turn a small set of structured fields (video type, game name, genres, rig, social links, content warnings, …) into a publish-ready YouTube title + description + tag set.

It doesn't talk to the YouTube API. It doesn't upload anything. It doesn't track you. There is no server. State lives in your browser's `localStorage` (web) or your OS application-data directory (desktop) — and nowhere else.

Built for the gameplay no-commentary niche — especially horror / scary games — by someone running the [@SkullMute](https://www.youtube.com/@SkullMute) channel who got tired of pasting the same boilerplate into every video. Released under Apache 2.0 in case it's useful to anyone else.

## Features

- **20 video types** — Full Gameplay, Part, Boss Fight, Boss No-Hit, Ending, Speedrun, 100%, DLC, NG+, Challenge, Side Quest, Secret, Comparison, Guide, Mods, Collectibles, Livestream, Gacha Quest, Demo, Demo Part.
- **6 UI languages** — English, Vietnamese, Japanese, Spanish, Korean, Chinese. *(VI authored by a native speaker; JA / ES / KO / ZH AI-translated — see [DISCLAIMER.md](./DISCLAIMER.md).)*
- **40+ game genres** — across action, RPG, FPS, horror, soulslike, indie, simulation, fighting, and more.
- **187 content-warning IDs** across 9 groups — spoilers, photosensitive, phobias, mental health, social phenomena, sensitive themes (incl. method-specific death/violence), horror-specific, playstyle, and gameplay disclosure (mods / cheats / glitches / guide-assisted). Sets viewer expectations before they hit play.
- **Profile system** — save channel / social / rig info once, reuse across every video.
- **Game presets** — save game name + store links once, reuse across the entire part series.
- **Snapshot templates** — save full-form configurations and recall in one click.
- **Smart tag generation** — combines genre pool, platform, quality tier, multilingual hooks, and trending terms; auto-dedup and 500-char-limit aware.
- **Character counters** — real-time limits for title (100), description (5000), tags (500).
- **Batch mode** — generate metadata for all parts of a series in one pass.
- **Desktop app** — Windows & macOS native binaries via Tauri (~8 MB).
- **Mobile-responsive web** — drawer navigation, touch-sized controls, iOS-safe text-input behavior. Tested down to 360 × 640.
- **100% offline** — no server, no telemetry, no account. See [PRIVACY.md](./PRIVACY.md).

## Quick Start

```bash
git clone https://github.com/poli0981/youtube-generator.git
cd yt-desc-gen
npm install
npm run dev        # web dev server at http://localhost:5173
```

Desktop build (Windows / macOS / Linux):

```bash
npm run tauri:build
# Output: src-tauri/target/release/bundle/{msi,deb,dmg,app}
```

Full development setup, IDE config, and troubleshooting: see [`docs/DEVELOPMENT.md`](./docs/DEVELOPMENT.md). Vietnamese version: [`docs/i18n/vi/DEVELOPMENT.md`](./docs/i18n/vi/DEVELOPMENT.md).

## Use Cases

- **Gameplay no-commentary channels** — the primary target. Default templates assume no voice-over and lean on visual hooks, music attribution, and timestamps.
- **Horror / scary-game channels** — the content-warning system is especially deep here (analog horror, liminal spaces, pursuit / chase, entity / SCP-style, body horror, etc.).
- **Demo / Early Access playthroughs** — dedicated video types and language-patch / game-version disclosure fields.
- **Speedrunners and 100% completionists** — playstyle disclosures, run-type metadata, and difficulty fields.
- **Solo creators tired of copy-paste** — profiles and presets exist specifically to eliminate repetitive data entry.

## Privacy & Offline-First

Nothing leaves your device. No analytics, no telemetry, no tracking. The web version stores your work in `localStorage`; the desktop version stores it in the OS application-data directory. Clearing site data (web) or uninstalling the app (desktop) wipes everything. Full details in [PRIVACY.md](./PRIVACY.md).

## Tech Stack

React 18 · TypeScript (strict) · Vite 7 · Tailwind CSS 3 · Zustand · i18next · Tauri 2 (Rust stable).

Architecture overview: [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md).

## Documentation

| Document | What's in it |
| --- | --- |
| [Development Guide](./docs/DEVELOPMENT.md) | Toolchain, IDE setup, build commands, troubleshooting. *(Also: [Vietnamese](./docs/i18n/vi/DEVELOPMENT.md).)* |
| [Architecture](./docs/ARCHITECTURE.md) | Layer model, data flow, engine design. |
| [Features](./docs/FEATURES.md) | Full feature matrix. |
| [Content Inventory](./docs/CONTENT-INVENTORY.md) | Every video type, genre, and content warning the editor surfaces. *(Also: [Vietnamese](./docs/i18n/vi/CONTENT-INVENTORY.md).)* |
| [Roadmap](./docs/ROADMAP.md) | Development phases. |
| [Tech Spec](./docs/TECH-SPEC.md) | Implementation details and configs. |
| [i18n Guide](./docs/I18N.md) | Adding new locales. |
| [Packaging](./docs/PACKAGING.md) | Tauri release builds and signing. |
| [Contributing](./CONTRIBUTING.md) | PR process, commit conventions, auto-ignore rules. |
| [Security](./SECURITY.md) | Reporting vulnerabilities. |
| [Privacy](./PRIVACY.md) | Data handling (TL;DR: none). |
| [Disclaimer](./DISCLAIMER.md) | AI-assistance and translation-quality disclosure. *(Also: [Vietnamese](./docs/i18n/vi/DISCLAIMER.md).)* |
| [Terms of Use](./TERMS.md) | Acceptable use and license compliance. |
| [Code of Conduct](./CODE_OF_CONDUCT.md) | Contributor Covenant v2.1. |
| [Maintainers](./MAINTAINERS.md) | Who runs this. |
| [Third-Party Notices](./THIRD_PARTY_NOTICES.md) | Dependency attribution. |
| [Changelog](./CHANGELOG.md) | Per-release notes. |

## Contributing

PRs welcome — read [CONTRIBUTING.md](./CONTRIBUTING.md) first. Native-speaker corrections to AI-translated locales (JA / ES / KO / ZH) are especially appreciated.

## License

Licensed under the **[Apache License 2.0](./LICENSE)**. See [`NOTICE`](./NOTICE) for the copyright statement and [`THIRD_PARTY_NOTICES.md`](./THIRD_PARTY_NOTICES.md) for dependency licenses.

## AI Disclosure

This project was co-authored with **Anthropic's Claude Code (model 4.7 Opus, 1M-context variant)**. Source code, locale translations, documentation, and CI workflows were generated or edited with AI assistance, then reviewed by the human maintainer (`@poli0981`) before being committed. See [DISCLAIMER.md](./DISCLAIMER.md) for the full disclosure.

## Channel & Socials

Reference channel and maintainer links:

- **YouTube**: [@SkullMute](https://www.youtube.com/@SkullMute)
- **X / Twitter**: [@SkullMute0011](https://x.com/SkullMute0011)
- **Bluesky**: [skullmute0011.bsky.social](https://bsky.app/profile/skullmute0011.bsky.social)
- **Mastodon**: [@skullmute1122@mastodon.social](https://mastodon.social/@skullmute1122)
- **Discord** (project / repo): [join](https://discord.gg/2aNR3aVt)
- **Discord** (gaming): [join](https://discord.gg/kDM9GMu5vm)
- **Steam**: [profile](https://steamcommunity.com/profiles/76561199544666292/)
- **Patreon / Ko-fi**: `skullmute`
- **Telegram**: `@SkullMute0011` (bot: `@my_skull_bot`)
- **Email** (security & private contact): `lopop05905@proton.me`
