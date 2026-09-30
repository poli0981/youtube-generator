# Desktop Packaging Guide

## YTDescGen — Tauri 2 Desktop and Android Apps

Reflects **v1.0.0**: Windows, macOS (Apple silicon) and Linux desktop apps plus an Android APK, all built from the same Tauri 2 project in `src-tauri/`. The web app is deployed separately — see [HOSTING.md](HOSTING.md).

---

## Why Tauri?

| Feature          | Tauri 2                                                                                                               | Electron                                |
| ---------------- | --------------------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| Download size    | 3–6 MB installers (v0.38.0: MSI 4.6 MB, NSIS 3.2 MB, `.deb` 5.9 MB); the AppImage, which bundles its libraries, 80 MB | ~150 MB                                 |
| Memory usage     | Lower — no second browser engine                                                                                      | Higher — bundled Chromium + Node.js     |
| Bundled runtime  | System WebView                                                                                                        | Chromium                                |
| Backend language | Rust                                                                                                                  | Node.js                                 |
| Security model   | Capability allow-list and CSP; no Node.js in the webview                                                              | Node.js main process, Chromium renderer |
| Auto-update      | Updater plugin available — not used by this app                                                                       | electron-updater                        |

The maintainer already knew Rust from the Tauri / build-tooling ecosystem; the small binary, low memory use and simple deployment settled it.

## Prerequisites

- **Rust** (stable) via [rustup](https://rustup.rs/).
- **Node.js 22** (`.node-version`) and npm.
- **Tauri CLI** — the npm package `@tauri-apps/cli` is a pinned dev dependency, so `npm run tauri …` (or `npm run tauri:dev` / `npm run tauri:build`) needs nothing else. The cargo CLI (`cargo install tauri-cli --version "^2" --locked`, then `cargo tauri …`) works the same way; the Android release job uses it.
- **Platform tools**:
  - Windows: Microsoft C++ Build Tools. WebView2 ships with Windows 10/11; the installers bootstrap it where it is missing (`webviewInstallMode: downloadBootstrapper`).
  - macOS: Xcode Command Line Tools.
  - Linux: `libwebkit2gtk-4.1-dev libgtk-3-dev libayatana-appindicator3-dev librsvg2-dev patchelf` (what CI installs).
- **Android**: see [Android (.apk) Packaging](#android-apk-packaging).

`npm run check:tauri` fails when the `@tauri-apps/*` npm packages and the `tauri` crates differ in major.minor — `tauri build` refuses to run in that state, and no workflow runs `tauri build` before a release tag does.

## Project Setup

The project was initialised once with `tauri init` (not needed again). `src-tauri/` is committed, except build output (`target/`, the Gradle build folders) and the Android signing files:

```
src-tauri/
├── Cargo.toml, Cargo.lock, build.rs
├── deny.toml                 # cargo-deny: advisories, licences, sources
├── tauri.conf.json
├── capabilities/default.json # what the webview may call
├── installer-license.txt     # Windows installers' licence page
├── icons/                    # desktop + Android icons (from assets/brand/logo.svg)
├── src/
│   ├── main.rs               # desktop entry → yt_desc_gen_lib::run()
│   ├── lib.rs                # plugins, commands, tray, single instance
│   ├── storage.rs            # backups and logs under the app data directory
│   └── file_dialog.rs        # native Save / Open dialogs
└── gen/android/              # the Android Gradle project (committed)
```

The icons come from the one brand logo: `npx tauri icon assets/brand/logo.svg` regenerates them (`npm run generate:brand` does the same for the web's favicon, PWA icons and link-preview card).

### 1. tauri.conf.json

```json
{
  "$schema": "https://raw.githubusercontent.com/tauri-apps/tauri/dev/crates/tauri-cli/schema.json",
  "productName": "YTDescGen",
  "version": "1.0.0",
  "identifier": "com.skullmute.ytdescgen",
  "build": {
    "beforeBuildCommand": "npm run build",
    "beforeDevCommand": "npm run dev",
    "frontendDist": "../dist",
    "devUrl": "http://localhost:5173"
  },
  "app": {
    "windows": [
      {
        "title": "YTDescGen",
        "width": 1280,
        "height": 820,
        "minWidth": 960,
        "minHeight": 640,
        "resizable": true,
        "maximizable": true,
        "fullscreen": false,
        "center": true
      }
    ],
    "security": {
      "csp": "default-src 'self'; style-src 'self' 'unsafe-inline'"
    }
  },
  "bundle": {
    "active": true,
    "licenseFile": "installer-license.txt",
    "icon": [
      "icons/32x32.png",
      "icons/128x128.png",
      "icons/128x128@2x.png",
      "icons/icon.icns",
      "icons/icon.ico"
    ],
    "targets": "all",
    "android": {
      "minSdkVersion": 30
    },
    "windows": {
      "webviewInstallMode": {
        "type": "downloadBootstrapper"
      }
    }
  }
}
```

Notes:

- The window opens at 1280×820 and can be resized down to 960×640.
- The CSP allows only the app's own files (plus inline styles, which Radix, Motion and sonner set). That is why the Vite build never inlines assets as `data:` URIs (`assetsInlineLimit: 0`) and the fonts are self-hosted. The Tauri build also carries no analytics beacon — Vite adds it only to the web build.
- There is **no `trayIcon` entry**: the tray icon is built in code (`lib.rs`), with the app icon — a `trayIcon` entry would add a second one.
- There is **no `updater` configuration** — see [Updates](#updates).
- `targets: "all"` builds every bundle the platform supports (MSI + NSIS on Windows, `.app` + `.dmg` on macOS, `.deb` + `.rpm` + AppImage on Linux); the release workflow narrows macOS to `.app`.

> **Installer license page (v0.28).** The real `src-tauri/tauri.conf.json`
> sets `bundle.licenseFile: "installer-license.txt"` (path relative to
> `src-tauri/`). Tauri shows that file as an "accept the terms" page in the
> **Windows MSI/NSIS** installers. macOS `.app`/`.dmg` and the Linux packages
> have no interactive license step, so they rely on the app's first-run
> consent gate instead. If a WiX/MSI build ever rejects the `.txt`, switch to
> the per-bundler keys (`bundle.windows.wix.licenseFile` wants `.rtf`,
> `bundle.windows.nsis.licenseFile` accepts `.txt`).

### 2. Capabilities (src-tauri/capabilities/default.json)

```json
{
  "identifier": "default",
  "description": "Default capabilities for YTDescGen. File access goes through the app's own name-only commands and native dialogs run from Rust, so the webview gets no dialog, fs or shell permissions.",
  "windows": ["main"],
  "permissions": ["core:default", "opener:default"]
}
```

The webview can call Tauri's core APIs, the opener plugin (external links open in the system browser, mail client or dialler) and the app's own commands — nothing else. v1.0.0 removed the `fs` and `shell` plugins and their permissions. `tauri-plugin-dialog` is still a dependency, but only Rust uses it: the webview has no dialog permission and no dialog JavaScript package. (`tauri-plugin-fs` still appears in `Cargo.lock` as a dependency of the dialog plugin; the app does not register it.)

### 3. Rust Backend (src-tauri/src)

`main.rs` only calls `yt_desc_gen_lib::run()`. `lib.rs`, abridged:

```rust
mod file_dialog;
mod storage;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Shared by every platform (desktop + Android). No command takes a path.
    let builder = tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            storage::backup_list,
            storage::backup_read,
            storage::backup_write,
            storage::backup_delete,
            storage::log_append,
            storage::log_list,
            storage::log_read,
            storage::log_delete,
            storage::recover_legacy_data,
            file_dialog::export_text_file,
            file_dialog::import_text_file,
        ]);

    #[cfg(desktop)]
    {
        // tauri_plugin_single_instance (first desktop plugin: a second launch
        // focuses the running window), a tray icon built in setup() with the
        // app icon and a Show / Quit menu, close-to-tray, and exit prevention
        // unless Quit was chosen from the tray.
    }

    #[cfg(not(desktop))]
    builder
        .run(tauri::generate_context!())
        .expect("error while building tauri application");
}
```

The commands:

| Command               | Arguments                                                        | What it does                                                                                                                                        |
| --------------------- | ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `backup_list`         | —                                                                | Lists the backups in `<app data>/backups/`, newest first (`name`, `size`, `modifiedMs`)                                                             |
| `backup_read`         | `name`                                                           | Reads one backup (at most 32 MB)                                                                                                                    |
| `backup_write`        | `name`, `content`                                                | Writes atomically (temporary file + rename); after writing a `ytdescgen-backup-*` file, deletes all but the newest ten of those                     |
| `backup_delete`       | `name`                                                           | Deletes one backup (a missing file is not an error)                                                                                                 |
| `log_append`          | `name`, `content`                                                | Appends one entry (at most 256 KB) to `<app data>/logs/<name>`                                                                                      |
| `log_list`            | —                                                                | The log file names, sorted                                                                                                                          |
| `log_read`            | `name`                                                           | Reads one log file (at most 32 MB)                                                                                                                  |
| `log_delete`          | `name`                                                           | Deletes one log file                                                                                                                                |
| `recover_legacy_data` | —                                                                | Moves files written by versions before 1.0 into place (see [Legacy files](#legacy-files-from-versions-before-10)); returns `{ backups, logsMoved }` |
| `export_text_file`    | `suggestedName`, `content`, `filterName`, `extensions`, `title?` | Opens the native Save dialog **in Rust** and writes the file the user picked; returns its name, or `null` when cancelled                            |
| `import_text_file`    | `filterName`, `extensions`, `title?`                             | Opens the native Open dialog in Rust and returns `{ name, text }`, or `null` when cancelled                                                         |

What makes them safe:

- **Names, not paths.** `storage.rs` builds every path itself, under Tauri's `app_data_dir()`, from a name that must match `ytdescgen-<lowercase letters, digits, hyphens>.json` (at most 100 bytes) for backups or `ytdescgen-YYYYMMDD.jsonl` for logs. Anything else — `..`, separators, other extensions — is rejected before a path exists.
- **Dialogs run in Rust.** `file_dialog.rs` accepts only the extensions `json`, `jsonl`, `txt`, `csv` and `md`; reduces a suggested name to its file name (`../../x/backup.json` → `backup.json`); makes a saved file end in an allowed extension (`backup` → `backup.json`, `backup.exe` → `backup.exe.json`); and refuses imports over 20 MB or that are not UTF-8 (a byte-order mark is stripped). The chosen path never passes through JavaScript. On desktop the dialog is attached to the app window.
- **Removed in v1.0.0**: the five commands that read, wrote, appended to, listed and deleted any path the webview sent (`save_to_file`, `read_from_file`, `append_to_file`, `list_dir`, `delete_file`), and the fs and shell plugins.

Both modules have unit tests (`cargo test` in `src-tauri/`): the name rules, path rejection, backup pruning, legacy recovery, dialog filters and the import checks.

### 4. Frontend Tauri Integration

- **`src/utils/platform.ts`** — `IS_TAURI` (`"__TAURI_INTERNALS__" in window`), `IS_MOBILE` (an Android user agent) and `IS_MAC` (how shortcuts are spelled).
- **`src/utils/native.ts`** — the typed bridge to the commands above; `invoke` from `@tauri-apps/api/core` is imported lazily, so the web build never loads it. Exposes `appBackups` (`list`, `read`, `write`, `remove`), `appLogs` (`append`, `list`, `read`, `remove`), `recoverLegacyData`, `nativeSaveTextFile`, `nativeOpenTextFile`, and `HAS_NATIVE_DIALOGS = IS_TAURI && !IS_MOBILE`.
- **`src/utils/file-ops.ts`** — exports and imports on every platform:

  ```typescript
  // saveTextFile({ content, filename, mimeType?, description? }) → "saved" | "cancelled" | "failed"
  //   1. Tauri desktop: nativeSaveTextFile → export_text_file (dialog + write in Rust)
  //   2. Web with the File System Access API (Chromium): showSaveFilePicker
  //   3. Anything else (Android, Firefox, Safari): a blob download
  //
  // openTextFile({ extensions, description? }) → picked | cancelled | failed
  //   Tauri desktop: nativeOpenTextFile → import_text_file
  //   Elsewhere: a hidden <input type="file">; its "cancel" event reports a
  //   dismissed picker (no focus-timer guessing). readTextFile() applies the
  //   same extension and 20 MB checks to dropped files.
  ```

- **`src/utils/log-storage.ts`** — in Tauri, one JSONL line per log entry through `appLogs.append` into the day's file; at start-up it loads the files inside the retention window and deletes older ones. On the web it uses the `ytdescgen-logs` localStorage key instead.
- **`src/utils/open-external.ts`** — in Tauri, external links go through the opener plugin. `target="_blank"` is stripped from external anchors and clicks are intercepted in the capture phase, so a link can neither navigate the app's own webview nor trigger the webview's new-window handling (which failed on Android).
- **`src/utils/backup/startup.ts`** — `startAppData()`, run once from `App.tsx` in Tauri builds: legacy-file recovery, then automatic backups on desktop.

## Where the Apps Keep Data

- **Everything the app holds** — profiles, presets, templates, history, settings and the current draft — is in the **WebView's localStorage**, under the same `ytdescgen-*` keys as the web app (Zustand `persist`). On Windows that is WebView2's profile in `%LOCALAPPDATA%\com.skullmute.ytdescgen\EBWebView`. There is no second copy: the settings "mirror" file of earlier versions is gone.
- **Files the app writes itself** live under Tauri's `app_data_dir()` — `<data dir>/com.skullmute.ytdescgen`, which is `%APPDATA%\com.skullmute.ytdescgen` on Windows:
  - `backups/` — `ytdescgen-backup-YYYYMMDD-HHmm.json` files: the automatic backups, **Back up now**, and the backup written before each restore (with a `-before-restore` suffix); the newest ten of these are kept (desktop only). Also the recovered legacy files (`ytdescgen-legacy-data*.json`), which are never deleted automatically. On desktop, Settings › Backup & restore lists them all and restores any of them.
  - `logs/` — `ytdescgen-YYYYMMDD.jsonl`, one file per day, deleted after the Log retention setting (1–90 days, default 7).
- **Exports** go wherever the user picks in the Save dialog (desktop) or are downloaded (Android).

Automatic backups: 5 s after start, then after the library changes (30 s quiet, at most every 10 minutes), only when the data differs from the last backup and the library is not empty. Format and rules: [TECH-SPEC.md § 4](TECH-SPEC.md#4-backup-file-format-v100).

### Legacy files from versions before 1.0

Before v1.0.0 the frontend glued file names onto the data directory without a separator, so the settings "mirror" was written as `…\com.skullmute.ytdescgensettings.json` next to the data folder — and never read back — and the log files landed in a `…\com.skullmute.ytdescgenlogs\` folder beside it.

On start, `startAppData()` calls `recover_legacy_data`, which:

- moves the old data file (from the glued path, or `settings.json` inside the data folder) into `backups/` as `ytdescgen-legacy-data.json` (`-2`, `-3`, … when taken). It is **never applied on its own** — the data in the app is usually newer. A toast offers **Review**, which opens the restore preview for that file; on desktop it also stays listed under Settings › Backup & restore.
- merges the stray daily log files into `logs/` (appending when that day's file already exists) and removes the stray folder once it is empty; anything else in it is left alone.

The recovery runs in every Tauri build (desktop and Android); a second run finds nothing to do.

## Versioning

A release bumps the version in **six places**, and `npm run check:version` (in CI and in the release `verify` job) fails until they agree:

| File                        | Field                   |
| --------------------------- | ----------------------- |
| `package.json`              | `version`               |
| `package-lock.json`         | `version`               |
| `package-lock.json`         | `packages[""].version`  |
| `src-tauri/tauri.conf.json` | `version`               |
| `src-tauri/Cargo.toml`      | `[package] version`     |
| `src-tauri/Cargo.lock`      | the `yt-desc-gen` entry |

`npm version --no-git-tag-version <version>` covers the first three; the Rust / Tauri files are edited by hand (cargo also rewrites the `Cargo.lock` entry on the next non-`--locked` build or check in `src-tauri/`). Add the `CHANGELOG.md` entry in the same change.

## Build & Release

### Development

```bash
# Web only
npm run dev

# Desktop (native window against the Vite dev server, with hot reload)
npm run tauri:dev
```

### Production Build

```bash
# Web only → dist/
npm run build

# Desktop → src-tauri/target/release/bundle/
npm run tauri:build
```

The Tauri CLI runs `npm run build` first (`beforeBuildCommand`) with `TAURI_ENV_PLATFORM` set, which switches Vite to the Tauri build: `es2020` target, the Legal Center content only, and no static legal pages, `security.txt` or analytics beacon.

Output file names, with the v0.38.0 release sizes:

| Platform              | Bundle                           | File                                     | Size   |
| --------------------- | -------------------------------- | ---------------------------------------- | ------ |
| Windows               | MSI                              | `YTDescGen_<version>_x64_en-US.msi`      | 4.6 MB |
| Windows               | NSIS                             | `YTDescGen_<version>_x64-setup.exe`      | 3.2 MB |
| macOS (Apple silicon) | `.app`, archived by tauri-action | `YTDescGen_<version>_aarch64.app.tar.gz` | 4.4 MB |
| Linux                 | Debian                           | `YTDescGen_<version>_amd64.deb`          | 5.9 MB |
| Linux                 | RPM                              | `YTDescGen-<version>-1.x86_64.rpm`       | 5.9 MB |
| Linux                 | AppImage                         | `YTDescGen_<version>_amd64.AppImage`     | 80 MB  |
| Android               | Universal APK                    | `app-universal-release.apk`              | 57 MB  |

### GitHub Actions Release

Pushing a `v*` tag (signed, e.g. `v1.0.0`) runs [.github/workflows/release-desktop.yml](../.github/workflows/release-desktop.yml) and [.github/workflows/release-android.yml](../.github/workflows/release-android.yml). Both start with a **`verify`** job, and their build jobs `needs: verify`:

```yaml
- run: npm ci # a clean install: package-manager-cache: false
- run: npm run typecheck
- run: npm run test:run
- run: npm run check:version
- run: npm run check:tauri
- name: Tag matches the manifests # "v" + package.json version must equal the tag
```

Release jobs use no dependency caches — a poisoned cache entry written by another workflow must not reach the binaries — and every action is pinned by commit SHA.

The desktop build is a three-platform matrix; `tauri-apps/tauri-action` builds each target and uploads its bundles to one **draft** GitHub Release named `YTDescGen vX.Y.Z`:

| Runner           | Target                     | Output                      |
| ---------------- | -------------------------- | --------------------------- |
| `windows-latest` | `x86_64-pc-windows-msvc`   | `.msi`, `.exe` (NSIS)       |
| `macos-14`       | `aarch64-apple-darwin`     | `.app.tar.gz`               |
| `ubuntu-latest`  | `x86_64-unknown-linux-gnu` | `.AppImage`, `.deb`, `.rpm` |

Linux runners install `libwebkit2gtk-4.1-dev`, `libgtk-3-dev`, `libayatana-appindicator3-dev`, `librsvg2-dev` and `patchelf` before building — Tauri's webview and AppImage tooling need them. AppImage bundling runs with `APPIMAGE_EXTRACT_AND_RUN=1` (linuxdeploy needs FUSE, which hosted runners don't reliably provide) and `NO_STRIP=true`.

`fail-fast: false` keeps the other platforms going if one breaks. The `bundleArgs` matrix field is concatenated with `--target ${{ matrix.target }}` and passed through to `tauri build`.

**macOS notes (v0.9.1+):**

- **DMG bundling is skipped** (`--bundles app`). Tauri's DMG bundler runs an AppleScript that flakes intermittently on hosted macOS runners (the headless display can't load Finder fast enough for `osascript` to position icons), so we ship a `.app.tar.gz` instead. Users expand the archive and drag the `.app` into `/Applications`.
- **Intel macOS (`macos-13`) is NOT built.** GitHub started deprecating the `macos-13` free runner pool in 2025; jobs queue indefinitely. If Intel support becomes a priority, switch the macos-14 entry's target to `universal-apple-darwin` (Tauri builds both archs and lipos them into one universal binary) — the runner already has the toolchain capacity.

**Code signing is intentionally skipped** for both Windows and macOS — this is an open-source personal tool, and signing certificates carry recurring cost. End users will see the standard "unverified publisher" / "unidentified developer" prompts on first launch. Document the bypass steps in the release notes if needed. (The Android APK is signed — see below.)

**Release notes.** tauri-action gives the draft a fixed body ("See the assets to download the installer for your platform."). `CHANGELOG.md` is hand-maintained and is the source for the notes; the maintainer smoke-tests the binaries and publishes the draft by hand. Publishing triggers `announce-release.yml` (the Announcements discussion and Discord).

**Manual re-run:** both workflows accept `workflow_dispatch` with a `tag` input — `gh workflow run release-desktop.yml -f tag=v1.0.0` rebuilds an existing release without deleting and recreating the tag. The manifests at that tag must already carry the version, or `verify` stops the run. Useful when a transient runner failure costs a single platform's binary.

**Backfill for pre-workflow tags:** `v0.8.0` and `v0.8.1` predate the multi-platform matrix and only have local Windows builds. To attach binaries retroactively, build manually then `gh release create v0.8.0 --notes-file CHANGELOG.md path/to/*.msi …`.

## Android (.apk) Packaging

YTDescGen also builds an installable Android APK from the **same** Tauri 2
codebase — there is no separate mobile project. Tauri 2 ships Android support;
the crate is already `cdylib`/`staticlib` with a `#[cfg_attr(mobile, …)]` entry
point, and the Android launcher icons live in `src-tauri/icons/android/`. The
desktop-only tray / single-instance / hide-to-tray logic in `src-tauri/src/lib.rs`
is gated behind `#[cfg(desktop)]` so the library compiles for Android.

### Requirements & tested versions

|                   |                                                                                                                                                                  |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Minimum OS**    | **Android 11** (API level 30, `minSdk 30`). The APK will not install below this.                                                                                 |
| **Target OS**     | **Android 16** (API level 36, `targetSdk 36`, `compileSdk 36`).                                                                                                  |
| **Architectures** | Universal APK — `arm64-v8a`, `armeabi-v7a`, `x86`, `x86_64`.                                                                                                     |
| **Tested**        | **Android 11 → 16.** The v0.29.0 build was verified on Android emulators across this range **and on a real device running Android 12** (the maintainer's phone). |

Where the value lives: `bundle.android.minSdkVersion` in
[`src-tauri/tauri.conf.json`](../src-tauri/tauri.conf.json) is the source of
truth used by `tauri android init`; the generated
`gen/android/app/build.gradle.kts` carries the baked `minSdk = 30` — edit that
directly if you change the floor without re-running `init`.

**Why Android 11 is the floor (rationale):**

- **Coverage.** Android 11+ accounts for the large majority of active devices in
  2026 (Android 14/15 alone are the two biggest slices, and 11–13 together still
  hold a sizeable share). Going lower buys few extra users at growing compat cost.
- **A modern, patched WebView.** The app renders entirely in the system WebView,
  whose minimum is Android 10. On Android 11+ the WebView auto-updates via Google
  Play, so the rendering/JS engine stays current and patched. This is exactly why
  the **real-device test on Android 12 worked**, while a _stale_ Android-12
  emulator stuck on WebView 91 showed a black screen (the `crypto.randomUUID`
  boot crash) — that class of bug is fixed in v0.29.0 and is moot on an
  up-to-date WebView.
- **Security upkeep.** Even though Google's _OS-level_ monthly security bulletins
  for Android 11–13 have ended (Android 12 in 2025, Android 13 in early 2026),
  Android 11+ keeps receiving security updates for the components that matter to a
  sandboxed WebView app: Google Play system updates (Project Mainline), Google
  Play services, and System WebView. Requiring strict OS-bulletin support would
  mean Android 14+, which would drop more than half of users.

### Prerequisites

- **Android SDK** — platform-tools, a platform (e.g. `android-36`), build-tools. Install via Android Studio or the command-line tools.
- **Android NDK** — r27 LTS (`27.3.13750724`, what CI uses).
- **JDK 17** — Android Studio's bundled JBR works (`…/Android Studio/jbr`).
- **Rust android targets**:
  ```bash
  rustup target add aarch64-linux-android armv7-linux-androideabi i686-linux-android x86_64-linux-android
  ```

Set these environment variables before any `android` command (PowerShell shown):

```powershell
$env:ANDROID_HOME = "C:\Users\<you>\AppData\Local\Android\Sdk"
$env:NDK_HOME     = "C:\Users\<you>\AppData\Local\Android\Sdk\ndk\27.3.13750724"
$env:JAVA_HOME    = "C:\Jetbrains\Android Studio\jbr"   # or any JDK 17
```

### Initialize (one-time)

```bash
cargo tauri android init
```

Generates the Gradle project under `src-tauri/gen/android/` — **committed** to
the repo so the signing block and any manifest edits persist. It pulls launcher
icons from `src-tauri/icons/android/` and sets `applicationId =
com.skullmute.ytdescgen`. Treat `init` as a one-time step: re-running it
overwrites hand edits like the signing config below, so only re-run it if a
Tauri upgrade requires regenerating the project (then re-apply the signing edit).

### Signing (one-time)

Sideloaded APKs must be signed. Create a self-signed release keystore and keep
it **outside** the repo:

```powershell
& "$env:JAVA_HOME\bin\keytool.exe" -genkeypair -v `
  -keystore C:\keys\ytdescgen-release.jks `
  -keyalg RSA -keysize 2048 -validity 10000 -alias ytdescgen
```

> ⚠️ **Back this keystore up.** If you lose it you can never publish an update
> that installs over an existing copy — Android rejects a changed signature.

Create `src-tauri/gen/android/keystore.properties` (gitignored):

```properties
storeFile=C:/keys/ytdescgen-release.jks
storePassword=<store-password>
keyAlias=ytdescgen
keyPassword=<key-password>
```

`app/build.gradle.kts` carries a `release` `signingConfigs` block that reads this
file, guarded by `if (exists())` — a missing keystore yields an _unsigned_
release build rather than a hard failure (handy for contributors).

### Build

```bash
cargo tauri android build --apk
# → src-tauri/gen/android/app/build/outputs/apk/universal/release/app-universal-release.apk
```

- `--apk` produces an APK. **Without it Tauri builds an `.aab`** App Bundle for the Play Store, which cannot be sideloaded.
- `cargo tauri android build --apk --target aarch64` builds an arm64-only APK (smaller download; covers virtually all modern phones).
- The build runs `npm run build` first (the `beforeBuildCommand`), then Gradle. The first build takes several minutes (Rust × up to 4 ABIs + a cold Gradle).
- For on-device iteration with hot reload: `cargo tauri android dev`.
- With the npm CLI instead of the cargo one: `npm run tauri android build -- --apk`.

Install on a device: copy the APK over (or `adb install -r <apk>`) and enable
"Install unknown apps" for the source app.

### CI

[.github/workflows/release-android.yml](../.github/workflows/release-android.yml)
runs on a `v*` tag (or `workflow_dispatch` with a `tag`). After `verify`, the
`build-android` job sets up JDK 17 (Temurin), the Android SDK, NDK
`27.3.13750724`, the four Rust Android targets and the cargo Tauri CLI; decodes
the keystore into `$RUNNER_TEMP`; writes `src-tauri/gen/android/keystore.properties`;
and runs `cargo tauri android build --apk` with `NDK_HOME` pinned to that NDK.

The APK is kept as the workflow artifact `ytdescgen-android-apk`, then attached
to the draft release with `gh release upload <tag> --clobber`. That upload needs
the draft the desktop workflow creates; if the Android job gets there first,
re-run it. It needs four repo secrets:

| Secret                    | Value                                                     |
| ------------------------- | --------------------------------------------------------- |
| `ANDROID_KEYSTORE_BASE64` | base64 of the `.jks` (`base64 -w0 ytdescgen-release.jks`) |
| `ANDROID_STORE_PASSWORD`  | keystore store password                                   |
| `ANDROID_KEY_PASSWORD`    | key password                                              |
| `ANDROID_KEY_ALIAS`       | `ytdescgen`                                               |

### App-level changes for Android

- **`src-tauri/src/lib.rs`** — tray / single-instance / hide-to-tray / exit-prevention are `#[cfg(desktop)]`; the dialog and opener plugins and the eleven commands are registered on every platform.
- **`src-tauri/Cargo.toml`** — `tauri-plugin-single-instance` lives in a desktop-only `[target.'cfg(not(any(target_os = "android", target_os = "ios")))'.dependencies]` table.
- **`src/utils/native.ts` / `file-ops.ts`** — `HAS_NATIVE_DIALOGS` is false on Android (a picked location there is a content URI, not a path), so exports are a WebView download and imports use the file input. Automatic backups are desktop-only; the legacy-file recovery runs on Android too.
- **Storage** — as on desktop, everything is in the WebView's localStorage; the app's own data directory holds `logs/` and, after an upgrade from an older version, the recovered legacy file in `backups/`.

## Updates

The app has no in-app updater: no updater plugin, no `updater` configuration, and it never checks for new versions. New versions are published as GitHub Releases; users download the installer or APK for their platform and install it over the existing app. User data is outside the installation — in the WebView storage and the app data directory described above — so it is kept. An Android update must be signed with the same keystore to install over an existing copy.

## Offline Capability

The desktop and Android apps work fully offline:

- All templates, configuration and translations are bundled; the non-English locales are separate chunks inside the app.
- The legal documents are rendered into the build at build time (the Legal Center reads them locally).
- Fonts (Inter, JetBrains Mono) are self-hosted.
- State lives in the WebView's localStorage; backups and logs in the app data directory.
- The app makes no network requests of its own. Only external links (opened in the system browser) need a connection.

The web app is the same code, but reaching it needs the network: the Turnstile check runs at the edge before the app loads, at most once a day per browser (see [HOSTING.md](HOSTING.md)).
