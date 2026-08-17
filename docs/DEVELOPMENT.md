# Development Guide

This guide covers setting up YTDescGen for local development on Windows, macOS, or Linux. The application is a Vite/React web app with an optional Tauri desktop shell.

## Reference Workstation

The reference workstation used to develop and ship this project:

| Component | Spec |
| --- | --- |
| OS | Windows 11 Pro (24H2 or newer) |
| CPU | Modern x86-64 — 6+ cores with AVX2 (Intel 11th-gen / AMD Zen 3 or newer) |
| GPU | Discrete or integrated — Tauri's WebView2 backend runs fine on iGPU |
| RAM | 16 GB minimum, 32 GB recommended for parallel typecheck + dev server |
| Storage | 5 GB free for `node_modules` + Cargo `target/` after a full Tauri build |
| Display | 1920×1080 minimum; mobile-responsive layout tested down to 360×640 |

macOS and Linux work for development. Tauri release builds are cross-compiled or run on dedicated CI runners — see [PACKAGING.md](./PACKAGING.md).

## Toolchain

Install in this order:

| Tool | Version | Why |
| --- | --- | --- |
| **Node.js** | `>= 22.12.0` | Vite 8 requires Node `^20.19` or `>= 22.12`. Use [nvm](https://github.com/nvm-sh/nvm) or [fnm](https://github.com/Schniz/fnm). |
| **npm** | bundled with Node 22 | The project uses npm; `pnpm` and `yarn` are not tested. |
| **Rust** | stable, `>= 1.78` | Required for the Tauri desktop build. Install via [rustup](https://rustup.rs/). |
| **Python** | `3.12` | Optional — only needed for some Tauri platform tooling on Windows. |
| **Tauri prerequisites** | per OS | See <https://v2.tauri.app/start/prerequisites/>. |

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
- Settings → Code Style → Prettier → Run on save (`src/**/*.{ts,tsx,json,css}`).

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

## Common Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Vite dev server, hot reload, web only. |
| `npm run build` | Production web bundle into `dist/`. |
| `npm run preview` | Serve the production bundle for sanity-testing. |
| `npm run typecheck` | `tsc --noEmit` over `src/` — what Vite actually builds. |
| `npm run typecheck:all` | Same, plus `tests/` and `scripts/`, which the base config deliberately excludes. Added in v0.35.0 after it turned out they had **never** been type-checked — and immediately found three fields silently missing from the editor→engine parity fixture. |
| `npm run lint` | ESLint. Use `npm run lint:fix` to autofix. |
| `npm run format` | Prettier write across `src/`, `tests/`, `scripts/`. |
| `npm run format:check` | Same, read-only. CI gate. Markdown and the locale JSON are deliberately out of scope — Prettier reflows prose and expands the schema's compact arrays by ~1600 lines for no benefit. |
| `npm run knip` | Dead-code / unused-dependency check. CI gate. |
| `npm run check:version` | Asserts all **six** version fields agree (`package.json`, both `package-lock.json` entries, `tauri.conf.json`, `Cargo.toml`, `Cargo.lock`). The only thing that notices a missed one. |
| `npm run test` | Vitest watch mode. |
| `npm run test:run` | Vitest single-run (for CI / pre-commit). |
| `npm run test:coverage` | Coverage report into `coverage/`. |
| `npm run validate:locales` | Enforces all 8 locales match `_schema.json` exactly. **Must pass before any locale-touching PR merges.** |
| `npm run generate:locale` | Scaffold a locale from the English source. `--lang <code>`, plus optional `--copy-english` / `--force`. (Advertised since v0.1 but only actually written in v0.35.0.) |
| `npm run tauri:dev` | Tauri desktop in dev mode (auto-restarts on Rust or frontend changes). |
| `npm run tauri:build` | Tauri release binary for the current platform. |

## Tauri Desktop Build

See [PACKAGING.md](./PACKAGING.md) for the full release pipeline. Quick local build:

```bash
npm run tauri:build
# Output: src-tauri/target/release/bundle/{msi,deb,dmg,app}
```

The first build takes ~5–10 minutes (cold Cargo cache). Subsequent builds are incremental.

## Troubleshooting

### `validate:locales` fails after adding a key

You forgot to update `src/i18n/locales/_schema.json`. The schema is the source of truth; locales must match it exactly.

### Tauri build fails with `link.exe not found` (Windows)

Install Visual Studio Build Tools 2022 + Desktop C++ workload, then restart your shell so the new PATH is picked up.

### Tauri build fails with `pkg-config not found` (Linux)

Install the per-distro Tauri prerequisites listed at <https://v2.tauri.app/start/prerequisites/>.

### `npm install` is slow or hangs

Disable corporate VPNs / proxies that block the npm registry. The lock file is committed; offline installs work after one successful online install.

### Hot reload not picking up locale edits

Locale JSON is bundled at build time, not watched. Restart the dev server after editing `src/i18n/locales/*`.

Since v0.26, only English ships in the main chunk; the other languages are
lazy-loaded async chunks fetched on first use (see `src/i18n/index.ts` and
docs/I18N.md). The restart advice above still applies to all of them.

### Pre-commit hook fails on `validate:locales` but I didn't touch locales

You probably added a new key to `_schema.json` indirectly via the engine types (`src/engine/types.ts` → `CONTENT_WARNINGS`). New IDs require translations in all 8 locales.

## See Also

- [ARCHITECTURE.md](./ARCHITECTURE.md) — layer model, data flow, engine design.
- [I18N.md](./I18N.md) — adding new languages step-by-step.
- [PACKAGING.md](./PACKAGING.md) — Tauri release builds and signing.
- [Top-level CONTRIBUTING.md](../CONTRIBUTING.md) — PR process, commit conventions, auto-ignore rules.
- [Top-level SECURITY.md](../SECURITY.md) — reporting vulnerabilities.
