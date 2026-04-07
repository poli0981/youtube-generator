# Development Roadmap

## YTDescGen — Phased Development Plan

---

## Phase 1 — MVP Core (Priority: P0)
**Goal**: Ứng dụng web chạy được, generate title + description + tags, copy to clipboard.
**Estimated**: 3-4 days

### Tasks
```
1.1  Project scaffold
     - [x] Vite + React 18 + TypeScript setup
     - [ ] Tailwind CSS configuration (dark theme default)
     - [ ] ESLint + Prettier config
     - [ ] Directory structure per CLAUDE.md
     - [ ] Package.json scripts

1.2  Config layer
     - [ ] src/config/video-types.ts (7 initial types)
     - [ ] src/config/genres.ts (10 initial genres)
     - [ ] src/config/platforms.ts (7 platforms)
     - [ ] src/config/rig-fields.ts
     - [ ] src/config/social-fields.ts
     - [ ] src/config/defaults.ts

1.3  i18n setup
     - [ ] i18next + react-i18next install & config
     - [ ] locales/en/ui.json + templates.json
     - [ ] locales/vi/ui.json + templates.json
     - [ ] locales/ja/ui.json + templates.json
     - [ ] Locale validation script

1.4  Core engine
     - [ ] engine/types.ts
     - [ ] engine/title-builder.ts + tests
     - [ ] engine/description-builder.ts + tests
     - [ ] engine/tag-generator.ts + tests
     - [ ] engine/template-renderer.ts (orchestrator)

1.5  State management
     - [ ] Zustand setup
     - [ ] editor-store.ts (form state)
     - [ ] settings-store.ts (theme, default language)

1.6  UI components
     - [ ] ui/ primitives: Button, Input, Textarea, Toggle, ChipGroup, Select
     - [ ] editor/ components: VideoTypeSelector, LanguageSelector, GenreSelector
     - [ ] editor/ components: GameInfoForm, VideoSettingsForm, TimestampEditor
     - [ ] editor/ components: StoreLinkEditor, RigEditor, SocialEditor, WarningToggles
     - [ ] editor/ components: QuickPreview
     - [ ] output/ components: OutputPreview, CopyButton, CharCounter, CopyAllBar
     - [ ] layout/ components: AppShell, Header, TabBar

1.7  Pages
     - [ ] EditorPage (form + quick preview)
     - [ ] OutputPage (title + desc + tags + copy)
     - [ ] React Router setup (HashRouter)

1.8  Testing
     - [ ] Vitest config
     - [ ] Engine unit tests (title, description, tags)
     - [ ] Smoke tests for main pages

1.9  CI/CD
     - [ ] GitHub Actions: lint + typecheck + test
     - [ ] GitHub Actions: deploy to GitHub Pages

### Definition of Done
- [ ] User can select video type, language, genre
- [ ] User can enter game name, timestamps, store links, rig, social, warnings
- [ ] Title, description, and tags generate correctly in EN/VI/JA
- [ ] Copy buttons work for title, description, tags, and all
- [ ] Character counts displayed (5000 desc, 500 tags)
- [ ] CI passes, deploys to GitHub Pages
```

---

## Phase 2 — Profiles & Presets (Priority: P1)
**Goal**: Lưu thông tin tái sử dụng, không phải nhập lại mỗi lần.
**Estimated**: 2-3 days

### Tasks
```
2.1  Profile system
     - [ ] profile-store.ts (Zustand + persist)
     - [ ] ProfileSaveForm component
     - [ ] ProfileList + ProfileCard components
     - [ ] Load profile → populate editor form
     - [ ] Delete profile with confirmation
     - [ ] Multiple profiles support

2.2  Game preset system
     - [ ] preset-store.ts (Zustand + persist)
     - [ ] GamePresetManager component
     - [ ] Save game (name + genre + platform + store links + warnings)
     - [ ] Load preset → populate game fields
     - [ ] Preset selector dropdown in editor

2.3  ProfilesPage
     - [ ] Profile management tab
     - [ ] Game preset management tab
     - [ ] Import/Export JSON

2.4  Auto-save draft
     - [ ] Debounced save of editor state to localStorage
     - [ ] Restore on page load
     - [ ] Clear draft button

2.5  Expand content
     - [ ] Add video types: dlc, newgame_plus, challenge, side_quest, secret
     - [ ] Add genres to 15+: fighting, stealth, survival_craft, roguelike, metroidvania
     - [ ] Add social fields: twitch, tiktok, instagram, streamlabs
     - [ ] Add rig fields: motherboard, controller
     - [ ] Add store: humble, amazon

### Definition of Done
- [ ] User creates profile → social/rig/channel info saved
- [ ] User loads profile → form populated instantly
- [ ] User creates game preset → reused across parts
- [ ] Form state auto-saved, survives page reload
- [ ] Export/Import profiles as JSON works
```

---

## Phase 3 — Polish & Advanced Features (Priority: P1-P2)
**Goal**: Batch mode, history, keyboard shortcuts, theme.
**Estimated**: 2-3 days

### Tasks
```
3.1  History system
     - [ ] history-store.ts (max 100 entries, auto-prune)
     - [ ] HistoryPage with list view
     - [ ] Copy from history
     - [ ] Delete history entries
     - [ ] Search/filter history

3.2  Batch mode
     - [ ] BatchPage UI
     - [ ] Same game, different parts/timestamps
     - [ ] Generate N outputs at once
     - [ ] Copy all as combined text or individual

3.3  Multi-language output
     - [ ] Generate output in multiple languages simultaneously
     - [ ] Tab-based display per language
     - [ ] Copy per language or copy all languages

3.4  Settings page
     - [ ] SettingsPage component
     - [ ] Theme toggle (dark/light)
     - [ ] Default language, genre preferences
     - [ ] Tag generation options (multilingual, trending on/off)
     - [ ] History limit setting

3.5  Keyboard shortcuts
     - [ ] Shortcut handler (global keyboard listener)
     - [ ] Ctrl+Enter, Ctrl+Shift+C, etc.
     - [ ] Shortcut help modal (Ctrl+/)

3.6  UX Polish
     - [ ] Toast notifications for copy/save/delete
     - [ ] Form validation (required fields highlight)
     - [ ] Responsive design (mobile-friendly)
     - [ ] Loading states and transitions
     - [ ] Empty states with illustrations

3.7  Expand languages
     - [ ] Spanish (es) locale files
     - [ ] Korean (ko) locale files
     - [ ] Chinese Simplified (zh) locale files

3.8  Expand genres to 25
     - [ ] Add remaining: mmo, rhythm, puzzle, tower_defense, card_game
     - [ ] battle_royale, crpg, tactical, space, farming
     - [ ] Tag pools for each new genre

### Definition of Done
- [ ] Batch generate 10 parts in under 30 seconds
- [ ] History page shows last 100 generated outputs
- [ ] Dark/Light theme works correctly
- [ ] Keyboard shortcuts functional
- [ ] 6 languages, 25 genres, 14 video types
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
