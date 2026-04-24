# Architecture Document

## YTDescGen — Technical Architecture

---

## 1. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Presentation Layer                      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────────┐  │
│  │  Editor   │ │  Output  │ │ Profiles │ │ Batch / History│  │
│  │  Page     │ │  Page    │ │  Page    │ │    Pages      │  │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └──────┬────────┘  │
│       │             │            │               │           │
│  ┌────┴─────────────┴────────────┴───────────────┴────────┐  │
│  │              Shared Components (ui/, editor/, output/)   │  │
│  └────────────────────────────┬────────────────────────────┘  │
├───────────────────────────────┼──────────────────────────────┤
│                    Application Layer                          │
│  ┌────────────┐  ┌───────────┴──────────┐  ┌──────────────┐ │
│  │   Hooks     │  │    State (Zustand)    │  │   i18next    │ │
│  │ useGenerate │  │ editor / profile /    │  │  locales/    │ │
│  │ useClipboard│  │ preset / history /    │  │  en/vi/ja/   │ │
│  │ useCharCount│  │ settings              │  │  es/ko/zh    │ │
│  └──────┬─────┘  └───────────┬───────────┘  └──────┬───────┘ │
├─────────┼────────────────────┼──────────────────────┼────────┤
│                      Core Engine Layer                        │
│  ┌──────┴────────────────────┴──────────────────────┴──────┐ │
│  │                 engine/ (Pure TypeScript)                 │ │
│  │  ┌──────────────┐ ┌──────────────────┐ ┌──────────────┐ │ │
│  │  │ title-builder│ │description-builder│ │ tag-generator│ │ │
│  │  └──────┬───────┘ └────────┬─────────┘ └──────┬───────┘ │ │
│  │         └──────────────────┼───────────────────┘         │ │
│  │                   ┌────────┴────────┐                    │ │
│  │                   │template-renderer│                    │ │
│  │                   └─────────────────┘                    │ │
│  └──────────────────────────────────────────────────────────┘ │
├──────────────────────────────────────────────────────────────┤
│                     Infrastructure Layer                      │
│  ┌────────────────┐  ┌───────────────┐  ┌─────────────────┐ │
│  │  localStorage   │  │  File System   │  │  Clipboard API  │ │
│  │  (Web)          │  │  (Tauri)       │  │                 │ │
│  └────────────────┘  └───────────────┘  └─────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

## 2. Core Engine Design

Engine module chứa toàn bộ logic generate — **zero framework dependency**. Mọi function đều pure: input → string.

### 2.1 Type Definitions (`engine/types.ts`)

```typescript
// ── Video Types ──
type VideoType =
  | "full"           // Full Gameplay
  | "part"           // Gameplay Part X
  | "boss"           // Boss Fight
  | "boss_nohit"     // Boss No Hit
  | "ending"         // Ending / All Endings
  | "speedrun"       // Speedrun
  | "100percent"     // 100% Completion
  | "dlc"            // DLC Content
  | "newgame_plus"   // New Game+
  | "challenge"      // Challenge Run
  | "side_quest"     // Side Quest / Optional Content
  | "secret"         // Secret / Hidden Content
  | "comparison"     // Graphics / Version Comparison
  | "guide";         // Silent Guide / Walkthrough

// ── Genre ──
type Genre =
  | "action" | "horror" | "rpg" | "fps" | "openworld"
  | "indie" | "soulslike" | "racing" | "story" | "simulation"
  | "fighting" | "stealth" | "survival_craft" | "mmo"
  | "rhythm" | "puzzle" | "roguelike" | "metroidvania"
  | "tower_defense" | "card_game" | "battle_royale"
  | "crpg" | "tactical" | "space" | "farming";

// ── Supported Languages ──
type SupportedLanguage = "en" | "vi" | "ja" | "es" | "ko" | "zh"
                       | "fr" | "de" | "pt" | "ru" | "th" | "ar";

// ── Input State ──
interface GeneratorInput {
  // Core
  videoType: VideoType;
  language: SupportedLanguage;
  genre: Genre;

  // Game info
  gameName: string;
  gameNameLocalized?: Record<SupportedLanguage, string>; // optional localized game name
  channelName: string;
  platform: string;

  // Video type-specific
  partNumber?: string;
  bossName?: string;
  dlcName?: string;
  challengeName?: string;

  // Video settings
  resolution?: string;
  fps?: string;
  graphicsPreset?: string;

  // Content
  timestamps?: string;
  playlistLink?: string;
  contactEmail?: string;

  // Warnings
  spoilerWarning: boolean;
  matureWarning: boolean;

  // Links
  storeLinks: Record<string, string>;
  social: Record<string, string>;
  rig: Record<string, string>;
}

// ── Output ──
interface GeneratorOutput {
  title: string;
  description: string;
  tags: string[];
  tagString: string;
  charCounts: {
    title: number;
    description: number;
    tags: number;
  };
  warnings: string[]; // e.g. "Tags exceed 500 character limit"
}
```

### 2.2 Template Architecture

Templates sử dụng **data-driven approach** thay vì hardcode string concatenation:

```typescript
// i18n/locales/en/templates.json
{
  "title": {
    "separator": " — ",
    "suffix": "Gameplay No Commentary",
    "videoType": {
      "full": "",
      "part": "Part {{partNumber}}",
      "boss": "{{bossName}} Boss Fight",
      "boss_nohit": "{{bossName}} Boss No Hit",
      "ending": "Ending",
      "speedrun": "Speedrun",
      "100percent": "100% Completion",
      "dlc": "{{dlcName}} DLC",
      "newgame_plus": "New Game+",
      "challenge": "{{challengeName}} Challenge"
    }
  },
  "description": {
    "intro": {
      "full": "This video features the full gameplay of {{gameName}} on {{channelName}}.",
      "part": "This video features Part {{partNumber}} of {{gameName}} on {{channelName}}."
    },
    "noCommentaryLine": "No Commentary — pure gameplay for your enjoyment.",
    "sections": {
      "timestamps": "⏱ TIMESTAMPS",
      "storeLinks": "🎮 GET THE GAME",
      "videoSettings": "🖥 VIDEO SETTINGS: {{settings}}",
      "rig": "💻 MY RIG",
      "spoilerWarning": "⚠️ SPOILER WARNING: This video contains spoilers.",
      "matureWarning": "🔞 MATURE CONTENT (18+): Contains violence / strong language.",
      "playlist": "▶️ Watch the full series: {{link}}",
      "contact": "📧 Business inquiries: {{email}}",
      "cta": "👍 Like | 🔔 Subscribe | ↗️ Share"
    }
  }
}
```

### 2.3 Tag Generator Architecture

```
TagGenerator Pipeline:
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│ Core Pool│───→│Genre Pool│───→│ Platform │───→│ Quality  │
│ (always) │    │(by genre)│    │  Pool    │    │  Pool    │
└──────────┘    └──────────┘    └──────────┘    └──────────┘
      │               │              │               │
      └───────────────┴──────────────┴───────────────┘
                              │
                    ┌─────────┴─────────┐
                    │  VideoType Pool   │
                    │ (boss, speedrun…) │
                    └─────────┬─────────┘
                              │
                    ┌─────────┴─────────┐
                    │ Multilingual Pool │
                    │  (JA, VI, ES…)    │
                    └─────────┬─────────┘
                              │
                    ┌─────────┴─────────┐
                    │  Trending Pool    │
                    │  (year-based)     │
                    └─────────┬─────────┘
                              │
                    ┌─────────┴─────────┐
                    │    Dedup (Set)    │
                    │  + Priority Sort  │
                    │ + 500 char trim   │
                    └───────────────────┘
```

Tag pools là registry pattern — thêm genre mới chỉ cần thêm 1 entry:

```typescript
// engine/tag-generator.ts
const TAG_REGISTRY: Record<Genre, (gameName: string) => string[]> = {
  action: (g) => [`${g} action`, "action game no commentary", "action adventure gameplay"],
  horror: (g) => [`${g} horror`, "horror game no commentary", "survival horror gameplay"],
  // ... thêm genre ở đây
};
```

## 3. State Architecture

```
Zustand Stores:
┌───────────────────────────────────────────────┐
│  EditorStore                                   │
│  - videoType, language, genre                  │
│  - gameName, channelName, platform             │
│  - timestamps, storeLinks, rig, social         │
│  - spoilerWarning, matureWarning               │
│  Middleware: none (ephemeral per session)       │
│  + persist: auto-save draft (debounced)        │
├───────────────────────────────────────────────┤
│  ProfileStore                                  │
│  - profiles: Profile[]                         │
│  - activeProfileId: string | null              │
│  Middleware: persist (localStorage)             │
├───────────────────────────────────────────────┤
│  PresetStore                                   │
│  - gamePresets: GamePreset[]                   │
│  Middleware: persist (localStorage)             │
├───────────────────────────────────────────────┤
│  HistoryStore                                  │
│  - entries: HistoryEntry[] (max 100)           │
│  Middleware: persist (localStorage, pruned)     │
├───────────────────────────────────────────────┤
│  SettingsStore                                 │
│  - theme: "dark" | "light"                     │
│  - defaultLanguage: SupportedLanguage          │
│  - defaultGenres: GenreId[]                    │
│  - (flags: quality badge / copyright / ...)    │
│  Middleware: persist (localStorage + file)     │
└───────────────────────────────────────────────┘
```

## 4. i18n Architecture

```
i18n/locales/
├── en/
│   ├── ui.json           # UI strings: buttons, labels, tooltips, errors
│   └── templates.json    # Generated content: title patterns, description sections
├── vi/
│   ├── ui.json
│   └── templates.json
├── ja/
│   ├── ui.json
│   └── templates.json
└── _schema.json          # JSON Schema — validates all locale files have same keys
```

**Adding a new language** = 2 JSON files + 1 line registration. See docs/I18N.md.

**UI language vs Output language**: These are independent. User can browse the app in English but generate descriptions in Japanese. UI language follows `SettingsStore.defaultLanguage`, output language follows `EditorStore.language`.

## 5. Desktop Packaging (Tauri)

```
Web App (React + Vite)
        │
        ▼
┌───────────────────┐
│    Tauri Shell     │
│  ┌──────────────┐  │
│  │  WebView     │  │  ← Renders the same React app
│  │  (system)    │  │
│  └──────────────┘  │
│  ┌──────────────┐  │
│  │  Rust Core   │  │  ← File system access, clipboard, tray
│  └──────────────┘  │
└───────────────────┘
        │
        ▼
  Binary output:
  - Windows: .msi / .exe (~8MB)
  - macOS: .dmg / .app (~10MB)
```

Tauri advantages over Electron:
- Binary size: ~8MB vs ~150MB
- Memory: ~30MB vs ~100MB+
- No bundled Chromium — uses system WebView
- Rust backend for native features

## 6. Extensibility Points

| What | How to Extend | Files to Touch |
|------|--------------|----------------|
| New language | Add `locales/{code}/ui.json` + `templates.json`, register in `i18n/index.ts` | 3 files |
| New genre | Add entry to `config/genres.ts`, add tag pool to `engine/tag-generator.ts` | 2 files |
| New video type | Add to `config/video-types.ts`, add patterns to all `templates.json` | 1 + N locale files |
| New platform/store | Add entry to `config/platforms.ts` | 1 file |
| New social link | Add entry to `config/social-fields.ts` | 1 file |
| New rig field | Add entry to `config/rig-fields.ts` | 1 file |
| Custom template | Edit `templates.json` for target language | 1 file |
| Desktop feature | Add Tauri command in `src-tauri/src/main.rs` | 1 file |

## 7. Data Flow

```
User Input (form)
       │
       ▼
EditorStore (Zustand)
       │
       ├──→ useGeneratedOutput hook
       │         │
       │         ├──→ titleBuilder(input, locale)     → title string
       │         ├──→ descriptionBuilder(input, locale) → description string
       │         ├──→ tagGenerator(input)              → tags string[]
       │         │
       │         └──→ GeneratorOutput (memoized)
       │                    │
       │                    ▼
       │              OutputPage (display + copy)
       │
       ├──→ ProfileStore.save() ──→ localStorage
       ├──→ PresetStore.save()  ──→ localStorage
       └──→ HistoryStore.add()  ──→ localStorage
```
