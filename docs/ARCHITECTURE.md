# Architecture Document

## YTDescGen — Technical Architecture

Reflects **v1.0.0**. Implementation details (configs, interfaces, file formats, CI) are in [TECH-SPEC.md](TECH-SPEC.md); desktop and Android builds in [PACKAGING.md](PACKAGING.md); running the web deployment in [HOSTING.md](HOSTING.md).

---

## 1. High-Level Architecture

```
┌────────────────────────────────────────────────────────────────────┐
│                         Presentation Layer                         │
│  Pages: Editor · Output · Profiles · History · Settings · Batch    │
│         Social · Playlist · Logs · About · Legal (+ error pages)   │
│  Shell: Sidebar · Header · MobileNav · CommandPalette (cmdk)       │
│  Components: ui/ (Radix, Motion, sonner) · editor/ · output/       │
│              backup/ · profiles/ · presets/ · templates/ · …       │
├────────────────────────────────────────────────────────────────────┤
│                         Application Layer                          │
│  Hooks: useGeneratedOutput · useRenderOptions · useOutputCopy      │
│         useOutputLimits · useStrictBlock · useSaveToHistory · …    │
│  Stores (Zustand): editor · profiles · presets · templates         │
│         history · settings · logs · pending-invalid                │
│  i18next: 8 locales — en bundled, the other seven lazy-loaded      │
│  utils/: backup/ · library-apply · store-paste · file-ops          │
│          native · log-storage · validation · …                     │
├────────────────────────────────────────────────────────────────────┤
│         Core Engine Layer — src/engine/ (pure TypeScript)          │
│  renderAll() in template-renderer                                  │
│    ├─ title-builder                                                │
│    ├─ description-builder ── rig-block · timeline-parser           │
│    │                         channel-phrase · endings-format       │
│    └─ tag-generator                                                │
│  Also: title-variants · limits · social-post-builder               │
│        pinned-comment-builder · playlist-builder · graphics-vendor │
├────────────────────────────────────────────────────────────────────┤
│                        Infrastructure Layer                        │
│  localStorage (every platform) · Clipboard API                     │
│  Web: File System Access API or a download                         │
│  Tauri: name-only Rust commands (backups, logs) · Save/Open        │
│         dialogs run from Rust · opener plugin (external links)     │
└────────────────────────────────────────────────────────────────────┘
```

The same source ships two ways:

```
                 One React source (src/), two Vite builds
                  ┌──────────────────┴───────────────────┐
                  ▼                                      ▼
┌──────────────────────────────────┐   ┌──────────────────────────────────┐
│ Web — ytgenerator.stream         │   │ Tauri 2 — desktop and Android    │
│ BrowserRouter (real paths)       │   │ HashRouter (asset protocol)      │
│ Build adds: static /legal pages, │   │ Build (TAURI_ENV_PLATFORM set):  │
│   security.txt, analytics beacon │   │   es2020 target, no analytics    │
│ Cloudflare Worker (worker/):     │   │ Rust core (src-tauri/):          │
│   Turnstile gate · headers ·     │   │   name-only file commands,       │
│   /legal/* · static assets       │   │   native dialogs, tray (desktop) │
│ Data: the browser's localStorage │   │ Data: WebView localStorage +     │
│                                  │   │   app data dir (backups, logs)   │
└──────────────────────────────────┘   └──────────────────────────────────┘
```

**Routing.** `App.tsx` picks the router at runtime: `BrowserRouter` on the web — the Worker serves the app shell for every route, and Web Analytics counts page views by path — and `HashRouter` inside Tauri, whose asset protocol has no server-side fallback. Before the router reads the URL, `main.tsx` rewrites an old web bookmark (`/#/output` → `/output`); Tauri keeps hash URLs.

**Route tree.** `/legal` and `/legal/:docId` (the Legal Center) sit outside the consent guard, so the consent screen can open each document. Everything else is inside `ConsentGuard`, a layout route that renders `ConsentGate` until the user has accepted the current terms version (`CURRENT_TERMS_VERSION` = 2 since v1.0.0). Inside it, `AppShell` holds the pages: the Editor (index route) stays in the entry bundle; Output, Profiles, History, Settings, Batch, Social, Playlist, Logs and About are `React.lazy` chunks, each wrapped in its own `ErrorBoundary` + `Suspense` so a crash on one page cannot blank the app. On the web, `/legal/<id>` loaded directly is the Worker's static page; navigated to inside the app, it is the Legal Center — the same URL either way.

**App shell.** `AppShell` combines a collapsible `Sidebar`, the `Header` top bar (output and interface languages, theme), `MobileNav` (a bottom bar on phones, with a "More" drawer), and three lazily loaded pieces: the ⌘/Ctrl + K `CommandPalette` (cmdk), the shortcut help and the backup `RestoreDialog`, mounted only while a restore is pending. UI primitives in `components/ui/` wrap Radix (Dialog, AlertDialog, Popover, Tooltip, Tabs, Switch, Checkbox, ToggleGroup); animation is Motion behind `LazyMotion` (its feature bundle loads after first paint, and `MotionConfig reducedMotion="user"` honours the OS setting); toasts are sonner.

**Error pages (v0.27).** `components/errors/` holds a reusable `ErrorPage` (404/403/419/500/offline/runtime) driven by the pure `config/error-pages.ts` map. The error routes (`/403`, `/419`, `/500`, `/offline`, catch-all `*`) are **siblings of the `AppShell` route group** inside the consent guard, so they render full-screen without the shell. `ErrorPage` is router-agnostic — Home is a plain location change (`/` on the web, `#/` in Tauri) and Back is `history.back()` — so the root `ErrorBoundary`, mounted in `main.tsx` outside the router, reuses it as its crash fallback.

**Start-up.** Before first paint:

1. `public/theme-init.js` (a plain script in `index.html`) applies the saved theme and sets `<html lang>` to the saved UI language, so a light-theme user sees no dark flash.
2. `main.tsx` rewrites old hash URLs (web), carries over a terms acceptance from the gate page's `ytg_terms` cookie (web), and registers a one-time reload for chunk files that a new deploy removed (`vite:preloadError`).
3. It loads the saved UI and output languages (capped at 2 s), applies the theme class, installs the external-link handler (Tauri: links open in the system browser through the opener plugin), then renders.

After mount, `App.tsx` starts a first-run draft in the Default Output Language, runs the Tauri data chores (`startAppData()`: legacy-file recovery, then automatic backups on desktop) before loading the persisted logs, prefetches the Output page when the browser is idle, and keeps i18next in step with the `appLanguage` setting.

## 2. Core Engine Design

The engine holds all generation logic with **zero framework dependency**: no React, no DOM, no storage, no clipboard. Every function is pure — typed input in, string (or list) out. Values from the environment come from the caller: the translator `t`, and the year for the copyright line and trending tags (the builders fall back to the current year when it is omitted).

| Module                                             | Role                                                                                                                                                     |
| -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `template-renderer.ts`                             | `renderAll(input, t, options)` → `GeneratorOutput`: title + description + tags, character counts, over-limit warnings                                    |
| `title-builder.ts`                                 | Titles: video-type segment, quality badge (position, case), separator, order (game first / video first)                                                  |
| `title-variants.ts`                                | Three alternative title shapes, each built by `buildTitle` with a different order / badge position                                                       |
| `description-builder.ts`                           | The description, block by block (intro, timestamps, store links, video settings, rig, warnings, notes, donate, social, community, contact, copyright, …) |
| `tag-generator.ts`                                 | Tag pools, de-duplication, YouTube's own tag-length count (`youtubeTagsLength`) and trimming                                                             |
| `timeline-parser.ts`                               | Timestamps → translated chapter lines; YouTube's chapter rules (`checkChapters`); "Tidy up" (`normalizeTimeline`)                                        |
| `channel-phrase.ts`                                | Drops "on {{channelName}}" (per language) when the channel name is empty                                                                                 |
| `rig-block.ts`                                     | The rig as localised `Label: value` lines in a fixed order (description and social captions)                                                             |
| `endings-format.ts`, `graphics-vendor.ts`          | Endings lists split across videos; valid upscaler / frame-generation options per vendor                                                                  |
| `limits.ts`                                        | Over-limit status per field, Copy All rules, `<` / `>` detection                                                                                         |
| `social-post-builder.ts`                           | Captions for TikTok, YouTube Shorts, Instagram Reels, Facebook Reels, X (weighted count), Threads, Bluesky                                               |
| `pinned-comment-builder.ts`, `playlist-builder.ts` | Pinned comment; playlist title, description and comment                                                                                                  |
| `types.ts`                                         | `GeneratorInput`, `GeneratorOutput`, `YT_LIMITS`, the option unions                                                                                      |

### 2.1 Type Definitions (`engine/types.ts`)

```typescript
// ── Video types (20) ──
// prettier-ignore
type VideoType =
  | "full" | "part" | "full_demo" | "demo_part"
  | "boss" | "boss_nohit" | "ending" | "speedrun" | "100percent"
  | "dlc" | "newgame_plus" | "challenge" | "side_quest" | "secret"
  | "comparison" | "guide" | "mods" | "collectibles" | "livestream" | "gacha_quest";

// ── Genres (42, up to 3 per video — MAX_GENRES) ──
// prettier-ignore
type Genre =
  | "action" | "hack_slash" | "beatemup" | "platformer"
  | "horror" | "survival_horror" | "psychological_horror"
  | "rpg" | "jrpg" | "action_rpg" | "crpg"
  | "fps" | "arena_shooter" | "tactical_fps" | "boomer_shooter" | "extraction_shooter" | "shmup"
  | "openworld" | "indie" | "soulslike" | "racing" | "story" | "simulation" | "city_builder"
  | "fighting" | "stealth" | "survival_craft" | "roguelike" | "metroidvania" | "mmo"
  | "rhythm" | "puzzle" | "tower_defense" | "card_game" | "deck_builder" | "auto_battler"
  | "battle_royale" | "tactical" | "space" | "farming" | "fmv" | "visual_novel";

// ── Supported languages (8) ──
type SupportedLanguage = "en" | "vi" | "ja" | "es" | "ko" | "zh" | "pt-BR" | "id";

// ── Input (abridged — about 75 fields) ──
interface GeneratorInput {
  // Core
  videoType: VideoType;
  language: SupportedLanguage;
  genres: Genre[];

  // Game and channel
  gameName: string;
  gameNameLocalized?: Partial<Record<SupportedLanguage, string>>;
  channelName: string; // may be empty
  platform: string;

  // Video-type specific: partNumber, bossName, dlcName, challengeName, modName, modList,
  // liveUrl, scheduledTime, gacha quest fields …
  // Video settings: resolution, fps, graphicsPreset, ray tracing, frame generation,
  // upscaling, artStyle, videoStyleEra, versionInfo …
  // Content: timestamps, playlistLink, emails, music, sponsor, publisher, content warnings,
  // tech notes, playthrough notes, endings, playtest, community links …

  // Deprecated since v0.11 (folded into contentWarnings), kept for old drafts
  spoilerWarning: boolean;
  matureWarning: boolean;

  // Links and hardware
  storeLinks: Partial<Record<string, string>>;
  storeLinkTypes?: Partial<Record<string, StoreLinkType>>; // "paid" | "free" | "demo"
  social: Partial<Record<string, string>>;
  rig: Partial<Record<string, string>>; // GPU as "gpu:<catalog id>" since v1.0.0
}

// ── Output ──
interface GeneratorOutput {
  title: string;
  description: string;
  tags: string[];
  tagString: string;
  charCounts: {
    title: number;
    description: number;
    tags: number; // YouTube's count: quotes around multi-word tags + commas
  };
  warnings: CharLimitWarning[]; // one per field strictly over its limit
}
```

### 2.2 Template Architecture

Templates are **data-driven**: every sentence the engine writes comes from the output language's `templates.json`, not from string concatenation in code. The engine interpolates `{{placeholders}}` through `t`. An excerpt of `src/i18n/locales/en/templates.json`:

```json
{
  "title": {
    "separator": " — ",
    "separators": { "emDash": " — ", "hyphen": " - ", "colon": ": ", "pipe": " | " },
    "suffix": "Gameplay No Commentary",
    "videoType": {
      "full": "",
      "part": "Part {{partNumber}}",
      "full_demo": "Demo",
      "demo_part": "Demo Part {{partNumber}}",
      "boss": "{{bossName}} Boss Fight",
      "boss_nohit": "{{bossName}} Boss No Hit"
    }
  },
  "description": {
    "intro": {
      "full": "This video features the full gameplay of {{gameName}} on {{channelName}}.",
      "part": "This video features Part {{partNumber}} of {{gameName}} on {{channelName}}."
    },
    "noCommentaryLine": "No Commentary — pure gameplay for your enjoyment.",
    "sections": {
      "timestamps": "⏱ TIMESTAMPS",
      "storeLinksBuy": "🎮 GET THE GAME (if you want to buy)",
      "storeLinksDownload": "⬇️ DOWNLOAD THE GAME (if you want to play)",
      "videoSettings": "🖥 VIDEO SETTINGS",
      "rig": "💻 MY RIG",
      "playlist": "▶️ Watch the full series: {{link}}",
      "contact": "📧 Business inquiries: {{email}}",
      "cta": "👍 Like | 🔔 Subscribe | ↗️ Share"
    },
    "rigLabels": { "cpu": "CPU", "gpu": "GPU", "ram": "RAM" }
  }
}
```

The file's top-level sections are `title`, `description`, `pinnedComment`, `hashtags`, `playlist` and `timeline` (the translated chapter keywords). When the channel name is empty, the builders render `{{channelName}}` as a placeholder slot and `channel-phrase.ts` removes the words around it, per language.

### 2.3 Tag Generator Architecture

```
generateTags(input, { includeMultilingualTags, includeTrendingTags, year })

  priority  pool                 source
  1         game name            bare tag (≤ 30 chars) + a shorter form for composites
  2         core                 CORE_TAGS_BY_LANG[language]
  3         genre                GENRE_TAG_REGISTRY[genre], for every selected genre
  4         video type           VIDEO_TYPE_TAGS[videoType]
  5         platform             PLATFORMS[].tagName ("Steam", "itch.io", …)
  6         quality              resolution / fps
  7         multilingual         MULTILINGUAL_TAGS[language]           (setting)
  8         trending             year-based, first genre only          (setting)
  9         publisher/developer  pubDevName, as a bare tag
                     │
                     ▼
  de-duplicate (case-insensitive) · drop tags over 30 characters
                     │
                     ▼
  trimToCharLimit(tags, 500): keep tags in priority order while they fit,
  measured the way YouTube measures them (youtubeTagsLength); a tag that
  doesn't fit is skipped and the shorter ones after it are still tried
```

The pools are registries — a new genre is one entry in `GENRE_TAG_REGISTRY` plus its search term in `GENRE_SEARCH_TERMS` (used by the trending tags), and `tests/engine/tag-generator.test.ts` fails if either disagrees with `config/genres.ts`:

```typescript
// engine/tag-generator.ts
export const GENRE_TAG_REGISTRY: Record<string, (gameName: string) => string[]> = {
  action: (g) => [
    `${g} action`,
    "action game no commentary",
    "action adventure gameplay",
    `${g} combat`,
  ],
  // … one entry per genre in config/genres.ts
};
```

## 3. State Architecture

```
┌────────────────────────────────────────────────────────────────────┐
│  EditorStore — "ytdescgen-editor-draft", v19                       │
│  - the draft: every form field (EditorData) + setter actions       │
│  - persists data only (editorDataOf); migrateEditorState           │
├────────────────────────────────────────────────────────────────────┤
│  ProfileStore — "ytdescgen-profiles", v3                           │
│  - profiles: Profile[] — channel fields (PROFILE_FIELDS)           │
├────────────────────────────────────────────────────────────────────┤
│  PresetStore — "ytdescgen-presets", v2                             │
│  - presets: GamePreset[] — per-game fields (PRESET_FIELDS)         │
├────────────────────────────────────────────────────────────────────┤
│  TemplateStore — "ytdescgen-templates", v2                         │
│  - templates: EditorTemplate[] — whole-form snapshots              │
├────────────────────────────────────────────────────────────────────┤
│  HistoryStore — "ytdescgen-history", v3                            │
│  - entries: HistoryEntry[] — one per video, newest first           │
│  - capped by the History Limit setting (10–500, default 100)       │
├────────────────────────────────────────────────────────────────────┤
│  SettingsStore — "ytdescgen-settings", v12                         │
│  - theme · appLanguage · defaultOutputLanguage · titleFormat       │
│  - description toggles · strictMode · copyAllIncludesTags · …      │
│  - healSettings on every load; consent and UI state never exported │
├────────────────────────────────────────────────────────────────────┤
│  LogStore — not persisted by Zustand                               │
│  - ≤ 2000 entries in memory; log-storage.ts mirrors each entry     │
│  - (web: localStorage "ytdescgen-logs"; Tauri: daily JSONL files)  │
├────────────────────────────────────────────────────────────────────┤
│  PendingInvalidStore — not persisted (v0.35)                       │
│  - typed text that is invalid and therefore not saved              │
├────────────────────────────────────────────────────────────────────┤
│  useRestoreDialog (utils/backup) — not persisted                   │
│  - the file waiting in the restore dialog                          │
└────────────────────────────────────────────────────────────────────┘
```

Every persisted store uses Zustand `persist` with `createJSONStorage(() => localStorage)` — **the only store on every platform**. The Tauri "mirror" file of earlier versions is gone (see [PACKAGING.md](PACKAGING.md) for how its leftovers are recovered). Each store exports its version and its migration function (`EDITOR_STORE_VERSION` / `migrateEditorState`, `PROFILE_STORE_VERSION` / `migrateProfilesState`, `PRESET_STORE_VERSION` / `migratePresetsState`, `TEMPLATE_STORE_VERSION` / `migrateTemplatesState`, `HISTORY_STORE_VERSION` / `migrateHistoryState`, `SETTINGS_STORE_VERSION` / `healSettings`). The migrations are idempotent and shared with backup import, which replays them from the version a file records (section 5).

### Profiles, presets and templates

`src/config/library-fields.ts` is the one list of which editor fields each kind of library item carries — the save forms, Apply, backups and imports all read it:

- **Profile** = the channel: `PROFILE_FIELDS` (channel name, emails, social, rig, resolution / fps / graphics preset, ad text, Vietnamese donate fields, community links).
- **Preset** = the game: `PRESET_FIELDS` (names, genres, platform, store links and their types, publisher, content warnings, language patch, game version, art style, the skip-graphics-settings switch, playlist link).
- **Template** = the whole form (every field since v1.0.0).
- `PER_VIDEO_FIELDS` is what belongs to one video only (boss, chapter, timestamps, pinned comment, endings, …).

`src/utils/library-apply.ts` does everything that fills or clears the editor in one go, each with Undo (the editor is snapshotted first): apply a profile / preset / template, **Next part** (part number + 1, per-video fields cleared), **New video, same game**, and **Start over** (keeps the profile fields and starts in the Default Output Language). Applying a preset for another game also clears the per-video fields. `QuickStart` (top of the editor) remembers the last profile and preset (`lastProfileId`, `lastPresetId`) and asks before overwriting filled-in fields. `src/utils/store-paste.ts` routes a store link pasted anywhere in the editor to the right store field (matching `PLATFORMS[].urlPattern`), sets the platform for the first link, and fills an empty game name from the URL (`url-extractors.ts`).

### Settings → engine options

`renderAll` is called from three places (the Output hook, the multi-language Output hook, BatchPage). Each used to hand-copy the same twelve settings fields into an options object, and they had drifted — BatchPage's copy silently omitted `splitContactEmail` and `showThirdPartyAds`, so Batch rendered a different description than Output from identical data.

`src/hooks/use-render-options.ts` is now the single mapping, with two guards:

- **Compile-time** — `buildRenderOptions` builds a `Required<SettingsRenderOptions>`, so omitting a key is a type error.
- **Runtime** — `tests/hooks/render-options-parity.test.ts` diffs the produced keys against `SETTINGS_DERIVED_RENDER_KEYS` in both directions.

`RenderOptions` is split accordingly: `SettingsRenderOptions` (from the user) plus `RenderOptionOverrides` (`tEn`, `bilingualContentBlocks`, `year` — decided per call site, since Output wants bilingual content blocks and Batch does not).

### Validation state

Two sources, unioned by `useStrictBlock`, because neither alone is sufficient:

| Source                                          | Catches                                                | Why it's needed                                                                                                         |
| ----------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| `collectEditorIssues` (pure, over `EditorData`) | Saved values that fail validation                      | Bad data from imports — `ValidatedInput` refuses to commit invalid text, so imports are the main way it gets in         |
| `PendingInvalidStore`                           | Typed text that is invalid and therefore **not** saved | Otherwise a field showing a red error is invisible to every gate, because the store behind it holds the last good value |

Both are filtered through `isRelevantIssueId`, so a field that isn't currently shown (`adEmail` with split-email off, `zaloGroupLink` outside Vietnamese output) can never block on a value with no visible input to fix it. Strict Mode is opt-in; with it off, no gate blocks.

The first implementation registered issues from the inputs themselves and cleared on unmount. It typechecked and had passing tests, and did nothing: the fields live on the Editor page while the gates live on Batch / Social / Output, so navigating away cleared every issue. Deriving from state removes the mount coupling entirely.

## 4. i18n Architecture

```
i18n/
├── index.ts              # i18next setup + SUPPORTED_LANGUAGES
└── locales/
    ├── en/
    │   ├── ui.json           # UI strings: buttons, labels, tooltips, errors
    │   └── templates.json    # Generated content: titles, description blocks, pinned comment, playlist, chapter keywords
    ├── vi/  ja/  es/  ko/  zh/  pt-BR/  id/
    │   ├── ui.json
    │   └── templates.json
    └── _schema.json      # the expected key list for both namespaces
```

`npm run validate:locales` checks every locale against `_schema.json`, and `tests/i18n/locale-registration.test.ts` checks the language list against the locale folders in both directions. **Adding a language** is two JSON files plus registration: the `SupportedLanguage` union, `SUPPORTED_LANGUAGES`, `detectBrowserLanguage` in `settings-heal.ts`, and the per-language records TypeScript enforces (the tag pools in `tag-generator.ts`, the channel-phrase patterns in `channel-phrase.ts`). The Turnstile gate page keeps its own strings and language list in `worker/gate-i18n.ts`. See [I18N.md](I18N.md).

**Lazy loading (v0.26+)**: only English is bundled into the main chunk — it is the `fallbackLng` and the engine's bilingual `tEn` translator, both of which must resolve synchronously. Every other language is fetched on first use as a Vite async chunk via `i18next-resources-to-backend` + dynamic `import()`. Generation paths gate on bundle readiness (`useLanguagesReady` hook / `ensureLanguagesLoaded`): an unloaded language would otherwise silently render English fallback output. A chunk that fails to fetch degrades to English and logs to the in-app Log page — it never hangs the UI.

**UI language vs output language**: independent. The UI follows `SettingsStore.appLanguage` (loaded before the first render in `main.tsx`, then kept in step with i18next by `App.tsx`); the generated text follows `EditorStore.language`. A new draft — first run or Start over — starts in `SettingsStore.defaultOutputLanguage`. Both settings default to the browser's language when it is supported.

## 5. Backup & Restore

Code in `src/utils/backup/`, UI in `src/components/backup/` (`BackupSection` in Settings › Backup & restore, `ExportBackupDialog`, `RestoreDialog`). Format and rules: [TECH-SPEC.md § 4](TECH-SPEC.md#4-backup-file-format-v100).

| Module               | Role                                                                                                                                                        |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `format.ts`          | The `_format: 2` envelope, `_type` values, section list, per-section store versions, dated file names                                                       |
| `collect.ts`         | Builds a backup of the chosen sections, a single-section export, or the History CSV                                                                         |
| `detect.ts`          | Recognises every file any version has written (v2, v0.15–v0.38 envelopes, bare arrays, the old desktop data file) and reports each section with its version |
| `sanitize.ts`        | Store migrations first, then a strict whitelist; keeps device-local settings                                                                                |
| `restore.ts`         | Plans the restore (new / same / changed per row) and applies the choice in one step, with undo                                                              |
| `restore-flow.ts`    | Gets a file into the dialog: Open dialog, drop, or one of the desktop app's own backups                                                                     |
| `restore-request.ts` | `useRestoreDialog` — the pending file, kept apart so the shell can watch it without loading the rest                                                        |
| `auto-backup.ts`     | Desktop automatic backups                                                                                                                                   |
| `startup.ts`         | Tauri start-up: legacy-file recovery, then automatic backups (desktop)                                                                                      |

```
Restore from file · drop · desktop backup list · "Review" on the legacy toast
        │  restore-flow.ts (openTextFile / readTextFile / appBackups.read)
        ▼
detect.ts — readBackupText → sections + recorded versions
        │  (logs, social, unknown or newer files are refused with a message)
        ▼
useRestoreDialog.open → RestoreDialog (lazy)
        │
        ▼
restore.ts — planRestore
        │  sanitize.ts: store migrations → whitelist
        │  per row: new / same / changed; Merge (newer | both) or Replace
        ▼
applyRestore — one synchronous write to every store → toast with Undo
   (desktop: a "before-restore" automatic backup is written first)
```

Export: `ExportBackupDialog` → `collectBackup(chosen sections)` → `saveTextFile` (`ytdescgen-backup-YYYY-MM-DD.json`); the library tabs and History export single sections (History also as CSV).

## 6. Web Delivery

The web build is served at <https://ytgenerator.stream> by a Cloudflare Worker (`worker/`, configured by `wrangler.jsonc`) that Cloudflare Workers Builds deploys from `main`. The Worker puts a Turnstile check in front of the app (verified server-side; a signed `HttpOnly` `__Host-ytg_gate` cookie remembers the pass for 24 hours), serves the prerendered legal pages at `/legal/*` to everyone, and sets the security headers (a CSP per page type). Agreeing to the terms on the gate page sets the `ytg_terms` cookie, which the app reads so a web visitor meets one blocking screen, not two. Build-time extras for the web only — static legal pages, `/.well-known/security.txt`, the cookieless Web Analytics beacon — come from `build-plugins/`. The desktop and Android builds use none of this and contain no analytics. Request flow, cookies, headers and operations: [HOSTING.md](HOSTING.md).

## 7. Desktop Packaging (Tauri)

```
React app (src/), built with TAURI_ENV_PLATFORM set
        │
        ▼
┌────────────────────────────────────────┐
│             Tauri 2 shell              │
│  ┌──────────────────────────────────┐  │
│  │ System WebView                   │  │ ← renders the same React app
│  │ WebView2 · WKWebView · WebKitGTK │  │
│  │ Android System WebView           │  │
│  └──────────────────────────────────┘  │
│  ┌──────────────────────────────────┐  │
│  │ Rust core (src-tauri/src)        │  │
│  │ lib.rs                           │  │ ← plugins, commands, tray, single instance
│  │ storage.rs                       │  │ ← backups and logs, by file name
│  │ file_dialog.rs                   │  │ ← Save / Open dialogs run in Rust
│  └──────────────────────────────────┘  │
└────────────────────────────────────────┘
        │
        ▼
  Release assets:
  - Windows: .msi and NSIS .exe
  - macOS (Apple silicon): .app.tar.gz
  - Linux: .AppImage, .deb, .rpm
  - Android: universal .apk
```

**The webview never names a path.** Since v1.0.0 the Rust side exposes only name-only commands for its own files (`backup_*` and `log_*` under the app data directory, `recover_legacy_data`) and two commands that open the native Save / Open dialog themselves (`export_text_file`, `import_text_file`: text formats only, imports capped at 20 MB). The capability file grants the webview only `core:default` and `opener:default`; the fs and shell plugins are gone. The JavaScript bridge is `src/utils/native.ts`, used by `file-ops.ts` (exports and imports on every platform), `log-storage.ts` and `utils/backup/`. Details: [PACKAGING.md](PACKAGING.md).

Tauri advantages over Electron:

- No bundled Chromium — uses the system WebView, so installers stay a few megabytes (the v0.38.0 MSI was 4.6 MB)
- Lower memory use
- A Rust backend for native features, with a capability system that limits what the webview can call

## 8. Extensibility Points

| What                    | How to extend                                                                                                                                                                                                                                                           | Files to touch                                                                                            |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| New language            | Add `locales/{code}/ui.json` + `templates.json` and register it (see section 4 and [I18N.md](I18N.md)); lazy-loaded automatically                                                                                                                                       | 2 locale files + `types.ts`, `i18n/index.ts`, `settings-heal.ts`, `tag-generator.ts`, `channel-phrase.ts` |
| New genre               | Add it to the `Genre` union (`engine/types.ts`) and `config/genres.ts`, its tag pool (`GENRE_TAG_REGISTRY`) and search term (`GENRE_SEARCH_TERMS`) to `engine/tag-generator.ts` — a test keeps the three lists in sync — and its `genres.<id>` label to every `ui.json` | 3 + N locale files                                                                                        |
| New video type          | Add it to the `VideoType` union and `config/video-types.ts`, its `videoTypes.<id>` label to every `ui.json`, and its title, intro and pinned-comment greeting to every `templates.json`                                                                                 | 2 + 2N locale files                                                                                       |
| New store / platform    | Add an entry to `config/platforms.ts` (URL pattern, optional normaliser, `tagName`); optionally a game-name extractor in `utils/url-extractors.ts`                                                                                                                      | 1–2 files                                                                                                 |
| New social link         | Add an entry to `config/social-fields.ts` and its `social.<id>` label to every `ui.json`                                                                                                                                                                                | 1 + N locale files                                                                                        |
| New rig field           | Add an entry to `config/rig-fields.ts`, its `rig.<id>` label to every `ui.json` and `description.rigLabels.<id>` to every `templates.json`                                                                                                                              | 1 + 2N locale files                                                                                       |
| New cross-post platform | Add an entry to `config/social-platforms.ts` (limit, hashtags, count mode) and its `socialPost.platforms.<id>` label                                                                                                                                                    | 1 + N locale files                                                                                        |
| Custom template text    | Edit `templates.json` for the target language                                                                                                                                                                                                                           | 1 file                                                                                                    |
| Desktop feature         | Add a command in `src-tauri/src/` (a module like `storage.rs`), register it in `lib.rs`'s `generate_handler!`, add a typed wrapper in `src/utils/native.ts`. Never take a path from the webview                                                                         | 3 files                                                                                                   |
| Persisted data shape    | Bump the store's exported version and add an idempotent step to its exported migration; backups replay it                                                                                                                                                               | 1 file                                                                                                    |

## 9. Data Flow

```
User input (form, paste, Quick start, command palette)
       │
       ▼
EditorStore (Zustand, persist → localStorage "ytdescgen-editor-draft")
       │
       ├──→ useCurrentGeneratorInput → GeneratorInput
       │         │
       │         ▼
       │    useGeneratedOutput
       │      ├─ useLanguagesReady ([output language])
       │      ├─ i18n.getFixedT(language, "templates") + the English tEn
       │      ├─ useRenderOptions (Settings → RenderOptions)
       │      └─ renderAll → buildTitle · buildDescription · generateTags
       │                      → GeneratorOutput (memoized)
       │                               │
       │                               ▼
       │          Output page · Editor live preview · Social captions ·
       │          Copy (limits.ts gates) · Ctrl/⌘+Shift+C · command palette
       │                               │
       │                               └──→ HistoryStore.addEntry
       │                                    (Output page and Ctrl/⌘+S; one entry per video)
       │
       ├──→ Profile / Preset / Template stores (save from the editor;
       │    apply through library-apply.ts) ──→ localStorage
       │
       └──→ Desktop: auto-backup.ts ──→ backup_write ──→ <app data>/backups/
```

The multi-language Output tabs (`useMultilangOutput`) and BatchPage call `renderAll` themselves, once per language, with the same `useRenderOptions` mapping.
