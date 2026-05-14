# Privacy Policy

**Effective:** 2026-05-14

YTDescGen is an **offline-first** template engine for generating YouTube video metadata. This document describes what data the application handles, where it lives, and what it never collects.

## What We Collect

**Nothing.** The application sends no data to any server controlled by the maintainer.

There is no analytics provider, no telemetry, no crash reporter, no A/B testing, no advertising network, no behavioral tracking. There is no backend.

## What Stays on Your Device

### Web version (GitHub Pages)

The web build stores your work in your browser's **`localStorage`** only. Keys used:

| Key prefix | Purpose |
| --- | --- |
| `ytdesc:editor` | Current editor draft |
| `ytdesc:settings` | Theme, default language, accordion state, hashtag preferences |
| `ytdesc:profiles` | Saved channel / social / rig profiles |
| `ytdesc:presets` | Saved game presets |
| `ytdesc:templates` | Saved full-form snapshots |
| `ytdesc:history` | Recently generated outputs |
| `ytdesc:logs` | Application event log |

`localStorage` is scoped to the origin and never transmitted. Clearing your browser data, browsing in a private/incognito window, or signing out wipes all of it.

### Desktop version (Tauri)

The desktop build uses the operating system's standard application-data directory:

- **Windows**: `%APPDATA%\com.skullmute.ytdescgen`
- **macOS**: `~/Library/Application Support/com.skullmute.ytdescgen`
- **Linux**: `~/.config/com.skullmute.ytdescgen`

The same key set as the web version is stored as JSON files there. Uninstalling the application or deleting that directory removes everything.

## Third-Party Services

The application does **not** call third-party APIs at runtime.

Optional links you may click — donation buttons, store links you paste into a draft, social links you save to your profile — navigate **away** from the application to third-party sites. Those sites have their own privacy policies; the maintainer is not responsible for them.

YouTube oEmbed, the Steam store API, Twitch helix, and similar services are **not** fetched by this application.

## Cookies / Local Storage Distinction

The web version uses **`localStorage`**, not cookies. No cookie is set by the application. GitHub Pages itself may issue a session cookie at the platform level — that is GitHub's, not ours, and is governed by [GitHub's Privacy Statement](https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement).

## Children's Privacy

This application is not directed at children under 13 and does not knowingly process any personal data from anyone.

## GDPR / CCPA / Equivalent Rights

Because no data ever leaves your device:

- **Right to access**: your data is already accessible — open DevTools → Application → Local Storage on the web, or browse the application-data directory on desktop.
- **Right to erasure**: clear your browser's site data (web) or delete the application-data directory / uninstall the app (desktop).
- **Right to portability**: use the in-app **Export** action in `Profiles` / `Presets` / `Templates` / `History` / `Logs` to download JSON.
- **Right to object / restrict processing**: not applicable — no processing happens off-device.
- **Right to know what is sold or shared**: nothing. Nothing is sold or shared.

## Changes to This Policy

If this policy changes, the change is committed to the repository under `PRIVACY.md` with the `Effective` date updated. There is no notification mechanism because the application has no way to reach you.

## Contact

`lopop05905@proton.me`
