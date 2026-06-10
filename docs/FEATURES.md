# Complete Feature List

## YTDescGen — All Features (Current + Planned)

---

## 🎬 Video Types (20 types)

Twenty video types, each driving a dedicated description template, title
structure, and tag bias. The complete table — every type with its icon and
the extra fields the editor reveals — is in
[Content Inventory](./CONTENT-INVENTORY.md).

## 🌐 Languages (6 shipped)

All six locales ship today — UI strings and description templates fully
translated and parity-validated by `npm run validate:locales`.

| Code | Language | Native Name | Status |
|------|----------|-------------|--------|
| `en` | English | English | ✅ Shipped |
| `vi` | Vietnamese | Tiếng Việt | ✅ Shipped |
| `ja` | Japanese | 日本語 | ✅ Shipped |
| `es` | Spanish | Español | ✅ Shipped |
| `ko` | Korean | 한국어 | ✅ Shipped |
| `zh` | Chinese (Simplified) | 简体中文 | ✅ Shipped |

Further locales (French, German, Portuguese, Russian, Thai, Arabic) are
tracked in [Roadmap § 5.3](./ROADMAP.md).

Each language requires:
- `ui.json` — UI labels, buttons, placeholders, error messages
- `templates.json` — Title patterns, description sections, CTA text

## 🎮 Game Genres (41 genres)

Forty-one genres feed the title format, the tag pool, and (when configured
in Settings → Genre Playlists) the pinned-comment playlist recommendation.
The complete list — with icons and bulk-select groups — is in
[Content Inventory](./CONTENT-INVENTORY.md).

## 🛒 Store Platforms (9 platforms)

| ID | Label | URL Prefix |
|----|-------|-----------|
| `steam` | Steam | `https://store.steampowered.com/app/` |
| `epic` | Epic Games Store | `https://store.epicgames.com/` |
| `ps` | PlayStation Store | `https://store.playstation.com/` |
| `xbox` | Xbox / Microsoft Store | `https://www.xbox.com/games/` |
| `nintendo` | Nintendo eShop | `https://www.nintendo.com/store/` |
| `gog` | GOG | `https://www.gog.com/game/` |
| `itchio` | itch.io | `https://itch.io/` |
| `humble` | Humble Bundle | `https://www.humblebundle.com/store/` |
| `amazon` | Amazon Luna | `https://www.amazon.com/luna/` |

## ☕ Social & Donate Links (12 fields)

### Donate
| ID | Label | Prefix |
|----|-------|--------|
| `kofi` | Ko-fi | `https://ko-fi.com/` |
| `patreon` | Patreon | `https://patreon.com/` |
| `buymeacoffee` | Buy Me a Coffee | `https://buymeacoffee.com/` |
| `paypal` | PayPal | `https://paypal.me/` |
| `streamlabs` | Streamlabs | `https://streamlabs.com/` |

### Social
| ID | Label | Prefix |
|----|-------|--------|
| `github` | GitHub | `https://github.com/` |
| `twitter` | Twitter / X | `https://x.com/` |
| `discord` | Discord | `https://discord.gg/` |
| `twitch` | Twitch | `https://twitch.tv/` |
| `tiktok` | TikTok | `https://tiktok.com/@` |
| `instagram` | Instagram | `https://instagram.com/` |
| `website` | Website | — |

## 💻 Rig Fields (8 fields)

| ID | Label | Example |
|----|-------|---------|
| `cpu` | CPU | Intel i9-14900K / AMD Ryzen 9 7950X |
| `gpu` | GPU | NVIDIA RTX 4090 / AMD RX 7900 XTX |
| `ram` | RAM | 32GB DDR5-6000 |
| `storage` | Storage | 2TB Samsung 990 PRO NVMe |
| `motherboard` | Motherboard | ASUS ROG Maximus Z790 |
| `monitor` | Monitor | LG 27GP950 27" 4K 144Hz |
| `capture` | Capture Software | OBS Studio 30.x |
| `controller` | Controller | DualSense / Xbox Elite Series 2 |

## 📄 Output Sections (Description Structure)

Mỗi ngôn ngữ có description structure như sau (tất cả sections optional):

```
1. Intro line (auto-generated from video type + game name)
2. No Commentary tagline
3. ─── Timestamps ─── (if provided)
4. ─── Store Links ─── (if any platform link provided)
5. ─── Video Settings ─── (resolution / FPS / graphics)
6. ─── My Rig ─── (if any rig field provided)
7. ─── Content Warnings ─── (if any selected — 248 IDs across 12 groups)
8. ─── Donate Links ─── (if any provided)
9. ─── Social Links ─── (if any provided)
10. ─── Playlist Link ─── (if provided)
11. ─── Contact Email ─── (if provided)
12. CTA line (Like / Subscribe / Share)
13. Hashtags (3 max, auto-generated)
```

## 🔁 Cross-Post Captions (Social tab)

A dedicated **Social** tab re-packages the same editor source that drives the
YouTube description into short-form captions for other platforms — no
re-typing. Each caption is derived live from the current form.

| Platform | Caption limit | Popular hashtags appended |
|----------|--------------|----------------------------|
| TikTok | 4,000 | `#fyp #foryou #foryoupage #gaming #gamingtiktok #gameplay #gamer` |
| Instagram Reels | 2,200 | `#reels #reelsinstagram #gaming #gamingreels #gamer #instagaming #videogames` |
| Facebook Reels | 2,200 | `#reels #facebookreels #fbreels #gaming #gameplay #gamingcommunity #videogames` |

Each caption pulls, in order: **Title** (quality badge suppressed for
short-form), **My Rig**, **Content Warnings**, **Thanks / sponsor credit**,
**Copyright**, and **hashtags** (game + primary genre + the curated
per-platform popular set, deduplicated case-insensitively).

- **Overflow handling** — when a caption exceeds the platform limit, optional
  blocks are dropped in priority order (warnings → copyright → thanks → rig).
  The title and the hashtag line are never dropped, and there is no
  mid-string truncation.
- **Single mode** — platform tabs with a live character counter and
  over-limit warning.
- **Bulk mode** — generate a part range (e.g. Parts 1–10) across selected
  languages in one pass, reusing the Batch loop.
- **Import / Export** — round-trip the generated captions as a typed JSON
  bundle (`_type: "social"`); import is display-only since captions are
  derived artifacts (the source round-trips via Profiles / Presets).

## 🏷 Tag Generation

### Tag Pools by Category

| Pool | Triggered By | Sample Output |
|------|-------------|---------------|
| Core | Always | `[game] gameplay`, `[game] no commentary`, `gameplay no commentary` |
| Genre | Genre selection | `horror game no commentary`, `RPG gameplay no commentary` |
| VideoType | Video type | `[game] boss fight`, `[game] speedrun`, `[game] all endings` |
| Platform | Platform field | `[game] PC`, `PC gameplay`, `[game] Steam` |
| Quality | Resolution/FPS | `[game] 4K`, `4K gameplay no commentary`, `[game] 4K 60FPS` |
| Multilingual JA | Always | `[game] ゲームプレイ`, `[game] 実況なし` |
| Multilingual VI | Always | `[game] gameplay không bình luận` |
| Multilingual ES | If ES enabled | `[game] sin comentarios`, `juego de acción` |
| Trending | Always | `[game] 2026`, `best [genre] games 2026` |

### Tag Pipeline
1. Collect tags from all applicable pools
2. Deduplicate (Set-based)
3. Priority sort (core first, trending last)
4. Trim to 500 character limit (drop lowest priority first)
5. Output as comma-separated string

## 💾 Data Persistence

### Profile (saved once, reused always)
```typescript
interface Profile {
  id: string;            // uuid
  name: string;          // "Main Channel"
  channelName: string;
  contactEmail: string;
  social: Record<string, string>;
  rig: Record<string, string>;
  resolution: string;
  fps: string;
  graphicsPreset: string;
  createdAt: string;
  updatedAt: string;
}
```

### Game Preset (saved per game, reused for all parts)
```typescript
interface GamePreset {
  id: string;
  gameName: string;
  gameNameLocalized?: Record<string, string>;
  genre: Genre;
  platform: string;
  storeLinks: Record<string, string>;
  spoilerWarning: boolean;
  matureWarning: boolean;
  createdAt: string;
}
```

### History Entry (auto-saved per generation)
```typescript
interface HistoryEntry {
  id: string;
  gameName: string;
  videoType: VideoType;
  language: SupportedLanguage;
  title: string;
  description: string;
  tags: string;
  createdAt: string;
}
```

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Enter` | Generate output (switch to Output tab) |
| `Ctrl+Shift+C` | Copy all (title + description + tags) |
| `Ctrl+Shift+T` | Copy title only |
| `Ctrl+Shift+D` | Copy description only |
| `Ctrl+Shift+G` | Copy tags only |
| `Ctrl+S` | Save current form as draft |
| `Ctrl+P` | Quick-switch profile |
| `Ctrl+/` | Show keyboard shortcuts |
| `Escape` | Close modal / clear selection |

## 🔧 Settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| Theme | dark / light | dark | App color theme |
| Default UI Language | SupportedLanguage | en | Language for app interface |
| Default Output Language | SupportedLanguage | en | Default language for generated output |
| Default Genre | Genre | action | Pre-selected genre on new session |
| Auto-save Draft | boolean | true | Auto-save form state to localStorage |
| Show Character Count | boolean | true | Display char counters on output |
| Compact Tag Display | boolean | false | Tags as comma list vs chip display |
| History Limit | number | 100 | Max history entries to keep |
| Include Multilingual Tags | boolean | true | Add JA/VI tags to tag output |
| Include Trending Tags | boolean | true | Add year-based trending tags |
| Hashtag Count | 1-3 | 3 | Number of hashtags to generate |

## 🖥 Desktop App Features (Tauri)

| Feature | Description |
|---------|-------------|
| System Tray | Minimize to tray, quick access |
| Native Clipboard | Direct clipboard write (no browser permission) |
| File Export | Save outputs as `.txt` / `.json` to file system |
| File Import | Import profiles/presets from JSON file |
| Auto-update | Tauri updater (check GitHub releases) |
| Offline | Full functionality without internet |
| Global Hotkey | System-wide hotkey to open app (optional) |

## 🔌 Future Extension Points

| Extension | Description | Effort |
|-----------|-------------|--------|
| VS Code Extension | Command palette → generate description | Medium |
| CLI Tool | `ytdesc generate --game "Elden Ring" --type full --lang en` | Low |
| Browser Extension | Right-click on YouTube Studio → auto-fill | High |
| YouTube API | Auto-apply description to video via API | High |
| Template Marketplace | Share/import community templates | Medium |
| AI Tag Suggestions | Use game name to suggest trending tags | Medium |
| Thumbnail Text | Generate text overlay suggestions for thumbnails | Low |
| Multi-channel | Support multiple YouTube channels per profile | Low |
