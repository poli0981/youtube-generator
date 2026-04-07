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

# Node.js 20+
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

```yaml
# .github/workflows/release-desktop.yml
name: Release Desktop

on:
  push:
    tags: ["v*"]

permissions:
  contents: write

jobs:
  build:
    strategy:
      matrix:
        include:
          - os: windows-latest
            target: x86_64-pc-windows-msvc
          - os: macos-latest
            target: aarch64-apple-darwin
          - os: macos-latest
            target: x86_64-apple-darwin
    runs-on: ${{ matrix.os }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - uses: dtolnay/rust-toolchain@stable
        with:
          targets: ${{ matrix.target }}
      - run: npm ci
      - uses: tauri-apps/tauri-action@v0
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          tagName: v__VERSION__
          releaseName: "YTDescGen v__VERSION__"
          releaseBody: "See CHANGELOG.md for details."
          releaseDraft: true
```

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
