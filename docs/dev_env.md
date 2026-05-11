# Development environment

What we install on a fresh box to be productive on YTDescGen. Hardware spec
lives in [`pc_spec.md`](pc_spec.md); this file is the toolchain side.

## Editors

- **JetBrains 2026.x** (paid lineup) — PyCharm, WebStorm, RustRover, Rider.
- **VS Code** — for quick edits, markdown preview, and shared remote sessions.

Pick whichever feels right for the file; both share the project's ESLint /
Prettier / TypeScript config out of the box.

## Toolchains

| Tool   | Version           | Notes |
|--------|-------------------|-------|
| Node.js | ≥ 25.8.1         | Required for Vite 5 + Vitest 2. Use `nvm` / `volta` if pinning. |
| Python  | 3.12             | Used by tooling scripts under `scripts/`. |
| Rust    | stable (`rustup`) | Required for Tauri 2 desktop builds. |
| Git     | recent           | Any version with SSH + Sparse Checkout support. |

## Git hygiene

- `commit.gpgsign = true` — all commits are GPG-signed.
- Branch model: `main` (stable) ← `dev` (integration) ← `feat/*`.
- Commit message format: `type(scope): message` — see [`../CLAUDE.md`](../CLAUDE.md).

## Common commands

See [`../CLAUDE.md`](../CLAUDE.md) for the full list. Day-to-day:

```bash
npm install         # first time
npm run dev         # Vite dev server
npm run typecheck   # tsc --noEmit
npm run test        # Vitest watch
npm run validate:locales
npm run tauri dev   # desktop shell against the dev server
```

## Companion docs

- [`pc_spec.md`](pc_spec.md) — hardware reference.
- [`../webapp/TAURI.md`](../webapp/TAURI.md) — Tauri 2 build prerequisites per platform.
- [`i18n/vi/dev_env.md`](i18n/vi/dev_env.md) — Vietnamese mirror.
