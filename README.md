# 🎮 YTDescGen

**YouTube Gameplay Description Generator** — A template engine for Gameplay No Commentary channels.

Generate YouTube video titles, descriptions, and tags in multiple languages with one click.

## Features

- **14 video types** — Full Gameplay, Part, Boss Fight, Speedrun, 100%, DLC, and more
- **12 languages** — English, Vietnamese, Japanese, Spanish, Korean, Chinese, and more
- **25 game genres** — Action, Horror, RPG, FPS, Open World, Souls-like, and more
- **Profile system** — Save social/rig/channel info once, reuse forever
- **Game presets** — Save game info once, reuse for multi-part series
- **Smart tags** — Auto-generated from genre + platform + quality + multilingual
- **Character counters** — Real-time limits for title (100), description (5000), tags (500)
- **Batch mode** — Generate descriptions for multiple parts at once
- **Desktop app** — Windows & macOS via Tauri (~8MB binary)
- **Offline** — Full functionality without internet

## Quick Start

```bash
# Clone
git clone https://github.com/poli0981/yt-desc-gen.git
cd yt-desc-gen

# Install
npm install

# Dev
npm run dev

# Build
npm run build
```

## Tech Stack

React 18 • TypeScript • Vite • Tailwind CSS • Zustand • i18next • Tauri 2

## Documentation

| Document | Description |
|----------|-------------|
| [CLAUDE.md](./CLAUDE.md) | Claude Code instructions & project overview |
| [PRD](./docs/PRD.md) | Product Requirements Document |
| [Architecture](./docs/ARCHITECTURE.md) | Technical architecture & data flow |
| [Features](./docs/FEATURES.md) | Complete feature list |
| [Roadmap](./docs/ROADMAP.md) | Development phases & timeline |
| [Tech Spec](./docs/TECH-SPEC.md) | Implementation details & configs |
| [i18n Guide](./docs/I18N.md) | How to add new languages |
| [Packaging](./docs/PACKAGING.md) | Desktop app build guide |

## License

MIT
