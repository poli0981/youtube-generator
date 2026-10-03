# CLAUDE.md — YTDescGen

## Project Overview

**YTDescGen** generates YouTube titles, descriptions and tags for Gameplay No Commentary channels, in eight languages, with profiles (channel), presets (game) and templates (whole form) to skip repeated data entry.

- **Web app**: <https://ytgenerator.stream> — a Cloudflare Worker (Turnstile gate + static build), deployed by Cloudflare Workers Builds on every push to `main`. See [docs/HOSTING.md](docs/HOSTING.md).
- **Desktop** (Windows / macOS / Linux) and **Android** apps: Tauri 2, released from signed tags.
- **Repository**: `github.com/poli0981/youtube-generator` · **License**: Apache-2.0 (`LICENSE`, `NOTICE`, REUSE-compliant).
- **Maintainer**: poli0981 (SkullMute). Contacts by purpose: see `src/config/about.ts` and README.

## Tech Stack

| Layer             | Technology                                                                                                                      |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| UI                | React 19, TypeScript (strict), Radix primitives (`radix-ui`), Motion (LazyMotion), cmdk, sonner, lucide-react + simple-icons    |
| Build             | Vite 8 (Rolldown); config imports need `.ts` extensions                                                                         |
| Styling           | Tailwind CSS 4, CSS-first `@theme` tokens in `src/styles/globals.css`                                                           |
| State             | Zustand 5 + `persist` (localStorage) — the only store on every platform                                                         |
| Routing           | React Router 7 — `BrowserRouter` on the web, `HashRouter` in Tauri                                                              |
| i18n              | i18next + react-i18next, 8 locales (en, vi, ja, es, ko, zh, pt-BR, id); `en` bundled, others lazy                               |
| Desktop / Android | Tauri 2 (Rust) — see `src-tauri/`                                                                                               |
| Web hosting       | Cloudflare Workers (`worker/`, `wrangler.jsonc`), Turnstile, Web Analytics                                                      |
| Tests             | Vitest (node environment; Worker tests included)                                                                                |
| Quality           | ESLint, Prettier, knip, coverage thresholds, bundle budget, licence allow-list, REUSE, actionlint/zizmor, cargo fmt/clippy/deny |

## Project Structure

```
src/
  App.tsx, main.tsx            # router, providers, start-up effects
  engine/                      # pure template engine — no React, no DOM
    template-renderer.ts       # renderAll(): title + description + tags
    title-builder.ts           # titles (badge position, separator, case, order)
    title-variants.ts          # alternative title shapes
    description-builder.ts     # the description, block by block
    tag-generator.ts           # tag pools, YouTube's tag length count, trimming
    timeline-parser.ts         # timestamps → chapters, YouTube's chapter rules
    channel-phrase.ts          # drops "on {{channel}}" when there is no channel name
    rig-block.ts, limits.ts, social-post-builder.ts, pinned-comment-builder.ts, playlist-builder.ts, types.ts
  config/                      # static data: video types, genres, platforms (stores),
                               # social fields/platforms, GPU catalog, rig fields,
                               # library-fields (profile/preset/per-video field lists),
                               # legal, about, field limits, Vietnamese banks, …
  store/                       # Zustand stores; each exports its version + migrate fn
    editor-store.ts            # the draft (EditorData, migrateEditorState, editorDataOf)
    profile-store.ts, preset-store.ts, template-store.ts, history-store.ts
    settings-store.ts + settings-heal.ts   # settings; healed on every load
    log-store.ts
  utils/
    backup/                    # backup format v2, detect, sanitize, restore (+undo),
                               # collect, desktop auto-backups, start-up recovery
    library-apply.ts           # apply profile/preset/template, next part, start over
    store-paste.ts             # store links pasted anywhere
    native.ts                  # typed bridge to the Tauri commands
    file-ops.ts                # save/open text files on every platform
    validation.ts, url-extractors.ts, log-storage.ts, …
  hooks/, components/, pages/, i18n/, styles/
worker/                        # Cloudflare Worker: gate, cookies, headers, routing
build-plugins/                 # legal pages at build time; web-only extras
src-tauri/src/                 # lib.rs (plugins, tray), storage.rs (name-only file
                               # commands), file_dialog.rs (native Save/Open)
migration-page/                # moving notice for the old GitHub Pages address (until 2026-11-29)
tests/                         # engine, store, utils, worker, build, i18n, config
scripts/                       # locale validation, version sync, bundle budget,
                               # licences/third-party notices, brand assets
docs/                          # DEVELOPMENT, HOSTING, ARCHITECTURE, FEATURES, ROADMAP,
                               # TECH-SPEC, I18N, PACKAGING, CONTENT-INVENTORY (+ vi/)
```

## Coding Conventions

### TypeScript

- Strict mode; no `any` — use `unknown` + type guards.
- Prefer `interface` for object shapes; `as const` for static config arrays.

### React

- Function components only; shared logic in `use*` hooks.
- Pages are lazy-loaded; keep the Editor (landing page) light — the **initial load budget is 280 KB gzip** (`npm run check:bundle`), no chunk over 500 KB raw.
- Read store slices with selectors; avoid prop drilling beyond two levels.

### Naming

- Files: `kebab-case.ts`, components `PascalCase.tsx`; stores `use[Name]Store`; constants `UPPER_SNAKE_CASE`.

### Styling

- Tailwind utilities and the design tokens (`bg-surface-1`, `text-text-muted`, `accent`, …) — no hard-coded colours, no inline styles.
- Dark by default, light via class; touch targets grow on coarse pointers.
- Watch Tailwind 4 specificity: a base `inline-flex` beats a plain `hidden` — wrap responsive visibility in an element.

### i18n

- Every user-visible string goes through `t()`; UI strings in `ui.json`, generated text in `templates.json`.
- New keys go into **all 8 locales** and `_schema.json`; `npm run validate:locales` must pass.
- No plural suffixes (`_one`/`_other`) — the key sets must match across locales; write count-neutral text.

### State

- Stores are persisted with Zustand `persist`; a shape change bumps the store's exported version and adds a step to its exported migrate function (backups replay the same steps). Steps must be idempotent.
- Settings are healed on every load (`healSettings`); consent and UI-state fields are device-local and never exported.

### Engine

- Pure functions only: typed input → string. No React, clipboard, storage or DOM; the year and other environment values come from the caller.

## Key Design Decisions

1. **The engine is framework-agnostic** (`src/engine/` has no React imports).
2. **i18n covers the UI and the generated text**, as separate namespaces.
3. **Profiles vs presets vs templates**: profile = channel (rarely changes), preset = game (reused across parts), template = the whole form. The field lists live in `src/config/library-fields.ts`.
4. **Tags are generated**, then trimmed to YouTube's own length count.
5. **Your data stays on your device.** localStorage is the only store; backups are files the user controls (plus automatic backups in the desktop app's data folder).
6. **The desktop webview never names a path**: Rust commands take file names under the app data folder or open the native dialog themselves.
7. **The web app is gated** by Turnstile, verified server-side in the Worker; the gate fails open if its secret is missing.

## Development Commands

```bash
npm install
npm run dev                 # Vite dev server (http://localhost:5173)
npm run build               # typecheck + production build
npm run test:run            # all tests (npm test = watch mode)
npm run test:coverage       # with coverage thresholds
npm run typecheck           # src
npm run typecheck:all       # src + tests + scripts + worker + build plugins
npm run lint && npm run format:check
npm run knip                # unused files/exports/dependencies
npm run validate:locales
npm run check:bundle        # after build: initial load / chunk budget
npm run check:licenses      # licence allow-list + THIRD_PARTY_NOTICES in sync
npm run check:copyright     # NOTICE, REUSE.toml, installer copyright = HEAD's year (update:copyright fixes)
npm run check:version       # the six version fields agree
npm run check:tauri         # @tauri-apps/* and tauri crates on the same major.minor
npm run cf:dev              # wrangler dev (copy .dev.vars.example to .dev.vars — test keys only)
npm run cf:check            # wrangler deploy --dry-run
npm run tauri:dev           # desktop app against the dev server
npm run tauri:build         # desktop installers
# src-tauri/: cargo fmt --check · cargo clippy --all-targets -- -D warnings · cargo test
```

## Git Workflow

- `main` only: feature branches (`feat/…`, `fix/…`, `docs/…`, `chore/…`) → PR → `main`. Every merge to `main` deploys the web app.
- Commit and PR-title format: `type(scope): message` (`feat`, `fix`, `refactor`, `docs`, `test`, `ci`, `chore`) — CI checks PR titles.
- Commits and release tags are GPG-signed; never bypass signing or hooks.
- Required checks: `check`, `dependency-review`, `workflow-lint`, `reuse`, `pr-title`.

## Releases

- Bump the version in all six places: `package.json`, `package-lock.json` (×2), `src-tauri/tauri.conf.json`, `src-tauri/Cargo.toml`, `src-tauri/Cargo.lock` (`npm run check:version`), and add a `CHANGELOG.md` entry.
- Push a signed tag `vX.Y.Z` → the release workflows verify, build the desktop and Android artifacts and create a **draft** release. The maintainer publishes it.

## Important Notes for Claude Code

- Run the gates before committing: `typecheck`, `typecheck:all`, `lint`, `format:check`, `test:run`, `knip`, `validate:locales`, `build` + `check:bundle`; `cargo fmt/clippy/test` when `src-tauri/` changes. In the first commit of a new year, `npm run update:copyright` (CI's `check:copyright` fails until then).
- New contact-email purpose words: `src/config/contact-emails.ts` (lower-case; a test keeps every locale's example address valid).
- New language: follow `docs/I18N.md` (register it, both namespaces, tag pools, `channel-phrase.ts` patterns, browser detection).
- New genre: `src/config/genres.ts` + its tag pool in `src/engine/tag-generator.ts` (a test keeps them in sync).
- New video type: `src/config/video-types.ts` + every `templates.json` (titles, intros, pinned-comment greetings).
- New store platform: `src/config/platforms.ts` (URL pattern, `tagName`), optionally a name extractor in `src/utils/url-extractors.ts`.
- Never commit `note.txt`, `warning.txt` or `__pycache__/`; never put real secrets in files (`.dev.vars` holds Cloudflare's public Turnstile test keys only).
- The Cloudflare dashboard, publishing releases and repository settings are the maintainer's; ask before touching them.
