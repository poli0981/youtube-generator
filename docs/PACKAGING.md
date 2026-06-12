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
