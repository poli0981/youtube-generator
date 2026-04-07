# Technical Specifications

## YTDescGen — Implementation Details

---

## 1. Package Configuration

### package.json

```jsonc
{
  "name": "yt-desc-gen",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage",
    "lint": "eslint src/ --ext .ts,.tsx",
    "lint:fix": "eslint src/ --ext .ts,.tsx --fix",
    "typecheck": "tsc --noEmit",
    "format": "prettier --write \"src/**/*.{ts,tsx,json,css}\"",
    "validate:locales": "tsx scripts/validate-locales.ts",
    "generate:locale": "tsx scripts/generate-locale-template.ts",
    "tauri": "tauri",
    "tauri:dev": "tauri dev",
    "tauri:build": "tauri build"
  },
  "dependencies": {
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "react-router-dom": "^6.26.0",
    "zustand": "^4.5.0",
    "i18next": "^23.15.0",
    "react-i18next": "^15.0.0",
    "react-hot-toast": "^2.4.0",
    "lucide-react": "^0.400.0",
    "clsx": "^2.1.0"
  },
  "devDependencies": {
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.0",
    "typescript": "^5.5.0",
    "vite": "^5.4.0",
    "vitest": "^2.0.0",
    "@testing-library/react": "^16.0.0",
    "@testing-library/jest-dom": "^6.4.0",
    "tailwindcss": "^3.4.0",
    "postcss": "^8.4.0",
    "autoprefixer": "^10.4.0",
    "eslint": "^9.0.0",
    "@eslint/js": "^9.0.0",
    "typescript-eslint": "^8.0.0",
    "eslint-plugin-react-hooks": "^4.6.0",
    "prettier": "^3.3.0",
    "prettier-plugin-tailwindcss": "^0.6.0",
    "@tauri-apps/cli": "^2.0.0",
    "@tauri-apps/api": "^2.0.0",
    "tsx": "^4.16.0"
  }
}
```

### tsconfig.json

```jsonc
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

### vite.config.ts

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  base: "/yt-desc-gen/", // GitHub Pages
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@config": path.resolve(__dirname, "./src/config"),
      "@engine": path.resolve(__dirname, "./src/engine"),
      "@store": path.resolve(__dirname, "./src/store"),
      "@hooks": path.resolve(__dirname, "./src/hooks"),
      "@components": path.resolve(__dirname, "./src/components"),
      "@pages": path.resolve(__dirname, "./src/pages"),
      "@utils": path.resolve(__dirname, "./src/utils"),
      "@i18n": path.resolve(__dirname, "./src/i18n"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom"],
          router: ["react-router-dom"],
          i18n: ["i18next", "react-i18next"],
        },
      },
    },
  },
});
```

### tailwind.config.ts

```typescript
import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        surface: {
          0: "var(--surface-0)",    // deepest background
          1: "var(--surface-1)",    // card background
          2: "var(--surface-2)",    // elevated surface
          3: "var(--surface-3)",    // hover/active state
        },
        border: {
          DEFAULT: "var(--border)",
          strong: "var(--border-strong)",
        },
        text: {
          primary: "var(--text-primary)",
          secondary: "var(--text-secondary)",
          muted: "var(--text-muted)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          hover: "var(--accent-hover)",
          muted: "var(--accent-muted)",
        },
        success: "var(--success)",
        warning: "var(--warning)",
        danger: "var(--danger)",
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
        mono: ["var(--font-mono)"],
      },
    },
  },
  plugins: [],
} satisfies Config;
```

## 2. Core Engine Interfaces

```typescript
// src/engine/types.ts

export interface GeneratorInput {
  videoType: VideoType;
  language: SupportedLanguage;
  genre: Genre;
  gameName: string;
  gameNameLocalized?: Partial<Record<SupportedLanguage, string>>;
  channelName: string;
  platform: string;
  partNumber?: string;
  bossName?: string;
  dlcName?: string;
  challengeName?: string;
  resolution?: string;
  fps?: string;
  graphicsPreset?: string;
  timestamps?: string;
  playlistLink?: string;
  contactEmail?: string;
  spoilerWarning: boolean;
  matureWarning: boolean;
  storeLinks: Partial<Record<string, string>>;
  social: Partial<Record<string, string>>;
  rig: Partial<Record<string, string>>;
}

export interface GeneratorOutput {
  title: string;
  description: string;
  tags: string[];
  tagString: string;
  charCounts: {
    title: number;       // YouTube limit: 100
    description: number; // YouTube limit: 5000
    tags: number;        // YouTube limit: 500
  };
  warnings: CharLimitWarning[];
}

export interface CharLimitWarning {
  field: "title" | "description" | "tags";
  current: number;
  limit: number;
  message: string;
}

// YouTube official limits
export const YT_LIMITS = {
  TITLE_MAX: 100,
  DESCRIPTION_MAX: 5000,
  TAGS_MAX: 500,
  SINGLE_TAG_MAX: 30, // single tag character limit
  HASHTAG_MAX: 3,
} as const;
```

## 3. Zustand Store Pattern

```typescript
// src/store/editor-store.ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { GeneratorInput } from "@engine/types";
import { DEFAULTS } from "@config/defaults";

interface EditorState extends GeneratorInput {
  // Actions
  set: <K extends keyof GeneratorInput>(key: K, value: GeneratorInput[K]) => void;
  setNested: <G extends "storeLinks" | "social" | "rig">(
    group: G,
    key: string,
    value: string,
  ) => void;
  loadProfile: (profile: Partial<GeneratorInput>) => void;
  loadPreset: (preset: Partial<GeneratorInput>) => void;
  reset: () => void;
}

export const useEditorStore = create<EditorState>()(
  persist(
    (set) => ({
      ...DEFAULTS.editor,

      set: (key, value) => set({ [key]: value }),

      setNested: (group, key, value) =>
        set((state) => ({
          [group]: { ...state[group], [key]: value },
        })),

      loadProfile: (profile) => set((state) => ({ ...state, ...profile })),

      loadPreset: (preset) => set((state) => ({ ...state, ...preset })),

      reset: () => set(DEFAULTS.editor),
    }),
    {
      name: "ytdescgen-editor-draft",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => {
        // Exclude actions from persistence
        const { set: _s, setNested: _sn, loadProfile: _lp, loadPreset: _lpre, reset: _r, ...data } = state;
        return data;
      },
    },
  ),
);
```

## 4. GitHub Actions CI

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, dev]
  pull_request:
    branches: [main]

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run typecheck
      - run: npm run lint
      - run: npm run validate:locales
      - run: npm run test:run
      - run: npm run build
```

```yaml
# .github/workflows/deploy-web.yml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run build
      - uses: actions/configure-pages@v5
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist
      - id: deployment
        uses: actions/deploy-pages@v4
```

## 5. Testing Strategy

```typescript
// tests/engine/title-builder.test.ts
import { describe, it, expect } from "vitest";
import { buildTitle } from "@engine/title-builder";

describe("buildTitle", () => {
  it("generates full gameplay title in English", () => {
    const result = buildTitle({
      gameName: "Elden Ring",
      videoType: "full",
      language: "en",
    });
    expect(result).toBe("Elden Ring — Gameplay No Commentary");
  });

  it("generates part title with number", () => {
    const result = buildTitle({
      gameName: "Elden Ring",
      videoType: "part",
      partNumber: "5",
      language: "en",
    });
    expect(result).toBe("Elden Ring — Part 5 — Gameplay No Commentary");
  });

  it("generates boss title in Japanese", () => {
    const result = buildTitle({
      gameName: "エルデンリング",
      videoType: "boss",
      bossName: "マルギット",
      language: "ja",
    });
    expect(result).toBe("エルデンリング — マルギット ボス戦 — Gameplay No Commentary");
  });

  it("warns when title exceeds 100 characters", () => {
    // ... test char limit warning
  });
});
```

## 6. YouTube Character Limits Reference

| Field | Limit | Behavior When Exceeded |
|-------|-------|----------------------|
| Title | 100 chars | YouTube truncates with "..." |
| Description | 5,000 chars | YouTube silently truncates |
| Tags (total) | 500 chars | YouTube rejects all tags |
| Single Tag | 30 chars | YouTube rejects that tag |
| Hashtags in description | 60 max, 3 shown | First 3 shown above title |
| Playlist title | 150 chars | Truncated |
