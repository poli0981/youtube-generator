# Changelog

All notable changes to YTDescGen ship as tagged releases on `main`.

## v0.16.0 — 2026-05-14

Structured ending editor + multi-video split. The Playthrough Notes
section's free-form "Endings shown" Input is replaced with a
structured row table that knows about ending numbers, names,
multi-video splits, and timeline cross-validation.

### Added

- **`EndingsEditor` component ([src/components/editor/EndingsEditor.tsx](src/components/editor/EndingsEditor.tsx))** — three logical cases driven by ending count + video count:
  - **Case A** (1 ending) — `Number` + `Name` pair with live preview. At least one of the two must be filled; otherwise an inline warning explains the bullet will be dropped.
  - **Case B** (≥2 endings, 1 video) — full table row per ending. A gate inspects the Timestamps textarea — if it doesn't contain at least `endings.length` lines tagged with the `ending` keyword, a warning banner surfaces ("Timeline needs N markers; only M found").
  - **Case C** (≥2 endings, ≥2 videos) — endings table + per-video range table. Default ranges are contiguous and balanced via the new `computeContiguousRanges` helper (extras spill into the *last* video for the climactic-final convention); the creator can override per-row. Overlap / gap / out-of-bounds errors surface inline.
- **Structured `endings: EndingEntry[]` schema** in `EditorData` (v0.16.0). Each entry pairs an optional `number` (1–100) with an optional `name`. Empty entries are dropped silently. Companions: `endingVideoCount`, `endingVideoRanges: EndingVideoRange[]`, `endingVideoIndex?` (engine-only — picks which video's slice to render).
- **Engine `endings-format.ts`** — pure helpers `formatEndingEntry`, `sliceEndingsForVideo`, `clampRange`. Used by both the description builder and the editor's live preview so creators see exactly what will render.
- **Ending ordinal capture in `timeline-parser.ts`** — the `ending` keyword pattern now captures an optional trailing number, so timeline lines like `1:23:45 Ending 3: Best End` parse into `{ keyword: "ending", number: 3, rest: ": Best End" }`. Unblocks the case-B timeline gate.
- **Locale keys (19 new × 6 locales)** under `editor.endings.*` covering count / video-count labels, per-row labels, the preview line, warnings (`singleEmpty`, `timelineShort`, `rangeInvalid`, `rangeGap`, `rangeOverlap`, `rangeShort`), and helper hints. Schema bumped from 686 to 705 ui keys.
- **Tests** — 42 new tests (367 → 409): `endings-format.test.ts` (15), `editor-store.endings.test.ts` (16), `description-builder.test.ts` (5 added inline), `timeline-parser.test.ts` (6 added inline).

### Changed

- **`PlaythroughNotesForm`** — the old single `<Input label="Endings shown">` is replaced by `<EndingsEditor />`. The legacy `endingsShown` freeform is kept on the editor type for migration round-trip but no longer surfaces in the UI.
- **`description-builder` endings bullet** — reads from structured `endings[]` first, falls back to legacy `endingsShown` only when the array is empty (covers migrated drafts that still carry both). Multi-row entries render as comma-joined: `Ending 1: True End, Ending 3: Bad End, Hidden`. When `endingVideoIndex` is supplied, only that video's slice renders.
- **`timeline-parser` keyword templates** — every locale's `timeline.keywords.ending` is now `"Ending {{n}}"` instead of `"Ending"`. The renderer collapses trailing whitespace so a bare `Boss` (no ordinal) still renders cleanly as `Boss` instead of `Boss `.
- **`TemplateSnapshot`** in `template-store.ts` — gained `endings?`, `endingVideoCount?`, `endingVideoRanges?` (all optional for back-compat with pre-v0.16 templates).

### Migration

- **`migrateEditorState` v11 → v12** — `liftLegacyEndingString` parses the freeform `endingsShown` into a single-row structured entry:
  - `"Ending 3: Best End"` → `{ number: 3, name: "Best End" }`
  - `"Ending 3"` → `{ number: 3, name: "" }`
  - `"True ending only"` → `{ number: null, name: "True ending only" }`
  - `""` → `[]` (no entry)
  Localised "Kết thúc N", "エンディングN", etc. are also recognised. After lifting, `endingVideoCount` defaults to 1, `endingVideoRanges` to a single span; the existing `endingsShown` string is left in place but unused.

### Under the hood

- `EndingEntry` and `EndingVideoRange` types live in `src/engine/types.ts`. The 1-indexed inclusive `from/to` convention matches the user-facing "Video 1, Video 2…" labels.
- The Output preview for case C currently renders the *union* of all endings (same as case B) — per-video output rendering is wired into the engine via `endingVideoIndex` but the UI selector for it lands in a follow-up patch. Documented inline in `EndingsEditor` as `multiVideoOutputNote`.
- Bundle: index 463.08 KB (+62 KB for EndingsEditor + endings-format + table-row UI). Still under the 500 KB cap.
- 409/409 tests pass. Lint + typecheck + locale-validate all clean.

## v0.15.0 — 2026-05-14

Import / export overhaul + stability hardening. Closes the "black
screen on bad file" class of bugs and gives every JSON export an
auto-detect header so users can no longer confuse profile / preset /
template files with each other.

### Added

- **`ErrorBoundary` ([src/components/ErrorBoundary.tsx](src/components/ErrorBoundary.tsx))** wrapping every `<Route>` plus a top-level boundary in `main.tsx`. Catches render-time errors that previously black-screened the app, surfaces a fallback UI with `Try again` (remount the subtree) + `Reload page` actions, and copies the error into the Logs tab via the in-app `logger`. Per-route boundaries mean a crash on the Profiles tab doesn't take down the Editor — the user can navigate elsewhere and recover.
- **File envelope format ([src/utils/file-schema.ts](src/utils/file-schema.ts))** — every `.json` export written from this version onwards is wrapped in `{ _app: "ytdescgen", _type, _schemaVersion, _exportedAt, data }`. The `_type` discriminator (`"profile" | "preset" | "template" | "settings" | "history"`) lets imports detect "you opened a Template file in the Profiles importer" and offer to switch tabs instead of silently failing.
- **`detectShape` / `resolveForType`** — shape inspector handles envelope files (authoritative `_type`), legacy bare arrays (best-effort guess from `snapshot` / `channelName` + `social` + `rig` / `gameName` + `storeLinks` / `createdAt` + title), and the multi-store settings dump (recognised by the `ytdescgen-settings` key). 17 new unit tests in `tests/utils/file-schema.test.ts` cover the round-trip + every detection branch.
- **`importTypedFromJsonFile(expectedType)`** — high-level reader that resolves to a tagged-union `ImportResult`: either `{ ok: true; data; sourceVersion? }` or `{ ok: false; failure }` with one of five kinds (`cancelled`, `read-failed`, `empty`, `parse-error`, `wrong-shape`, `newer-schema`). Replaces the throw/catch-and-show-generic-toast pattern.
- **Auto tab-switch on wrong-type import** — when the user clicks Import on the Profiles tab but the file is detected as a Templates export, the toast says "This file looks like a Templates export. Switching tabs…" and `setTab("templates")` runs immediately. One click instead of three.
- **Import-result summary** in toasts — `Imported 5 of 7 profiles (some skipped).` when the store-level validator drops malformed rows. Previously a partial success surfaced as a plain "Imported!" even when half the file got rejected.

### Fixed

- **Black-screen crash** on loading a corrupt profile or template ("Cannot convert undefined or null to object"). Root cause was three unguarded spreads/`Object.values` chained together:
  - [src/components/profiles/TemplateCard.tsx:21](src/components/profiles/TemplateCard.tsx) `loadProfile(template.snapshot)` with `snapshot: null` →
  - [src/store/editor-store.ts:149](src/store/editor-store.ts) `normalizeEditorPatch` spread of `null` patch →
  - [src/components/profiles/ProfileCard.tsx:34](src/components/profiles/ProfileCard.tsx) `Object.values(profile.social)` with `social: null`.
  All three now null-guard. `normalizeEditorPatch` returns `{}` for a falsy patch; `loadProfile`-chain spreads degrade to a no-op; `Object.values(profile.social ?? {})` returns 0 instead of throwing. The new ErrorBoundary catches anything that still slips through.
- **Store-level import validators** in [profile-store.ts](src/store/profile-store.ts), [preset-store.ts](src/store/preset-store.ts), [template-store.ts](src/store/template-store.ts) now filter incoming arrays for rows with a string `id` of non-zero length; templates additionally require a non-null `snapshot` object. Bad rows are silently dropped (count surfaces in the import toast).

### Changed

- **`exportToJsonFile` → `exportTypedToJsonFile`** at every ProfilesPage call site. The legacy bare-value exporter is retained for back-compat but unused.
- **`importFromJsonFile<T>` → `importTypedFromJsonFile`** at every ProfilesPage handler. Legacy bare reader retained for the same reason — callers outside Profiles can migrate later.
- **`detectShape` is forward-compatible**: an envelope from a future version (whose `_schemaVersion` exceeds `SCHEMA_VERSIONS[expected]`) returns `newer-schema` instead of importing silently. Tells the user to upgrade the app.

### Under the hood

- Two layers of validation by design: `detectShape` confirms the file *kind*; per-store `importX` rejects malformed *rows*. A future tab-specific quirk in one validator can't corrupt other stores' data.
- `normalizeEditorPatch` signature widened to `Partial<EditorData> | null | undefined` so TS forces null-handling at call sites. Existing callers still work — `Partial<T>` is assignable to the new union.
- Vite reports one dynamic-import-also-statically-imported warning for `logger.ts`. Intentional: the boundary uses a dynamic import so logger init failures during the *primary* render error don't escalate into a secondary boundary crash. Bundle is not split.
- Bundle: index 401.06 KB (+2.49 KB), ProfilesPage chunk 18.44 KB (+4.38 KB for envelope + failure-toast rendering). Total still well under the 500 KB cap.
- 367/367 tests pass (350 + 17 new for file-schema).

### Migration notes

- **No store schema bump**. v0.14.x persisted state loads unchanged in v0.15.0; new envelope only affects on-disk JSON export files.
- **Legacy export files still import** via the shape-detector path. Re-export to get the envelope header + tab-switch hints.
- **Envelope schema versions**: profile=1, preset=2, template=1, settings=9, history=2. Bump per-type when introducing a non-additive change to that store's shape.

## v0.14.1 — 2026-05-14

Same-day patch on v0.14.0. Two desktop-only items closing user-reported
issues on Windows + a small Settings convenience.

### Fixed

- **Windows "cannot find ... `AppData\Roaming\com.skullmute.ytdescgen`"** when clicking *Settings → Open Folder* on a fresh install ([`src/pages/SettingsPage.tsx:25-35`](src/pages/SettingsPage.tsx)). Root cause: `appDataDir()` only resolves the path string — the directory itself is created lazily on the first `save_to_file` write, so first-run users hit the OS shell before any setting had been persisted. New Rust command `ensure_dir(path)` ([`src-tauri/src/lib.rs:18-27`](src-tauri/src/lib.rs)) wraps `std::fs::create_dir_all` and is invoked before both `openPath(dir)` and `read_from_file` in `exportSettingsToFile`, so the shell + read paths can never encounter a non-existent folder.

### Added

- **Settings → Import button** (Tauri-only, next to *Export*). Reads a `.json` settings file via the existing `loadFile()` Tauri dialog, accepts either the full multi-store dump produced by *Export* (object keyed by `ytdescgen-settings`) or a bare `SettingsData` payload, runs it through `healSettings()` to back-fill any missing keys, then dispatches via `useSettingsStore.setState`. Theme class on `<html>` is re-applied directly because `setState` bypasses the `setTheme` action. Five distinct failure modes get their own toast: dialog-cancel (silent), `read_from_file` error, empty file, JSON parse error, non-object root. Each failure logs to the in-app logger with the source `"settings"` so it surfaces in the Logs tab without leaving the UI.

### Under the hood

- New Tauri command `ensure_dir` registered in `invoke_handler!` macro alongside `save_to_file` and `read_from_file`. Pure stdlib — no new crates.
- `exportSettingsToFile` also pre-creates the data folder so *Export* works on a fresh install without first triggering any other write.
- Settings store gained no schema fields; the import path reuses the existing `healSettings` (v9) for back-fill so no `version` bump on the persist store.
- 350/350 tests still pass; lint + typecheck clean.
- Bundle: SettingsPage chunk grew ~0.18 KB raw for the new icon import + import handler; main bundle and overall gzip totals unchanged.

### Migration notes

- No store schema bump. Existing v0.14.0 installs upgrade in place.
- Web (GitHub Pages) build is unchanged — both fixes are Tauri-only by virtue of the `IS_TAURI` gate on the Settings toolbar.

## v0.14.0 — 2026-05-14

Three independent strands land together:

1. **License flip MIT → Apache-2.0.** The repo previously claimed MIT in README/CLAUDE.md but had no `LICENSE` file. Adds canonical Apache License 2.0 text, a `NOTICE` asserting copyright + AI-assisted-development disclosure, and the `license` field in `package.json` + `src-tauri/Cargo.toml`. Per the production-docs spec.
2. **Content warnings 69 → 91** across a new 8th group `gameplay_disclosure`. Adds horror-channel staples plus transparency disclosures for non-vanilla play. See "Added" below for the full ID list.
3. **Mobile-responsive web** without PWA or Tauri-mobile. The GitHub Pages build is now usable on phones (drawer nav below `md`, touch-sized form controls, iOS-safe focus behavior, safe-area-inset padding for notch/home indicator).

Plus a documentation sweep: full `README.md` rewrite, new root policy files for public release (`SECURITY`, `CONTRIBUTING`, `CODE_OF_CONDUCT`, `PRIVACY`, `DISCLAIMER`, `TERMS`, `THIRD_PARTY_NOTICES`, `MAINTAINERS`), `docs/DEVELOPMENT.md` merging the deleted `pc_spec.md` + `dev_env.md`, Vietnamese mirrors for DEVELOPMENT and DISCLAIMER, and a `.github/PULL_REQUEST_TEMPLATE.md`.

### Added

- **`LICENSE`** (root) — canonical Apache License 2.0 text. **`NOTICE`** asserting `Copyright 2026 poli0981` + Claude Code 4.7 Opus (1M context) co-authorship disclosure. `license` field added to `package.json` and `src-tauri/Cargo.toml`.
- **22 new content-warning IDs** across 8 groups ([src/engine/types.ts](src/engine/types.ts), [src/config/content-warning-groups.ts](src/config/content-warning-groups.ts)):
  - Phobias (+3): `coulrophobia` (clowns), `ablutophobia` (drowning), `taphophobia` (live burial).
  - Photosensitive (+2): `strobe_effects`, `screen_shake_intense`.
  - Mental Health (+3): `paranoia_themes`, `intrusive_thoughts`, `medical_horror`.
  - Sensitive (+3): `human_experimentation`, `cannibalism`, `nuclear_themes`.
  - Horror-Specific (+5): `liminal_spaces`, `analog_horror`, `unreality_themes`, `pursuit_chase`, `entity_horror`.
  - Playstyle (+2): `first_time_playing`, `returning_player`.
  - **NEW group Gameplay Disclosure (+4)**: `mods_used`, `cheats_enabled`, `glitch_exploits`, `assisted_run`.
- **`src/components/ui/Drawer.tsx`** — slide-in mobile-nav drawer. Reuses overlay + Esc patterns from `Modal.tsx`; body-scroll lock + safe-area-inset padding; tap-outside-to-close.
- **`tailwind.config.ts`** — `theme.extend.spacing.touch = "44px"` (iOS HIG minimum), exposed via `min-h-touch` / `h-touch` utilities.
- **Mobile keyboard hints** — `inputMode` / `autoComplete` / `enterKeyHint` on game-name, channel-name, contact-email, and playlist-URL fields so iOS shows the right keyboard.
- **Root policy file set** for public release: `SECURITY.md` (private-disclosure flow), `CONTRIBUTING.md` (PR process, validate:locales gate, auto-ignore rules), `CODE_OF_CONDUCT.md` (Contributor Covenant v2.1 link), `PRIVACY.md` (offline-first, localStorage keys listed, GDPR/CCPA), `DISCLAIMER.md` (AI-assistance + translation-quality disclosure), `TERMS.md` (Apache-2.0 + GitHub ToS + GDPR/CCPA/PIPL/LGPD/VN Cybersecurity), `THIRD_PARTY_NOTICES.md` (full dep table + AI disclosure paragraph), `MAINTAINERS.md`. Plus `.github/PULL_REQUEST_TEMPLATE.md`.
- **`docs/DEVELOPMENT.md`** (EN) + **`docs/i18n/vi/DEVELOPMENT.md`** (VI) — merge of the deleted `pc_spec.md` + `dev_env.md`. Covers toolchain (Node ≥ 22, Rust stable, Tauri 2), JetBrains 2026.x + VS Code setup, build commands, per-OS Tauri prerequisites, troubleshooting.
- **`docs/i18n/vi/DISCLAIMER.md`** — VI mirror of `DISCLAIMER.md`.

### Changed

- **`Sidebar.tsx`** — extracts `<SidebarNavList collapsed onItemClick?>` so the same nav can render inside the desktop sidebar **and** the new mobile Drawer. Outer `<aside>` now `hidden md:flex`.
- **`AppShell.tsx`** — wires `mobileNavOpen` state + renders `<Drawer side="left">` containing `<SidebarNavList />` for mobile. Header gets `onOpenMobileNav` prop.
- **`Header.tsx`** — adds `Menu` hamburger (md:hidden), `pt-[max(0.75rem,env(safe-area-inset-top))]` for iOS notch, donate icon-only below md, language dropdown width `min-w-[200px] max-w-[calc(100vw-2rem)]` so it never overflows at 360px width.
- **`Button.tsx` / `Input.tsx` / `Textarea.tsx` / `ValidatedInput.tsx`** — bump heights to `min-h-touch` (44 px) for `md` / `lg`; `sm` to `min-h-[36px]` (iOS minimum). Inputs / textareas use `text-base sm:text-sm` to prevent iOS Safari focus zoom (Safari zooms when font-size < 16 px).
- **`EditorPage.tsx`** — responsive padding `gap-6 p-6 lg:flex-row` → `gap-4 p-3 sm:p-4 md:gap-6 md:p-6 lg:flex-row`. Sticky preview wrapper changed to `lg:sticky lg:top-6` so mobile portrait doesn't lock the preview.
- **`OutputPreview.tsx`** — description scroll-box `max-h-[400px]` → `max-h-[60vh] sm:max-h-[400px]`.
- **`CopyAllBar.tsx`** — `pb-[max(0.75rem,env(safe-area-inset-bottom))]` for iOS home indicator; button class compaction below `sm`.
- **`README.md`** — full rewrite (~200 lines). Badges (Apache-2.0 / Node ≥ 22 / latest release / last commit), Use Cases (esp. horror gameplay), Privacy section, full doc table, AI disclosure, channel/socials block.
- **`CLAUDE.md`** — license MIT → Apache-2.0; project-structure tree updated (`PRD.md` removed, `DEVELOPMENT.md` added with VI mirror sibling).
- **`src/config/about.ts`** — `license` MIT → Apache-2.0. `pcSpecDocUrl` / `devEnvDocUrl` field names preserved for About-page layout compat but now point to `docs/DEVELOPMENT.md` (EN) and `docs/i18n/vi/DEVELOPMENT.md` (VI) respectively.
- **`webapp/TAURI.md`** — cross-links updated to `docs/DEVELOPMENT.md`.

### Removed

- **`docs/PRD.md`** — Product Requirements Document V1.0 (2026-04-07). Shipped through v0.13.1; no longer load-bearing for public readers.
- **`docs/pc_spec.md`** + **`docs/dev_env.md`** — merged into `docs/DEVELOPMENT.md`.
- **`docs/i18n/vi/pc_spec.md`** + **`docs/i18n/vi/dev_env.md`** — merged into `docs/i18n/vi/DEVELOPMENT.md`.

### Under the hood

- **`_schema.json`** updated with the 23 new keys (1 new group label + 22 new option keys + 22 new long-description keys). All 6 locales × 2 files now at 686/686 ui + 368/368 templates.
- **No engine logic changes.** `description-builder.ts:415-431` already loops content warnings by user selection order — the new IDs are pure-data additions.
- 350/350 tests still pass — no engine math changed.
- Bundle: 443.55 KB raw / 136.55 KB gzip (under the 500 KB cap; ~+30 KB vs v0.13.1 from the docs imports being inlined).
- Repository URL canonicalized — all README / CLAUDE / DEVELOPMENT references that pointed to `github.com/poli0981/yt-desc-gen` now correctly resolve `github.com/poli0981/youtube-generator`. `src/config/about.ts` still uses the canonical name; no behavior change.
- Tauri app-data identifier (`com.skullmute.ytdescgen`) documented correctly in `PRIVACY.md`.

### Migration notes

- **License change is not a code migration** — your build environment doesn't need any action. If you redistribute the source, the new `LICENSE` + `NOTICE` apply per Apache 2.0 §§ 4(a)–4(d). Pre-v0.14 forks may continue under their snapshot's license; this is a forward change.
- **No store schema bump.** Editor / settings / profile / preset / template store versions unchanged. Persisted drafts containing the legacy `contentWarnings` array round-trip unchanged — the array just renders against the expanded ID set.
- **Mobile users** get the new layout automatically on next visit; nothing to opt in to.

## v0.13.1 — 2026-05-11

Same-day hotfix for v0.13.0. Three small but load-bearing pieces:

### Added

- **GitHub-side housekeeping** — `.github/FUNDING.yml` (mirrors `Donate.txt`), `.github/ISSUE_TEMPLATE/{config,bug_report,feature_request}.yml`, `docs/pc_spec.md` + `docs/dev_env.md` (+ VI mirrors), `webapp/TAURI.md`. Auto-link-discussion job added to `announce-release.yml` (`gh release edit --discussion-category "Announcements"`) so every future release auto-creates a linked Discussion thread.
- **AboutPage restructure** — split into Repository / Donate / Connect / Dev Environment / Third-Party sections. Ko-fi / Patreon moved out of `ABOUT.socials` into a new `@config/donate` (`PRIMARY_DONATE_URL` constant feeds the Header donate button). Socials expanded with Bluesky, Mastodon, Steam, Telegram (bot + user), email, game-server Discord.
- **Header donate button** — persistent pink Ko-fi link to the left of the language switcher.
- **Sidebar external link** — Report Bug item added to the tabs array via a new `external?: boolean` field on `TabItem`; branches render between `<NavLink>` and plain `<a target="_blank">`.
- **Basic SEO** — expanded `<head>` (description, OG, Twitter card, JSON-LD `WebApplication`, 6 locale alternates) + new `useDocumentTitle(title)` hook applied to all 9 page components + `public/{robots.txt,sitemap.xml,manifest.webmanifest,favicon.svg}` (favicon is a placeholder SVG).
- **Heavy-horror content-warning group** (7 IDs: `eye_horror`, `body_horror`, `face_horror`, `cosmic_horror`, `extreme_gore`, `decay_rot`, `mutilation`) translated to all 6 locales in both short-label and long-description forms.

### Changed

- **Workflow `workflow_run` filters narrowed** — `notify-ci-failure.yml` / `notify-deploy.yml` / `notify-release-pipeline.yml` switched from `workflows: ["*"]` to specific producer names. Eliminates Skipped-row spam in the Actions tab.
- **`@tauri-apps/api` 2.10.1 → 2.11.0** to match Rust `tauri` 2.11.1 (Dependabot bumped Rust side; tauri-action requires the npm and Rust minors to match).

### Fixed

- **Tauri-action `releaseDraft: true` is search-by-version, not search-by-tag.** The initial v0.13.1 tag push silently uploaded `0.13.0`-labelled binaries to the existing v0.13.0 release object because `src-tauri/{tauri.conf.json, Cargo.toml, Cargo.lock}` stayed at `0.13.0`. Recovered with PR #58 (Tauri-side manifests to 0.13.1), then PR #59 (`@tauri-apps/api` bump), then force-moving the signed `v0.13.1` tag twice via `git tag -fs` + `git push origin v0.13.1 --force`, finally `gh workflow run release-desktop.yml -f tag=v0.13.0` to rebuild and restore v0.13.0's binaries.

### Migration notes

- **Version-bump ritual is now SIX files**, not five: `package.json`, `package-lock.json`, `src-tauri/Cargo.toml`, `src-tauri/Cargo.lock` (the `yt-desc-gen` entry only), `src-tauri/tauri.conf.json`, and — when Rust `tauri` minor moves — `@tauri-apps/api` in `package.json` (its minor must equal Rust `tauri` crate minor).

## v0.13.0 — 2026-05-08

A scope-broadening release: two UI/Gacha bugs squashed, Gacha-quest editor extended with three structured fields (Anniversary year dropdown, Showcase character name, free-form `gachaVersion`), copy buttons hard-stop when text exceeds YouTube's title/description/tags limits, the Tauri desktop window is now locked at 1100×750 (no resize, no maximize), 27 new content warnings — including a brand-new "Playstyle disclosures" group — fill the phobia / mental-health / sensitive / playstyle gaps, and the My Rig editor's free-text GPU and RAM inputs are replaced with structured cascading dropdowns (Brand → Series → Model for GPU, Size + DDR generation for RAM) covering ~200+ GPU models across 14 series and 4 brands. Two QoL touches round it out: per-quest-type smart placeholders ("Day 12" for Daily Commission, "Floor 12" for Endgame, "Part 1" for Main Story) and inline validation badges that nudge the creator when a rig field is half-filled.

### Added

- **Anniversary year dropdown (1–20)** ([src/components/editor/ExtraFieldsInput.tsx](src/components/editor/ExtraFieldsInput.tsx)) — replaces the v0.12 `chapterName` text input for the `anniversary` quest type. Title and description templates render `"{{anniversaryYear}}{{ordinalSuffix}} Anniversary"` (e.g. "2nd Anniversary", "11th Anniversary") with a locale-aware `ordinalSuffix()` helper that returns `st/nd/rd/th` for English and an empty string for non-English locales (so "周年記念" / "주년" / "周年纪念" don't pick up an English suffix).
- **Showcase character name** — when `gachaQuestType === "showcase"`, the editor swaps Chapter/Quest/Part for a single `characterName` input. The description renders the user's exact requested phrasing: "This video showcases the skills, appearance, and details of {{characterName}} in {{gameName}}{{versionLabel}} on {{channelName}}." Title becomes "{{gameName}} — Character Showcase: {{characterName}}".
- **Gacha `gachaVersion` field** ([src/store/editor-store.ts](src/store/editor-store.ts)) — free-form game version label like "1.2", "2.4", scoped to the Gacha Quest video type. Distinct from `versionInfo` (driver/general game version, rendered in the 🖥 VIDEO SETTINGS block for any video type). Surfaces in Gacha-specific intros via a new `description.intro.versionInline` template helper that renders only when non-empty (so the parenthetical "(version 1.2)" disappears entirely when the field is blank — no "(version )" artifact).
- **Cascading GPU dropdown** ([src/config/gpu-catalog.ts](src/config/gpu-catalog.ts), [src/config/rig-fields.ts](src/config/rig-fields.ts)) — three-level Brand → Series → Model picker covering NVIDIA (GTX 700/900/10/16, RTX 20/30/40/50), AMD (HD 7000, R7/R9 200/300, RX 400/500/Vega/5000/6000/7000/9000), Intel Arc (A and B series), and Apple Silicon (M1–M4 with Pro/Max/Ultra variants). A `Custom` brand swap-in keeps free-text entry available for niche cards. Stored as pipe-delimited `"<brand>|<series>|<model>"` so the rig store stays a flat `Record<string, string>` — no schema migration vs. v0.12. `formatRigValue("gpu", …)` outputs `"NVIDIA RTX 4090"` (drops the redundant series label).
- **Composite RAM input** — two cascading dropdowns (Size + DDR) replace the free-text RAM field. Sizes: 4/6/8/12/16/32/64/96/128/256 GB plus a `Custom…` numeric input for unusual sticks. DDR generations: DDR1–DDR7. Output renders as `"32 GB DDR5"` / `"48 GB DDR5"` (custom). Same flat-string storage approach as GPU (`"<size>|<ddr>"`, with `"custom:48|DDR5"` for custom numeric).
- **27 new content warnings + Playstyle disclosures group** ([src/engine/types.ts](src/engine/types.ts), [src/config/content-warning-groups.ts](src/config/content-warning-groups.ts)) — Phobias gain `cynophobia / nyctophobia / pyrophobia / pediophobia / hemophobia` (5). Mental health gains `bipolar_themes / ocd_themes / panic_attacks / dissociation` (4). Sensitive gains `hate_speech / historical_atrocity / slavery_themes / terrorism_themes / bullying_themes` (5). A brand-new **Playstyle disclosures** group (8 items) covers `blind_playthrough / no_spoilers_chat / casual_difficulty / hardcore_difficulty / permadeath_run / speedrun_attempt / completionist_run / learning_mechanics` — disclosure-style warnings that aren't really "content" but viewers benefit from knowing (e.g. "Blind playthrough — first time" sets expectations for repeated dying).
- **Smart placeholders per Quest Type** ([src/config/gacha-quest-types.ts](src/config/gacha-quest-types.ts)) — `GACHA_QUEST_PLACEHOLDERS` map drives the Chapter / Quest / Part inputs to show context-specific hints based on the selected quest type: `"Day 12"` for Daily Commission, `"Floor 12"` for Endgame, `"Part 1"` and `"Chapter 5 Act 2"` for Main Story, etc. Placeholders only — no value clearing or auto-fill, so user input is preserved when switching types.
- **Inline rig validation badges** ([src/utils/rig-validation.ts](src/utils/rig-validation.ts)) — `validateGpuValue` / `validateRamValue` flag half-filled selections (brand picked but no model, RAM size set but DDR missing, custom numeric empty) and the rig editor renders a small ⚠️ warning under the affected field. Soft warning only — the description still renders, but the badge nudges the creator to complete the field.
- **Copy-over-limit guard** ([src/hooks/use-clipboard.ts](src/hooks/use-clipboard.ts)) — `useClipboard().copy(text, { limit, fieldLabel })` now refuses to write to the clipboard when `text.length > limit`. Surfaces a toast like "Title is too long: 117/100 chars. Trim before copying." Each output button (Title / Description / Tags) passes its respective `YT_LIMITS.*` cap; the Copy All bar pre-validates Title and Description and shows a combined error if either is over. Over-limit copy buttons render with a `text-danger` style and a ⚠️ icon so the lock state is visible before the user clicks.

### Changed

- **Editor store v10 → v11** ([src/store/editor-store.ts](src/store/editor-store.ts)) — additive only: `characterName: ""`, `anniversaryYear: null`, `gachaVersion: ""` back-fills. Out-of-range or non-integer `anniversaryYear` values coerce to `null` so a hand-edited persistent blob with `anniversaryYear: 99` doesn't render "99th Anniversary" in titles. Existing fields round-trip unchanged.
- **Tauri window locked** ([src-tauri/tauri.conf.json](src-tauri/tauri.conf.json)) — `resizable: false`, `maximizable: false`, and `minWidth = maxWidth = 1100` / `minHeight = maxHeight = 750` ensure the desktop binary opens at the design resolution and stays there. Eliminates layout drift from users dragging the window to ultra-wide ratios where the editor → preview split breaks.
- **AppShell layout reflow** ([src/components/layout/AppShell.tsx](src/components/layout/AppShell.tsx)) — root `min-h-screen` swapped for `h-screen overflow-hidden` so the outer container can't grow beyond viewport height. The `<main>` scroll container now actually constrains content, fixing the v0.12 bug where long descriptions caused the entire page (sidebar + header included) to scroll instead of just the main pane.
- **Showcase template renders character, not quest** — `gachaQuestType.showcase` title and `description.intro.gacha_quest_showcase` now consume `characterName` instead of `questName`. Pre-v0.13 drafts that picked `showcase` and filled `questName` will see `characterName` empty after upgrade — re-enter the character into the new field.
- **Anniversary template renders year + ordinal** — `gachaQuestType.anniversary` and `description.intro.gacha_quest_anniversary` consume `anniversaryYear` (number) instead of `chapterName` (free text). The English title is now `"<game> — 2nd Anniversary - Day N"` driven by the new ordinal helper; locale variants render in their native conventions ("2周年記念", "2주년 기념", "Aniversario 2", etc.).
- **`formatRigValue()` extended** — switches on `field.type` to handle the two new cascading / composite types. Pre-v0.13 free-text GPU and RAM values (no pipes) pass through unchanged so existing profiles render the same string they did before; the editor displays them under the Custom brand for further editing.

### Under the hood

- **Schema-driven locale validation** still passes with 629 ui keys + 339 templates keys across all 6 locales (en/es/ja/ko/vi/zh) — every new key is mirrored in the schema and translated where applicable. Validation errors are caught at the build / pre-merge step via `npm run validate:locales`.
- **`tests/engine/rig-fields.test.ts`** grew from 7 → 18 cases — new coverage for `cascading_dropdown` (brand+model formatting, custom-brand verbatim, brand-only fallback, legacy free-text passthrough) and `composite_dropdown` (size+DDR, custom numeric, partial values, legacy passthrough).
- **`tests/store/editor-store.migrate.test.ts`** grew from 9 → 13 cases — new v10 → v11 migration tests assert the Gacha field back-fills, the 1–20 anniversary-year range guard, and the round-trip preservation of valid persisted values.
- **`tests/engine/title-builder.test.ts`** updated — the Anniversary test now passes `anniversaryYear: 7` instead of `chapterName: "7th"` to match the new template shape.
- Test count: 350/350 (was 335/335).

### Migration notes

- v10 → v11 is automatic and additive; the migration runs once on first launch of v0.13. Existing drafts are preserved.
- **Showcase users**: the `questName` you previously typed for showcase videos won't be carried into `characterName`. Open the editor, pick Showcase, and re-enter the character — the field name change is intentional (Showcase = character, not quest).
- **Anniversary users**: the free-text `chapterName` you used to type "2nd" / "Year 2" / etc. is no longer used by the Anniversary template. Pick the year from the new dropdown instead.
- **Free-text GPU / RAM users**: existing profiles render identically. The editor will show your old free-text under the Custom brand / RAM legacy fallback; switch to the structured dropdowns when convenient.

## v0.12.1 — 2026-05-06

Hotfix for v0.12.0. Ticking a Tech Notes checkbox (or filling any of the new Playthrough Notes structured fields — Endings shown, Language patch, Game version) updated the editor state but never reached the description preview, because the editor → engine mapping in `useCurrentGeneratorInput` wasn't kept in sync when the new fields were added. The unit-test suite caught nothing because every v0.12 description-builder test passed `GeneratorInput` directly to the engine, bypassing the hook.

### Fixed

- **Editor → engine pipeline carries every v0.12 field** ([src/hooks/use-current-generator-input.ts](src/hooks/use-current-generator-input.ts)) — `endingsShown`, `languagePatch`, `languagePatchCustom`, `gameVersion`, `gameVersionCustom`, and `techNotes` are now forwarded into `GeneratorInput`. Symptom of the bug was that the description preview (and Output / Batch tabs) didn't change when the user ticked tech-note items or filled language-patch / game-version, even though the editor checkboxes / selects reflected the change correctly.
- **Save-as-template captures every v0.12 field** ([src/components/templates/TemplateSaveForm.tsx](src/components/templates/TemplateSaveForm.tsx)) — the snapshot builder explicitly enumerates each editor field and was missing the same six fields. A v0.12.0 user saving a template lost their Tech Notes / Playthrough Notes selections; loading the template later didn't restore them.

### Changed

- **Hook field-mapping extracted into a pure helper** — `buildGeneratorInputFromEditor(state, languageOverride?)` is now exported alongside the React hook. Pure function so it's directly unit-testable; the hook just wraps it in `useMemo`. Same change pattern used for `migrateEditorState` in v0.12.0 — pull the load-bearing logic out of React-coupled wrappers so tests can hit it without a render harness.
- **Hook `useMemo` deps simplified** — the previous list enumerated every field individually (50+ entries); a missing field would silently freeze that field's value in the memoised output. Replaced with a single `[state, languageOverride]` since `useEditorStore()` returns a fresh state reference on every store update — equivalent invalidation, fewer footguns.
- **`TemplateSnapshot` carries the v0.12 fields as optional** ([src/store/template-store.ts](src/store/template-store.ts)) — `endingsShown`, `languagePatch`, `languagePatchCustom`, `gameVersion`, `gameVersionCustom`, `techNotes` joined the snapshot type. Optional for back-compat with templates saved before this hotfix; the editor's `loadProfile` spread keeps existing values when the patch lacks them.
- **`EditorData` is now `export interface`** in `src/store/editor-store.ts` so the shared snapshot helper can reference it.
- **package-lock.json** synced to the v0.12 / v0.12.1 version line — was carrying a stale v0.11.0 root version since the v0.12.0 PR forgot it (the v0.9.0 lockfile-bump-miss memory note reminded us, but only after the v0.12.0 ship).

### Under the hood

- New `tests/hooks/generator-input-mapping.test.ts` (6 cases) — direct assertions that each v0.12 field reaches `GeneratorInput` (`endingsShown`, `languagePatch + custom`, `gameVersion + custom`, `techNotes` selection-order), plus a parity guard that walks every key of an `EditorData` instance and fails if any non-allowlisted field is dropped from the resulting `GeneratorInput`. The allowlist is exactly two keys (`thumbnailText`, `pinnedComment` — both feed the pinned-comment builder via a separate code path); anything else added in the future will trip the assertion immediately.
- Test count: 335/335 (was 329/329). Bundle: 345.50 KB raw / 115.52 KB gzipped (essentially flat versus v0.12.0 — only swapped a deps array for a single ref).

### Migration notes

- No state migration needed. `loadProfile` / `loadPreset` continue to spread snapshots over current state, and the new fields are all optional on `TemplateSnapshot`. A v0.12.0 user with templates saved during the bug window will see those templates load with empty Tech Notes / Playthrough Notes — re-save the template after upgrading to capture the fields properly.

## v0.12.0 — 2026-05-06

A bug fix and a description overhaul. The Tauri desktop build picks up `tauri-plugin-single-instance` so launching the app twice no longer stacks tray icons / orphan processes — second launches refocus the existing window. The description's Playthrough block consolidates the v0.7 standalone "🎯 Playthrough" line and the standalone "🎮 DIFFICULTY" block into a unified `▸ 🎮 PLAYTHROUGH NOTES` section with three new structured fields (`endingsShown`, `languagePatch`, `gameVersion`), and a new `▸ 🛠 TECH NOTES` bilingual checklist (24 items across 5 groups) sits alongside Content Warnings for production / playstyle disclaimers.

### Added

- **Single-instance enforcement (desktop)** — `src-tauri/Cargo.toml` adds `tauri-plugin-single-instance = "2"`, registered first in the `Builder` chain in `src-tauri/src/lib.rs` with a `get_webview_window("main")` → show + unminimize + focus callback. Closing-to-tray then double-clicking the launcher / start-menu shortcut surfaces the existing window instead of spawning a fresh process with its own tray icon.
- **Unified `▸ 🎮 PLAYTHROUGH NOTES` description block** — replaces the v0.7 standalone "🎯 Playthrough:" line and the v0.7 standalone "🎮 DIFFICULTY" block with one bulleted section that renders five fields: Run type (reads from existing `playthroughStatus`), Difficulty (reads from existing `difficulty` + `difficultyCustomLabel`), Endings shown (NEW free text), Language patch (NEW enum + custom slot), Game version (NEW enum + custom slot). Empty bullets are skipped; the whole block is skipped when every field is empty. Bilingual `EN · LOCAL` rendering for both label and value when `tEn` is provided and output language ≠ English. Section sits in slot 1.5 (right after the intro), matching the position of the pre-v0.12 standalone playthrough line.
- **`▸ 🛠 TECH NOTES` checklist** — a 24-item, 5-group bilingual multi-select for production / playstyle disclaimers: audio (5: copyright muting, volume reduction, music replacement, cutscene-only mute, original-audio kept), video quality (3: low resolution, low graphics, FPS drops with FPS counter pointer), recording issues (4: bug-from-game, crash kept, loading cut, OBS artifacts), playstyle (8: not no-hit, not clean walkthrough, casual no-commentary, many deaths, slow exploration, puzzle-stuck, grinding cut, not speedrun), production (4: exploration-focused, edited-for-pacing, support-developers, online-connectivity-issues). Same render pattern as v0.11 Content Warnings — header / two-line intro / `EN · LOCAL` bullets with U+00B7 MIDDLE DOT separator. Section sits right after Content Warnings; both transparency blocks group together.
- **`languagePatch` enum** with options `none / official_en / official_other / fan_translation / mtl / custom` and a paired free-form `languagePatchCustom` slot — covers the most common patch states (canonical EN release, official non-EN locale, fan TL, machine TL) plus an escape hatch for niche cases. `none` is the skip-bullet sentinel; `official_other` and `custom` both surface the free-form input under the Select.
- **`gameVersion` enum** with options `full_release / demo / early_access / beta / prologue / pre_release / custom` and a paired `gameVersionCustom` slot — `full_release` is the implicit default (no bullet rendered) so creators recording the released game don't have to fill anything; "Steam Next Fest demo" / "Kickstarter backer build" / similar niche cases go through `custom`.
- **Free-text `endingsShown` field** — captures values like "1 of 3", "True ending only", "All routes 100%", "Normal + True". Free text on purpose — the natural value space is too varied for an enum, and a `custom` escape hatch would catch 80% of selections anyway.

### Changed

- **Editor store** v9 → v10 — additive only: `endingsShown: ""`, `languagePatch: "none"`, `languagePatchCustom: ""`, `gameVersion: "full_release"`, `gameVersionCustom: ""`, `techNotes: []` back-fills. Existing `playthroughStatus` / `difficulty` / `difficultyCustomLabel` values round-trip unchanged — only the description-builder render path moves them into the unified block. Invalid persisted enum values coerce to their skip-sentinel default; unknown `techNotes` ids are filtered out (defensive against hand-edited blobs). The `migrate` function is now extracted into a named `migrateEditorState` export so the v9→v10 path can be unit-tested without going through localStorage.
- **`ContentDetailsForm.tsx`** is removed and replaced with the v0.12 `PlaythroughNotesForm.tsx` — the new component owns all five PN fields (Run type, Difficulty + custom, Endings shown, Language patch + custom, Game version + custom) in one block, with the custom-slot inputs only appearing when their parent enum carries one. The Editor page mounts `PlaythroughNotesForm` then `ContentWarningChecklist` then `TechNotesChecklist` inside the Content Details accordion.
- **`description-builder.ts`** — the v0.7 standalone playthrough conditional (`if (input.playthroughStatus !== "none") sections.push(...)`) and the standalone difficulty conditional (`if (input.difficulty !== "none") sections.push(...)`) are gone; replaced with one call to a new `buildPlaythroughNotesSection(input, t, tEn)` helper at slot 1.5. A new `buildTechNotesSection(input, t, tEn)` helper at slot 7.5 mirrors the v0.11 content-warnings render pattern.

### Removed

- **`description.sections.playthrough` / `description.sections.difficulty`** template keys — section heading is now bullet-formatted inside the `▸ 🎮 PLAYTHROUGH NOTES` block via `description.playthroughNotes.labels.*`. The per-status / per-level value labels (`description.playthrough.{blind,replay,…}`, `description.difficulty.{easy,normal,…}`) are kept — the new block reads them for the "Run type" and "Difficulty" bullet values.
- **`ContentDetailsForm.tsx`** — superseded by `PlaythroughNotesForm.tsx`.

### Under the hood

- New `src/config/tech-note-groups.ts` carries the 5-group UI structure (`audio` / `video_quality` / `recording_issues` / `playstyle` / `production`). Engine doesn't read groups — output follows selection order — but the editor uses them to render collapsible sections.
- New `src/config/playthrough-options.ts` exports `LANGUAGE_PATCH_UI_OPTIONS` / `GAME_VERSION_UI_OPTIONS` (Select-friendly `{id, labelKey}` shapes) plus `languagePatchHasCustomSlot` / `gameVersionHasCustomSlot` predicates so the editor knows when to show the paired custom-text input.
- `src/engine/types.ts` adds `LANGUAGE_PATCH_OPTIONS` / `LanguagePatch`, `GAME_VERSION_OPTIONS` / `GameVersion`, `TECH_NOTES` / `TechNote` const-and-type pairs, plus six new optional fields on `GeneratorInput`.
- All 6 locales (en / vi / ja / es / ko / zh) updated with `description.playthroughNotes.{header,intro,labels,languagePatchOptions,gameVersionOptions}` + `description.techNotes.{header,intro,items}` (24 items) + matching editor short labels (`editor.playthroughNotes.*`, `editor.techNoteOptions.*`, `editor.techNoteGroups.*`). `validate:locales` clean at 585 ui + 316 templates per locale.
- Engine tests grow by 14 cases: PN block bullet formatting (en single-language, all five filled), PN block omission when every field is empty, regression that the old standalone `🎯 Playthrough:` and `🎮 DIFFICULTY` lines no longer render, custom-difficulty label passthrough, custom-difficulty blank-label skip, PN bilingual VI mode, PN with `languagePatch: official_other` + custom slot, PN with `gameVersion: custom` + custom slot, TN selection-order preservation, TN bilingual VI / JA modes, TN single-language fallback when `tEn` omitted, TN block omission when list is empty. Plus a new `tests/store/editor-store.migrate.test.ts` with 9 cases covering the v9→v10 migration: default back-fills, preservation of existing playthrough / difficulty / contentWarnings, invalid enum coercion, unknown tech-note id filtering, idempotency on a v10 blob, and null / undefined handling. Full suite: 329 / 329 green.
- Bundle: main chunk 345.85 KB raw / 115.78 KB gzipped (under the 500 KB constraint).

### Migration notes

- No manual action required. First launch after upgrade migrates state in place: pre-v0.12 drafts gain the new PN + TN field defaults; existing `playthroughStatus` / `difficulty` keep their values, the description just renders them under the unified PN header now.
- The Tauri single-instance fix only takes effect after a fresh install of the v0.12 build; existing v0.11 desktop installs need to be uninstalled / replaced. Web builds are unaffected.

## v0.11.0 — 2026-05-06

Three independent features: vendor-aware graphics dropdowns (DLAA + XeSS Ultra Quality joined the ladder, multipliers cap per vendor), a third-party advertising block driven by a per-profile copy field, and a major content-warning overhaul — the v0.7 trio (`spoilerWarning` / `matureWarning` toggles + 3-item checklist) becomes a unified bilingual checklist of 44 items across 5 categories with `EN · output-language` rendering and asterisk-masked Vietnamese terms for YouTube ToS safety.

### Added

- **Vendor-aware upscaling & frame-gen options** — when the creator picks an FG vendor, the upscale-quality and frame-gen-multiplier dropdowns filter to that vendor's actual ladder. NVIDIA exposes DLAA + Quality / Balanced / Performance / Ultra Performance and goes up to x4 multi-frame-gen; AMD keeps FSR Native AA + 4 quality bins and caps at x3 (FSR 3.1); Intel adds XeSS Ultra Quality (its own tier) and ships only x2 (XeFG). Description-builder uses vendor-keyed full labels — `NVIDIA DLAA`, `AMD FSR Quality`, `Intel XeSS Ultra Quality`, `AMD Fluid Motion Frames x3` — instead of the old "brand prefix in code" pattern, so `dlaa` reads `NVIDIA DLAA` not `NVIDIA DLSS DLAA`. Pre-v0.11 drafts / presets / templates with stale combos (e.g. NVIDIA + `native_aa`) coerce to `none` on rehydrate via `coerceUpscaleQuality` + `coerceFrameGenMultiplier` in `src/engine/graphics-vendor.ts`.
- **Third-party advertising block** — new `showThirdPartyAds` toggle in Settings → Description renders a `🤝 SPONSORS & PARTNERS` block in the description, sourced from a new `thirdPartyAdText` Textarea on the channel Profile (multi-line preserved verbatim). Block is gated on toggle ON AND profile field non-empty; toggling on without text is a no-op and surfaces an inline hint pointing the user to Profiles → Edit. Per-profile (not per-video) — partner copy is channel-stable.
- **Bilingual content-warning checklist** — replaces `WarningToggles` with `ContentWarningChecklist`: a searchable, collapsible-grouped checkbox grid covering 44 items across Spoilers / Photosensitive / Phobias / Mental health / Mature & Sensitive. Description format becomes `▸ ⚠️ CONTENT WARNINGS / CẢNH BÁO NỘI DUNG` header (bilingual when output language ≠ English), a two-line intro, then bullets `• {EN} · {local}` separated by U+00B7 MIDDLE DOT — matches the visual format in the v0.11 spec exactly. Selection order is preserved in the rendered output. Vietnamese translations apply asterisk masking on YouTube-ToS-prone terms (`t* tử`, `x*m h*i t*nh d*c`, `g*ết người`, `b*o h*nh`, `ng*y h*i`); other locales use clinical wording (`Sexual assault references`, `Self-harm / suicide themes`, `Violence against minors`).

### Changed

- **Editor store** v8 → v9 (three concerns rolled into one bump): `thirdPartyAdText: ""` default, legacy `spoilerWarning: true` → push `"spoiler_story"` into `contentWarnings` (same for `matureWarning` → `"mature_18plus"`), and vendor-incompatible upscale-quality / multiplier combos coerce to `"none"`. `normalizeEditorPatch` runs the same coercion + boolean-merge logic on every `loadProfile` / `loadPreset` / `loadTemplate` call so legacy snapshots round-trip cleanly.
- **Settings store** v8 → v9 (additive — `showThirdPartyAds: false` default; healed via `initialSettings` spread).
- **Profile store** unversioned → v1 (additive — `thirdPartyAdText: ""` back-fill for pre-v0.11 profiles).
- **Template store** unversioned → v1 (vendor-quality coercion on persisted snapshots).
- **`UPSCALE_QUALITIES`** enum gains `"dlaa"` and `"ultra_quality"`. The flat enum stays — vendor filtering happens at the UI / engine layer via `getValidUpscaleQualities(vendor)` so storage shape doesn't fork per vendor.
- **`ContentDetailsForm`** drops its content-warning ChipGroup (the new `ContentWarningChecklist` mounted in the Editor's Content Details accordion is the new home). Playthrough + difficulty stay where they were.
- **`description-builder`** drops the v0.7 "skip brand on second mention" optimization — both halves of `upscale + framegen` now carry the brand. Worth the mild verbosity for AMD / Intel: AMD's frame-gen brand is `Fluid Motion Frames` (not `Frame Generation`), Intel's is `XeFG`; the old code emitted `Frame Generation` regardless. The 3 separate warning blocks (`spoilerWarning` header, `contentWarnings` bullet list, `matureWarning` header) collapse into one unified bilingual block, placed at the same description position.

### Removed

- **`WarningToggles.tsx`** — superseded by `ContentWarningChecklist.tsx`. Editor-state fields `spoilerWarning` / `matureWarning` stay (marked `@deprecated`) so v8-shaped persisted drafts round-trip through the migration without data loss; they're no longer exposed in the UI and no longer drive description rendering.
- **`description.sections.spoilerWarning` / `matureWarning` / `contentWarnings`** template keys — section heading lives at `description.contentWarnings.header` now. The old per-warning `description.contentWarnings.{flashing_lights,loud_noises,jump_scares}` keys moved under `description.contentWarnings.items.*` alongside 41 new entries.

### Under the hood

- New `src/engine/graphics-vendor.ts` exports `getValidUpscaleQualities` / `getValidFrameGenMultipliers` / `coerceUpscaleQuality` / `coerceFrameGenMultiplier` — pure functions reused by the editor-store migration, the template-store migration, `normalizeEditorPatch`, the `VideoSettingsForm` Select option lists, and the `handleVendorChange` reset path so changing vendors mid-edit doesn't leave the Selects stuck on a stale value.
- New `src/config/content-warning-groups.ts` carries the 5-group UI structure (`spoilers` / `photosensitive` / `phobias` / `mental_health` / `sensitive`). Engine never reads the groups — output ordering follows user selection — but the editor uses them to render collapsible sections with per-group counts so 44 items stay scannable.
- `BuildDescriptionOptions` extends with `tEn?: TranslationFn` — the engine stays framework-agnostic; the caller (`use-generated-output`) builds it via `i18next.getFixedT("en", "templates")` and passes it in alongside the locale-fixed `t`. Falls back to `t` when omitted, so existing callers / unit tests keep working.
- All 6 locales (en / vi / ja / es / ko / zh) updated with vendor-keyed `description.graphics.upscale.{vendor}.{q}` + `description.graphics.frameGen.{vendor}.{m}` maps, vendor-keyed editor short labels (`editor.upscaleQuality.{vendor}.*` / `editor.frameGenMultiplier.{vendor}.*`), 5 group headings, 44 bilingual warning items, 44 short editor labels, plus `settings.showThirdPartyAds` / `settings.thirdPartyAdsHint` and `profiles.thirdPartyAdText{,Placeholder,Help}`. `validate:locales` clean at 529 ui + 274 templates per locale.
- Engine tests grow by 9 cases: vendor-aware DLAA / XeSS Ultra Quality / AMD label rendering, content-warning bilingual EN · VI block, EN-only single-language output, single-language fallback when `tEn` is omitted, censoring snapshot for VI, third-party-ads gating (toggle on + text non-empty, toggle off + text non-empty, toggle on + text empty), multi-line preservation, and selection-order preservation. Two legacy-deprecation tests replace the old `spoilerWarning` / `matureWarning` standalone-block tests. Full suite: 310 / 310 green.
- Bundle: main chunk 313 KB (under the 500 KB constraint).

### Migration notes

- No manual action required. First launch after upgrade migrates state in place: pre-v0.11 drafts with `spoilerWarning: true` / `matureWarning: true` get the equivalent items checked in `contentWarnings`; vendor-incompatible upscale combos coerce to `none`; profile / settings stores back-fill their new defaults.
- Channel partners / affiliates: the toggle in Settings → Description does nothing until you fill `Third-party ad copy` in your profile (Profiles → Edit). The inline hint in Settings calls this out when the toggle is on but the text is empty.

## v0.10.0 — 2026-05-05

Three independent features shipped in [#44](https://github.com/poli0981/youtube-generator/pull/44): a publisher-name tag for the Store Links editor, a hotfix for the live web build that had been serving a blank page since the v0.5 scaffold, and a vertical collapsible sidebar with a new About page.

### Added

- **Pub/Dev Name → tag** ([#44](https://github.com/poli0981/youtube-generator/pull/44)) — when the `Publisher / Developer site` URL is filled in, a free-text "Pub/Dev Name" input appears underneath. Whatever the user types becomes a bare YouTube tag (e.g. `Ubisoft`, `FromSoftware`) via the existing dedup + 30-char trim pipeline. Independent from `sponsorName` / `sponsorPlatform`, which still drive the description's "🎁 Thanks to …" line — different semantic, different output.
- **Vertical collapsible sidebar** ([#44](https://github.com/poli0981/youtube-generator/pull/44)) — replaces the horizontal top tab bar. Hamburger toggle (`PanelLeftClose` / `PanelLeftOpen` from lucide), `w-56 ↔ w-14` width transition, persisted across reloads via the settings store. `Ctrl+B` shortcut wired (VS Code convention) and surfaced in the keyboard help cheatsheet.
- **About page** ([#44](https://github.com/poli0981/youtube-generator/pull/44)) — new `/about` route with app metadata (version pulled live from `package.json`), repo / issues / author / license links, configurable social links (YouTube / X / Discord / Ko-fi / Patreon — empty entries hide their row), and a third-party credits list with versions read live from `package.json` deps. shadcn/ui evaluated and skipped — would have forced a 10+ component retrofit and a token-system swap (`--background` / `--foreground` / `--primary`) for one feature.

### Fixed

- **GitHub Pages white page** ([#44](https://github.com/poli0981/youtube-generator/pull/44)) — the deployed site at `https://poli0981.github.io/youtube-generator/` was blank because Vite's `base` was hardcoded to `/yt-desc-gen/` (an old project name carried over from the v0.5 scaffold). Every asset 404'd. Aligning the base with the actual repo name unblocks the live web build. `public/.nojekyll` added defensively.

### Changed

- **Editor store** v7 → v8 (additive — `pubDevName: ""` default).
- **Settings store** v7 → v8 (additive — `sidebarCollapsed: false` default; healed automatically through `initialSettings` spread).
- **AppShell** layout changed from `flex flex-col` (`Header` / `TabBar` / `main`) to a left-sidebar / right-pane (`Sidebar` / `Header` / `main`). Header stays at the top of the right pane.

### Under the hood

- `tag-generator.ts` gains a `pubDevName` step before the dedup pass; reuses `tagFriendlyGameName(name, 30)` for the per-tag char limit. 4 new tag-generator tests cover emission, empty / whitespace skip, dedup against `sponsorName`, and over-long truncation.
- `TabBar.tsx` renamed to `Sidebar.tsx` (`git mv` to preserve blame).
- New `src/config/about.ts` (single source of truth for app metadata + socials) and `src/config/third-party.ts` (credits with versions auto-derived from `package.json`).
- All 6 locales (en / vi / ja / es / ko / zh) updated with `editor.pubDevName` + `editor.pubDevNamePlaceholder` (F1), plus `tabs.about`, `sidebar.{expand,collapse}`, the full `about.*` namespace including `about.socials.*`, and `shortcuts.toggleSidebar` (F3). `validate:locales` clean at 448 / 448 keys.
- Full suite: 301 tests green; main bundle 277 KB.

### Migration notes

- No manual action required. First launch after upgrade heals any missing keys in place.
- Pre-v0.10 drafts get `pubDevName: ""` and `sidebarCollapsed: false` by default — the fields only become visible once the user fills the publisher URL or toggles the sidebar.

## v0.9.0 — 2026-05-03

Two-phase release. Phase 1 covered the gacha video type and four new URL extractors with a typed-name-mismatch banner; phase 2 wrapped the version with a QoL trio and a four-platform CI release matrix. PRs that landed: [#37](https://github.com/poli0981/youtube-generator/pull/37) (phase 1 B2), [#40](https://github.com/poli0981/youtube-generator/pull/40) (phase 1 B1, re-ship of #38), [#41](https://github.com/poli0981/youtube-generator/pull/41) (phase 2).

### Added

- **Gacha-quest video type** ([#40](https://github.com/poli0981/youtube-generator/pull/40)) — new `VideoType: "gacha_quest"` with a 17-value `gachaQuestType` enum grouped by use case (Story / Events / Tutorial-Trial / Endgame-Multiplayer / Showcase) plus free-form `chapterName` and `questName` extras. `partNumber` is reused, with the suffix wording driven by quest type — `main_story` → `"- Part N"`, `anniversary` + `daily_commission` → `"- Day N"`, `endgame` → `"- Floor N"`, every other quest type drops the suffix. Per-quest-type title format and intro template, single shared pinned-comment greeting.
- **4 new URL extractors** ([#37](https://github.com/poli0981/youtube-generator/pull/37)) — Epic Games Store (locale-prefixed `/p/<slug>`, strips trailing 6+-char hex hash), Nintendo US (`/us/store/products/<slug>`, strips `-switch` / `-switch-2` platform suffix), Nintendo EU (`/<locale>/Games/<segment>/<slug>-<id>.html`, strips trailing numeric id), and Humble Bundle. PlayStation / Xbox / Amazon Luna stay unsupported because their canonical URLs use opaque product IDs.
- **Name-mismatch warning banner** ([#37](https://github.com/poli0981/youtube-generator/pull/37)) — `StoreLinkEditor` shows a reactive banner above the platform grid when any filled link extracts to a name whose tokens aren't a subset of the typed Game Name. New `isLinkNameMismatch(gameName, url)` helper applies a subset-tolerant token comparison; apostrophes are stripped (not spaced) so `Marvel's` matches `Marvels` in Steam slugs. Per-pair dismissal (`gameName|url` fingerprint); banner re-shows automatically when either side changes.
- **Keyboard-shortcuts cheatsheet** ([#41](https://github.com/poli0981/youtube-generator/pull/41)) — bare `?` key now opens the existing modal (Ctrl+/ still works); the `?` handler skips firing when the keydown target is an input / textarea / select / contentEditable element. The modal grows a search input that filters by translated label OR by the literal key combo string.
- **Genre selector search + bulk-toggle** ([#41](https://github.com/poli0981/youtube-generator/pull/41)) — case-insensitive substring filter above the chip group, plus three bulk-select buttons ("All RPGs" / "All Shooters" / "All Horror") that replace the current selection with the first `MAX_GENRES` (3) ids of the matching `GENRE_GROUPS` entry. Filter clears on bulk-toggle.

### Changed

- **Editor store** v6 → v7 (additive — gacha extras `gachaQuestType` / `chapterName` / `questName`).
- **TemplateSnapshot** — extends with the gacha extras as optional so legacy templates load cleanly.

### CI / Release

- **`release-desktop.yml`** ([#41](https://github.com/poli0981/youtube-generator/pull/41)) grows from a Windows-only build to a four-entry matrix: `windows-latest`, `macos-13` (Intel), `macos-14` (ARM), `ubuntu-latest`. `fail-fast: false` so one platform breaking doesn't cancel the others. Linux runner installs `libwebkit2gtk-4.1-dev` + companions for Tauri's webview + AppImage tooling. `tauri-action@v0` collects all artifacts onto a single draft GitHub Release named `YTDescGen v__VERSION__`. No code signing; release notes come from the tag message.

### Under the hood

- New `src/config/gacha-quest-types.ts` houses the 17-value enum, display-order grouping, and the per-quest-type partNumber suffix style map (`GACHA_PART_SUFFIX_STYLES`).
- New `src/config/genres.ts:GENRE_GROUPS` typed `Record<GenreGroupId, readonly GenreId[]>` drives the bulk-toggle buttons.
- All 6 locales updated: 428 ui + 203 template keys each (up from 391 + 164 in v0.8). en + vi fully translated; ja / es / ko / zh seeded with English placeholders for the new strings.
- Full suite: 297 tests green; main bundle 270 KB.

### Migration notes

- No manual action required. First launch after upgrade heals any missing keys in place.
- Pre-v0.9 drafts get `gachaQuestType: "main_story"` and empty `chapterName` / `questName` defaults. The fields only matter when `videoType === "gacha_quest"`.

## v0.8.1 — 2026-05-02

Patch release fixing a v0.8 regression in the genre-playlist suggestion feature.

### Fixed

- **Genre-playlist URL validator** ([#36](https://github.com/poli0981/youtube-generator/pull/36)) accepted only `https://www.youtube.com/playlist?list=…` with the literal `www.` subdomain and rejected any extra query parameters. Real share URLs from YouTube emit `https://youtube.com/…` (no `www.`) or `…&si=…` tracking params, both of which silently failed validation and the `ValidatedInput` component then wiped the entry from the settings store. Now accepts: optional `www.`, `list=…` at any position in the query string with sibling params before/after, and a trailing fragment. `watch?v=…` and `youtu.be/…` short URLs still rejected (path must be `/playlist`).

### Under the hood

- 4 new validation tests cover the relaxed regex (no-www, mixed query order, trailing fragment, `&si=` tracking suffix). Full suite: 253 tests green.

## v0.8.0 — 2026-05-02

Three-PR release covering graphics rebuild, livestream support, pinned-comment polish, and Vietnamese-specific donate fields. PRs that landed: [#32](https://github.com/poli0981/youtube-generator/pull/32) (phase 1), [#33](https://github.com/poli0981/youtube-generator/pull/33) (phase 2), [#34](https://github.com/poli0981/youtube-generator/pull/34) (polish), [#35](https://github.com/poli0981/youtube-generator/pull/35) (version bump).

### Added

- **Graphics Settings v2** — preset is now an enum (`Low` → `Extreme` + `Custom`) instead of free-form text, default `Medium`. New multi-select **Ray Tracing** modes (Ray Tracing / Full Ray Tracing / Path Tracing / Ray Reconstruction), **Frame Generation** vendor + multiplier (NVIDIA / AMD / Intel × x2 / x3 / x4 / x6), **Upscaling Quality** (DLSS / FSR / XeSS quality presets), **Art Style** dropdown, free-form **Driver / Game Version** field, and a **Skip-graphics toggle** for 2D / pixel-art / web games (auto-suggested when a `visual_novel` / `fmv` / `rhythm` genre is added). Description renders a labelled multi-line block: `Video: 1080p - 60 FPS` / `In-game Setting: Cinematic - NVIDIA Frame Generation x2 with Ray Tracing` / `Art Style: …` / `Version: …`.
- **Livestream** — new VideoType with `liveUrl` + `scheduledTime` extras. Title gets `🔴 LIVE` segment, description gets `🔴 LIVE on {{time}}` / `Watch / replay: {{link}}` block (locale-aware datetime via `Intl.DateTimeFormat`), tag pool gets `livestream` / `live gameplay` / `${gameName} live` / `${gameName} stream`, pinned-comment template gets a livestream-specific greeting.
- **Pinned-comment genre playlists** — Settings → Genre Playlists section configures one YouTube playlist URL per genre. When the new `pinnedCommentIncludeGenrePlaylist` toggle is on, the template auto-suggests `📺 More <genre> gameplay on the channel: <link>` for the video's primary genre.
- **Vietnamese donate** — five new editor fields (bank name, account number, account holder, MoMo, ZaloPay) in a new `VietnameseDonateEditor` component. Description block `🏦 CHUYỂN KHOẢN / VÍ ĐIỆN TỬ (Việt Nam)` only renders when output language is `vi`; bank line drops the parens when holder is empty; e-wallet lines render independently.
- **Mod List textarea** — new `modList` field exposed alongside `modName` for the `mods` videoType. Description gets a `🧩 MOD LIST` block right after MY RIG.
- **Publisher / Developer site** — 10th store-link platform with a permissive HTTPS pattern for indie / niche releases.
- **URL paste auto-extract** — pasting a Steam / itch.io / GOG URL into a store-link input auto-fills an empty Game Name with a 5s Undo toast. Other storefronts skipped because their URL slugs aren't stable.
- **YouTube playlist URL validator** — `validatePlaylistUrl` for the editor's playlist-link field and the new Genre Playlists settings. (Note: a regression in the strict regex shipped here; corrected in v0.8.1.)

### Fixed

- **Long-game-name tag bug** ([#32](https://github.com/poli0981/youtube-generator/pull/32)) — composite tags built from a long game name (`Tony Hawk's Pro Skater 1+2 Remastered: Definitive Edition`) used to silently disappear because they exceeded YouTube's 30-char per-tag limit. New `tagFriendlyGameName` helper strips trademark marks + edition qualifiers, then composes ≤21-char form for composite tags + bare ≤30-char form. The game name now always lands in the tag list.

### Changed

- **Editor store**: v4 → v5 (graphics enum + livestream + new fields, legacy `graphicsPreset` text mapped via `legacyGraphicsPresetToEnum`); v5 → v6 (additive — VN donate fields + modList).
- **Settings store**: v6 → v7 (additive — `genrePlaylists` map + the new pinned-comment toggle).
- **TemplateSnapshot** — extended to capture the v0.7 phase 2 fields that had been missing (`playthroughStatus`, `difficulty`, `difficultyCustomLabel`, `contentWarnings`) plus all v0.8 fields. Saving a template now preserves full editor state.
- **Video Settings description block** — was a single pipe-separated line `1080p | 60 FPS | Cinematic Setting - …`, now multi-line with explicit labels matching the rig + timestamps shape.

### Under the hood

- New `src/config/graphics-settings.ts` houses every graphics-related enum + the `GENRES_WITHOUT_GRAPHICS_SETTINGS` allowlist for the auto-suggest hint.
- New `src/utils/url-extractors.ts` implements Steam / itch.io / GOG slug extraction with a shared `titleCase` helper.
- Brand-name table (`VENDOR_GFX_BRANDS`) is engine-internal and English-only across locales (DLSS / FSR / XeSS preserved verbatim for SEO).
- All 6 locales updated: 391 ui + 164 template keys each. Vietnamese fully translated; ja / es / ko / zh seeded with English defaults for the new strings.
- Full suite: 249 tests green; main bundle 239 KB.

### Migration notes

- No manual action required. First launch after upgrade heals any missing keys in place.
- Pre-v0.8 free-form `graphicsPreset` text values map automatically: known labels ("Ultra", "Very High", …) become enum values; anything else lands in the new Custom slot ("Epic" → `graphicsPreset: "custom"` + `graphicsPresetCustom: "Epic"`).
- Existing `Profile` and `TemplateSnapshot` shapes are TS-extended to the v0.8 enum types; legacy on-disk values round-trip via `normalizeEditorPatch` on `loadProfile` / `loadPreset`.

## v0.7.0 — 2026-04-24

Two-phase release. Phase 1 landed as [#30](https://github.com/poli0981/youtube-generator/pull/30); this entry is cumulative across both phases.

### Added

- **Title format settings** (phase 1): configure where the quality badge sits (`prefix` / `middle` / `suffix`), which separator joins the segments (`—` / `-` / `:` / `|`), and the badge case (`2K` / `2k`). Defaults reproduce v0.6 output byte-for-byte. Setting the trio to `prefix` + `hyphen` + `lower` produces e.g. `[2k] - Elden Ring - phần 1 - Gameplay No Commentary`.
- **Settings page reorganized** (phase 1) from 5 → 7 sections: Appearance, Language & Defaults, Editor, **Title**, **Description**, Tags, History.
- **Content Details** (phase 2): three new editor fields for framing a run.
  - `Playthrough status` — Blind / Replay / New Game+ / Post-game. Renders a `🎯 Playthrough: …` line right after the intro.
  - `Difficulty` — Easy / Normal / Hard / Nightmare / Custom. Custom reveals a free-form label so game-specific names like "Lethal" or "NG+7" survive a locale switch unchanged.
  - `Content warnings` — multi-select chips for Flashing lights / Loud noises / Jump scares. Renders a `⚠️ CONTENT WARNINGS` bulleted block between spoiler and mature warnings.
- **Pinned-comment template system** (phase 2): opt-in Settings toggle generates a ready-to-paste pinned comment per video. Per-video-type greetings (boss / ending / speedrun / …) sit atop four shared CTA lines (thanks / playlist / engage / ask-next-game). Shown as a third section on the Output page alongside the user's freeform pinned comment; Batch generates one per part per language with its own copy button.

### Changed

- **Settings store**: v4 → v6. Heal migration back-fills `titleFormat` (v4→v5) and the two pinned-comment toggles (v5→v6) with sensible defaults — upgrading from v0.6 requires no manual action.
- **Editor store**: v3 → v4. Heal migration back-fills `playthroughStatus`, `difficulty`, `difficultyCustomLabel`, and `contentWarnings` — existing drafts round-trip cleanly.
- **Shared `useCurrentGeneratorInput` hook**: the editor → `GeneratorInput` shape used to be copy-pasted across four call sites (two hooks + Batch + OutputExtras). Extracted into one hook; future input-field additions now touch one file instead of four.
- **`buildTitle` options bag**: third arg accepts either the legacy boolean (`showQualityBadge`) OR a full options object. Legacy callers (including `title-variants.ts`) don't need to change.

### Fixed

- `useMultilangOutput` was silently missing `showSponsorCredit` and the sponsor fields on its built `GeneratorInput`, so multi-language output hid the sponsor credit line even when the setting was on. Fixed while threading the new `titleFormat` options through.

### Under the hood

- `engine/types.ts` gained `TitleFormatConfig`, `PlaythroughStatus`, `DifficultyLevel`, `ContentWarning` + the const-tuple ID registries that back them. Engine stays pure; `store/settings-heal.ts` re-exports.
- New pure module `engine/pinned-comment-builder.ts` (10 unit tests).
- Description builder gained 9 new cases; title builder has 10 new options-bag cases; settings-heal has 5 new migration cases. Full suite: 175 tests green.
- All 6 locales (`en`, `vi`, `ja`, `es`, `ko`, `zh`) now in sync at 314 UI + 125 template keys each.

### Migration notes

- No manual action required. First launch after upgrade heals any missing keys in place.
- If you've been hand-editing `settings.json` or `ytdescgen-editor-draft.json`, the new optional fields will be back-filled to sensible defaults (playthrough/difficulty default to `"none"` → section is skipped; content warnings default to `[]`; pinned-comment template defaults to off).
