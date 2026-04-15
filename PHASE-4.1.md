# Phase 4.1 — Bug Fixes, Improvements & New Features

**Status**: In Progress
**Priority**: P0 (bugs) + P1 (improvements + features)
**Estimated**: 3-4 days

---

## Table of Contents

1. [Bug Fixes](#1-bug-fixes)
2. [Improvements](#2-improvements)
3. [New Features](#3-new-features)
4. [Task Checklist](#4-task-checklist)
5. [Definition of Done](#5-definition-of-done)

---

## 1. Bug Fixes

### 1.1 BUG: Settings Not Persisting Across Sessions

**Severity**: High
**Component**: `src/store/settings-store.ts`

**Problem**: Settings values (theme, default language, tag options, etc.) are lost when the app restarts. The Zustand `persist` middleware writes to `localStorage` on web but the desktop (Tauri) app does not reliably read from it across sessions. Additionally, there is no fallback file-based persistence.

**Root Cause**: Relying solely on `localStorage` which can be cleared by the system WebView or on page navigation edge cases in Tauri.

**Solution**: Introduce a `settings.json` file-based persistence layer alongside `localStorage`.

**Implementation**:

```
src/
├── utils/
│   └── storage-adapter.ts     # NEW — abstract storage backend
├── store/
│   └── settings-store.ts      # MODIFY — use storage adapter
└── src-tauri/
    └── src/main.rs             # MODIFY — add read/write settings commands
```

**storage-adapter.ts** — Dual-backend storage:

```typescript
// src/utils/storage-adapter.ts

import { IS_TAURI } from "./platform";

const SETTINGS_FILENAME = "settings.json";

/**
 * Resolves the settings file path in Tauri's app data directory.
 * e.g. Windows: %APPDATA%/com.skullmute.ytdescgen/settings.json
 *      macOS:   ~/Library/Application Support/com.skullmute.ytdescgen/settings.json
 */
async function getSettingsPath(): Promise<string> {
  const { appDataDir } = await import("@tauri-apps/api/path");
  const dir = await appDataDir();
  return `${dir}${SETTINGS_FILENAME}`;
}

export async function loadSettings<T>(key: string, fallback: T): Promise<T> {
  // 1. Try Tauri file system first
  if (IS_TAURI) {
    try {
      const { invoke } = await import("@tauri-apps/api/tauri");
      const path = await getSettingsPath();
      const raw: string = await invoke("read_from_file", { path });
      const allSettings = JSON.parse(raw);
      if (key in allSettings) return allSettings[key] as T;
    } catch {
      // File doesn't exist yet or read error — fall through
    }
  }

  // 2. Fallback to localStorage
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw) as T;
  } catch {
    // Parse error — fall through
  }

  return fallback;
}

export async function saveSettings<T>(key: string, value: T): Promise<void> {
  // 1. Always write to localStorage (web compatibility)
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or disabled
  }

  // 2. Also write to file in Tauri
  if (IS_TAURI) {
    try {
      const { invoke } = await import("@tauri-apps/api/tauri");
      const path = await getSettingsPath();

      // Read existing file, merge, write back
      let allSettings: Record<string, unknown> = {};
      try {
        const raw: string = await invoke("read_from_file", { path });
        allSettings = JSON.parse(raw);
      } catch {
        // File doesn't exist yet — start fresh
      }

      allSettings[key] = value;
      await invoke("save_to_file", {
        path,
        content: JSON.stringify(allSettings, null, 2),
      });
    } catch {
      // Write error — localStorage is the fallback
    }
  }
}
```

**Tauri backend** — Ensure app data directory exists:

```rust
// src-tauri/src/main.rs — add or modify save_to_file

#[tauri::command]
fn save_to_file(path: String, content: String) -> Result<(), String> {
    // Ensure parent directory exists
    if let Some(parent) = std::path::Path::new(&path).parent() {
        std::fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    std::fs::write(&path, &content).map_err(|e| e.to_string())
}
```

**settings-store.ts** — Integrate dual storage:

```typescript
// src/store/settings-store.ts — modify persist config

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { saveSettings } from "@utils/storage-adapter";

const STORE_KEY = "ytdescgen-settings";

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      // ... existing state & actions

      // Override set to also write to file
      _afterHydration: false,

      setTheme: (theme) => {
        set({ theme });
        saveSettings(STORE_KEY, get()); // fire-and-forget async write
      },

      setDefaultLanguage: (lang) => {
        set({ defaultLanguage: lang });
        saveSettings(STORE_KEY, get());
      },

      // ... same pattern for other setters
    }),
    {
      name: STORE_KEY,
      storage: createJSONStorage(() => localStorage),
      // On hydration, also try loading from file
      onRehydrateStorage: () => {
        return async (_state, error) => {
          if (!error) {
            // Async load from file (Tauri) — overrides localStorage if newer
            const { loadSettings } = await import("@utils/storage-adapter");
            const fileSettings = await loadSettings(STORE_KEY, null);
            if (fileSettings) {
              useSettingsStore.setState(fileSettings);
            }
          }
        };
      },
    },
  ),
);
```

**settings.json example** (written to app data dir):

```jsonc
{
  "ytdescgen-settings": {
    "theme": "dark",
    "defaultLanguage": "vi",
    "defaultOutputLanguage": "en",
    "defaultGenre": "action",
    "autoSaveDraft": true,
    "showCharCount": true,
    "includeMultilingualTags": true,
    "includeTrendingTags": true,
    "hashtagCount": 3,
    "historyLimit": 100
  },
  "ytdescgen-profiles": [ /* ... */ ],
  "ytdescgen-presets": [ /* ... */ ]
}
```

**Apply the same pattern** to `profile-store.ts`, `preset-store.ts`, and `history-store.ts` — all should dual-write through `storage-adapter.ts`.

---

### 1.2 BUG: Platform/Social Text Names Not Capitalized

**Severity**: Low
**Component**: `src/config/platforms.ts`, `src/config/social-fields.ts`

**Problem**: Platform names like "steam", "paypal", "gog" appear in lowercase in the generated description output instead of their proper brand names ("Steam", "PayPal", "GOG").

**Root Cause**: The `label` field in config arrays uses lowercase, or the description builder reads from the `id` field instead of `label`.

**Solution**: Audit and fix all config entries + ensure the description builder always uses `label` for display.

**Files to fix**:

```typescript
// src/config/platforms.ts — ensure correct brand capitalization
export const PLATFORMS = [
  { id: "steam",    label: "Steam",             prefix: "https://store.steampowered.com/app/" },
  { id: "epic",     label: "Epic Games Store",   prefix: "https://store.epicgames.com/" },
  { id: "ps",       label: "PlayStation Store",   prefix: "https://store.playstation.com/" },
  { id: "xbox",     label: "Xbox",               prefix: "https://www.xbox.com/games/" },
  { id: "nintendo", label: "Nintendo eShop",      prefix: "https://www.nintendo.com/store/" },
  { id: "gog",      label: "GOG",                prefix: "https://www.gog.com/game/" },
  { id: "itchio",   label: "itch.io",            prefix: "https://itch.io/" },
  { id: "humble",   label: "Humble Bundle",       prefix: "https://www.humblebundle.com/store/" },
  { id: "amazon",   label: "Amazon Luna",         prefix: "https://www.amazon.com/luna/" },
] as const;

// src/config/social-fields.ts — ensure correct brand capitalization
export const DONATE_FIELDS = [
  { id: "kofi",          label: "Ko-fi",              prefix: "https://ko-fi.com/" },
  { id: "patreon",       label: "Patreon",            prefix: "https://patreon.com/" },
  { id: "buymeacoffee",  label: "Buy Me a Coffee",    prefix: "https://buymeacoffee.com/" },
  { id: "paypal",        label: "PayPal",             prefix: "https://paypal.me/" },
  { id: "streamlabs",    label: "Streamlabs",         prefix: "https://streamlabs.com/" },
] as const;

export const SOCIAL_FIELDS = [
  { id: "github",    label: "GitHub",       prefix: "https://github.com/" },
  { id: "twitter",   label: "Twitter / X",  prefix: "https://x.com/" },
  { id: "discord",   label: "Discord",      prefix: "https://discord.gg/" },
  { id: "twitch",    label: "Twitch",       prefix: "https://twitch.tv/" },
  { id: "tiktok",    label: "TikTok",       prefix: "https://tiktok.com/@" },
  { id: "instagram", label: "Instagram",    prefix: "https://instagram.com/" },
  { id: "bluesky",   label: "Bluesky",      prefix: "https://bsky.app/profile/" },
  { id: "mastodon",  label: "Mastodon",     prefix: "" }, // instance varies
  { id: "facebook",  label: "Facebook",     prefix: "https://facebook.com/" },
  { id: "fb_page",   label: "Facebook Page", prefix: "https://facebook.com/" },
  { id: "fb_group",  label: "Facebook Group", prefix: "https://facebook.com/groups/" },
  { id: "website",   label: "Website",      prefix: "" },
] as const;
```

**description-builder.ts** — Ensure it uses `label` not `id`:

```typescript
// WRONG — uses id directly
const storeLines = Object.entries(storeLinks)
  .filter(([_, url]) => url)
  .map(([id, url]) => `🎮 ${id}: ${url}`);  // ← outputs "steam: ..."

// CORRECT — look up label from config
import { PLATFORMS } from "@config/platforms";

const storeLines = Object.entries(storeLinks)
  .filter(([_, url]) => url)
  .map(([id, url]) => {
    const platform = PLATFORMS.find((p) => p.id === id);
    return `🎮 ${platform?.label ?? id}: ${url}`;  // ← outputs "Steam: ..."
  });
```

Apply the same fix for social/donate links in description output — always look up `label` from the config arrays.

---

### 1.3 BUG: System Tray Icon Duplicates on Restart

**Severity**: Medium
**Component**: `src-tauri/src/main.rs`

**Problem**: When the app window is closed and reopened (or the app restarts), a duplicate system tray icon appears. Each `tauri::Builder` run creates a new tray without cleaning up the previous one.

**Root Cause**: Tauri's system tray is created on every app launch. If the previous instance didn't clean up properly (crash, force-quit), the OS retains the old icon.

**Solution**: Use `SystemTray::with_id()` to ensure a single tray identity, and handle the close event to hide instead of quit.

```rust
// src-tauri/src/main.rs

use tauri::{
    AppHandle, CustomMenuItem, Manager, SystemTray, SystemTrayEvent,
    SystemTrayMenu, SystemTrayMenuItem, WindowEvent, RunEvent,
};

fn create_tray() -> SystemTray {
    let show = CustomMenuItem::new("show".to_string(), "Show YTDescGen");
    let quit = CustomMenuItem::new("quit".to_string(), "Quit");

    let menu = SystemTrayMenu::new()
        .add_item(show)
        .add_native_item(SystemTrayMenuItem::Separator)
        .add_item(quit);

    SystemTray::new()
        .with_id("ytdescgen-tray")      // ← Fixed ID prevents duplicates
        .with_menu(menu)
        .with_tooltip("YTDescGen — YouTube Description Generator") // ← Tooltip fix
}

fn handle_tray_event(app: &AppHandle, event: SystemTrayEvent) {
    match event {
        SystemTrayEvent::LeftClick { .. } | SystemTrayEvent::DoubleClick { .. } => {
            if let Some(window) = app.get_window("main") {
                let _ = window.show();
                let _ = window.unminimize();
                let _ = window.set_focus();
            }
        }
        SystemTrayEvent::MenuItemClick { id, .. } => match id.as_str() {
            "show" => {
                if let Some(window) = app.get_window("main") {
                    let _ = window.show();
                    let _ = window.unminimize();
                    let _ = window.set_focus();
                }
            }
            "quit" => {
                app.exit(0);
            }
            _ => {}
        },
        _ => {}
    }
}

fn main() {
    tauri::Builder::default()
        .system_tray(create_tray())
        .on_system_tray_event(handle_tray_event)
        // Hide window instead of closing — prevents tray duplication
        .on_window_event(|event| {
            if let WindowEvent::CloseRequested { api, .. } = event.event() {
                // Hide the window instead of destroying it
                event.window().hide().unwrap();
                api.prevent_close();
            }
        })
        .invoke_handler(tauri::generate_handler![save_to_file, read_from_file])
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        .run(|app_handle, event| {
            if let RunEvent::ExitRequested { api, .. } = event {
                // Keep app running in tray when all windows are closed
                api.prevent_exit();
            }
        });
}
```

**Key changes**:
1. `with_id("ytdescgen-tray")` — OS uses this ID to track the tray icon; prevents duplicates
2. `with_tooltip(...)` — Adds tooltip on hover (fixes missing tooltip)
3. `on_window_event(CloseRequested)` — Hides window instead of destroying, so the tray stays consistent
4. `RunEvent::ExitRequested` — Prevents the app from exiting when the window is hidden
5. Only "Quit" menu item actually exits the process via `app.exit(0)`

### 1.4 BUG: System Tray Missing Tooltip

**Severity**: Low
**Component**: `src-tauri/src/main.rs`

**Problem**: Hovering over the tray icon shows no tooltip text.

**Solution**: Already addressed in 1.3 above — `.with_tooltip("YTDescGen — YouTube Description Generator")`.

---

## 2. Improvements

### 2.1 Input Validation: Email Format (Allow Up to 3 Emails)

**Component**: `src/utils/validation.ts` (NEW), `src/components/editor/SocialEditor.tsx`

**Requirement**:
- Contact email field accepts **1 to 3 email addresses**, separated by commas
- Each email must pass format validation
- Invalid email = field shows error, value not saved to state
- Empty field = valid (email is optional)

**Implementation**:

```typescript
// src/utils/validation.ts

/**
 * RFC 5322 simplified email regex.
 * Covers 99.9% of real-world email addresses.
 */
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

const MAX_EMAILS = 3;

export interface ValidationResult {
  valid: boolean;
  error?: string;       // i18n key for error message
  errorParams?: Record<string, string | number>;
}

/**
 * Validate a contact email field.
 * Accepts 1-3 comma-separated email addresses.
 * Returns { valid: true } if empty (field is optional).
 */
export function validateEmails(input: string): ValidationResult {
  const trimmed = input.trim();
  if (!trimmed) return { valid: true }; // optional field

  const emails = trimmed.split(",").map((e) => e.trim()).filter(Boolean);

  if (emails.length > MAX_EMAILS) {
    return {
      valid: false,
      error: "validation.emailMaxExceeded",
      errorParams: { max: MAX_EMAILS, count: emails.length },
    };
  }

  for (const email of emails) {
    if (!EMAIL_REGEX.test(email)) {
      return {
        valid: false,
        error: "validation.emailInvalid",
        errorParams: { email },
      };
    }
  }

  return { valid: true };
}
```

**UI integration** — ValidatedInput component:

```typescript
// src/components/ui/ValidatedInput.tsx

import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import type { ValidationResult } from "@utils/validation";

interface ValidatedInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  validate: (value: string) => ValidationResult;
  placeholder?: string;
  helpText?: string;
}

export function ValidatedInput({
  label, value, onChange, validate, placeholder, helpText,
}: ValidatedInputProps) {
  const { t } = useTranslation("ui");
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);

  const handleChange = useCallback((newValue: string) => {
    const result = validate(newValue);
    if (result.valid) {
      setError(null);
      onChange(newValue);
    } else {
      setError(t(result.error!, result.errorParams));
      // Still update the display value so user can keep typing,
      // but do NOT propagate to state
    }
    setTouched(true);
  }, [validate, onChange, t]);

  return (
    <div className="space-y-1">
      <label className="block text-xs font-semibold uppercase tracking-wide text-text-muted">
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        onBlur={() => setTouched(true)}
        placeholder={placeholder}
        className={`w-full rounded-lg border bg-surface-0 px-3 py-2 text-sm text-text-primary
          ${touched && error ? "border-danger" : "border-border"}`}
      />
      {touched && error && (
        <p className="text-xs text-danger">{error}</p>
      )}
      {helpText && !error && (
        <p className="text-xs text-text-muted">{helpText}</p>
      )}
    </div>
  );
}
```

**Usage in SocialEditor**:

```typescript
// src/components/editor/SocialEditor.tsx

import { validateEmails } from "@utils/validation";

<ValidatedInput
  label={t("editor.contactEmail")}
  value={state.contactEmail}
  onChange={(v) => set("contactEmail", v)}
  validate={validateEmails}
  placeholder="email1@example.com, email2@example.com"
  helpText={t("editor.contactEmailHelp")} // "Up to 3 emails, comma-separated"
/>
```

**i18n strings to add** (all locale files):

```jsonc
// ui.json
{
  "validation": {
    "emailInvalid": "Invalid email: {{email}}",
    "emailMaxExceeded": "Maximum {{max}} emails allowed (currently {{count}})"
  },
  "editor": {
    "contactEmailHelp": "Up to 3 emails, comma-separated"
  }
}
```

---

### 2.2 Input Validation: URL Format

**Component**: `src/utils/validation.ts`, `src/components/editor/StoreLinkEditor.tsx`, `src/components/editor/SocialEditor.tsx`

**Requirement**:
- All link fields (store links, social links, playlist, donate) must be valid URLs
- Must start with `https://` (or `http://` for legacy)
- Invalid URL = field shows error, value not saved to state
- Empty field = valid (all links are optional)
- Mastodon is a special case: instance URL varies (e.g. `https://mastodon.social/@user`)

**Implementation**:

```typescript
// src/utils/validation.ts — add to existing file

/**
 * Validate a URL.
 * Must start with http:// or https://.
 * Must have a valid domain with at least one dot.
 */
const URL_REGEX = /^https?:\/\/[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)+([/?#].*)?$/;

export function validateUrl(input: string): ValidationResult {
  const trimmed = input.trim();
  if (!trimmed) return { valid: true }; // optional field

  if (!URL_REGEX.test(trimmed)) {
    return {
      valid: false,
      error: "validation.urlInvalid",
    };
  }

  return { valid: true };
}

/**
 * Validate a URL with expected prefix.
 * Shows a warning (not error) if URL doesn't match the platform's expected prefix.
 */
export function validateUrlWithPrefix(input: string, expectedPrefix: string): ValidationResult {
  const baseResult = validateUrl(input);
  if (!baseResult.valid) return baseResult;

  const trimmed = input.trim();
  if (!trimmed) return { valid: true };

  // Warn if URL doesn't match expected platform prefix
  if (expectedPrefix && !trimmed.startsWith(expectedPrefix)) {
    return {
      valid: true, // still valid, just a warning
      error: "validation.urlPrefixMismatch",
      errorParams: { expected: expectedPrefix },
    };
  }

  return { valid: true };
}
```

**StoreLinkEditor** — Apply validation per platform:

```typescript
// src/components/editor/StoreLinkEditor.tsx

{PLATFORMS.map((platform) => (
  <ValidatedInput
    key={platform.id}
    label={platform.label}
    value={state.storeLinks[platform.id] || ""}
    onChange={(v) => setNested("storeLinks", platform.id, v)}
    validate={(v) => validateUrlWithPrefix(v, platform.prefix)}
    placeholder={`${platform.prefix}...`}
  />
))}
```

**i18n strings to add**:

```jsonc
{
  "validation": {
    "urlInvalid": "Invalid URL. Must start with https://",
    "urlPrefixMismatch": "Expected URL starting with {{expected}}"
  }
}
```

---

### 2.3 Batch Mode: Multi-Language Per Part

**Component**: `src/pages/BatchPage.tsx`, `src/components/batch/BatchPartCard.tsx`

**Current behavior**: Batch mode generates N parts, each in a single selected language. User must switch language and regenerate to get other languages.

**Desired behavior**: Each part in the batch output contains all selected languages grouped together, so the user can copy title+description in each language for that specific part without switching.

**New batch output structure**:

```
┌─────────────────────────────────────────────────┐
│  BATCH OUTPUT                                    │
│                                                  │
│  ┌─ Part 1 ─────────────────────────────────┐   │
│  │  🇬🇧 English                              │   │
│  │  Title: Elden Ring — Part 1 — Gameplay... │   │
│  │  Description: This video features...      │   │
│  │  [Copy Title] [Copy Desc]                 │   │
│  │                                           │   │
│  │  🇻🇳 Tiếng Việt                           │   │
│  │  Title: Elden Ring — Phần 1 — Gameplay... │   │
│  │  Description: Video này là...             │   │
│  │  [Copy Title] [Copy Desc]                 │   │
│  │                                           │   │
│  │  🇯🇵 日本語                                 │   │
│  │  Title: エルデンリング — パート1 — Gameplay...│   │
│  │  Description: この動画は...                │   │
│  │  [Copy Title] [Copy Desc]                 │   │
│  │                                           │   │
│  │  🏷 Tags (shared)                         │   │
│  │  [Copy Tags]                              │   │
│  │  [Copy All Part 1]                        │   │
│  └───────────────────────────────────────────┘   │
│                                                  │
│  ┌─ Part 2 ─────────────────────────────────┐   │
│  │  ... same structure ...                   │   │
│  └───────────────────────────────────────────┘   │
│                                                  │
│  [Copy All Parts]                                │
└─────────────────────────────────────────────────┘
```

**Data model change**:

```typescript
// src/pages/BatchPage.tsx — state

interface BatchConfig {
  // Existing
  gameName: string;
  genre: Genre;
  videoType: VideoType; // usually "part"
  parts: BatchPart[];

  // NEW
  selectedLanguages: SupportedLanguage[]; // e.g. ["en", "vi", "ja"]
}

interface BatchPart {
  partNumber: string;
  timestamps: string;
}

// Generated output changes from:
interface BatchOutput {
  partNumber: string;
  title: string;
  description: string;
  tags: string;
}

// To:
interface BatchOutput {
  partNumber: string;
  languages: {
    language: SupportedLanguage;
    title: string;
    description: string;
  }[];
  tags: string; // tags are shared across languages (contain multilingual tags already)
}
```

**Batch generation logic**:

```typescript
// src/hooks/use-batch-generate.ts

function generateBatchOutputs(config: BatchConfig, baseInput: GeneratorInput): BatchOutput[] {
  return config.parts.map((part) => ({
    partNumber: part.partNumber,
    languages: config.selectedLanguages.map((lang) => {
      const input: GeneratorInput = {
        ...baseInput,
        language: lang,
        videoType: config.videoType,
        partNumber: part.partNumber,
        timestamps: part.timestamps,
      };
      return {
        language: lang,
        title: buildTitle(input),
        description: buildDescription(input),
      };
    }),
    tags: generateTags({ ...baseInput, partNumber: part.partNumber }).join(", "),
  }));
}
```

**UI**: Add a multi-select language picker at the top of the batch page:

```typescript
// In BatchPage.tsx — language selector
<Section title="Output Languages" icon="🌐">
  <ChipGroup
    items={SUPPORTED_LANGUAGES}
    value={batchConfig.selectedLanguages}
    onChange={(langId) => {
      // Toggle language in/out of selection
      setBatchConfig((prev) => ({
        ...prev,
        selectedLanguages: prev.selectedLanguages.includes(langId)
          ? prev.selectedLanguages.filter((l) => l !== langId)
          : [...prev.selectedLanguages, langId],
      }));
    }}
    multi={true}
  />
</Section>
```

---

### 2.4 Unify App Language Selection

**Component**: `src/store/settings-store.ts`, `src/components/layout/Header.tsx`

**Problem**: Currently there are two language concepts that can confuse users:
1. **UI language** — the app interface language
2. **Output language** — the generated content language

These are selected in different places and the distinction isn't clear.

**Solution**:

1. **UI language** — moved to Settings page only. This controls the app interface. Labeled clearly as "App Language / Ngôn ngữ ứng dụng / アプリの言語".

2. **Output language** — stays in the Editor tab. This controls what language the generated title/description uses. Labeled as "Output Language / Ngôn ngữ đầu ra / 出力言語".

3. **Header** — shows current UI language flag + name. Clicking opens a small dropdown to switch UI language quickly (convenience shortcut for Settings).

4. **First-run detection** — on first launch, detect browser locale and set both UI and default output language accordingly.

```typescript
// src/store/settings-store.ts

interface SettingsState {
  // Renamed for clarity
  appLanguage: SupportedLanguage;       // UI interface language
  defaultOutputLanguage: SupportedLanguage; // Default for new editor sessions
  // ...
}

// src/i18n/index.ts — on init
const browserLocale = navigator.language.split("-")[0]; // "vi", "ja", "en", etc.
const detectedLanguage = SUPPORTED_LANGUAGES.find(l => l.id === browserLocale)?.id || "en";
```

**Header quick-switch**:

```typescript
// src/components/layout/Header.tsx

function LanguageQuickSwitch() {
  const { appLanguage, setAppLanguage } = useSettingsStore();
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);

  const current = SUPPORTED_LANGUAGES.find(l => l.id === appLanguage);

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="flex items-center gap-1.5 ...">
        <span>{current?.flag}</span>
        <span className="text-sm">{current?.nativeName}</span>
        <ChevronDown size={14} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 rounded-lg border ...">
          {SUPPORTED_LANGUAGES.map(lang => (
            <button
              key={lang.id}
              onClick={() => {
                setAppLanguage(lang.id);
                i18n.changeLanguage(lang.id);
                setOpen(false);
              }}
              className={`flex items-center gap-2 px-3 py-2 w-full ...
                ${lang.id === appLanguage ? "bg-accent-muted" : ""}`}
            >
              <span>{lang.flag}</span>
              <span>{lang.nativeName}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

## 3. New Features

### 3.1 New Genre: FMV (Full Motion Video)

**Component**: `src/config/genres.ts`, `src/engine/tag-generator.ts`, all `templates.json` files

**Addition to genres.ts**:

```typescript
{ id: "fmv", label: "FMV / Interactive Movie", icon: "🎬" },
```

**Tag pool** (tag-generator.ts):

```typescript
fmv: (gameName: string) => [
  `${gameName} FMV`,
  "FMV game no commentary",
  "FMV gameplay",
  "interactive movie no commentary",
  "interactive movie gameplay",
  "full motion video game",
  "FMV game walkthrough",
  "interactive film gameplay",
  `${gameName} all choices`,
  `${gameName} all endings`,
],
```

**Template intro lines** (add to each locale `templates.json`):

```jsonc
// en/templates.json
"fmv": "This video features the full FMV gameplay of {{gameName}} on {{channelName}}."

// vi/templates.json
"fmv": "Video này là toàn bộ gameplay FMV của game {{gameName}} trên kênh {{channelName}}."

// ja/templates.json
"fmv": "この動画は{{channelName}}で{{gameName}}のFMVゲームプレイ全編をお届けします。"

// es/templates.json
"fmv": "Este video presenta el gameplay completo de FMV de {{gameName}} en {{channelName}}."
```

---

### 3.2 New Social Links: Bluesky, Mastodon, Facebook (Account/Page/Group)

**Component**: `src/config/social-fields.ts`

Already included in the config fix in section 1.2. Here are the full entries with emoji icons for description output:

```typescript
// src/config/social-fields.ts — add these entries

// In SOCIAL_FIELDS array:
{ id: "bluesky",   label: "Bluesky",        prefix: "https://bsky.app/profile/", icon: "🦋" },
{ id: "mastodon",  label: "Mastodon",        prefix: "",                          icon: "🐘" },
{ id: "facebook",  label: "Facebook",        prefix: "https://facebook.com/",     icon: "👤" },
{ id: "fb_page",   label: "Facebook Page",   prefix: "https://facebook.com/",     icon: "📄" },
{ id: "fb_group",  label: "Facebook Group",  prefix: "https://facebook.com/groups/", icon: "👥" },
```

**Description output mapping** (description-builder.ts):

```typescript
// Map social field id → emoji for description output
const SOCIAL_ICONS: Record<string, string> = {
  github:    "🐙",
  twitter:   "🐦",
  discord:   "💬",
  twitch:    "📺",
  tiktok:    "🎵",
  instagram: "📸",
  bluesky:   "🦋",
  mastodon:  "🐘",
  facebook:  "👤",
  fb_page:   "📄",
  fb_group:  "👥",
  website:   "🌐",
};
```

**Mastodon special handling** — No fixed prefix since instances vary:

```typescript
// src/components/editor/SocialEditor.tsx
// For Mastodon, show a help text explaining the format

{field.id === "mastodon" && (
  <p className="text-xs text-text-muted">
    {t("editor.mastodonHelp")}
    {/* "Full URL including instance, e.g. https://mastodon.social/@username" */}
  </p>
)}
```

**Validation for Mastodon**: Use `validateUrl()` (standard URL validation, no prefix check).

**Facebook variants**: Treat as separate fields in the form, but collapse in description output:

```typescript
// description-builder.ts — collapse Facebook variants
const fbFields = ["facebook", "fb_page", "fb_group"];
const fbLines = fbFields
  .filter(id => social[id])
  .map(id => {
    const field = SOCIAL_FIELDS.find(f => f.id === id);
    return `${SOCIAL_ICONS[id]} ${field?.label}: ${social[id]}`;
  });
```

---

### 3.3 Playlist Template Generator

**Component**: `src/pages/PlaylistPage.tsx` (NEW), `src/engine/playlist-builder.ts` (NEW)

**Requirement**: Generate YouTube playlist titles and descriptions for game series.

#### Playlist Title Format

```
[Status] Game Name — Gameplay No Commentary
```

**Status values**:

| Status | EN | VI | JA | ES |
|--------|-----|-----|-----|-----|
| Completed | ✅ Completed | ✅ Hoàn thành | ✅ クリア済み | ✅ Completado |
| Dropped | ❌ Dropped | ❌ Bỏ dở | ❌ 中断 | ❌ Abandonado |
| Incomplete | 🔄 Incomplete | 🔄 Chưa hoàn thành | 🔄 未完了 | 🔄 Incompleto |
| In Progress | ▶️ In Progress | ▶️ Đang chơi | ▶️ プレイ中 | ▶️ En progreso |

**Title examples**:

```
✅ Completed — Elden Ring — Gameplay No Commentary
❌ Dropped — Cyberpunk 2077 — Gameplay No Commentary
🔄 Incomplete — Final Fantasy XVI — Gameplay No Commentary
▶️ In Progress — Stellar Blade — Gameplay No Commentary
```

#### Playlist Description Templates

**Data model**:

```typescript
// src/engine/playlist-builder.ts

type PlaylistStatus = "completed" | "dropped" | "incomplete" | "in_progress";

type PlaylistContentType =
  | "full_gameplay"
  | "boss_fights"
  | "speedrun"
  | "all_endings"
  | "dlc"
  | "100_percent"
  | "guide"
  | "highlights";

interface PlaylistInput {
  gameName: string;
  channelName: string;
  status: PlaylistStatus;
  contentType: PlaylistContentType;
  language: SupportedLanguage;
  totalVideos?: number;
  storeLinks?: Record<string, string>;
  playlistNote?: string; // optional custom note
}

interface PlaylistOutput {
  title: string;
  description: string;
}
```

**Template strings** (add to each locale `templates.json`):

```jsonc
// en/templates.json — add "playlist" section
{
  "playlist": {
    "status": {
      "completed": "✅ Completed",
      "dropped": "❌ Dropped",
      "incomplete": "🔄 Incomplete",
      "in_progress": "▶️ In Progress"
    },
    "titleFormat": "{{status}} — {{gameName}} — Gameplay No Commentary",
    "description": {
      "full_gameplay": "This playlist contains the full gameplay of {{gameName}} on {{channelName}}.\nNo Commentary — pure gameplay experience.",
      "boss_fights": "This playlist contains all boss fights from {{gameName}} on {{channelName}}.\nNo Commentary — pure boss battle footage.",
      "speedrun": "This playlist contains speedrun(s) of {{gameName}} on {{channelName}}.\nNo Commentary — optimized gameplay.",
      "all_endings": "This playlist contains all endings of {{gameName}} on {{channelName}}.\n⚠️ Contains spoilers.",
      "dlc": "This playlist contains DLC gameplay of {{gameName}} on {{channelName}}.\nNo Commentary.",
      "100_percent": "This playlist contains the 100% completion run of {{gameName}} on {{channelName}}.\nNo Commentary — all collectibles, side quests, and secrets.",
      "guide": "This playlist is a silent walkthrough/guide for {{gameName}} on {{channelName}}.\nNo Commentary.",
      "highlights": "This playlist contains gameplay highlights from {{gameName}} on {{channelName}}.\nNo Commentary."
    },
    "videoCount": "📹 {{count}} video(s)",
    "storeSection": "🎮 Get the game:",
    "footer": "👍 Like | 🔔 Subscribe for more gameplay!"
  }
}

// vi/templates.json
{
  "playlist": {
    "status": {
      "completed": "✅ Hoàn thành",
      "dropped": "❌ Bỏ dở",
      "incomplete": "🔄 Chưa hoàn thành",
      "in_progress": "▶️ Đang chơi"
    },
    "titleFormat": "{{status}} — {{gameName}} — Gameplay No Commentary",
    "description": {
      "full_gameplay": "Playlist này là toàn bộ gameplay của game {{gameName}} trên kênh {{channelName}}.\nKhông bình luận — chỉ có gameplay thuần túy.",
      "boss_fights": "Playlist này bao gồm tất cả các trận boss trong game {{gameName}} trên kênh {{channelName}}.\nKhông bình luận.",
      "speedrun": "Playlist này là (các) video speedrun của game {{gameName}} trên kênh {{channelName}}.\nKhông bình luận.",
      "all_endings": "Playlist này bao gồm tất cả các kết thúc của game {{gameName}} trên kênh {{channelName}}.\n⚠️ Có chứa nội dung spoiler.",
      "dlc": "Playlist này là gameplay DLC của game {{gameName}} trên kênh {{channelName}}.\nKhông bình luận.",
      "100_percent": "Playlist này là bản chơi 100% của game {{gameName}} trên kênh {{channelName}}.\nKhông bình luận — bao gồm tất cả collectibles, nhiệm vụ phụ và bí mật.",
      "guide": "Playlist này là hướng dẫn không lời cho game {{gameName}} trên kênh {{channelName}}.\nKhông bình luận.",
      "highlights": "Playlist này là những khoảnh khắc nổi bật từ game {{gameName}} trên kênh {{channelName}}.\nKhông bình luận."
    },
    "videoCount": "📹 {{count}} video",
    "storeSection": "🎮 Tải / mua game:",
    "footer": "👍 Like | 🔔 Subscribe để xem thêm gameplay!"
  }
}

// ja/templates.json
{
  "playlist": {
    "status": {
      "completed": "✅ クリア済み",
      "dropped": "❌ 中断",
      "incomplete": "🔄 未完了",
      "in_progress": "▶️ プレイ中"
    },
    "titleFormat": "{{status}} — {{gameName}} — Gameplay No Commentary",
    "description": {
      "full_gameplay": "このプレイリストは{{channelName}}での{{gameName}}のフルゲームプレイです。\n解説なし — 純粋なゲームプレイ体験。",
      "boss_fights": "このプレイリストは{{channelName}}での{{gameName}}の全ボス戦です。\n解説なし。",
      "speedrun": "このプレイリストは{{channelName}}での{{gameName}}のスピードランです。\n解説なし。",
      "all_endings": "このプレイリストは{{channelName}}での{{gameName}}の全エンディングです。\n⚠️ ネタバレを含みます。",
      "dlc": "このプレイリストは{{channelName}}での{{gameName}}のDLCゲームプレイです。\n解説なし。",
      "100_percent": "このプレイリストは{{channelName}}での{{gameName}}の100%クリアです。\n解説なし — 全コレクティブル、サブクエスト、隠し要素を含みます。",
      "guide": "このプレイリストは{{channelName}}での{{gameName}}のサイレント攻略ガイドです。\n解説なし。",
      "highlights": "このプレイリストは{{channelName}}での{{gameName}}のハイライトシーンです。\n解説なし。"
    },
    "videoCount": "📹 {{count}}本の動画",
    "storeSection": "🎮 ゲーム購入:",
    "footer": "👍 高評価 | 🔔 チャンネル登録お願いします！"
  }
}

// es/templates.json
{
  "playlist": {
    "status": {
      "completed": "✅ Completado",
      "dropped": "❌ Abandonado",
      "incomplete": "🔄 Incompleto",
      "in_progress": "▶️ En progreso"
    },
    "titleFormat": "{{status}} — {{gameName}} — Gameplay No Commentary",
    "description": {
      "full_gameplay": "Esta playlist contiene el gameplay completo de {{gameName}} en {{channelName}}.\nSin comentarios — experiencia de juego pura.",
      "boss_fights": "Esta playlist contiene todas las peleas de jefes de {{gameName}} en {{channelName}}.\nSin comentarios.",
      "speedrun": "Esta playlist contiene el speedrun de {{gameName}} en {{channelName}}.\nSin comentarios.",
      "all_endings": "Esta playlist contiene todos los finales de {{gameName}} en {{channelName}}.\n⚠️ Contiene spoilers.",
      "dlc": "Esta playlist contiene el gameplay del DLC de {{gameName}} en {{channelName}}.\nSin comentarios.",
      "100_percent": "Esta playlist contiene la partida al 100% de {{gameName}} en {{channelName}}.\nSin comentarios — todos los coleccionables, misiones secundarias y secretos.",
      "guide": "Esta playlist es una guía silenciosa de {{gameName}} en {{channelName}}.\nSin comentarios.",
      "highlights": "Esta playlist contiene los momentos destacados de {{gameName}} en {{channelName}}.\nSin comentarios."
    },
    "videoCount": "📹 {{count}} video(s)",
    "storeSection": "🎮 Obtener el juego:",
    "footer": "👍 Me gusta | 🔔 ¡Suscríbete para más gameplay!"
  }
}
```

**Playlist builder engine**:

```typescript
// src/engine/playlist-builder.ts

import type { PlaylistInput, PlaylistOutput } from "./types";

export function buildPlaylistTitle(input: PlaylistInput, t: TFunction): string {
  const statusText = t(`templates:playlist.status.${input.status}`);
  return t("templates:playlist.titleFormat", {
    status: statusText,
    gameName: input.gameName,
  });
}

export function buildPlaylistDescription(input: PlaylistInput, t: TFunction): string {
  const lines: string[] = [];

  // Main description based on content type
  lines.push(t(`templates:playlist.description.${input.contentType}`, {
    gameName: input.gameName,
    channelName: input.channelName,
  }));

  lines.push("");

  // Video count (if provided)
  if (input.totalVideos) {
    lines.push(t("templates:playlist.videoCount", { count: input.totalVideos }));
    lines.push("");
  }

  // Store links
  if (input.storeLinks && Object.values(input.storeLinks).some(Boolean)) {
    lines.push(t("templates:playlist.storeSection"));
    for (const [id, url] of Object.entries(input.storeLinks)) {
      if (!url) continue;
      const platform = PLATFORMS.find(p => p.id === id);
      lines.push(`🎮 ${platform?.label ?? id}: ${url}`);
    }
    lines.push("");
  }

  // Custom note
  if (input.playlistNote?.trim()) {
    lines.push(input.playlistNote.trim());
    lines.push("");
  }

  // Footer
  lines.push(t("templates:playlist.footer"));

  return lines.join("\n");
}
```

**UI — new PlaylistPage**:

Add a new tab/route for the Playlist generator:

```typescript
// src/App.tsx — add route
<Route path="/playlist" element={<PlaylistPage />} />

// src/components/layout/TabBar.tsx — add tab
{ id: "playlist", path: "/playlist", label: t("tabs.playlist"), icon: "📺" },
```

**PlaylistPage** contains:
- Game name input (or load from preset)
- Channel name input (or load from profile)
- Status selector (chips: completed / dropped / incomplete / in_progress)
- Content type selector (chips: full_gameplay / boss_fights / speedrun / etc.)
- Language selector
- Optional: total video count
- Optional: store links (reuse from preset)
- Optional: custom note
- Output preview with copy buttons

---

## 4. Task Checklist

```
Phase 4.1 — Bug Fixes, Improvements & New Features

BUG FIXES
  - [ ] 1.1 Settings persistence: implement storage-adapter.ts (dual localStorage + file)
  - [ ] 1.1 Update settings-store.ts to use storage-adapter
  - [ ] 1.1 Update Tauri save_to_file to create parent directories
  - [ ] 1.1 Apply same pattern to profile-store, preset-store, history-store
  - [ ] 1.1 Test: settings survive app restart (web + desktop)
  - [ ] 1.2 Fix platform labels in config/platforms.ts (proper capitalization)
  - [ ] 1.2 Fix social/donate labels in config/social-fields.ts
  - [ ] 1.2 Fix description-builder to use label instead of id for display
  - [ ] 1.2 Test: generated description shows "Steam" not "steam", "PayPal" not "paypal"
  - [ ] 1.3 Fix tray duplication: add with_id("ytdescgen-tray")
  - [ ] 1.3 Hide window on close instead of destroying (prevent_close)
  - [ ] 1.3 Handle RunEvent::ExitRequested to keep app alive in tray
  - [ ] 1.4 Add tooltip: with_tooltip("YTDescGen — YouTube Description Generator")
  - [ ] 1.3/1.4 Test: close window → tray stays, no duplicate → click tray → window shows

IMPROVEMENTS
  - [ ] 2.1 Create src/utils/validation.ts with validateEmails()
  - [ ] 2.1 Create ValidatedInput component
  - [ ] 2.1 Apply email validation to contactEmail field (max 3 emails)
  - [ ] 2.1 Add i18n strings for validation errors
  - [ ] 2.1 Test: invalid email shows error, valid email saves
  - [ ] 2.2 Add validateUrl() and validateUrlWithPrefix() to validation.ts
  - [ ] 2.2 Apply URL validation to all store link fields
  - [ ] 2.2 Apply URL validation to all social/donate link fields
  - [ ] 2.2 Apply URL validation to playlist link field
  - [ ] 2.2 Test: invalid URLs show error, valid URLs save
  - [ ] 2.3 Refactor BatchPage: add multi-language selector (ChipGroup multi)
  - [ ] 2.3 Update batch generation to produce per-part × per-language outputs
  - [ ] 2.3 Update BatchPartCard UI: group languages within each part
  - [ ] 2.3 Add copy buttons per language + copy all for a part
  - [ ] 2.3 Test: batch generates correct output for 3 parts × 3 languages
  - [ ] 2.4 Rename settings: appLanguage + defaultOutputLanguage
  - [ ] 2.4 Add language quick-switch dropdown to Header
  - [ ] 2.4 Add first-run browser locale detection
  - [ ] 2.4 Update Settings page labels for clarity
  - [ ] 2.4 Test: UI language and output language are independent and clear

NEW FEATURES
  - [ ] 3.1 Add FMV genre to config/genres.ts
  - [ ] 3.1 Add FMV tag pool to engine/tag-generator.ts
  - [ ] 3.1 Add FMV intro lines to all locale templates.json
  - [ ] 3.1 Test: FMV genre generates correct tags and description
  - [ ] 3.2 Add Bluesky, Mastodon, Facebook, FB Page, FB Group to social-fields.ts
  - [ ] 3.2 Add icon mapping to description-builder.ts
  - [ ] 3.2 Add Mastodon help text in SocialEditor
  - [ ] 3.2 Test: new social links appear in editor and output correctly
  - [ ] 3.3 Create engine/playlist-builder.ts (buildPlaylistTitle + buildPlaylistDescription)
  - [ ] 3.3 Add playlist templates to all locale templates.json (en, vi, ja, es)
  - [ ] 3.3 Create PlaylistPage.tsx with status/content-type selectors
  - [ ] 3.3 Add playlist tab/route to app navigation
  - [ ] 3.3 Wire up profile/preset loading in PlaylistPage
  - [ ] 3.3 Add copy buttons for playlist title + description
  - [ ] 3.3 Test: playlist generates correct output in all languages
  - [ ] 3.3 Test: all 4 statuses × 8 content types produce valid output

LOCALE UPDATES
  - [ ] Add validation error strings to en/ui.json
  - [ ] Add validation error strings to vi/ui.json
  - [ ] Add validation error strings to ja/ui.json
  - [ ] Add validation error strings to es/ui.json
  - [ ] Add playlist section to en/templates.json
  - [ ] Add playlist section to vi/templates.json
  - [ ] Add playlist section to ja/templates.json
  - [ ] Add playlist section to es/templates.json
  - [ ] Add FMV intro lines to all templates.json
  - [ ] Run npm run validate:locales — all pass
```

## 5. Definition of Done

- [ ] All bugs verified fixed on both web and desktop
- [ ] Settings persist across app restart (tested on Windows + macOS + web)
- [ ] No duplicate tray icons after close/reopen cycle
- [ ] Tray tooltip shows "YTDescGen — YouTube Description Generator"
- [ ] Invalid email/URL inputs show error and do not save to state
- [ ] Valid inputs with 3 emails work correctly
- [ ] All platform/social names display with correct capitalization in output
- [ ] Batch mode shows all selected languages grouped per part
- [ ] App language and output language are clearly separated in UI
- [ ] FMV genre available with correct tags in all languages
- [ ] Bluesky, Mastodon, Facebook variants available in social editor
- [ ] Playlist generator produces correct titles and descriptions in 4 languages
- [ ] `npm run validate:locales` passes
- [ ] `npm run typecheck` passes
- [ ] `npm run test:run` passes
- [ ] CI pipeline green
