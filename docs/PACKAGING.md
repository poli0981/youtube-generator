# Desktop Packaging Guide

## YTDescGen — Tauri Desktop App

---

## Why Tauri?

| Feature | Tauri 2 | Electron |
|---------|---------|----------|
| Binary size | ~8 MB | ~150 MB |
| Memory usage | ~30 MB | ~100 MB+ |
| Bundled runtime | System WebView | Chromium |
| Backend language | Rust | Node.js |
| Security | Strict CSP, no Node in renderer | Full Node access |
| Auto-update | Built-in updater | electron-updater |
| CI build time | ~5 min | ~10 min |

Kokone đã quen Rust (từ hệ sinh thái Tauri/build tooling). Binary nhỏ, tốn ít RAM, deploy đơn giản.

## Prerequisites

```bash
# Rust toolchain
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Tauri CLI
cargo install tauri-cli

# Node.js 22+
# npm already installed from web development

# Platform-specific
# Windows: Microsoft Visual Studio C++ Build Tools
# macOS: Xcode Command Line Tools
```

## Project Setup

### 1. Initialize Tauri in existing Vite project

```bash
npm run tauri init
```

This creates `src-tauri/` directory.

### 2. tauri.conf.json

```jsonc
{
  "$schema": "https://raw.githubusercontent.com/nicedoc/tauri/dev/tooling/cli/schema.json",
  "build": {
    "beforeBuildCommand": "npm run build",
    "beforeDevCommand": "npm run dev",
    "devPath": "http://localhost:5173",
    "distDir": "../dist"
  },
  "package": {
    "productName": "YTDescGen",
    "version": "0.1.0"
  },
  "tauri": {
    "bundle": {
      "active": true,
      "identifier": "com.skullmute.ytdescgen",
      "icon": [
        "icons/32x32.png",
        "icons/128x128.png",
        "icons/128x128@2x.png",
        "icons/icon.icns",
        "icons/icon.ico"
      ],
      "targets": ["msi", "nsis", "dmg", "app"],
      "windows": {
        "webviewInstallMode": {
          "type": "downloadBootstrapper"
        }
      }
    },
    "windows": [
      {
        "title": "YTDescGen",
        "width": 1100,
        "height": 750,
        "minWidth": 800,
        "minHeight": 600,
        "resizable": true,
        "fullscreen": false,
        "center": true
      }
    ],
    "security": {
      "csp": "default-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com"
    },
    "systemTray": {
      "iconPath": "icons/icon.png",
      "iconAsTemplate": true
    },
    "updater": {
      "active": true,
      "dialog": true,
      "endpoints": [
        "https://github.com/poli0981/yt-desc-gen/releases/latest/download/latest.json"
      ]
    }
  }
}
```

> **Installer license page (v0.28).** The real `src-tauri/tauri.conf.json`
> sets `bundle.licenseFile: "installer-license.txt"` (path relative to
> `src-tauri/`). Tauri shows that file as an "accept the terms" page in the
> **Windows MSI/NSIS** installers. macOS `.app`/`.dmg` and the Linux packages
> have no interactive license step, so they rely on the app's first-run
> consent gate instead. If a WiX/MSI build ever rejects the `.txt`, switch to
> the per-bundler keys (`bundle.windows.wix.licenseFile` wants `.rtf`,
> `bundle.windows.nsis.licenseFile` accepts `.txt`).

### 3. Rust Backend (src-tauri/src/main.rs)

```rust
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{Manager, SystemTray, SystemTrayMenu, SystemTrayMenuItem, SystemTrayEvent};

#[tauri::command]
fn save_to_file(path: String, content: String) -> Result<(), String> {
    std::fs::write(&path, &content).map_err(|e| e.to_string())
}

#[tauri::command]
fn read_from_file(path: String) -> Result<String, String> {
    std::fs::read_to_string(&path).map_err(|e| e.to_string())
}

fn main() {
    let tray_menu = SystemTrayMenu::new()
        .add_item(tauri::CustomMenuItem::new("show", "Show"))
        .add_native_item(SystemTrayMenuItem::Separator)
        .add_item(tauri::CustomMenuItem::new("quit", "Quit"));

    let system_tray = SystemTray::new().with_menu(tray_menu);

    tauri::Builder::default()
        .system_tray(system_tray)
        .on_system_tray_event(|app, event| match event {
            SystemTrayEvent::LeftClick { .. } => {
                let window = app.get_window("main").unwrap();
                window.show().unwrap();
                window.set_focus().unwrap();
            }
            SystemTrayEvent::MenuItemClick { id, .. } => match id.as_str() {
                "show" => {
                    let window = app.get_window("main").unwrap();
                    window.show().unwrap();
                    window.set_focus().unwrap();
                }
                "quit" => {
                    std::process::exit(0);
                }
                _ => {}
            },
            _ => {}
        })
        .invoke_handler(tauri::generate_handler![save_to_file, read_from_file])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

### 4. Frontend Tauri Integration

```typescript
// src/utils/platform.ts
export const IS_TAURI = "__TAURI__" in window;

// src/utils/file-ops.ts
import { IS_TAURI } from "./platform";

export async function saveFile(content: string, filename: string): Promise<void> {
  if (IS_TAURI) {
    const { save } = await import("@tauri-apps/api/dialog");
    const { invoke } = await import("@tauri-apps/api/tauri");
    const path = await save({ defaultPath: filename });
    if (path) await invoke("save_to_file", { path, content });
  } else {
    // Web fallback: download via blob
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
}

export async function loadFile(): Promise<string | null> {
  if (IS_TAURI) {
    const { open } = await import("@tauri-apps/api/dialog");
    const { invoke } = await import("@tauri-apps/api/tauri");
    const path = await open({ filters: [{ name: "JSON", extensions: ["json"] }] });
    if (typeof path === "string") return invoke("read_from_file", { path });
    return null;
  } else {
    // Web fallback: file input
    return new Promise((resolve) => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = ".json";
      input.onchange = async () => {
        const file = input.files?.[0];
        if (file) resolve(await file.text());
        else resolve(null);
      };
      input.click();
    });
  }
}
```

## Build & Release

### Development

```bash
# Web only
npm run dev

# Desktop (opens native window with hot reload)
npm run tauri dev
```

### Production Build

```bash
# Web only → dist/
npm run build

# Desktop → src-tauri/target/release/bundle/
npm run tauri build
```

Output locations:
- Windows: `src-tauri/target/release/bundle/msi/YTDescGen_0.1.0_x64.msi`
- macOS: `src-tauri/target/release/bundle/dmg/YTDescGen_0.1.0_aarch64.dmg`

### GitHub Actions Release

The live workflow lives at [.github/workflows/release-desktop.yml](../.github/workflows/release-desktop.yml). Pushing a `v*` tag (e.g. `v0.10.0`) triggers a three-platform matrix build (Windows, macOS ARM, Linux) and uploads each installer to a single draft GitHub Release named `YTDescGen v__VERSION__`. Publish the draft manually after smoke-testing the binaries.

Matrix entries:

| Runner | Target | Output |
|---|---|---|
| `windows-latest` | `x86_64-pc-windows-msvc` | `.msi`, `.exe` (NSIS) |
| `macos-14` | `aarch64-apple-darwin` | `.app.tar.gz` |
| `ubuntu-latest` | `x86_64-unknown-linux-gnu` | `.AppImage`, `.deb` |

Linux runners install `libwebkit2gtk-4.1-dev`, `libgtk-3-dev`, `libayatana-appindicator3-dev`, `librsvg2-dev`, and `patchelf` before building — Tauri's webview + AppImage tooling needs these.

`fail-fast: false` keeps the other platforms going if one breaks. The `bundleArgs` matrix field is concatenated with `--target ${{ matrix.target }}` and passed through to `tauri build`.

**macOS notes (v0.9.1+):**
- **DMG bundling is skipped** (`--bundles app`). Tauri's DMG bundler runs an AppleScript that flakes intermittently on hosted macOS runners (the headless display can't load Finder fast enough for `osascript` to position icons), so we ship a `.app.tar.gz` instead. Users expand the archive and drag the `.app` into `/Applications`.
- **Intel macOS (`macos-13`) is NOT built.** GitHub started deprecating the `macos-13` free runner pool in 2025; jobs queue indefinitely. If Intel support becomes a priority, switch the macos-14 entry's target to `universal-apple-darwin` (Tauri builds both archs and lipos them into one universal binary) — the runner already has the toolchain capacity.

**Code signing is intentionally skipped** for both Windows and macOS — this is an open-source personal tool, and signing certificates carry recurring cost. End users will see the standard "unverified publisher" / "unidentified developer" prompts on first launch. Document the bypass steps in the release notes if needed.

**Auto-changelog** (`git-cliff`) is out of scope; release notes come from the tag's annotated message via the default `tauri-action` behaviour. CHANGELOG.md is hand-maintained.

**Manual re-run:** the workflow accepts `workflow_dispatch` with a `tag` input — `gh workflow run release-desktop.yml -f tag=v0.9.0` rebuilds an existing release without deleting + recreating the tag. Useful when a transient runner failure costs a single arch's binary.

**Backfill for pre-workflow tags:** `v0.8.0` and `v0.8.1` predate the multi-platform matrix and only have local Windows builds. To attach binaries retroactively, build manually then `gh release create v0.8.0 --notes-file CHANGELOG.md path/to/*.msi …`.

## Android (.apk) Packaging

YTDescGen also builds an installable Android APK from the **same** Tauri 2
codebase — there is no separate mobile project. Tauri 2 ships Android support;
the crate is already `cdylib`/`staticlib` with a `#[cfg_attr(mobile, …)]` entry
point, and the Android launcher icons live in `src-tauri/icons/android/`. The
desktop-only tray / single-instance / hide-to-tray logic in `src-tauri/src/lib.rs`
is gated behind `#[cfg(desktop)]` so the library compiles for Android.

> **Min version: Android 11 (minSdk 30), targetSdk 36.** Set via
> `bundle.android.minSdkVersion` in `src-tauri/tauri.conf.json` (the source of
> truth used by `tauri android init`) and the generated
> `gen/android/app/build.gradle.kts` (`minSdk = 30` — edit this directly if you
> change it without re-running `init`, since the gradle value is baked at init
> time). Android 11+ covers the large majority of active devices and keeps a
> modern, auto-updating System WebView (the WebView minimum is Android 10) plus
> Google Play system/Play-services security updates, even though Google's
> OS-level security bulletins for Android 11–13 have ended. Raising minSdk also
> moots the ancient-WebView class of bug (e.g. the Chromium-91 `crypto.randomUUID`
> boot crash fixed in this release).

### Prerequisites

- **Android SDK** — platform-tools, a platform (e.g. `android-34`/`android-36`), build-tools. Install via Android Studio or the command-line tools.
- **Android NDK** — r27 LTS recommended (e.g. `27.3.13750724`).
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
file, guarded by `if (exists())` — a missing keystore yields an *unsigned*
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

Install on a device: copy the APK over (or `adb install -r <apk>`) and enable
"Install unknown apps" for the source app.

### CI

[.github/workflows/release-android.yml](../.github/workflows/release-android.yml)
builds and signs the APK on a `v*` tag (or `workflow_dispatch`) and attaches it
to the same draft GitHub Release as the desktop binaries. It needs four repo
secrets:

| Secret | Value |
|---|---|
| `ANDROID_KEYSTORE_BASE64` | base64 of the `.jks` (`base64 -w0 ytdescgen-release.jks`) |
| `ANDROID_STORE_PASSWORD` | keystore store password |
| `ANDROID_KEY_PASSWORD` | key password |
| `ANDROID_KEY_ALIAS` | `ytdescgen` |

### App-level changes for Android

- **`src-tauri/src/lib.rs`** — tray / single-instance / hide-to-tray / exit-prevention are `#[cfg(desktop)]`; the dialog/fs/opener/shell plugins and the six file commands run on every platform.
- **`src-tauri/Cargo.toml`** — `tauri-plugin-single-instance` lives in a desktop-only `[target.'cfg(not(any(target_os = "android", target_os = "ios")))'.dependencies]` table.
- **`src/utils/platform.ts` / `file-ops.ts`** — `IS_MOBILE` routes file export through the WebView blob download on Android (the native save dialog is unreliable under scoped storage). Settings persist via `appDataDir()` (app-private storage) **and** localStorage, both of which work on Android.

## Auto-Update Flow

```
App Start
   │
   ▼
Check GitHub Releases endpoint
   │
   ├─ No update → Continue normally
   │
   └─ Update available
       │
       ▼
   Show dialog: "Update v0.2.0 available. Install now?"
       │
       ├─ Yes → Download + install + restart
       └─ No  → Dismiss, ask again next launch
```

## Offline Capability

The app is fully offline-capable because:
- All templates and configs are bundled
- State persists in localStorage (web) or app data directory (Tauri)
- No external API calls required
- Fonts can be bundled locally for desktop

Only auto-update requires internet connectivity.
