# Complete Feature List

## YTDescGen — All Features (Current + Planned)

---

## 🎬 Video Types (14 types)

| ID | Label (EN) | Label (VI) | Label (JA) | Extra Fields |
|----|-----------|------------|------------|--------------|
| `full` | Full Gameplay | Full Gameplay | フルゲームプレイ | — |
| `part` | Gameplay Part | Gameplay Phần | ゲームプレイ パート | `partNumber` |
| `boss` | Boss Fight | Boss Fight | ボス戦 | `bossName` |
| `boss_nohit` | Boss No Hit | Boss No Hit | ボス ノーヒット | `bossName` |
| `ending` | Ending / All Endings | Kết thúc | エンディング | — |
| `speedrun` | Speedrun | Speedrun | スピードラン | — |
| `100percent` | 100% Completion | 100% Completion | 100%クリア | — |
| `dlc` | DLC Content | Nội dung DLC | DLCコンテンツ | `dlcName` |
| `newgame_plus` | New Game+ | New Game+ | 強くてニューゲーム | — |
| `challenge` | Challenge Run | Challenge Run | チャレンジラン | `challengeName` |
| `side_quest` | Side Quests | Nhiệm vụ phụ | サブクエスト | — |
| `secret` | Secrets / Hidden | Bí mật | 隠し要素 | — |
| `comparison` | Graphics Comparison | So sánh đồ họa | グラフィック比較 | — |
| `guide` | Silent Guide | Hướng dẫn | 攻略ガイド | — |

## 🌐 Languages (12 languages)

### Launch (Phase 1)
| Code | Language | Native Name | Status |
|------|----------|-------------|--------|
| `en` | English | English | ✅ Ready |
| `vi` | Vietnamese | Tiếng Việt | ✅ Ready |
| `ja` | Japanese | 日本語 | ✅ Ready |

### Phase 2
| Code | Language | Native Name |
|------|----------|-------------|
| `es` | Spanish | Español |
| `ko` | Korean | 한국어 |
| `zh` | Chinese (Simplified) | 简体中文 |

### Phase 3+
| Code | Language | Native Name |
|------|----------|-------------|
| `fr` | French | Français |
| `de` | German | Deutsch |
| `pt` | Portuguese | Português |
| `ru` | Russian | Русский |
| `th` | Thai | ภาษาไทย |
| `ar` | Arabic | العربية |

Each language requires:
- `ui.json` — UI labels, buttons, placeholders, error messages
- `templates.json` — Title patterns, description sections, CTA text

## 🎮 Game Genres (25 genres)

| ID | Label | Icon | Tag Keywords (sample) |
|----|-------|------|-----------------------|
| `action` | Action / Adventure | ⚔️ | action game, hack and slash, action adventure |
| `horror` | Horror / Survival | 👻 | horror game, survival horror, scary game, psychological horror |
| `rpg` | RPG / JRPG | 🛡 | RPG, JRPG, action RPG, turn based RPG |
| `fps` | FPS / Shooter | 🔫 | FPS, shooter, tactical shooter, third person shooter |
| `openworld` | Open World / Sandbox | 🌍 | open world, sandbox, free roam, exploration |
| `indie` | Indie / Platformer | 🕹 | indie game, platformer, pixel art |
| `soulslike` | Souls-like | 💀 | souls like, soulsborne, boss fight, no death run |
| `racing` | Racing / Sports | 🏎 | racing game, driving sim, sports game |
| `story` | Story / Visual Novel | 📖 | story game, visual novel, narrative game, interactive drama |
| `simulation` | Simulation / Strategy | 🏗 | simulation, city builder, management, tycoon |
| `fighting` | Fighting | 🥊 | fighting game, combo, versus, arcade |
| `stealth` | Stealth / Espionage | 🥷 | stealth game, stealth gameplay, infiltration |
| `survival_craft` | Survival / Crafting | 🏕 | survival game, crafting, base building |
| `mmo` | MMO / Online | 🌐 | MMO, MMORPG, online game, multiplayer |
| `rhythm` | Rhythm / Music | 🎵 | rhythm game, music game, beat game |
| `puzzle` | Puzzle | 🧩 | puzzle game, brain teaser, logic game |
| `roguelike` | Roguelike / Roguelite | 🎲 | roguelike, roguelite, procedural, permadeath |
| `metroidvania` | Metroidvania | 🗺 | metroidvania, exploration, ability unlock |
| `tower_defense` | Tower Defense | 🏰 | tower defense, TD game, strategy |
| `card_game` | Card / Deck Builder | 🃏 | card game, deck builder, TCG |
| `battle_royale` | Battle Royale | 🏆 | battle royale, last man standing, BR |
| `crpg` | CRPG / Isometric | 📜 | CRPG, isometric RPG, classic RPG |
| `tactical` | Tactical / Turn-based | ♟ | tactical, turn based strategy, XCOM-like |
| `space` | Space / Sci-Fi | 🚀 | space game, sci-fi, space exploration |
| `farming` | Farming / Life Sim | 🌾 | farming sim, life sim, cozy game |

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
7. ─── Spoiler Warning ─── (if toggled)
8. ─── 18+ Warning ─── (if toggled)
9. ─── Donate Links ─── (if any provided)
10. ─── Social Links ─── (if any provided)
11. ─── Playlist Link ─── (if provided)
12. ─── Contact Email ─── (if provided)
13. CTA line (Like / Subscribe / Share)
14. Hashtags (3 max, auto-generated)
```

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
