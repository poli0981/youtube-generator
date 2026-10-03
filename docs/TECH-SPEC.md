# Technical Specifications

## YTDescGen — Implementation Details

Reflects **v1.0.0**. The module map and data flow are in [ARCHITECTURE.md](ARCHITECTURE.md), the desktop and Android builds in [PACKAGING.md](PACKAGING.md), and running the web deployment (Cloudflare Worker, Turnstile, secrets, rollback) in [HOSTING.md](HOSTING.md).

---

## 1. Package Configuration

### package.json

```json
{
  "name": "yt-desc-gen",
  "version": "1.0.0",
  "private": true,
  "license": "Apache-2.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage",
    "lint": "eslint src/ tests/ scripts/ worker/ build-plugins/",
    "lint:fix": "eslint src/ tests/ scripts/ worker/ build-plugins/ --fix",
    "knip": "knip",
    "typecheck": "tsc --noEmit",
    "typecheck:all": "tsc --noEmit -p tsconfig.check.json",
    "format": "prettier --write \"{src,tests,scripts,worker,build-plugins}/**/*.{ts,tsx,css}\"",
    "format:check": "prettier --check \"{src,tests,scripts,worker,build-plugins}/**/*.{ts,tsx,css}\"",
    "check:version": "tsx scripts/check-version-sync.ts",
    "validate:locales": "tsx scripts/validate-locales.ts",
    "generate:locale": "tsx scripts/generate-locale-template.ts",
    "tauri": "tauri",
    "tauri:dev": "tauri dev",
    "tauri:build": "tauri build",
    "generate:brand": "tsx scripts/generate-brand-assets.ts",
    "cf:dev": "wrangler dev",
    "cf:check": "wrangler deploy --dry-run --outdir .wrangler/dry-run",
    "check:tauri": "tsx scripts/check-tauri-versions.ts",
    "check:bundle": "tsx scripts/check-bundle-size.ts",
    "check:licenses": "tsx scripts/third-party.ts",
    "generate:third-party": "tsx scripts/third-party.ts --write",
    "check:copyright": "tsx scripts/check-copyright.ts",
    "update:copyright": "tsx scripts/check-copyright.ts --write"
  },
  "dependencies": {
    "@fontsource-variable/inter": "^5.3.0",
    "@fontsource-variable/jetbrains-mono": "^5.3.0",
    "@tauri-apps/api": "^2.12.0",
    "@tauri-apps/plugin-opener": "^2.7.0",
    "clsx": "^2.1.1",
    "cmdk": "^1.1.1",
    "i18next": "^26.4.2",
    "i18next-resources-to-backend": "^1.2.3",
    "lucide-react": "^1.49.0",
    "motion": "^13.4.6",
    "radix-ui": "^1.6.7",
    "react": "^19.3.0",
    "react-dom": "^19.3.0",
    "react-i18next": "^17.0.15",
    "react-router-dom": "^7.18.4",
    "simple-icons": "^16.33.0",
    "sonner": "^2.0.8",
    "zustand": "^5.0.15"
  },
  "devDependencies": {
    "@eslint/js": "^10.0.1",
    "@resvg/resvg-js": "2.6.2",
    "@tailwindcss/postcss": "^4.3.3",
    "@tauri-apps/cli": "2.12.0",
    "@testing-library/jest-dom": "^7.0.1",
    "@testing-library/react": "^16.3.3",
    "@types/node": "^26.6.3",
    "@types/react": "^19.3.0",
    "@types/react-dom": "^19.3.0",
    "@vitejs/plugin-react": "^6.1.1",
    "@vitest/coverage-v8": "^4.1.11",
    "autoprefixer": "^10.6.1",
    "eslint": "^10.11.0",
    "eslint-plugin-react-hooks": "^7.1.1",
    "knip": "^6.38.0",
    "marked": "18.0.14",
    "postcss": "^8.5.28",
    "prettier": "^3.9.9",
    "prettier-plugin-tailwindcss": "^0.8.1",
    "tailwindcss": "^4.3.3",
    "tsx": "^4.23.15",
    "typescript": "^5.9.3",
    "typescript-eslint": "^8.71.0",
    "vite": "^8.3.1",
    "vitest": "^4.1.11",
    "wrangler": "4.144.0"
  }
}
```

Notes:

- **UI stack**: React 19, React Router 7, Zustand 5, i18next 26 / react-i18next 17, Radix primitives through the single `radix-ui` package (Dialog, AlertDialog, Popover, Tooltip, Tabs, Switch, Checkbox, ToggleGroup, Slot), Motion (loaded through `LazyMotion`), cmdk for the command palette, sonner for toasts (react-hot-toast is gone), lucide-react 1.x for UI icons and simple-icons (CC0-1.0) for the brand marks lucide 1.x dropped.
- **Tauri on the JavaScript side** is only `@tauri-apps/api` (for `invoke`) and `@tauri-apps/plugin-opener`. There are no dialog, fs or shell plugin packages: file access goes through the app's own Rust commands (see [PACKAGING.md](PACKAGING.md)). `@tauri-apps/cli` is pinned exactly, and `npm run check:tauri` keeps the npm packages on the same major.minor as the crates.
- **Build-time only**: `marked` renders the legal documents and `@resvg/resvg-js` rasterises the brand assets; neither ships in the app. `wrangler` is pinned exactly for `cf:dev` / `cf:check`.
- **Fonts** are self-hosted: `@fontsource-variable/inter` and `@fontsource-variable/jetbrains-mono` are imported in `src/main.tsx`, and each subset (latin, latin-ext, vietnamese, …) is fetched only when a page uses it.
- **Node 22** comes from `.node-version`, which CI, the release workflows and Cloudflare Workers Builds all read.

### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@config/*": ["./src/config/*"],
      "@engine/*": ["./src/engine/*"],
      "@store/*": ["./src/store/*"],
      "@hooks/*": ["./src/hooks/*"],
      "@components/*": ["./src/components/*"],
      "@pages/*": ["./src/pages/*"],
      "@utils/*": ["./src/utils/*"],
      "@i18n/*": ["./src/i18n/*"]
    }
  },
  "include": ["src"]
}
```

`tsconfig.json` covers only `src/` — what `vite build` compiles. `tsconfig.check.json` extends it for `npm run typecheck:all`: it adds `tests`, `scripts`, `worker` and `build-plugins`, plus the `vitest/globals` and `node` types those need.

### vite.config.ts

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { legalDocsPlugin } from "./build-plugins/legal-docs.ts";
import { cloudflareWebAnalytics, securityTxt } from "./build-plugins/web-only.ts";

// Set by the Tauri CLI for `tauri dev` / `tauri build`.
const isTauri = !!process.env.TAURI_ENV_PLATFORM;

export default defineConfig({
  plugins: [
    react(),
    // In-app Legal Center content for every build; the static /legal pages,
    // security.txt and the analytics beacon only for the web deployment.
    legalDocsPlugin({ emitStaticPages: !isTauri }),
    ...(isTauri ? [] : [securityTxt(), cloudflareWebAnalytics()]),
  ],
  // Web: https://ytgenerator.stream (Cloudflare Workers static assets).
  // Tauri: its own asset protocol. The GitHub Pages sub-path is gone.
  base: "/",
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
      "@config": path.resolve(import.meta.dirname, "./src/config"),
      "@engine": path.resolve(import.meta.dirname, "./src/engine"),
      "@store": path.resolve(import.meta.dirname, "./src/store"),
      "@hooks": path.resolve(import.meta.dirname, "./src/hooks"),
      "@components": path.resolve(import.meta.dirname, "./src/components"),
      "@pages": path.resolve(import.meta.dirname, "./src/pages"),
      "@utils": path.resolve(import.meta.dirname, "./src/utils"),
      "@i18n": path.resolve(import.meta.dirname, "./src/i18n"),
    },
  },
  server: {
    // `tauri dev` rebuilds under src-tauri/target while Vite runs; watching
    // it crashed Vite on Windows (EBUSY on the locked .dll).
    watch: { ignored: ["**/src-tauri/**", "**/.wrangler/**"] },
  },
  build: {
    // Old Android System WebViews choke on Vite's modern default target.
    target: isTauri ? "es2020" : undefined,
    // The Tauri CSP allows only 'self' for images and fonts: no data: URIs.
    assetsInlineLimit: 0,
    // Full license texts of the bundled packages, linked from the
    // third-party notices.
    license: { fileName: "licenses/third-party.md" },
    rollupOptions: {
      output: {
        // Rolldown (Vite 8) only accepts the function form of manualChunks.
        manualChunks(id) {
          if (/[\\/]node_modules[\\/]react(-dom)?[\\/]/.test(id)) return "react";
          if (/[\\/]node_modules[\\/]react-router(-dom)?[\\/]/.test(id)) return "router";
          if (
            /[\\/]node_modules[\\/](i18next|react-i18next|i18next-resources-to-backend)[\\/]/.test(
              id,
            )
          )
            return "i18n";
          return undefined;
        },
      },
    },
  },
});
```

What differs between the two builds:

|                                 | Web build                                                                                                                     | Tauri build (`TAURI_ENV_PLATFORM` set) |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| Legal documents                 | `virtual:legal-docs` (lazy chunk for the Legal Center) **and** static `dist/legal/<id>.html` (+ `<id>.vi.html`, `index.html`) | `virtual:legal-docs` only              |
| `/.well-known/security.txt`     | Generated on every build (RFC 9116, `Expires` 180 days ahead)                                                                 | —                                      |
| Cloudflare Web Analytics beacon | Injected before `</body>` of `index.html` (build only, never in `npm run dev`)                                                | —                                      |
| JS target                       | Vite default                                                                                                                  | `es2020`                               |

`build-plugins/legal-docs.ts` renders the repository's legal files (`TERMS.md`, `PRIVACY.md`, `DISCLAIMER.md` + `docs/i18n/vi/DISCLAIMER.md`, `LICENSE`, `THIRD_PARTY_NOTICES.md`, `SECURITY.md`, `NOTICE`, `CODE_OF_CONDUCT.md`; list in `src/config/legal.ts`) with `marked` at build time. `build-plugins/web-only.ts` holds the analytics snippet and the `security.txt` generator.

### Styling: Tailwind CSS 4

There is no `tailwind.config.ts` (removed in v0.37.0). PostCSS loads `@tailwindcss/postcss` and `autoprefixer` (`postcss.config.js`), and Tailwind is configured in CSS, in `src/styles/globals.css`:

```css
@import "tailwindcss";

/* The app toggles a .dark / .light class on <html> instead of following the OS. */
@custom-variant dark (&:where(.dark, .dark *));

/* Tailwind names → runtime variables. The values live in the :root / .light blocks,
   which is what the theme toggle rewrites. */
@theme {
  --color-surface-0: var(--surface-0);
  --color-surface-1: var(--surface-1);
  --color-text-primary: var(--text-primary);
  --color-accent: var(--accent);
  --font-sans: var(--font-sans-stack);
  --radius-card: 0.875rem;
  /* Controls are compact with a mouse and 44px on touch screens. */
  --spacing-control: var(--control-h);
  /* … the full token list is in the file … */
}
```

Components use the tokens (`bg-surface-1`, `text-text-muted`, `rounded-card`, …), never raw colours. `public/theme-init.js` applies the saved theme and the Hide scrollbars class (and sets `<html lang>` to the saved UI language) before the first paint; it is a separate file rather than an inline script so the Content-Security-Policy needs no exception.

### wrangler.jsonc

The only Cloudflare file in the repository; Workers Builds runs `npx wrangler deploy` on every push to `main`. Its settings, without the file's comments:

```json
{
  "name": "youtube-generator",
  "main": "worker/index.ts",
  "compatibility_date": "2026-09-25",
  "workers_dev": false,
  "preview_urls": true,
  "routes": [{ "pattern": "ytgenerator.stream", "custom_domain": true }],
  "build": { "command": "npm run build" },
  "assets": {
    "directory": "./dist",
    "binding": "ASSETS",
    "not_found_handling": "404-page",
    "run_worker_first": [
      "/*",
      "!/assets/*",
      "!/icons/*",
      "!/.well-known/*",
      "!/favicon.svg",
      "!/favicon.ico",
      "!/apple-touch-icon.png",
      "!/og-image.png",
      "!/manifest.webmanifest",
      "!/robots.txt",
      "!/sitemap.xml",
      "!/theme-init.js",
      "!/licenses/*",
      "!/404.html"
    ]
  },
  "vars": {
    "TURNSTILE_SITE_KEY": "0x4AAAAAAFKFAMUx9rQ5H6bQ",
    "GATE_TTL_SECONDS": "86400"
  },
  "observability": { "enabled": true }
}
```

Every request goes through the Worker first except content-hashed build output and the public files browsers and crawlers fetch without cookies. `not_found_handling` is `404-page`, not the SPA fallback, so no path can reach `index.html` without passing the gate. `TURNSTILE_SECRET` is a dashboard Secret, never committed. Request flow, cookies, headers and operations: [HOSTING.md](HOSTING.md).

The Worker (`worker/`): `index.ts` (entry; injects the clock, `fetch` and random ids), `router.ts` (routing), `env.ts` (bindings, constants, the gate lifetime clamped to 5 min – 30 days), `turnstile.ts` (siteverify call and verdict: success, hostname, action `enter`, token age ≤ 300 s), `cookie.ts` (the HMAC-signed `__Host-ytg_gate` cookie, key derived from the Turnstile secret, bound to a User-Agent hash), `headers.ts` (CSP per page type and the baseline security headers), `gate-page.ts` + `gate-i18n.ts` (the gate page in the app's eight languages). It uses only standard Web APIs, so it type-checks against the DOM lib and runs under Vitest in Node.

## 2. Core Engine Interfaces

`renderAll(input, t, options?)` in `src/engine/template-renderer.ts` is the entry point: it calls `buildTitle`, `buildDescription` and `generateTags` and returns a `GeneratorOutput`. `t` is an i18next translator fixed to the output language and the `templates` namespace.

```typescript
// src/engine/types.ts — abridged; the file has every field with its history.

export type SupportedLanguage = "en" | "vi" | "ja" | "es" | "ko" | "zh" | "pt-BR" | "id";

export interface GeneratorInput {
  videoType: VideoType; // 20 video types
  language: SupportedLanguage;
  /** 1–3 genres (MAX_GENRES); the first drives the genre hashtag and trending tags. */
  genres: Genre[];
  gameName: string;
  gameNameLocalized?: Partial<Record<SupportedLanguage, string>>;
  /** May be empty: the channel phrase is then dropped (channel-phrase.ts). */
  channelName: string;
  platform: string;
  // Video-type specific: partNumber, bossName, dlcName, challengeName, modName, modList,
  // liveUrl, scheduledTime, gachaQuestType, chapterName, questName, characterName,
  // anniversaryYear, gachaVersion.
  // Video settings: resolution, fps, graphicsPreset (+ graphicsPresetCustom),
  // skipGraphicsSettings, rayTracingModes, frameGenVendor, frameGenMultiplier,
  // upscaleQuality, artStyle, videoStyleEra, versionInfo.
  // Content: timestamps, playlistLink, contactEmail, adEmail, gameKeyEmail,
  // copyrightEmail, musicAttribution, sponsorName, sponsorPlatform, pubDevName,
  // thirdPartyAdText,
  // playthroughStatus, difficulty, endings, languagePatch, gameVersion,
  // contentWarnings, techNotes, playtest fields, community invite links,
  // Vietnamese donate fields.
  /** @deprecated v0.11 — folded into contentWarnings. */
  spoilerWarning: boolean;
  /** @deprecated v0.11 — folded into contentWarnings. */
  matureWarning: boolean;
  storeLinks: Partial<Record<string, string>>;
  /** "paid" | "free" | "demo" per store link. */
  storeLinkTypes?: Partial<Record<string, StoreLinkType>>;
  social: Partial<Record<string, string>>;
  /** Since v1.0.0 the GPU is stored as `gpu:<catalog id>` (src/config/gpu-catalog.ts). */
  rig: Partial<Record<string, string>>;
}

export interface GeneratorOutput {
  title: string;
  description: string;
  tags: string[];
  /** The tags joined with ", " — what Copy puts on the clipboard. */
  tagString: string;
  charCounts: {
    title: number;
    description: number;
    /** youtubeTagsLength(tags) — YouTube's count, not tagString.length. */
    tags: number;
  };
  /** One entry per field that is strictly over its limit. */
  warnings: CharLimitWarning[];
}

export interface CharLimitWarning {
  field: "title" | "description" | "tags";
  current: number;
  limit: number;
  message: string; // English; the UI builds its own text from the numbers
}

// YouTube limits
export const YT_LIMITS = {
  TITLE_MAX: 100,
  DESCRIPTION_MAX: 5000,
  TAGS_MAX: 500,
  SINGLE_TAG_MAX: 30,
  HASHTAG_MAX: 3,
} as const;

export interface TitleFormatConfig {
  badgePosition: TitleBadgePosition; // "prefix" | "middle" | "suffix"
  separator: TitleSeparatorId; // "emDash" | "hyphen" | "colon" | "pipe"
  badgeCase: TitleBadgeCase; // "upper" | "lower"
  /** v1.0.0. Missing on settings saved before — read as "gameFirst". */
  order?: TitleOrder; // "gameFirst" | "typeFirst"
}
```

`RenderOptions` = `SettingsRenderOptions` (the twelve settings-derived knobs, built by `buildRenderOptions` in `src/hooks/use-render-options.ts`) + `RenderOptionOverrides` (`tEn`, `bilingualContentBlocks`, `year`, decided per call site). The year for the copyright line and trending tags comes in as an option so tests are deterministic; the builders fall back to the current year when it is omitted.

### 2.1 Engine rules added or changed in v1.0.0

**Tag length, counted the way YouTube counts it** (`tag-generator.ts`):

- `youtubeTagsLength(tags)` = the sum of each tag's length, plus 2 for the quotes YouTube puts around any tag containing whitespace, plus one comma between tags. The old measure (length of the `", "`-joined string) ignored the quotes; 15 of 51 real tag sets were over 500 by YouTube's count while showing as under.
- `generateTags` collects, in priority order: the game name (bare, and a shortened form for composites), core tags for the output language, genre tags for every selected genre, video-type tags, platform tags, quality tags, the output language's multilingual tags (setting), trending tags for the first genre (setting), and the publisher/developer name. It then de-duplicates case-insensitively, drops tags over 30 characters, and `trimToCharLimit(tags, 500)` keeps tags in priority order while they fit — a tag that doesn't fit is skipped and the shorter ones after it are still tried.
- Platform tags use `PlatformConfig.tagName` ("Steam", "Epic Games", "itch.io"), not the id; the publisher's own site has no tag name and adds no platform tags.

**Empty channel name** (`channel-phrase.ts`, used by the description, pinned comment and playlist builders): templates render with `CHANNEL_SLOT` (`@@CHANNEL@@`) in place of an empty channel name. `withoutEmptyChannel(text, language)` then removes the words that go with the channel name in that language ("trên kênh", "による", "en", "no", "di", …) and the English "on" (for English, and for locales that still carry English sentences for newer video types), replaces any slot left over with a neutral fallback ("this channel", "kênh", …) and tidies the spacing before punctuation. "…of Hades on ." no longer happens in any of the eight languages.

**Rig block** (`rig-block.ts`): `buildRigLines(rig, t)` returns `Label: value` lines, shared by the description and the social captions. Labels come from `description.rigLabels.<field>` in the output language, the order is `RIG_FIELDS` (CPU, GPU, RAM, motherboard, storage, OS, monitor, capture, controller, video editor), and values go through `formatRigValue` (`gpu:nvidia-rtx-5080` → "NVIDIA GeForce RTX 5080"). Keys that are no longer rig fields are still printed, after the known ones.

**Chapters** (`timeline-parser.ts`):

- A timestamp line may be `0:00 label`, `[0:00] label`, `(0:00) label`, `H:MM:SS`, or frame-accurate `HH:MM:SS:FF` (frames are dropped), with an optional separator (`-`, `–`, `—`, `:`, `|`, `•`, `·`).
- Latin-script keywords must end at a non-letter ("Part 2" is a part, "Party" is not). A bare "Final" counts as an ending only when nothing but a number or punctuation follows it, so "Final Fantasy VII" stays a game name.
- `checkChapters(entries)` applies YouTube's rules (`CHAPTER_RULES = { minCount: 3, minSeconds: 10 }`): first timestamp at 0:00, at least three, ascending, each chapter at least 10 s. Issues: `firstNotZero`, `tooFew`, `outOfOrder`, `tooShort`. An empty list has no issues.
- `normalizeTimeline(raw)` ("Tidy up") rewrites a pasted list as `M:SS label` lines without brackets, frames or separators; lines that are not timestamps are kept.

**Title shapes** (`title-variants.ts`): `buildTitleVariants` returns three shapes, each produced by the real `buildTitle` with a different `{ order, badgePosition }` — `default` (gameFirst, middle), `typeFirst` (typeFirst, middle), `qualityFirst` (gameFirst, prefix). The user's separator and badge case still apply, and the shape's `format` is what "Apply" writes into the `titleFormat` setting, so the Output title then matches what was shown.

**Social captions** (`social-post-builder.ts`, platforms in `src/config/social-platforms.ts`):

| Platform        | Limit | Hashtags kept | Count                        |
| --------------- | ----- | ------------- | ---------------------------- |
| TikTok          | 4,000 | all           | plain length                 |
| YouTube Shorts  | 5,000 | 5             | plain length                 |
| Instagram Reels | 2,200 | all           | plain length                 |
| Facebook Reels  | 2,200 | all           | plain length                 |
| X               | 280   | 3             | weighted (`xWeightedLength`) |
| Threads         | 500   | 1             | plain length                 |
| Bluesky         | 300   | 3             | plain length                 |

`xWeightedLength` NFC-normalises the text and walks grapheme clusters: an emoji counts 2; otherwise each code point counts 1 inside X's weight-1 ranges (U+0000–U+10FF, U+2000–U+200D, U+2010–U+201F, U+2032–U+2037) and 2 outside them (CJK, Hangul, Vietnamese letters from Latin Extended Additional). When a caption is over its limit, optional blocks are dropped in the order warnings → copyright → thanks → rig; `isOver` reports any overflow that remains.

**Limits and forbidden characters** (`limits.ts`): see [§ 7](#7-youtube-character-limits-reference).

## 3. Zustand Store Pattern

Every persisted store follows the same shape. The editor store, abridged:

```typescript
// src/store/editor-store.ts (abridged)
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface EditorData {
  /* every form field */
}

interface EditorActions {
  set: <K extends keyof EditorData>(key: K, value: EditorData[K]) => void;
  setNested: <G extends "storeLinks" | "social" | "rig">(
    group: G,
    key: string,
    value: string,
  ) => void;
  setStoreLinkType: (platformId: string, type: StoreLinkType) => void;
  loadProfile: (profile: Partial<EditorData>) => void;
  loadPreset: (preset: Partial<EditorData>) => void;
  reset: () => void;
}

/** Bump together with a new step in migrateEditorState. */
export const EDITOR_STORE_VERSION = 20;

export const useEditorStore = create<EditorData & EditorActions>()(
  persist(
    (set) => ({
      ...initialState, // built from DEFAULTS.editor (src/config/defaults.ts)
      set: (key, value) => set({ [key]: value }),
      setNested: (group, key, value) =>
        set((state) => ({ [group]: { ...state[group], [key]: value } })),
      setStoreLinkType: (platformId, type) =>
        set((state) => ({ storeLinkTypes: { ...state.storeLinkTypes, [platformId]: type } })),
      // normalizeEditorPatch maps legacy values and clamps string lengths.
      loadProfile: (profile) => set((state) => ({ ...state, ...normalizeEditorPatch(profile) })),
      loadPreset: (preset) => set((state) => ({ ...state, ...normalizeEditorPatch(preset) })),
      reset: () => set(initialState),
    }),
    {
      name: "ytdescgen-editor-draft",
      storage: createJSONStorage(() => localStorage),
      version: EDITOR_STORE_VERSION,
      migrate: (persistedState, version) => migrateEditorState(persistedState, version),
      partialize: (state) => editorDataOf(state), // data only, never the actions
    },
  ),
);

/** The persist migration — exported, and run again by backup import. */
export function migrateEditorState(persistedState: unknown, version: number): EditorData {
  /* one `if (version < N)` block per schema change; every step is idempotent */
}
```

| Store              | localStorage key         | Version                       | Migration (exported)                                                                           |
| ------------------ | ------------------------ | ----------------------------- | ---------------------------------------------------------------------------------------------- |
| `useEditorStore`   | `ytdescgen-editor-draft` | `EDITOR_STORE_VERSION` = 20   | `migrateEditorState`                                                                           |
| `useProfileStore`  | `ytdescgen-profiles`     | `PROFILE_STORE_VERSION` = 3   | `migrateProfilesState`                                                                         |
| `usePresetStore`   | `ytdescgen-presets`      | `PRESET_STORE_VERSION` = 2    | `migratePresetsState`                                                                          |
| `useTemplateStore` | `ytdescgen-templates`    | `TEMPLATE_STORE_VERSION` = 2  | `migrateTemplatesState`                                                                        |
| `useHistoryStore`  | `ytdescgen-history`      | `HISTORY_STORE_VERSION` = 3   | `migrateHistoryState`                                                                          |
| `useSettingsStore` | `ytdescgen-settings`     | `SETTINGS_STORE_VERSION` = 12 | `healSettings` (`settings-heal.ts`), as `migrate` **and** in `merge`, so it runs on every load |

v1.0.0 migration steps: editor v19, profiles v3 and templates v2 move the GPU to the catalog format (`migrateRig`: `brand|series|model` → `gpu:<id>`, or the full name as free text when the card is not in the catalog); history v3 folds the duplicates older versions piled up into one entry per video (`dedupeHistory`; a video is game name (case-insensitive) + video type + language + title), keeping the newest.

v1.1.0: editor v20 back-fills `copyrightEmail` (the fourth split contact line) with `""`. `Profile.copyrightEmail` is optional, like the v1.0.0 additions, so the profile store stays at v3. The settings gain `hideScrollbars` without a version bump: `healSettings` back-fills and coerces it on every load, and the unchanged version keeps a 1.1.0 settings backup restorable on 1.0.0.

Rules:

- **localStorage is the only store**, on the web, desktop and Android. The desktop "mirror" file of earlier versions (`storage-adapter.ts`, `saveSettings`, `checkDataFileHealth`) was removed in v1.0.0; it was written next to the data folder and never read back. [PACKAGING.md](PACKAGING.md) covers how the leftover file is recovered.
- `partialize` persists data only. A shape change bumps the store's exported version and adds an idempotent step to its exported migration; backup import replays the same steps from the version a file records.
- Settings are healed on every load, not only on a version change, so a hand-edited value never reaches the app. Seven settings are device-local and never exported or overwritten by an import (`LOCAL_SETTINGS_KEYS` in `src/utils/backup/sanitize.ts`): `legalConsentVersion`, `legalConsentAt`, `editorAccordionState`, `settingsAccordionState`, `sidebarCollapsed`, `lastProfileId`, `lastPresetId`.
- **Not persisted by Zustand**: `useLogStore` (up to 2,000 entries in memory; `src/utils/log-storage.ts` mirrors each entry to the `ytdescgen-logs` localStorage key on the web, capped at 5,000, or to daily JSONL files in Tauri), `usePendingInvalidStore` (typed-but-invalid text) and `useRestoreDialog` (the file waiting in the restore dialog).

## 4. Backup File Format (v1.0.0)

Code: `src/utils/backup/`. Every export since v1.0.0 is a `_format: 2` envelope:

```json
{
  "_app": "ytdescgen",
  "_format": 2,
  "_type": "backup",
  "_schemaVersion": 1,
  "_appVersion": "1.0.0",
  "_exportedAt": "2026-09-30T14:00:00.000Z",
  "data": {
    "profiles": { "version": 3, "items": [] },
    "settings": { "version": 12, "value": {} }
  }
}
```

- `_type`: `backup` | `profiles` | `presets` | `templates` | `settings` | `history` | `logs` | `social`.
- **`backup`**: `_schemaVersion` is the container version (`BACKUP_CONTAINER_VERSION` = 1). `data` holds any of the sections `profiles`, `presets`, `templates`, `history`, `settings`, `draft`, each as `{ version, items }` (lists) or `{ version, value }` (settings, draft), where `version` is the store version the data is in (`SECTION_VERSIONS`). Settings are written without the device-local keys.
- **Single-section export** (`_type: "profiles"`, … — the library tabs and History): `_schemaVersion` is that store's version and `data` is the items (or the value).
- `logs` and `social` files are exports only; they are recognised and refused by restore.
- File names: `ytdescgen-<kind>-YYYY-MM-DD.<ext>` (`datedFileName`, local date). History also exports CSV (`historyToCsv`): UTF-8 with a byte-order mark, CRLF, RFC 4180 quoting, and a `'` prefix on cells a spreadsheet would read as a formula.

### Reading a file (`detect.ts`)

| File                                                                                                              | Written by                                                                      | Read as                                                                                               |
| ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `_format: 2` backup or section export                                                                             | v1.0.0+                                                                         | As recorded. `_format` > 2, or a backup `_schemaVersion` > 1, is refused as "made by a newer version" |
| `{ "_app": "ytdescgen", "_type": "profile" \| "preset" \| "template" \| "settings" \| "history" \| "social", … }` | v0.15 – v0.38                                                                   | One section. A `history` file whose rows are log entries is a logs export                             |
| Bare array                                                                                                        | before v0.15                                                                    | Section guessed from the first row                                                                    |
| `{ "ytdescgen-settings": …, "ytdescgen-profiles": …, … }`                                                         | The desktop app's old data file; the pre-v0.18 Settings export, which dumped it | Each store key, as `{ state, version }` or bare data                                                  |
| Bare settings object (`appLanguage` / `theme`)                                                                    | Hand-made, pre-v0.18                                                            | Settings, version 0                                                                                   |

An unknown version is read as 0: every migration step is idempotent, so running all of them on data that didn't need them changes nothing. A section saved by a newer store version than this build's is marked `tooNew` — shown in the preview but not restorable.

### Cleaning (`sanitize.ts`)

1. **Store migration first** — the store's own exported function, from the recorded version. List sections migrate in one pass (so the history de-duplication works across rows); if that throws, row by row, and a row that still throws is dropped instead of failing the file.
2. **Whitelist** — only known fields with the right types; choice fields limited to known ids (video types, languages, genres, graphics options, content warnings, tech notes, …); strings cut to the editor's limits (`PATCH_FIELD_LIMITS`, `FIELD_LIMITS`); map keys `^[A-Za-z0-9][A-Za-z0-9_.:-]{0,63}$` (at most 100 entries); an id that is not `^[A-Za-z0-9_-]{1,64}$`, or repeats one already taken, is replaced by a new one; at most 5,000 items per section. Nothing is copied by key except the whitelist, so a key like `__proto__`, or `set` (which once overwrote an editor action), cannot reach a store.
3. **Settings** go through `healSettings` and keep this device's local keys. Dropped rows are counted per section and reported.

### Restoring (`restore.ts`)

- `planRestore(file, readCurrentData())` marks every incoming row `new`, `same` or `changed`. A row is matched to an existing item by id, then by content (ignoring `id`, `createdAt`, `updatedAt`), then — for history — by video (`historyKey`). `incomingNewer` compares `updatedAt ?? createdAt`. Settings and the draft are `same` or `changed`.
- The choice (`RestoreChoice`): sections and rows (by default every row that would change something; in Replace mode every row), mode `merge` or `replace`, and for Merge a conflict rule: `newer` (replace the item here only when the incoming copy is newer) or `both` (add the incoming copy with a new id; profiles and templates get a free name such as "Main (2)"; history has no "both" — one entry per video).
- **Replace** makes the section exactly the selected rows; a matched row keeps the id it has here, so nothing pointing at it breaks.
- In either mode, restored history is sorted newest first, de-duplicated per video and cut to the history limit (the incoming limit when settings are restored too).
- `applyRestore` writes every store synchronously, in one step, and returns `undo`, which puts back only the sections that restore changed — edits made afterwards in other sections survive. The desktop app also writes a `…-before-restore` automatic backup first.

### Automatic backups (desktop)

`auto-backup.ts` writes `ytdescgen-backup-YYYYMMDD-HHmm.json` through the `backup_write` command into `<app data>/backups/`: 5 s after start, then 30 s after the last change to profiles, presets, templates, history or settings, at most once every 10 minutes. It skips a write when the data is identical to the last backup (FNV-1a hash of `data`, seeded from the newest backup on start) or when the library (profiles, presets, templates, history) is empty, so a run of empty backups can never push the good ones out. The draft is included but does not trigger a backup. **Back up now** in Settings and the backup before a restore (`…-before-restore.json`) use the same folder and name pattern. The Rust side writes atomically (temporary file + rename) and keeps the newest ten `ytdescgen-backup-*` files; any other name, such as a recovered `ytdescgen-legacy-data.json`, is never deleted automatically.

## 5. GitHub Actions

| Workflow                                               | Runs on                                    | Jobs                                                                                                                                                                                                                                                                     |
| ------------------------------------------------------ | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ci.yml` (CI)                                          | PRs to and pushes on `main`                | `check` — the required status on `main`                                                                                                                                                                                                                                  |
| `security.yml` (Security)                              | PRs, pushes on `main`, weekly, manual      | `dependency-review` (PRs: fails on a newly added high/critical advisory), `workflow-lint` (actionlint + zizmor, `.github/zizmor.yml`), `scorecard` (OpenSSF Scorecard, informational; not on PRs)                                                                        |
| `compliance.yml` (Compliance)                          | PRs, pushes on `main`                      | `reuse` (REUSE licensing via `REUSE.toml`), `pr-title` (Conventional-Commit PR titles with a lower-case subject)                                                                                                                                                         |
| `rust.yml` (Rust)                                      | Changes under `src-tauri/`, weekly, manual | `lint-and-test` (`cargo fmt --all -- --check`, `cargo clippy --all-targets --locked -- -D warnings`, `cargo test --locked`, after `npm run build` because `generate_context!` embeds `dist/`), `cargo-deny` (`check advisories licenses sources`, `src-tauri/deny.toml`) |
| `release-desktop.yml`, `release-android.yml`           | `v*` tags, manual with a `tag` input       | `verify`, then the builds — see [PACKAGING.md](PACKAGING.md)                                                                                                                                                                                                             |
| `announce-release.yml`                                 | Release published, manual                  | Links the release to an Announcements discussion and posts to Discord                                                                                                                                                                                                    |
| `notify-ci-failure.yml`, `notify-release-pipeline.yml` | `workflow_run`                             | Discord notifications through the maintainer's shared workflows                                                                                                                                                                                                          |
| `pages-migration.yml`                                  | Manual only                                | Publishes `migration-page/` to the old GitHub Pages address until 2026-11-29                                                                                                                                                                                             |

The `check` job, in order:

```yaml
- run: npm ci
# correctness
- run: npm run typecheck # src/
- run: npm run typecheck:all # + tests/, scripts/, worker/, build-plugins/
- run: npm run lint
- run: npm run validate:locales
- run: npm run test:coverage # thresholds in vitest.config.ts
# consistency
- run: npm run format:check
- run: npm run knip
- run: npm run check:version # the six version fields agree
- run: npm run check:tauri # @tauri-apps/* npm packages and tauri crates on the same major.minor
# licensing
- run: npm run check:licenses # allow-list + THIRD_PARTY_NOTICES.md matches what is installed
- run: npm run check:copyright # NOTICE, REUSE.toml, installer copyright state HEAD's year
# security (advisory: a fresh transitive advisory must not redden unrelated PRs)
- run: npm audit --audit-level=high
  continue-on-error: true
# build
- run: npm run build
- run: npm run check:bundle # initial load ≤ 280 KB gzip, no JS chunk > 500 KB raw
- run: npx wrangler deploy --dry-run --outdir .wrangler/dry-run
```

- **Bundle budget** (`scripts/check-bundle-size.ts`): the initial load is every script, modulepreload and stylesheet `dist/index.html` references, summed gzip — lazy chunks (pages, locales, legal documents) are excluded. The result is printed as a table and added to the job summary.
- **Licences** (`scripts/lib/third-party.ts`): every package bundled into the app must carry an allowed licence (MIT, ISC, Apache-2.0, BSD-2/3-Clause, 0BSD, CC0-1.0, Unlicense, BlueOak-1.0.0, OFL-1.1, Zlib, MPL-2.0), and `THIRD_PARTY_NOTICES.md` is generated (`npm run generate:third-party`) and checked, not hand-written.
- **Copyright years** (`scripts/lib/copyright.ts`, v1.1.0): NOTICE, REUSE.toml and `bundle.copyright` in `tauri.conf.json` must state `copyrightYears(<year of HEAD's commit>)` from `src/config/brand.ts` — "2026", then "2026-2027" from the first commit of 2027. The commit year rather than the clock keeps old commits green; `npm run update:copyright` rewrites the three files. The `/legal` pages' footer uses the same helper at build time.
- **Wrangler dry run** validates `wrangler.jsonc` and bundles the Worker exactly as Workers Builds will, without deploying.
- Every workflow declares least-privilege `permissions`, checks out with `persist-credentials: false`, and pins actions by commit SHA (Dependabot keeps the SHAs and version comments current). The exceptions are the actionlint Docker image (pinned by version tag) and the maintainer's own `poli0981/.github` reusable workflows (tracked at `main`, allowed in `.github/zizmor.yml`). CI, Security, Compliance and Rust cancel superseded runs through a `concurrency` group, except on `main`, where each commit's result is a record the release process reads back.

**Web deployment is not a GitHub workflow.** Cloudflare Workers Builds builds and deploys the Worker and `dist/` on every push to `main` (preview versions for other branches). The old `deploy-web.yml` (GitHub Pages) is gone; `pages-migration.yml` only serves the moving notice, which hands visitors the data their browser saved on the old address as a `_format: 2` backup file. See [HOSTING.md](HOSTING.md).

**Why these gates exist (v0.35.0).** Several gates were installed and configured long before they ran: `knip` had a `knip.json`, Prettier had a config and a `format` script. Turning them on found real problems at once — most notably that `tsconfig.json` covers only `src/`, so `tests/` and `scripts/` had never been type-checked, which hid three fields missing from the editor → engine parity fixture.

## 6. Testing Strategy

Vitest runs `tests/**/*.test.{ts,tsx}` and `src/**/*.test.{ts,tsx}` in the **node** environment, with `globals: true`: 930 tests in 48 files at v1.0.0. Directories: `tests/engine`, `store`, `utils` (backup detect / sanitize / restore, quick entry, validation, the migration page), `worker` (router, cookie, Turnstile verdicts, headers, gate language), `build` (legal pages, web-only plugins), `config`, `hooks`, `i18n`, `scripts`. No test renders components: React Testing Library is installed but jsdom is not, so a rendering test would need both jsdom and a `// @vitest-environment jsdom` docblock.

Engine tests build a full `GeneratorInput` and pass a mock translator (`tests/helpers/mock-t.ts`) that reads the real `templates.json` files (en, vi, ja):

```typescript
// tests/engine/title-builder.test.ts
import { describe, it, expect } from "vitest";
import { buildTitle } from "@engine/title-builder";
import { createMockT } from "../helpers/mock-t";
import type { GeneratorInput } from "@engine/types";

function makeInput(overrides: Partial<GeneratorInput> = {}): GeneratorInput {
  return {
    videoType: "full",
    language: "en",
    genres: ["action"],
    gameName: "Elden Ring",
    channelName: "TestChannel",
    platform: "steam",
    spoilerWarning: false,
    matureWarning: false,
    storeLinks: {},
    social: {},
    rig: {},
    ...overrides,
  };
}

describe("buildTitle", () => {
  it("generates full gameplay title in English", () => {
    const t = createMockT("en");
    expect(buildTitle(makeInput(), t)).toBe("Elden Ring — Gameplay No Commentary");
  });

  it("generates part title with number", () => {
    const t = createMockT("en");
    const result = buildTitle(makeInput({ videoType: "part", partNumber: "5" }), t);
    expect(result).toBe("Elden Ring — Part 5 — Gameplay No Commentary");
  });
});
```

`npm run test:coverage` (what CI runs) measures `src/engine/**`, `worker/**` and `build-plugins/**` with V8 and fails below these thresholds — the engine is what the whole app trusts, the Worker is what guards the site:

| Scope                                     | Statements | Branches | Functions | Lines |
| ----------------------------------------- | ---------- | -------- | --------- | ----- |
| `src/engine/**`                           | 88 %       | 85 %     | 60 %      | 88 %  |
| `worker/**` (excluding `worker/index.ts`) | 95 %       | 85 %     | 95 %      | 95 %  |

Guard tests worth knowing: `tests/hooks/render-options-parity.test.ts` (settings → engine options), `tests/hooks/generator-input-mapping.test.ts` (editor → engine input), `tests/i18n/locale-registration.test.ts` (language registration in both directions), the genre/tag-pool sync in `tests/engine/tag-generator.test.ts`, and `tests/worker/headers.test.ts` (keeps the Worker's baseline headers in step with `public/_headers`). The Rust side has its own `cargo test` suite (name validation, path rejection, pruning, legacy recovery, dialog filters).

## 7. YouTube Character Limits Reference

| Field                              | Limit                                                                                    | When exceeded                   |
| ---------------------------------- | ---------------------------------------------------------------------------------------- | ------------------------------- |
| Title                              | 100 chars                                                                                | Studio won't save it            |
| Description                        | 5,000 chars                                                                              | Studio won't save it            |
| Tags (total)                       | 500 chars, counted YouTube's way: quotes around multi-word tags + one comma between tags | Studio won't save the tag list  |
| Single tag                         | 30 chars (`SINGLE_TAG_MAX`)                                                              | The generator drops longer tags |
| Hashtags in description            | 60 max, 3 shown                                                                          | First 3 shown above the title   |
| Playlist title                     | 150 chars                                                                                | Truncated                       |
| `<` or `>` in title or description | not allowed                                                                              | Studio rejects the text         |

### Enforcement (v1.0.0)

`renderAll` returns `warnings: CharLimitWarning[]` with one entry per field that is **strictly over** its limit (never at the 80 % counter threshold), so a warning is an exact "YouTube will reject this" signal. `src/engine/limits.ts` is the single derivation, shared by the Output page, Batch, the command palette and the Ctrl/⌘+Shift+C shortcut (`useOutputCopy`):

- `getOutputLimitStatus(output)` / `mergeLimitStatus(statuses)` — one output, or several merged (multi-language Copy All, Copy All Batch), keeping the worst offender per field.
- **Per field** (changed in v1.0.0 from all-or-nothing per output): `isFieldOver(status, field)` blocks copying only the field that is over (`useCopyGate` puts the reason in the button's tooltip); the other fields stay copyable.
- **Copy All** copies title + description, plus the tags when the `copyAllIncludesTags` setting is on (`copyAllText`); `isCopyAllBlocked(status, withTags)` blocks it when the title or description is over, or the tags when they are included.
- With the opt-in Strict Mode setting on, `useStrictBlock` blocks every copy while the editor has an error (a saved value that fails validation, or typed text that is invalid and therefore not saved).
- `fieldsWithForbiddenChars(output)` reports a title or description containing `<` or `>`; the Output page shows a warning for each (it does not block copying).

Deliberately not gated by `YT_LIMITS`: thumbnail text and the pinned comment (different surfaces), the Playlist tab (150-character title), and social captions (per-platform limits in `SOCIAL_PLATFORMS`).

## 8. Field Limits (v0.35.0)

`src/config/field-limits.ts` — caps on what can be _typed_, distinct from YouTube's caps on what is _generated_.

```typescript
export const FIELD_LIMITS = {
  URL: 200,
  EMAIL_FIELD: 320, // 3 addresses; RFC 5321 caps a single one at 254
  SHORT_NAME: 100,
  LABEL: 300,
  LONG_TEXT: 2000,
  TIMESTAMPS: YT_LIMITS.DESCRIPTION_MAX,
  NUMERIC: 10,
} as const;
```

Values are UTF-16 code units, matching the DOM `maxLength` attribute — an emoji costs 2. Grapheme counting would be more correct but cannot be enforced by the browser, and these are ceilings against absurd input, not a character budget.

`maxLength` only constrains typing and pasting, so `clampField` is applied in `normalizeEditorPatch` (via `PATCH_FIELD_LIMITS`) whenever a profile, preset or template is applied, and backup restore cuts every string to the same limits in `sanitize.ts`.
