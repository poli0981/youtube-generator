# Complete Feature List

## YTDescGen — All Features (v1.0.0 + Planned)

---

## 🌍 Where It Runs

| Platform    | Where                                                                                               | Bot check & analytics                                                                                       |
| ----------- | --------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| **Web**     | [ytgenerator.stream](https://ytgenerator.stream)                                                    | A Cloudflare **Turnstile** check (usually invisible), remembered for 24 hours; **cookieless** Web Analytics |
| **Desktop** | Windows, macOS, Linux — [Releases](https://github.com/poli0981/youtube-generator/releases)          | Neither                                                                                                     |
| **Android** | Android 11+, sideloaded `.apk` — [Releases](https://github.com/poli0981/youtube-generator/releases) | Neither                                                                                                     |

The web app is a Cloudflare Worker in front of the static build, and
Cloudflare Workers Builds deploys every merge to `main` — see
[HOSTING.md](./HOSTING.md). On every platform your data stays on the device.

GitHub Pages is retired. Until **2026-11-29** the old
`poli0981.github.io/youtube-generator` address shows a moving notice whose
**Download my data** button saves what the browser stored there as a backup
file — restore it in **Settings › Backup & restore**.

## 🎬 Video Types (20 types)

Twenty video types, each driving a dedicated description template, title
structure, and tag bias. The complete table — every type with its icon and
the extra fields the editor reveals — is in
[Content Inventory](./CONTENT-INVENTORY.md).

## 🌐 Languages (8 shipped)

All eight locales ship today — UI strings and description templates fully
translated and parity-validated by `npm run validate:locales`.

| Code    | Language             | Native Name      | Status     |
| ------- | -------------------- | ---------------- | ---------- |
| `en`    | English              | English          | ✅ Shipped |
| `vi`    | Vietnamese           | Tiếng Việt       | ✅ Shipped |
| `ja`    | Japanese             | 日本語           | ✅ Shipped |
| `es`    | Spanish              | Español          | ✅ Shipped |
| `ko`    | Korean               | 한국어           | ✅ Shipped |
| `zh`    | Chinese (Simplified) | 简体中文         | ✅ Shipped |
| `pt-BR` | Portuguese (Brazil)  | Português (BR)   | ✅ Shipped |
| `id`    | Indonesian           | Bahasa Indonesia | ✅ Shipped |

The interface language and the output language are chosen separately. The
Output page, Batch and Social can render several output languages at once.
Japanese, Spanish, Korean, Chinese, Portuguese and Indonesian are
AI-translated — see [DISCLAIMER.md](../DISCLAIMER.md).

Further locales (French, German, Russian, Thai, Arabic) are tracked in
[Roadmap § 5.3](./ROADMAP.md). Arabic additionally needs RTL layout work —
see [I18N.md](./I18N.md).

Each language requires:

- `ui.json` — UI labels, buttons, placeholders, error messages
- `templates.json` — everything the engine writes: title patterns, description blocks, rig labels, timestamp keywords, pinned comments, CTA text

## 🎮 Game Genres (42 genres)

Forty-two genres feed the title format, the tag pool, and (when configured
in Settings → Genre Playlists) the pinned-comment playlist recommendation.
A video takes up to **3** genres, picked from a searchable list or with the
All RPGs / All Shooters / All Horror shortcuts. The complete list — with
icons and bulk-select groups — is in [Content Inventory](./CONTENT-INVENTORY.md).

## 🛒 Store Platforms (15 stores + publisher site)

| ID           | Label                      | URL Prefix                                       | Name in tags    |
| ------------ | -------------------------- | ------------------------------------------------ | --------------- |
| `steam`      | Steam                      | `https://store.steampowered.com/app/`            | Steam           |
| `epic`       | Epic Games Store           | `https://store.epicgames.com/`                   | Epic Games      |
| `ps`         | PlayStation Store          | `https://store.playstation.com/`                 | PlayStation     |
| `xbox`       | Xbox / Microsoft Store     | `https://www.xbox.com/games/`                    | Xbox            |
| `nintendo`   | Nintendo eShop             | `https://www.nintendo.com/store/`                | Nintendo Switch |
| `gog`        | GOG                        | `https://www.gog.com/game/`                      | GOG             |
| `itchio`     | itch.io                    | `https://<dev>.itch.io/<game>`                   | itch.io         |
| `humble`     | Humble Bundle              | `https://www.humblebundle.com/store/`            | Humble Bundle   |
| `amazon`     | Amazon Luna                | `https://luna.amazon.com/game/`                  | Amazon Luna     |
| `ea`         | EA app                     | `https://www.ea.com/games/`                      | EA app          |
| `ubisoft`    | Ubisoft Store              | `https://store.ubisoft.com/`                     | Ubisoft Connect |
| `battlenet`  | Battle.net                 | `https://shop.battle.net/`                       | Battle.net      |
| `googleplay` | Google Play                | `https://play.google.com/store/apps/details?id=` | Android         |
| `appstore`   | App Store                  | `https://apps.apple.com/app/`                    | iOS             |
| `meta`       | Meta Quest Store           | `https://www.meta.com/experiences/`              | Meta Quest      |
| `publisher`  | Publisher / Developer site | any `https://` link                              | —               |

EA app, Ubisoft, Battle.net, Google Play, App Store and Meta Quest are new in
v1.0.0. Validation accepts the variants people actually paste (Steam `/sub/`,
`/bundle/` and `s.team` links, regional Nintendo sites, `www.`-less hosts);
Steam links lose their tracking parameters. Each link is marked **paid**,
**free** or **demo**, and the store block's heading switches to "DOWNLOAD THE
GAME" when most links are free or demos.

## ☕ Social & Donate Links (22 fields)

### Donate (5)

| ID             | Label           | Prefix                      |
| -------------- | --------------- | --------------------------- |
| `kofi`         | Ko-fi           | `https://ko-fi.com/`        |
| `patreon`      | Patreon         | `https://patreon.com/`      |
| `buymeacoffee` | Buy Me a Coffee | `https://buymeacoffee.com/` |
| `paypal`       | PayPal          | `https://paypal.me/`        |
| `streamlabs`   | Streamlabs      | `https://streamlabs.com/`   |

### Social (17)

| ID          | Label         | Prefix                            |
| ----------- | ------------- | --------------------------------- |
| `github`    | GitHub        | `https://github.com/`             |
| `youtube`   | YouTube       | `https://www.youtube.com/`        |
| `twitter`   | X (Twitter)   | `https://x.com/`                  |
| `discord`   | Discord       | `https://discord.gg/`             |
| `twitch`    | Twitch        | `https://twitch.tv/`              |
| `kick`      | Kick          | `https://kick.com/`               |
| `tiktok`    | TikTok        | `https://tiktok.com/@`            |
| `instagram` | Instagram     | `https://instagram.com/`          |
| `threads`   | Threads       | `https://www.threads.com/@`       |
| `bluesky`   | Bluesky       | `https://bsky.app/profile/`       |
| `mastodon`  | Mastodon      | — (full URL including the server) |
| `facebook`  | Facebook      | `https://facebook.com/`           |
| `fb_page`   | Facebook Page | `https://facebook.com/`           |
| `reddit`    | Reddit        | `https://www.reddit.com/`         |
| `bilibili`  | Bilibili      | `https://space.bilibili.com/`     |
| `telegram`  | Telegram      | `https://t.me/`                   |
| `website`   | Website       | —                                 |

YouTube, Threads, Kick, Reddit and Bilibili are new in v1.0.0; "Twitter / X"
is now "X (Twitter)" (same `twitter` id, so saved links still load).

### Community & Vietnam

- **Community** block — Messenger community, Signal group, Instagram group chat
  and Facebook Group links for every language; a Zalo group link for
  Vietnamese output only.
- **Donate (Vietnam)** — bank transfer (a list of 37 Vietnamese banks, or
  type your own), account number and holder, MoMo and ZaloPay. Rendered only
  when the output language is Vietnamese. v1.0.0 added MBV, VCBNeo, Vikki
  Bank, Cake by VPBank and Timo; a profile saved with OceanBank, CBBank or
  DongA Bank is offered the new name in one click.

## 💻 Rig Fields (10 fields)

Printed in this order, with labels in the output language.

| ID             | Label            | Input                                                       | Example                              |
| -------------- | ---------------- | ----------------------------------------------------------- | ------------------------------------ |
| `cpu`          | CPU              | Text with suggestions; names pasted from Windows are tidied | AMD Ryzen 7 9800X3D                  |
| `gpu`          | GPU              | Searchable catalog (below) or your own text                 | NVIDIA GeForce RTX 5080              |
| `ram`          | RAM              | Size + type (DDR, LPDDR) + speed                            | 32 GB DDR5-6000                      |
| `motherboard`  | Motherboard      | Text                                                        | ASUS ROG Strix X870E-E Gaming        |
| `storage`      | Storage          | Text                                                        | 2TB Samsung 990 PRO NVMe             |
| `os`           | Operating System | Windows / macOS / Linux + version or distro + edition       | Windows 11 Pro, Ubuntu 24.04 LTS     |
| `monitor`      | Monitor          | Text                                                        | LG 27GP950 27" 4K 144Hz              |
| `capture`      | Capture Software | Text                                                        | OBS Studio 31                        |
| `controller`   | Controller       | Text                                                        | DualSense / Xbox Wireless Controller |
| `video_editor` | Video Editor     | Dropdown + version                                          | DaVinci Resolve Studio 19.1          |

**GPU catalog (v1.0.0)** — 198 models in 29 groups: NVIDIA GeForce (desktop
and laptop), AMD Radeon (including integrated), Intel Arc and integrated,
Apple M1–M5 and handheld PCs, each printed under its official name ("NVIDIA
GeForce RTX 5080", "AMD Radeon RX 9070 XT", "Apple M4 Pro"). Cards that never
shipped are not listed. Values saved by older versions (Brand › Series ›
Model) are migrated.

## 📄 Output Sections (Description Structure)

Every block is optional and skipped when empty. In order:

```
 1. Intro line (video type + game; gacha quests have their own openings)
 2. Livestream link / scheduled time (Livestream only)
 3. Playthrough notes (run type, difficulty, endings shown, language patch, game version)
 4. No Commentary tagline
 5. ⏱ Timestamps (keywords translated into the output language)
 6. 🎮 Store links (heading depends on paid vs. free / demo links)
 7. © Game copyright line (opt-in)
 8. 🧪 Playtest / early access (when a playtest link is set)
 9. 🖥 Video settings (skipped for games without graphics settings)
10. 💻 My rig
11. 🧩 Mod list (Modded Gameplay only)
12. ⚠️ Content warnings (248 IDs across 12 groups)
13. Tech notes
14. Translation-quality note (opt-in; not for English or Vietnamese)
15. 🎁 Sponsor credit (opt-in)
16. 🤝 Sponsors & partners (opt-in)
17. 🎵 Music / sound
18. ☕ Donate links
19. 🏦 Bank transfer / e-wallet (Vietnamese output only)
20. 🔗 Social links
21. 💬 Community
22. ▶️ Playlist link
23. 📧 Contact email(s) — one line, or split by purpose
24. CTA line (Like / Subscribe / Share)
25. © Copyright line (on by default; needs a channel name)
26. 📋 Usage policy (opt-in)
27. Hashtags (1–3, auto-generated)
```

With one output language selected, the Output page shows content warnings,
tech notes and playthrough notes bilingually (English · output language)
unless the output is English; with several languages selected, each tab —
like each Batch row — stays in its own language. An empty channel name drops
the "on …" phrase from every sentence, in all eight languages.

The Output page also shows the thumbnail text, your pinned-comment draft and,
opt-in, a generated pinned-comment template.

## 🔁 Cross-Post Captions (Social tab)

A dedicated **Social** tab re-packages the same editor source that drives the
YouTube description into short-form captions for other platforms — no
re-typing. Each caption is derived live from the current form.

| Platform        | Caption limit                     | Hashtags | Popular hashtags appended                                                       |
| --------------- | --------------------------------- | -------- | ------------------------------------------------------------------------------- |
| TikTok          | 4,000                             | no cap   | `#fyp #foryou #foryoupage #gaming #gamingtiktok #gameplay #gamer`               |
| YouTube Shorts  | 5,000                             | up to 5  | `#shorts #gaming #gameplay`                                                     |
| Instagram Reels | 2,200                             | no cap   | `#reels #reelsinstagram #gaming #gamingreels #gamer #instagaming #videogames`   |
| Facebook Reels  | 2,200                             | no cap   | `#reels #facebookreels #fbreels #gaming #gameplay #gamingcommunity #videogames` |
| X               | 280, **counted the way X counts** | up to 3  | `#gaming`                                                                       |
| Threads         | 500                               | 1        | —                                                                               |
| Bluesky         | 300                               | up to 3  | `#gaming`                                                                       |

YouTube Shorts, X, Threads and Bluesky are new in v1.0.0. X's count weighs
CJK characters, Vietnamese letters with diacritics and emoji double.

Each caption pulls, in order: **Title** (quality badge suppressed for
short-form), **My Rig**, **Content Warnings**, **Thanks / sponsor credit**,
**Copyright**, and **hashtags** (game, `#GameplayNoCommentary`, primary genre,
then the platform's popular set — deduplicated case-insensitively and capped
per platform).

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

| Pool         | Triggered By                      | Sample Output                                                            |
| ------------ | --------------------------------- | ------------------------------------------------------------------------ |
| Game name    | Always                            | `[game]` (shortened to fit 30 characters)                                |
| Core         | Always, in the output language    | `[game] gameplay`, `[game] no commentary`, `gameplay no commentary`      |
| Genre        | Each selected genre               | `horror game no commentary`, `RPG gameplay no commentary`                |
| VideoType    | Video type                        | `[game] boss fight`, `[game] speedrun`, `[game] all endings`             |
| Platform     | Platform field                    | `[game] Steam`, `Steam gameplay`, `[game] Steam gameplay`                |
| Quality      | Resolution / FPS                  | `[game] 4K`, `4K gameplay no commentary`, `[game] 4K 60fps`              |
| Multilingual | Setting on — output language only | `[game] tiếng Việt` (vi), `[game] 日本語` (ja), `[game] en español` (es) |
| Trending     | Setting on                        | `[game] 2026`, `best horror games 2026`, `horror gameplay 2026`          |
| Publisher    | Publisher / developer set         | `[publisher]`                                                            |

### Tag Pipeline

1. Collect tags from all applicable pools, in the priority order above
2. Deduplicate case-insensitively; drop any tag over 30 characters
3. Fit to **500 characters the way YouTube counts them** — every tag, plus
   the quotes YouTube puts around a tag with a space, plus a comma between
   tags. A tag that doesn't fit is skipped and shorter ones after it are
   still tried (v1.0.0; the old count missed the quotes)
4. Output as comma-separated string

Game names are cleaned of characters YouTube splits tags on (`,` `;` `|`) and
of ™ / ® / ©.

## ⚡ Faster Data Entry (v1.0.0)

- **Quick start** — at the top of the editor, pick a **channel profile** and
  a **game preset** (both remembered). If that would replace fields you
  already filled, it asks first. "Update profile" / "Update preset" appears
  when the editor no longer matches them.
- **Next part** — same game, next part: the part number goes up by one and
  what belonged to the last video (boss, timestamps, endings, pinned comment,
  sponsor, …) is cleared.
- **New video, same game** — the same clean-up, without touching the part
  number. Applying a preset for another game clears those fields too.
- **Start over** — clears the game and video fields but keeps your channel
  (name, contact, social links, rig, donate and community links); the draft
  starts in your **Default Output Language**.
- **Paste a store link anywhere** — on the page, in the Game name field or in
  the wrong store's field: the link lands in the right store field, sets the
  platform when it's the game's first store link, and fills an empty Game
  name from the link ("Final Fantasy VII Remake").
- **Game-name suggestions** — the Game name field suggests names from your
  presets and history.
- **Title shapes** — the Output page's title alternatives (game first, video
  first, quality badge first); "Use this shape" saves one to the title
  format.
- **Batch** — Part or Demo part N…M (up to 100 parts) in several languages at
  once, continuing from the editor's part number.
- **Save to History** — Ctrl/⌘+S from any page.

Applying a profile, preset or template, Next part, New video, Start over and
a pasted store link can each be undone from the toast they show.

## 🖥 Interface (v1.0.0)

- **App shell** — a collapsible sidebar, a top bar with the output and
  interface languages, and on phones a bottom bar (Editor, Output, Batch,
  Profiles, More).
- **Command palette** (Ctrl/⌘+K) — go to any page or the Legal Center; copy
  the title, description, tags or everything; apply a saved profile, game
  preset or template; switch theme, interface language or output language;
  open the shortcuts, the wiki or a bug report.
- **Live preview** — the generated title, description and tags beside the
  editor form (a sheet on phones), with the same counters and copy rules as
  the Output page.
- **YouTube preview** (Output) — where search results cut the title (about
  70 characters) and what shows above "…more" (about the first 150
  characters of the description).
- **Chapter check** (Timestamps) — whether YouTube will show chapters (first
  timestamp at 0:00, at least 3, ascending, each at least 10 seconds long);
  **Tidy up** rewrites a pasted list as one `M:SS label` per line.
- **Pages** — Editor, Output, Batch, Social, Playlist; Profiles (profiles,
  game presets, templates), History; Settings, Logs, About; the Legal Center.
- Dark and light themes; animated icons follow the system's _reduce motion_;
  controls grow on touch screens.

## 💾 Data Persistence

Everything stays on the device: the browser's storage for
`ytgenerator.stream` on the web, the app's own storage on desktop and
Android. There is no account and no server-side copy.

| Item                          | What it holds                                                                                                                                                                                                                  | Where                   |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------- |
| **Profile** — the channel     | Channel name; contact emails (general, advertising, game keys); social and donate links; community links; Vietnamese bank / MoMo / ZaloPay details; rig; resolution, FPS and graphics preset; sponsors & partners text         | Profiles › Profiles     |
| **Game preset** — the game    | Game name (+ per-language names); genres; platform; store links and their type (paid / free / demo); publisher / developer; content warnings; language patch; game version; art style; "no graphics settings"; series playlist | Profiles › Game presets |
| **Template** — the whole form | Every editor field                                                                                                                                                                                                             | Profiles › Templates    |
| **History**                   | One entry per video — game, video type, language, genres, title, description, tags. Saving the same video again updates its entry (v1.0.0)                                                                                     | History                 |
| **Draft**                     | The editor form, saved as you type                                                                                                                                                                                             | —                       |

The field lists live in `src/config/library-fields.ts`. Profiles, presets and
templates export and import as JSON; History exports as **CSV** or JSON.
Backups and exports carry the date in their file names
(`ytdescgen-backup-2026-09-30.json`).

### Backup & restore (v1.0.0)

In **Settings › Backup & restore**:

- **Back up** everything — or chosen parts: profiles, game presets,
  templates, history, settings, the current draft — to one JSON file.
  Settings never carry your legal consent or which panels are open.
- **Restore** from a file, or drop the file on the section. Files from every
  earlier version are read (v0.15–v0.38 exports, pre-v0.15 arrays, the old
  desktop data file) and go through the same migrations the app runs on its
  own data.
- **Preview before anything changes**: each item is _new_, _already here_ or
  _different_. **Merge** adds what's new and, for items that differ, keeps
  the newer one or both; **Replace** makes each chosen section match the
  file. One step, with **Undo**.
- **Automatic backups (desktop)** — the newest ten in the app's data folder,
  written after the library changes and before every restore. Restore any of
  them from the same section, or **Back up now**.

## ⌨️ Keyboard Shortcuts

`Ctrl` on Windows / Linux / Android, `⌘` on a Mac — both work everywhere.

| Shortcut                     | Action                                                          |
| ---------------------------- | --------------------------------------------------------------- |
| `Ctrl/⌘+K`                   | Command palette                                                 |
| `Ctrl/⌘+Enter` or `Ctrl/⌘+G` | Generate (switch to Output)                                     |
| `Ctrl/⌘+Shift+C`             | Copy All — same limits and Strict Mode rules as the Output page |
| `Ctrl/⌘+S`                   | Save the current output to History                              |
| `Ctrl/⌘+B`                   | Collapse / expand the sidebar                                   |
| `Ctrl/⌘+/` or `?`            | Show keyboard shortcuts (`?` only outside text fields)          |
| `Escape`                     | Close modal                                                     |

## 🔧 Settings

| Setting                    | Type                            | Default          | Description                                                                        |
| -------------------------- | ------------------------------- | ---------------- | ---------------------------------------------------------------------------------- |
| Theme                      | dark / light                    | dark             | App color theme                                                                    |
| App Language               | SupportedLanguage               | browser-detected | Language of the interface                                                          |
| Default Output Language    | SupportedLanguage               | browser-detected | Language a new draft starts in (first run, Start over)                             |
| Show Character Count       | boolean                         | true             | Display char counters on output. **Does not** affect copy blocking                 |
| Compact Tag Display        | boolean                         | false            | Tags as comma list vs chip display                                                 |
| Copy All includes the tags | boolean                         | false            | v1.0.0. Copy All copies title, description, then tags                              |
| **Strict Mode**            | boolean                         | **false**        | v0.35.0. Blocks Generate / Copy / Export while any field has a hard error          |
| Show quality badge         | boolean                         | true             | `[2K 60FPS]`-style badge in the title when resolution or FPS is above the defaults |
| Title order                | game first / video first        | game first       | v1.0.0. "Hades — Part 3" or "Part 3 — Hades"                                       |
| Quality badge position     | prefix / middle / suffix        | middle           | Where the badge sits in the title                                                  |
| Segment separator          | em dash / hyphen / colon / pipe | em dash          | Characters come from each locale                                                   |
| Badge case                 | upper / lower                   | upper            | "2K" or "2k"                                                                       |
| Include Multilingual Tags  | boolean                         | true             | Add tags in the output language                                                    |
| Include Trending Tags      | boolean                         | true             | Add year-based trending tags                                                       |
| Hashtag Count              | 1-3                             | 3                | Number of hashtags to generate                                                     |
| Genre Playlists            | map                             | `{}`             | One playlist URL per genre (42), collapsed by default                              |
| History Limit              | 10–500                          | 100              | Max history entries to keep                                                        |
| Log Retention              | 1–90 days                       | 7                | Log files older than this are deleted at boot                                      |

"Browser-detected" means the browser's language when it is one of the eight,
otherwise English. `Default Genre` and `Auto-save Draft` were removed in
v0.22.0 and v0.3 respectively — the draft autosaves unconditionally, so the
toggle was dead. **Backup & restore** is the last section of the page.

### Description toggles

`showCopyright` · `showUsagePolicy` · `showSponsorCredit` · `showGameCopyright`
· `showThirdPartyAds` · `showTranslationQuality` · `splitContactEmail` ·
`showPinnedCommentTemplate` · `pinnedCommentIncludeAskNextGame` ·
`pinnedCommentIncludeGenrePlaylist`

On by default: `showCopyright` and `pinnedCommentIncludeAskNextGame`.

## 🛡 Guardrails

| Mechanism                      | Scope                                                                                                                                                                                                                                                                                                                                                                             |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Character limits**           | Title 100 / description 5,000 / tags 500 (tags counted the way YouTube counts them). Since v1.0.0 only the field that is over can't be copied; the others still can. Copy All is blocked when the title or description is over — or the tags, when Copy All includes them. In Batch an over-limit part blocks only its own field; Copy All Batch is blocked when any part is over |
| **Characters YouTube rejects** | The Output page warns when the title or description contains `<` or `>`                                                                                                                                                                                                                                                                                                           |
| **Field limits**               | Hard `maxLength` per category: URL 200, email 320, short name 100, label 300, long text 2,000, timestamps 5,000, numeric 10. Imported values are clamped too                                                                                                                                                                                                                      |
| **Strict Mode**                | Opt-in. Blocks Generate / Copy / Export on hard errors only; warnings (e.g. a working link on a non-standard prefix) never block. Log export is exempt                                                                                                                                                                                                                            |

Emails are capped at **three per field**, enforced on the increase so an
over-cap legacy value stays editable, and a domain without a TLD is rejected.
Invalid input is never committed to the store, so a malformed URL cannot
reach the generated description whether Strict Mode is on or off.

## 🖥 Desktop App Features (Tauri)

| Feature           | Description                                                                                                                                                                                          |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| System Tray       | One tray icon (the app icon) with Show / Quit; left-click shows the window; closing the window hides it to the tray                                                                                  |
| Single instance   | Launching the app again brings the running window forward                                                                                                                                            |
| Files             | Export and import through native Save / Open dialogs run from Rust — text formats only (`json`, `jsonl`, `txt`, `csv`, `md`), imports capped in size. The webview never handles a file path (v1.0.0) |
| Automatic backups | The newest ten in the app's data folder (see Backup & restore)                                                                                                                                       |
| Logs              | One log file per day in the app's data folder, pruned by Log Retention                                                                                                                               |
| Offline           | Full functionality without internet; no analytics, no Turnstile check                                                                                                                                |
| Window            | Resizable, 1280×820 by default                                                                                                                                                                       |
| Installer         | The Windows MSI / NSIS installers show the license page                                                                                                                                              |

There is no auto-updater yet — new versions come from
[Releases](https://github.com/poli0981/youtube-generator/releases).

## 📱 Android App (v0.29)

An installable, sideloadable `.apk` built from the same Tauri 2 codebase — no
separate mobile project. Build with `cargo tauri android build --apk`; see
[PACKAGING.md](./PACKAGING.md#android-apk-packaging).

| Feature       | Description                                                                                    |
| ------------- | ---------------------------------------------------------------------------------------------- |
| Same codebase | One Tauri 2 project produces web, desktop, and Android                                         |
| Min version   | Android 11+ (minSdk 30); `targetSdk` 36 (Android 16)                                           |
| Tested        | Android 11 → 16 (emulators); real device on Android 12                                         |
| Signed APK    | Self-signed release APK for sideloading; CI publishes it to GitHub Releases                    |
| Responsive UI | Bottom tab bar (Editor, Output, Batch, Profiles, More), touch-sized controls, safe-area insets |
| File export   | Routed through the WebView download (lands in Downloads) on Android                            |
| Persistence   | App-private storage; works offline                                                             |
| No tray       | Desktop-only tray / single-instance / automatic backups are left out                           |

## 🚦 Error Pages & Offline (v0.27)

A single reusable, fully-localized `ErrorPage` component (`src/components/errors/`)
backed by a pure kind→meta config (`src/config/error-pages.ts`). All copy ships
in all eight locales.

Routes are real paths on the web (`/403`) and hash routes in the desktop and
Android apps (`/#/403`). Old `/#/…` links on the web still work — they are
rewritten to the path form (v1.0.0).

| Kind             | Route               | Trigger                                                               |
| ---------------- | ------------------- | --------------------------------------------------------------------- |
| 404 Not found    | catch-all `*`       | A mistyped / dead route (live — was a blank screen before)            |
| 403 Forbidden    | `/403`              | Designed page, route-reachable for future triggers                    |
| 419 Expired      | `/419`              | Designed page, route-reachable for future triggers                    |
| 500 Server error | `/500`              | Designed page (covers 408/5xx), route-reachable for future triggers   |
| Offline          | `/offline` + banner | `navigator.onLine` flips false                                        |
| Runtime crash    | —                   | A render error caught by `ErrorBoundary` (shared `contained` variant) |

- **Full-screen, no shell** — dedicated error routes render outside `AppShell`
  (no Sidebar/Header), with Home / Back / (Reload) / Report-a-bug actions.
- **Non-blocking offline banner** — a dismissible bottom strip; the app stays
  fully usable offline, and a toast confirms when the connection returns.

## ⚖️ Legal & Consent (v0.28, reworked in v1.0.0)

A first-run **consent gate** (`src/components/ConsentGate.tsx`, backed by the
pure `src/config/legal.ts`) blocks the app until the user reviews the legal
documents and ticks one "I agree" checkbox.

| Aspect      | Behaviour                                                                                                                                                                                                                                                                                                                                                              |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Documents   | Terms of Use, Privacy Policy, Disclaimer, License (the four you agree to), plus Third-party notices, Security, Notice and Code of Conduct — rendered from the repository's files at build time into the in-app **Legal Center** (offline on desktop and Android; linked from the sidebar, About and the command palette). The Disclaimer also has a Vietnamese version |
| On the web  | The same documents are public pages at `/legal/<doc>` (e.g. `/legal/privacy`), readable before the Turnstile check                                                                                                                                                                                                                                                     |
| Acceptance  | One combined checkbox; Continue disabled until checked; each document opens in the Legal Center; language and theme can be changed on the gate                                                                                                                                                                                                                         |
| Persistence | `legalConsentVersion` + timestamp in the settings record. On the web, agreeing on the Turnstile page sets a `ytg_terms` cookie the app reads, so a web visitor sees one blocking screen, not two                                                                                                                                                                       |
| Re-prompt   | Version-based — only when `CURRENT_TERMS_VERSION` is raised (terms changed); also re-shows in fresh / incognito storage. Version **2** since v1.0.0 (Cloudflare hosting, Turnstile and Web Analytics in the Privacy Policy)                                                                                                                                            |
| Desktop     | Same in-app gate on Windows/macOS/Linux, **plus** a license-acceptance page in the Windows MSI/NSIS installer (`bundle.licenseFile`)                                                                                                                                                                                                                                   |
| Layout      | Full-screen, non-dismissible, theme- and locale-aware (all 8 languages)                                                                                                                                                                                                                                                                                                |

## 🔌 Future Extension Points

See [ROADMAP.md](./ROADMAP.md) for the post-1.0 backlog.

| Extension            | Description                                                 | Effort |
| -------------------- | ----------------------------------------------------------- | ------ |
| VS Code Extension    | Command palette → generate description                      | Medium |
| CLI Tool             | `ytdesc generate --game "Elden Ring" --type full --lang en` | Low    |
| Browser Extension    | Right-click on YouTube Studio → auto-fill                   | High   |
| YouTube API          | Auto-apply description to video via API                     | High   |
| Template Marketplace | Share/import community templates                            | Medium |
| AI Tag Suggestions   | Use game name to suggest trending tags                      | Medium |
| Thumbnail Text       | Generate text overlay suggestions for thumbnails            | Low    |
| Multi-channel        | Support multiple YouTube channels per profile               | Low    |
