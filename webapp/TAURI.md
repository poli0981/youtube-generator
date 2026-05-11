# Tauri 2 desktop build prerequisites

YTDescGen ships a Tauri 2 desktop shell alongside the web build. This file
covers the per-platform native dependencies you need before
`npm run tauri:dev` or `npm run tauri:build` will succeed.

The corresponding hardware reference is in [`../docs/pc_spec.md`](../docs/pc_spec.md);
toolchain versions are in [`../docs/dev_env.md`](../docs/dev_env.md).

## All platforms

- **Rust stable** via `rustup`. Tauri 2 currently tracks the latest stable.
- **Node.js ≥ 25.8.1**. Tauri-action in CI uses Node 20; locally we use ≥ 25
  so the JetBrains and VS Code dev tools have a single shared LTS.

```bash
rustup update stable
rustup target add x86_64-pc-windows-msvc       # Windows
rustup target add aarch64-apple-darwin         # Apple Silicon
rustup target add x86_64-unknown-linux-gnu     # Linux
```

## Windows

- **MSVC build tools** — install via "Desktop development with C++" workload in
  Visual Studio Installer, or `winget install Microsoft.VisualStudio.2022.BuildTools`.
- **WebView2 Runtime** — ships with Windows 11; on Windows 10 you may need
  to install the Evergreen Bootstrapper from Microsoft.
- Default bundles produced: MSI installer + NSIS `.exe`.

## macOS

- **Xcode Command Line Tools** — `xcode-select --install`.
- **Apple Silicon only** for hosted CI; Intel is not in the matrix anymore.
- Bundling DMG on hosted runners has historically flaked inside
  `bundle_dmg.sh`. The release matrix builds the `.app` bundle and tar-gzips
  it (`--bundles app`). Users expand and drag-drop into `/Applications`.

## Linux

Hosted Ubuntu runners need these apt packages:

```bash
sudo apt-get update
sudo apt-get install -y \
  libwebkit2gtk-4.1-dev \
  libgtk-3-dev \
  libayatana-appindicator3-dev \
  librsvg2-dev \
  patchelf
```

Default bundles produced: AppImage + `.deb`.

## Verifying the toolchain

```bash
npm run tauri info
```

`tauri info` prints versions of Rust, the WebView, the Node runtime, and the
detected bundle targets. Use this before opening a bug — most "Tauri won't
build" reports are version mismatches.

## CI reference

Release builds run on tagged pushes via
[`.github/workflows/release-desktop.yml`](../.github/workflows/release-desktop.yml).
That file is the source of truth for what versions actually shipped.
