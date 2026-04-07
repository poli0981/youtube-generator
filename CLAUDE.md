# CLAUDE.md — YouTube Description Generator (YTDescGen)

## Project Overview

**YTDescGen** is a desktop-capable web application that generates YouTube video titles, descriptions, and tags for Gameplay No Commentary channels. It supports multiple languages, game genres, and video types with a profile/preset system to eliminate repetitive data entry.

- **Repository**: `github.com/poli0981/yt-desc-gen` (private)
- **License**: MIT
- **Primary Language**: TypeScript
- **Stack**: React 18 + Vite + Tailwind CSS + Zustand + Tauri (desktop)
- **Target Platforms**: Web (GitHub Pages), Desktop (Windows/macOS via Tauri)

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Framework | React 18 | Familiar from F2P tracker dashboard |
| Build | Vite 5 | Fast HMR, clean config |
| Language | TypeScript (strict) | Type safety for template engine |
| Styling | Tailwind CSS 3 | Utility-first, fast iteration |
| State | Zustand + persist middleware | Simple, localStorage/file persistence |
| Router | React Router 6 (HashRouter) | GitHub Pages compatible |
| i18n | i18next + react-i18next | Industry standard, lazy-load locales |
| Desktop | Tauri 2 | Lightweight Rust-based, ~5MB binary |
| Testing | Vitest + React Testing Library | Vite-native, fast |
| Lint | ESLint + Prettier | Consistent code style |
| CI/CD | GitHub Actions | Familiar workflow |

## Project Structure

```
yt-desc-gen/
├── CLAUDE.md                    # ← You are here
├── README.md
├── LICENSE
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.ts
├── index.html
│
├── docs/                        # Project documentation
│   ├── PRD.md                   # Product Requirements Document
│   ├── ARCHITECTURE.md          # Technical architecture
│   ├── FEATURES.md              # Complete feature list
│   ├── ROADMAP.md               # Development phases
│   ├── TECH-SPEC.md             # Technical specifications
│   ├── I18N.md                  # Internationalization guide
│   └── PACKAGING.md             # Desktop packaging guide
│
├── src/
│   ├── main.tsx                 # Entry point
│   ├── App.tsx                  # Root component + router
│   ├── vite-env.d.ts
│   │
│   ├── config/                  # Static data & constants
│   │   ├── video-types.ts       # VIDEO_TYPES array
│   │   ├── genres.ts            # GENRES array (extensible)
│   │   ├── platforms.ts         # Store platforms (Steam, Epic, etc.)
│   │   ├── rig-fields.ts        # Hardware field definitions
│   │   ├── social-fields.ts     # Social/donate link definitions
│   │   └── defaults.ts          # Default state values
│   │
│   ├── i18n/                    # Internationalization
│   │   ├── index.ts             # i18next setup
│   │   └── locales/
│   │       ├── en/
│   │       │   ├── ui.json      # UI strings (buttons, labels)
│   │       │   └── templates.json # Description templates
│   │       ├── vi/
│   │       ├── ja/
│   │       ├── es/              # Spanish (example extension)
│   │       ├── ko/              # Korean (future)
│   │       ├── zh/              # Chinese (future)
│   │       └── _schema.json     # JSON schema for locale validation
│   │
│   ├── engine/                  # Core template engine (pure functions, no React)
│   │   ├── title-builder.ts     # Title generation logic
│   │   ├── description-builder.ts # Description generation logic
│   │   ├── tag-generator.ts     # Tag generation + dedup + char limit
│   │   ├── template-renderer.ts # Orchestrator: combines title + desc + tags
│   │   └── types.ts             # Shared types for engine
│   │
│   ├── store/                   # State management (Zustand)
│   │   ├── editor-store.ts      # Current editor form state
│   │   ├── profile-store.ts     # Saved profiles (social, rig, channel)
│   │   ├── preset-store.ts      # Game presets (name + store links)
│   │   ├── history-store.ts     # Generated output history
│   │   └── settings-store.ts    # App settings (theme, default language)
│   │
│   ├── hooks/                   # Custom React hooks
│   │   ├── use-generated-output.ts  # Memoized template rendering
│   │   ├── use-clipboard.ts     # Copy-to-clipboard with feedback
│   │   ├── use-char-count.ts    # Character count with limit warning
│   │   └── use-debounce.ts      # Input debouncing
│   │
│   ├── components/              # Reusable UI components
│   │   ├── ui/                  # Primitives
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Textarea.tsx
│   │   │   ├── Toggle.tsx
│   │   │   ├── ChipGroup.tsx
│   │   │   ├── Select.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Tooltip.tsx
│   │   │   ├── Modal.tsx
│   │   │   └── Toast.tsx
│   │   │
│   │   ├── editor/              # Editor-specific components
│   │   │   ├── VideoTypeSelector.tsx
│   │   │   ├── LanguageSelector.tsx
│   │   │   ├── GenreSelector.tsx
│   │   │   ├── GameInfoForm.tsx
│   │   │   ├── VideoSettingsForm.tsx
│   │   │   ├── TimestampEditor.tsx
│   │   │   ├── StoreLinkEditor.tsx
│   │   │   ├── RigEditor.tsx
│   │   │   ├── SocialEditor.tsx
│   │   │   ├── WarningToggles.tsx
│   │   │   └── QuickPreview.tsx
│   │   │
│   │   ├── output/              # Output display components
│   │   │   ├── OutputPreview.tsx
│   │   │   ├── TitleOutput.tsx
│   │   │   ├── DescriptionOutput.tsx
│   │   │   ├── TagOutput.tsx
│   │   │   ├── CharCounter.tsx
│   │   │   ├── CopyButton.tsx
│   │   │   └── CopyAllBar.tsx
│   │   │
│   │   ├── profiles/            # Profile management
│   │   │   ├── ProfileList.tsx
│   │   │   ├── ProfileCard.tsx
│   │   │   ├── ProfileSaveForm.tsx
│   │   │   └── GamePresetManager.tsx
│   │   │
│   │   └── layout/              # App shell
│   │       ├── AppShell.tsx
│   │       ├── Sidebar.tsx
│   │       ├── Header.tsx
│   │       └── TabBar.tsx
│   │
│   ├── pages/                   # Route pages
│   │   ├── EditorPage.tsx
│   │   ├── OutputPage.tsx
│   │   ├── ProfilesPage.tsx
│   │   ├── HistoryPage.tsx
│   │   ├── SettingsPage.tsx
│   │   └── BatchPage.tsx
│   │
│   ├── utils/                   # Shared utilities
│   │   ├── clipboard.ts
│   │   ├── char-count.ts
│   │   ├── sanitize.ts
│   │   ├── export.ts            # JSON/CSV export
│   │   └── import.ts            # JSON import
│   │
│   └── styles/
│       └── globals.css          # Tailwind directives + custom vars
│
├── src-tauri/                   # Tauri desktop shell (Phase 4)
│   ├── Cargo.toml
│   ├── tauri.conf.json
│   ├── src/
│   │   └── main.rs
│   └── icons/
│
├── tests/
│   ├── engine/                  # Unit tests for template engine
│   │   ├── title-builder.test.ts
│   │   ├── description-builder.test.ts
│   │   └── tag-generator.test.ts
│   ├── store/                   # Store tests
│   └── components/              # Component tests
│
├── scripts/                     # Build/dev scripts
│   ├── validate-locales.ts      # Validate all locale files have same keys
│   └── generate-locale-template.ts # Generate empty locale from schema
│
└── .github/
    └── workflows/
        ├── ci.yml               # Lint + test + build
        ├── deploy-web.yml       # Deploy to GitHub Pages
        └── release-desktop.yml  # Build Tauri binaries
```

## Coding Conventions

### TypeScript
- Strict mode enabled (`strict: true` in tsconfig)
- Prefer `interface` over `type` for object shapes
- Use `const` assertions for static config arrays
- No `any` — use `unknown` + type guards
- Barrel exports via `index.ts` per directory

### React
- Functional components only, no class components
- Custom hooks for shared logic — prefix with `use`
- Memoize expensive computations with `useMemo`
- Use `React.lazy()` for page-level code splitting
- No prop drilling beyond 2 levels — use Zustand store

### Naming
- Files: `kebab-case.ts` / `PascalCase.tsx` for components
- Variables/functions: `camelCase`
- Types/interfaces: `PascalCase`
- Constants: `UPPER_SNAKE_CASE`
- Store slices: `use[Name]Store`

### Styling
- Tailwind utility classes — no inline styles, no CSS modules
- Custom colors defined in `tailwind.config.ts`
- Dark theme by default, optional light theme via class toggle
- Responsive: mobile-first, breakpoints at `sm`, `md`, `lg`

### i18n
- All user-facing strings go through `t()` function
- Template strings (description/title) use dedicated locale file
- UI strings and template strings are separate namespace files
- Never hardcode user-visible text in components

### State Management
- Zustand stores with `persist` middleware for localStorage
- Separate stores by domain (editor, profiles, presets, settings)
- Keep stores flat — no deep nesting
- Actions defined inside the store, not externally

### Engine (template logic)
- Pure functions only — no React dependencies
- 100% unit test coverage for engine/
- Each function takes typed input, returns string
- No side effects — no clipboard, no storage, no DOM

## Key Design Decisions

1. **Engine is framework-agnostic**: `src/engine/` has zero React imports. This allows reuse if migrating to another framework, CLI tool, or VS Code extension.

2. **i18n covers both UI and templates**: UI labels (`ui.json`) and generated content (`templates.json`) are separate. Adding a language means adding 2 JSON files + registering in config.

3. **Profiles vs Presets**: Profile = user identity (channel, social, rig — rarely changes). Preset = game identity (name, store links — reused across parts). These are separate stores.

4. **Tags are generated, not hand-written**: Tag engine combines genre pool + core pool + platform + quality + multilingual + trending. User can edit the final output but doesn't build tags manually.

5. **Tauri for desktop**: Chosen over Electron for ~5MB binary vs ~150MB. Familiar Rust toolchain. Web version works independently without Tauri.

## Development Commands

```bash
# Install dependencies
npm install

# Development server
npm run dev

# Build for web
npm run build

# Preview production build
npm run preview

# Run tests
npm run test

# Lint
npm run lint

# Type check
npm run typecheck

# Validate locale files
npm run validate:locales

# Desktop dev (requires Tauri CLI)
npm run tauri dev

# Desktop build
npm run tauri build
```

## Git Workflow

- `main` — stable releases
- `dev` — integration branch
- Feature branches: `feat/feature-name`
- Commit format: `type(scope): message`
  - Types: `feat`, `fix`, `refactor`, `docs`, `test`, `ci`, `chore`
  - Example: `feat(engine): add Spanish template support`

## Important Notes for Claude Code

- Always run `npm run typecheck` before committing
- When adding a new language: follow docs/I18N.md checklist
- When adding a new genre: add to `src/config/genres.ts` + tag pool in `src/engine/tag-generator.ts`
- When adding a new video type: add to `src/config/video-types.ts` + update all template files in `src/i18n/locales/*/templates.json`
- Engine tests must pass before any PR merge
- Keep bundle size under 500KB (excluding Tauri)
