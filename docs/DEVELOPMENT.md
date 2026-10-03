# Development Guide

This guide covers setting up YTDescGen for local development on Windows, macOS, or Linux. The application is a Vite/React web app with an optional Tauri shell for desktop and Android. On the web it is served at [ytgenerator.stream](https://ytgenerator.stream) by a Cloudflare Worker — see [HOSTING.md](./HOSTING.md).

## Reference Workstation

The reference workstation used to develop and ship this project:

| Component | Spec                                                                     |
| --------- | ------------------------------------------------------------------------ |
| OS        | Windows 11 Pro (24H2 or newer)                                           |
| CPU       | Modern x86-64 — 6+ cores with AVX2 (Intel 11th-gen / AMD Zen 3 or newer) |
| GPU       | Discrete or integrated — Tauri's WebView2 backend runs fine on iGPU      |
| RAM       | 16 GB minimum, 32 GB recommended for parallel typecheck + dev server     |
| Storage   | 5 GB free for `node_modules` + Cargo `target/` after a full Tauri build  |
| Display   | 1920×1080 minimum; mobile-responsive layout tested down to 360×640       |

macOS and Linux work for development. Tauri release builds are cross-compiled or run on dedicated CI runners — see [PACKAGING.md](./PACKAGING.md).

## Toolchain

Install in this order:

| Tool                    | Version                                 | Why                                                                                                                                                                                                                                                                                         |
| ----------------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Node.js**             | **22** — the version in `.node-version` | CI, the release workflows and Cloudflare Workers Builds all read `.node-version`. Vite 8 needs Node `^20.19` or `>= 22.12` and wrangler needs `>= 22`, so use 22.12 or newer. Use [nvm](https://github.com/nvm-sh/nvm) or [fnm](https://github.com/Schniz/fnm) (fnm reads `.node-version`). |
| **npm**                 | bundled with Node 22                    | The project uses npm; `pnpm` and `yarn` are not tested.                                                                                                                                                                                                                                     |
| **Rust**                | stable, `>= 1.90`                       | Required for the Tauri desktop and Android builds (Tauri 2.12 needs Rust 1.90). Install via [rustup](https://rustup.rs/); its default profile includes `rustfmt` and `clippy`.                                                                                                              |
| **Python**              | `3.12`                                  | Optional — only needed for some Tauri platform tooling on Windows.                                                                                                                                                                                                                          |
| **Tauri prerequisites** | per OS                                  | See <https://v2.tauri.app/start/prerequisites/>.                                                                                                                                                                                                                                            |

### Windows specifics

- Install **Visual Studio Build Tools 2022** with the "Desktop development with C++" workload (required by `tauri-build`).
- Install the **WebView2 Runtime** (usually pre-installed on Windows 11).
- Long path support: `git config --global core.longpaths true`.

### macOS specifics

- Install Xcode Command Line Tools: `xcode-select --install`.

### Linux specifics

- Install per-distro Tauri prerequisites — `libwebkit2gtk-4.1-dev`, `libappindicator3-dev`, etc. See the Tauri docs linked above.

## IDE Setup

The reference workflow uses **JetBrains 2026.x** IDEs (WebStorm or RustRover) as primary, with **VS Code** for quick edits.

### JetBrains (WebStorm / RustRover / IntelliJ Ultimate)

- Enable the **Tailwind CSS** plugin.
- Enable the **i18next** plugin (or rely on `src/i18n/locales/_schema.json` for autocomplete).
- Settings → Languages → TypeScript → "Use TypeScript from `node_modules/typescript`".
- Settings → Code Style → Prettier → Run on save (`{src,tests,scripts,worker,build-plugins}/**/*.{ts,tsx,css}` — the same files `npm run format` covers).

### VS Code

Recommended extensions (no `.vscode/extensions.json` is committed — install manually):

- `dbaeumer.vscode-eslint`
- `esbenp.prettier-vscode`
- `bradlc.vscode-tailwindcss`
- `rust-lang.rust-analyzer` (if you touch `src-tauri/`)
- `tauri-apps.tauri-vscode`

## First Run

```bash
# 1. Clone
git clone https://github.com/poli0981/youtube-generator.git
cd youtube-generator

# 2. Install web dependencies
npm install

# 3. Start the web dev server
npm run dev
# → http://localhost:5173
```

The dev server is the app alone: no Turnstile gate and no analytics. To run the Worker that serves the web app, see [Cloudflare Worker (local)](#cloudflare-worker-local).

## Branches and Pull Requests

- Branch from `main` (`feat/…`, `fix/…`, `docs/…`, `chore/…`) and open the pull request against `main`. There is no other long-lived branch, and every merge to `main` deploys the web app.
- PR titles use the commit format `type(scope): message`; CI checks them.
- Every PR runs the `check` job (below), `dependency-review`, `workflow-lint`, `reuse` and `pr-title`; the Rust jobs `lint-and-test` and `cargo-deny` run when `src-tauri/` changes.

Full rules: [CONTRIBUTING.md](../CONTRIBUTING.md).

## Common Commands

### Develop and build

| Command               | What it does                                                                                                                                                                                               |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run dev`         | Vite dev server, hot reload, web only.                                                                                                                                                                     |
| `npm run build`       | `tsc` + production web bundle into `dist/`. The web build also gets the Web Analytics beacon, `/.well-known/security.txt` and the static `/legal/*` pages; builds started by the Tauri CLI leave them out. |
| `npm run preview`     | Serve the production bundle for sanity-testing (without the Worker).                                                                                                                                       |
| `npm run cf:dev`      | `wrangler dev` — the Worker in front of `dist/` on `http://localhost:8787`. See [Cloudflare Worker (local)](#cloudflare-worker-local).                                                                     |
| `npm run tauri:dev`   | Tauri desktop in dev mode (also `npm run tauri dev`): starts `npm run dev` and opens the app window on it. Frontend changes hot-reload; Rust changes rebuild the app.                                      |
| `npm run tauri:build` | Tauri release binary for the current platform.                                                                                                                                                             |

### Check

| Command                    | What it does                                                                                                                                                                                                                                                                                                              |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run typecheck`        | `tsc --noEmit` over `src/` — what Vite actually builds.                                                                                                                                                                                                                                                                   |
| `npm run typecheck:all`    | Same, plus `tests/`, `scripts/`, `worker/` and `build-plugins/` (`tsconfig.check.json`), which the base config deliberately excludes. Added in v0.35.0 after it turned out tests and scripts had **never** been type-checked — and immediately found three fields silently missing from the editor→engine parity fixture. |
| `npm run lint`             | ESLint over `src/`, `tests/`, `scripts/`, `worker/` and `build-plugins/`. Use `npm run lint:fix` to autofix.                                                                                                                                                                                                              |
| `npm run format`           | Prettier write across `src/`, `tests/`, `scripts/`, `worker/` and `build-plugins/` (`.ts`, `.tsx`, `.css`).                                                                                                                                                                                                               |
| `npm run format:check`     | Same, read-only. CI gate. Markdown and the locale JSON are deliberately out of scope.                                                                                                                                                                                                                                     |
| `npm run knip`             | Dead-code / unused-dependency check. CI gate.                                                                                                                                                                                                                                                                             |
| `npm run validate:locales` | Enforces all 8 locales match `_schema.json` exactly. **Must pass before any locale-touching PR merges.**                                                                                                                                                                                                                  |
| `npm run test`             | Vitest watch mode.                                                                                                                                                                                                                                                                                                        |
| `npm run test:run`         | Vitest single-run.                                                                                                                                                                                                                                                                                                        |
| `npm run test:coverage`    | Single run with a coverage report into `coverage/`; fails below the thresholds for `src/engine/` and `worker/` set in `vitest.config.ts`. This is what CI runs.                                                                                                                                                           |
| `npm run check:version`    | Asserts all **six** version fields agree (`package.json`, both `package-lock.json` entries, `tauri.conf.json`, `Cargo.toml`, `Cargo.lock`). The only thing that notices a missed one.                                                                                                                                     |
| `npm run check:tauri`      | The `@tauri-apps/*` npm packages and the Tauri crates must share major.minor. The Tauri CLI refuses to build otherwise, and CI never runs a Tauri build.                                                                                                                                                                  |
| `npm run check:licenses`   | Every bundled package has an allowed license, and `THIRD_PARTY_NOTICES.md` matches what is installed.                                                                                                                                                                                                                     |
| `npm run check:copyright`  | NOTICE, REUSE.toml and the installers' copyright string (`tauri.conf.json`) state the copyright years for the year of HEAD's commit — "2026", then "2026-2027" from the first commit of 2027. CI gate (v1.1.0).                                                                                                           |
| `npm run check:bundle`     | Run after `npm run build`: the initial load must stay ≤ 280 KB gzip and no JS chunk over 500 KB raw.                                                                                                                                                                                                                      |
| `npm run cf:check`         | `wrangler deploy --dry-run`: validates `wrangler.jsonc` and bundles the Worker the way Workers Builds will, without deploying.                                                                                                                                                                                            |

### Generate

| Command                        | What it does                                                                                                                                                                                                                    |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run generate:locale`      | Scaffold a locale from the English source. `--lang <code>`, plus optional `--copy-english` / `--force`. (Advertised since v0.1 but only actually written in v0.35.0.)                                                           |
| `npm run generate:third-party` | Rewrite `THIRD_PARTY_NOTICES.md` from the installed packages — needed after a dependency change, or `check:licenses` fails.                                                                                                     |
| `npm run update:copyright`     | Rewrite the copyright years in NOTICE, REUSE.toml and `tauri.conf.json` — needed with the first commit of a new year, or `check:copyright` fails.                                                                               |
| `npm run generate:brand`       | Rasterise the brand SVGs in `assets/brand/` into the web's PNG icons and link-preview card in `public/`. The PNGs are committed. The desktop and Android icons come from the same logo: `npx tauri icon assets/brand/logo.svg`. |

## Before You Open a PR

Run what CI's `check` job runs:

```bash
npm run typecheck && npm run typecheck:all
npm run lint && npm run format:check
npm run validate:locales
npm run test:coverage
npm run knip
npm run check:version && npm run check:tauri && npm run check:licenses
npm run check:copyright
npm run build && npm run check:bundle
npm run cf:check
```

Touched `src-tauri/`? Also run the [Rust checks](#rust-checks).

## Cloudflare Worker (local)

The web app is served by a Cloudflare Worker ([`worker/`](../worker), configured in [`wrangler.jsonc`](../wrangler.jsonc)) that puts the Turnstile gate, the security headers and the public `/legal` pages in front of `dist/`. To run it locally:

```bash
cp .dev.vars.example .dev.vars   # Cloudflare's public Turnstile TEST keys only
npm run build                    # the Worker serves dist/
npm run cf:dev                   # wrangler dev → http://localhost:8787
```

- `.dev.vars` (git-ignored) holds Cloudflare's published Turnstile **test** keys: the widget always passes and the secret only accepts the dummy token it produces. Never put the real secret in a file — production keeps `TURNSTILE_SECRET` as a Cloudflare Secret.
- Without `.dev.vars` the Worker has no `TURNSTILE_SECRET` and fails open: the app loads without the gate.
- The Worker serves the last build — run `npm run build` again to see frontend changes behind it.
- Worker tests run with the rest of the suite (`tests/worker/`).

Deployment, cookies, headers, secrets and rollback: [HOSTING.md](./HOSTING.md).

## Tauri Desktop Build

See [PACKAGING.md](./PACKAGING.md) for the full release pipeline. Quick local build:

```bash
npm run tauri:build
# Output: src-tauri/target/release/bundle/
#   Windows: MSI + NSIS installers · Linux: deb, rpm, AppImage · macOS: .app + DMG
```

The first build takes ~5–10 minutes (cold Cargo cache). Subsequent builds are incremental.

The Vite dev server does not watch `src-tauri/**` or `.wrangler/**` (`server.watch.ignored` in `vite.config.ts`): while `tauri dev` runs, Cargo rewrites files under `src-tauri/target`, and watching them crashed Vite on Windows with `EBUSY` on a locked `.dll`.

### Rust checks

The same steps as the `lint-and-test` job in `.github/workflows/rust.yml`, which runs when `src-tauri/` changes (and weekly):

```bash
npm run build          # tauri::generate_context!() embeds dist/, so clippy and the tests need a build
cd src-tauri
cargo fmt --all -- --check
cargo clippy --all-targets --locked -- -D warnings
cargo test --locked
```

The `cargo-deny` job checks RustSec advisories, licenses and crate sources against `src-tauri/deny.toml`. Locally (after `cargo install cargo-deny`): `cargo deny check advisories licenses sources` in `src-tauri/`.

## Troubleshooting

### `validate:locales` fails after adding a key

You forgot to update `src/i18n/locales/_schema.json`, or one of the 8 locales. The schema is the source of truth; every locale must match it exactly.

### `validate:locales` fails but I didn't touch locales

Someone — or a merge from `main` — added a key to `_schema.json` (for example the label of a new `CONTENT_WARNINGS` id from `src/engine/types.ts`) that isn't in every locale yet. New keys need a value in all 8 locales.

### Tauri build fails with `link.exe not found` (Windows)

Install Visual Studio Build Tools 2022 + Desktop C++ workload, then restart your shell so the new PATH is picked up.

### Tauri build fails with `pkg-config not found` (Linux)

Install the per-distro Tauri prerequisites listed at <https://v2.tauri.app/start/prerequisites/>.

### `check:tauri` fails after a dependency update

A `@tauri-apps/*` npm package moved to a new minor version without the crates (or the other way round). Run `cargo update -p tauri` (and the plugin crates `check:tauri` names) in `src-tauri/` on the same branch.

### `check:bundle` can't find `dist/index.html`

It measures a build — run `npm run build` first.

### `npm run cf:dev` shows no Turnstile gate

`.dev.vars` is missing, so the Worker has no secret and serves the app without the gate. Copy `.dev.vars.example` to `.dev.vars` and restart.

### `npm install` is slow or hangs

Disable corporate VPNs / proxies that block the npm registry. The lock file is committed; offline installs work after one successful online install.

### Hot reload not picking up locale edits

Locale JSON is bundled at build time, not watched. Restart the dev server after editing `src/i18n/locales/*`.

Since v0.26, only English ships in the main chunk; the other languages are
lazy-loaded async chunks fetched on first use (see `src/i18n/index.ts` and
docs/I18N.md). The restart advice above still applies to all of them.

## See Also

- [ARCHITECTURE.md](./ARCHITECTURE.md) — layer model, data flow, engine design.
- [HOSTING.md](./HOSTING.md) — how ytgenerator.stream is built, deployed and protected.
- [I18N.md](./I18N.md) — adding new languages step-by-step.
- [PACKAGING.md](./PACKAGING.md) — Tauri release builds and signing.
- [Top-level CONTRIBUTING.md](../CONTRIBUTING.md) — PR process, commit conventions, auto-ignore rules.
- [Top-level SECURITY.md](../SECURITY.md) — reporting vulnerabilities.
