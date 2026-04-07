# Development Roadmap

## YTDescGen — Phased Development Plan

---

## Phase 1 — MVP Core (Priority: P0) ✅ COMPLETED 2026-04-07
**Goal**: Ứng dụng web chạy được, generate title + description + tags, copy to clipboard.
**Estimated**: 3-4 days | **Actual**: 1 day

### Tasks
```
1.1  Project scaffold
     - [x] Vite + React 18 + TypeScript setup
     - [x] Tailwind CSS configuration (dark theme default)
     - [x] ESLint + Prettier config
     - [x] Directory structure per CLAUDE.md
     - [x] Package.json scripts

1.2  Config layer
     - [x] src/config/video-types.ts (7 initial types)
     - [x] src/config/genres.ts (10 initial genres)
     - [x] src/config/platforms.ts (7 platforms)
     - [x] src/config/rig-fields.ts
     - [x] src/config/social-fields.ts
     - [x] src/config/defaults.ts

1.3  i18n setup
     - [x] i18next + react-i18next install & config
     - [x] locales/en/ui.json + templates.json
     - [x] locales/vi/ui.json + templates.json
     - [x] locales/ja/ui.json + templates.json
     - [x] Locale validation script

1.4  Core engine
     - [x] engine/types.ts
     - [x] engine/title-builder.ts + tests
     - [x] engine/description-builder.ts + tests
     - [x] engine/tag-generator.ts + tests
     - [x] engine/template-renderer.ts (orchestrator)

1.5  State management
     - [x] Zustand setup
     - [x] editor-store.ts (form state)
     - [x] settings-store.ts (theme, default language)

1.6  UI components
     - [x] ui/ primitives: Button, Input, Textarea, Toggle, ChipGroup, Select
     - [x] editor/ components: VideoTypeSelector, LanguageSelector, GenreSelector
     - [x] editor/ components: GameInfoForm, VideoSettingsForm, TimestampEditor
     - [x] editor/ components: StoreLinkEditor, RigEditor, SocialEditor, WarningToggles
     - [x] editor/ components: QuickPreview
     - [x] output/ components: OutputPreview, CopyButton, CharCounter, CopyAllBar
     - [x] layout/ components: AppShell, Header, TabBar

1.7  Pages
     - [x] EditorPage (form + quick preview)
     - [x] OutputPage (title + desc + tags + copy)
     - [x] React Router setup (HashRouter)

1.8  Testing
     - [x] Vitest config
     - [x] Engine unit tests (title, description, tags) — 42 tests
     - [ ] Smoke tests for main pages (deferred to Phase 3)

1.9  CI/CD
     - [x] GitHub Actions: lint + typecheck + test
     - [x] GitHub Actions: deploy to GitHub Pages

### Definition of Done
- [x] User can select video type, language, genre
- [x] User can enter game name, timestamps, store links, rig, social, warnings
- [x] Title, description, and tags generate correctly in EN/VI/JA
- [x] Copy buttons work for title, description, tags, and all
- [x] Character counts displayed (5000 desc, 500 tags)
- [x] CI passes, deploys to GitHub Pages
```

---

## Phase 2 — Profiles & Presets (Priority: P1) ✅ COMPLETED 2026-04-07
**Goal**: Lưu thông tin tái sử dụng, không phải nhập lại mỗi lần.
**Estimated**: 2-3 days | **Actual**: 1 day

### Tasks
```
2.1  Profile system
     - [x] profile-store.ts (Zustand + persist)
     - [x] ProfileSaveForm component
     - [x] ProfileList + ProfileCard components
     - [x] Load profile → populate editor form
     - [x] Delete profile with confirmation
     - [x] Multiple profiles support

2.2  Game preset system
     - [x] preset-store.ts (Zustand + persist)
     - [x] PresetSaveForm + PresetCard + PresetList + PresetSelector
     - [x] Save game (name + genre + platform + store links + warnings)
     - [x] Load preset → populate game fields
     - [x] Preset selector dropdown in editor

2.3  ProfilesPage
     - [x] Profile management tab
     - [x] Game preset management tab
     - [x] Import/Export JSON

2.4  Auto-save draft
     - [x] Debounced save of editor state to localStorage (via Zustand persist)
     - [x] Restore on page load
     - [x] Clear draft button + DraftIndicator

2.5  Expand content
     - [x] Add video types: dlc, newgame_plus, challenge, side_quest, secret (12 total)
     - [x] Add genres: fighting, stealth, survival_craft, roguelike, metroidvania (15 total)
     - [x] Add social fields: twitch, tiktok, instagram, streamlabs (12 total)
     - [x] Add rig fields: motherboard, controller (8 total)
     - [x] Add store: humble, amazon (9 total)

2.6  Foundation additions
     - [x] Modal + ConfirmDialog UI primitives
     - [x] Import/Export utility (src/utils/import-export.ts)
     - [x] UUID utility (src/utils/uuid.ts)
     - [x] Updated i18n: 134 UI keys + 41 template keys across EN/VI/JA

### Definition of Done
- [x] User creates profile → social/rig/channel info saved
- [x] User loads profile → form populated instantly
- [x] User creates game preset → reused across parts
- [x] Form state auto-saved, survives page reload
- [x] Export/Import profiles as JSON works
```

---

## Phase 3 — Polish & Advanced Features (Priority: P1-P2) ✅ COMPLETED 2026-04-07
**Goal**: Batch mode, history, keyboard shortcuts, theme.
**Estimated**: 2-3 days | **Actual**: 1 day

### Tasks
```
3.1  History system
     - [x] history-store.ts (max entries, auto-prune, configurable limit)
     - [x] HistoryPage with list view
     - [x] Copy from history (title, description, tags)
     - [x] Delete history entries
     - [x] Search/filter history by game name or title
     - [x] Auto-save to history on OutputPage view

3.2  Batch mode
     - [x] BatchPage UI
     - [x] Same game, different parts (start/end range)
     - [x] Generate N outputs at once (max 100)
     - [x] Copy all as combined text or individual

3.3  Multi-language output
     - [x] Generate output in multiple languages simultaneously
     - [x] Tab-based display per language
     - [x] Copy per language or copy all languages combined

3.4  Settings page
     - [x] SettingsPage component
     - [x] Theme toggle (dark/light)
     - [x] Default UI language, output language, genre preferences
     - [x] Tag generation options (multilingual, trending on/off, hashtag count)
     - [x] Editor settings (auto-save, show char count, compact tags)
     - [x] History limit setting (10-500)

3.5  Keyboard shortcuts
     - [x] Global keyboard listener (useKeyboardShortcuts hook)
     - [x] Ctrl+Enter (go to output), Ctrl+Shift+C (copy all), Ctrl+S (save draft)
     - [x] Ctrl+/ shortcut help modal

3.6  UX Polish
     - [x] Toast notifications for copy/save/delete (react-hot-toast)
     - [x] Responsive layout (mobile-first, lg breakpoint for sidebar)
     - [x] Scrollable tab bar for mobile
     - [x] Empty states for all list pages
     - [x] Lazy-loaded pages (React.lazy + Suspense)

3.7  Expand languages
     - [x] Spanish (es) locale files (184 UI + 45 template keys)
     - [x] Korean (ko) locale files
     - [x] Chinese Simplified (zh) locale files

3.8  Expand genres to 25 + video types to 14
     - [x] 10 new genres: mmo, rhythm, puzzle, tower_defense, card_game, battle_royale, crpg, tactical, space, farming
     - [x] 2 new video types: comparison, guide (14 total)
     - [x] Tag pools for each new genre and video type
     - [x] Settings wiring: showCharCount, compactTagDisplay into OutputPreview

### Definition of Done
- [x] Batch generate 10 parts in under 30 seconds
- [x] History page shows last N generated outputs (configurable)
- [x] Dark/Light theme works correctly
- [x] Keyboard shortcuts functional (Ctrl+Enter, Ctrl+Shift+C, Ctrl+S, Ctrl+/)
- [x] 6 languages, 25 genres, 14 video types
```

---

## Phase 4 — Desktop App (Priority: P2)
**Goal**: Đóng gói thành ứng dụng desktop bằng Tauri.
**Estimated**: 2-3 days

### Tasks
```
4.1  Tauri setup
     - [ ] Install Tauri CLI + dependencies
     - [ ] src-tauri/ scaffold
     - [ ] tauri.conf.json configuration
     - [ ] App icons (all sizes)

4.2  Desktop features
     - [ ] Native clipboard integration
     - [ ] File export (save outputs as .txt/.json)
     - [ ] File import (load profiles/presets from JSON)
     - [ ] System tray with quick access
     - [ ] Window state persistence (size, position)

4.3  Auto-update
     - [ ] Tauri updater configuration
     - [ ] GitHub Releases integration
     - [ ] Update notification UI

4.4  Build pipeline
     - [ ] GitHub Actions: build Windows .msi
     - [ ] GitHub Actions: build macOS .dmg
     - [ ] Release workflow (tag → build → publish)

4.5  Platform-specific
     - [ ] Windows: installer, start menu shortcut
     - [ ] macOS: .app bundle, code signing (if needed)
     - [ ] Verify offline functionality

### Definition of Done
- [ ] Windows installer < 15MB, installs and runs
- [ ] macOS .app < 15MB, runs on Apple Silicon + Intel
- [ ] Auto-update from GitHub Releases works
- [ ] All web features work identically in desktop
- [ ] Offline mode fully functional
```

---

## Phase 5 — Extensions & Ecosystem (Priority: P2-P3)
**Goal**: IDE extension, CLI, community features.
**Estimated**: Ongoing

### Tasks
```
5.1  CLI tool
     - [ ] Standalone Node.js CLI using engine/
     - [ ] `npx ytdescgen generate --game "..." --type full --lang en`
     - [ ] JSON output mode for scripting
     - [ ] Config file support (.ytdescgen.json)

5.2  VS Code Extension
     - [ ] Command palette: "YTDescGen: Generate Description"
     - [ ] Webview panel with editor UI
     - [ ] Output to new editor tab
     - [ ] Settings sync with VS Code settings

5.3  Additional languages
     - [ ] French, German, Portuguese, Russian, Thai, Arabic
     - [ ] Community contribution guide for translations
     - [ ] Locale validation CI check

5.4  Template customization
     - [ ] Custom template editor in app
     - [ ] Template import/export
     - [ ] Template sharing (JSON format)

5.5  Quality of life
     - [ ] YouTube API integration (auto-apply description)
     - [ ] Tag trend analysis (what's trending for the genre)
     - [ ] Multi-channel profile support
```

---

## Timeline Summary

| Phase | Scope | Days | Cumulative |
|-------|-------|------|------------|
| Phase 1 | MVP Core | 3-4 | 3-4 days |
| Phase 2 | Profiles & Presets | 2-3 | 5-7 days |
| Phase 3 | Polish & Advanced | 2-3 | 7-10 days |
| Phase 4 | Desktop App | 2-3 | 9-13 days |
| Phase 5 | Extensions | Ongoing | — |

**MVP usable after Phase 1** (~3-4 days). Full-featured after Phase 3 (~7-10 days).
