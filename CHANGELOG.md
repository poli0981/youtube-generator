# Changelog

All notable changes to YTDescGen ship as tagged releases on `main`.

## v0.8.1 — 2026-05-02

Patch release fixing a v0.8 regression in the genre-playlist suggestion feature.

### Fixed

- **Genre-playlist URL validator** ([#36](https://github.com/poli0981/youtube-generator/pull/36)) accepted only `https://www.youtube.com/playlist?list=…` with the literal `www.` subdomain and rejected any extra query parameters. Real share URLs from YouTube emit `https://youtube.com/…` (no `www.`) or `…&si=…` tracking params, both of which silently failed validation and the `ValidatedInput` component then wiped the entry from the settings store. Now accepts: optional `www.`, `list=…` at any position in the query string with sibling params before/after, and a trailing fragment. `watch?v=…` and `youtu.be/…` short URLs still rejected (path must be `/playlist`).

### Under the hood

- 4 new validation tests cover the relaxed regex (no-www, mixed query order, trailing fragment, `&si=` tracking suffix). Full suite: 253 tests green.

## v0.8.0 — 2026-05-02

Three-PR release covering graphics rebuild, livestream support, pinned-comment polish, and Vietnamese-specific donate fields. PRs that landed: [#32](https://github.com/poli0981/youtube-generator/pull/32) (phase 1), [#33](https://github.com/poli0981/youtube-generator/pull/33) (phase 2), [#34](https://github.com/poli0981/youtube-generator/pull/34) (polish), [#35](https://github.com/poli0981/youtube-generator/pull/35) (version bump).

### Added

- **Graphics Settings v2** — preset is now an enum (`Low` → `Extreme` + `Custom`) instead of free-form text, default `Medium`. New multi-select **Ray Tracing** modes (Ray Tracing / Full Ray Tracing / Path Tracing / Ray Reconstruction), **Frame Generation** vendor + multiplier (NVIDIA / AMD / Intel × x2 / x3 / x4 / x6), **Upscaling Quality** (DLSS / FSR / XeSS quality presets), **Art Style** dropdown, free-form **Driver / Game Version** field, and a **Skip-graphics toggle** for 2D / pixel-art / web games (auto-suggested when a `visual_novel` / `fmv` / `rhythm` genre is added). Description renders a labelled multi-line block: `Video: 1080p - 60 FPS` / `In-game Setting: Cinematic - NVIDIA Frame Generation x2 with Ray Tracing` / `Art Style: …` / `Version: …`.
- **Livestream** — new VideoType with `liveUrl` + `scheduledTime` extras. Title gets `🔴 LIVE` segment, description gets `🔴 LIVE on {{time}}` / `Watch / replay: {{link}}` block (locale-aware datetime via `Intl.DateTimeFormat`), tag pool gets `livestream` / `live gameplay` / `${gameName} live` / `${gameName} stream`, pinned-comment template gets a livestream-specific greeting.
- **Pinned-comment genre playlists** — Settings → Genre Playlists section configures one YouTube playlist URL per genre. When the new `pinnedCommentIncludeGenrePlaylist` toggle is on, the template auto-suggests `📺 More <genre> gameplay on the channel: <link>` for the video's primary genre.
- **Vietnamese donate** — five new editor fields (bank name, account number, account holder, MoMo, ZaloPay) in a new `VietnameseDonateEditor` component. Description block `🏦 CHUYỂN KHOẢN / VÍ ĐIỆN TỬ (Việt Nam)` only renders when output language is `vi`; bank line drops the parens when holder is empty; e-wallet lines render independently.
- **Mod List textarea** — new `modList` field exposed alongside `modName` for the `mods` videoType. Description gets a `🧩 MOD LIST` block right after MY RIG.
- **Publisher / Developer site** — 10th store-link platform with a permissive HTTPS pattern for indie / niche releases.
- **URL paste auto-extract** — pasting a Steam / itch.io / GOG URL into a store-link input auto-fills an empty Game Name with a 5s Undo toast. Other storefronts skipped because their URL slugs aren't stable.
- **YouTube playlist URL validator** — `validatePlaylistUrl` for the editor's playlist-link field and the new Genre Playlists settings. (Note: a regression in the strict regex shipped here; corrected in v0.8.1.)

### Fixed

- **Long-game-name tag bug** ([#32](https://github.com/poli0981/youtube-generator/pull/32)) — composite tags built from a long game name (`Tony Hawk's Pro Skater 1+2 Remastered: Definitive Edition`) used to silently disappear because they exceeded YouTube's 30-char per-tag limit. New `tagFriendlyGameName` helper strips trademark marks + edition qualifiers, then composes ≤21-char form for composite tags + bare ≤30-char form. The game name now always lands in the tag list.

### Changed

- **Editor store**: v4 → v5 (graphics enum + livestream + new fields, legacy `graphicsPreset` text mapped via `legacyGraphicsPresetToEnum`); v5 → v6 (additive — VN donate fields + modList).
- **Settings store**: v6 → v7 (additive — `genrePlaylists` map + the new pinned-comment toggle).
- **TemplateSnapshot** — extended to capture the v0.7 phase 2 fields that had been missing (`playthroughStatus`, `difficulty`, `difficultyCustomLabel`, `contentWarnings`) plus all v0.8 fields. Saving a template now preserves full editor state.
- **Video Settings description block** — was a single pipe-separated line `1080p | 60 FPS | Cinematic Setting - …`, now multi-line with explicit labels matching the rig + timestamps shape.

### Under the hood

- New `src/config/graphics-settings.ts` houses every graphics-related enum + the `GENRES_WITHOUT_GRAPHICS_SETTINGS` allowlist for the auto-suggest hint.
- New `src/utils/url-extractors.ts` implements Steam / itch.io / GOG slug extraction with a shared `titleCase` helper.
- Brand-name table (`VENDOR_GFX_BRANDS`) is engine-internal and English-only across locales (DLSS / FSR / XeSS preserved verbatim for SEO).
- All 6 locales updated: 391 ui + 164 template keys each. Vietnamese fully translated; ja / es / ko / zh seeded with English defaults for the new strings.
- Full suite: 249 tests green; main bundle 239 KB.

### Migration notes

- No manual action required. First launch after upgrade heals any missing keys in place.
- Pre-v0.8 free-form `graphicsPreset` text values map automatically: known labels ("Ultra", "Very High", …) become enum values; anything else lands in the new Custom slot ("Epic" → `graphicsPreset: "custom"` + `graphicsPresetCustom: "Epic"`).
- Existing `Profile` and `TemplateSnapshot` shapes are TS-extended to the v0.8 enum types; legacy on-disk values round-trip via `normalizeEditorPatch` on `loadProfile` / `loadPreset`.

## v0.7.0 — 2026-04-24

Two-phase release. Phase 1 landed as [#30](https://github.com/poli0981/youtube-generator/pull/30); this entry is cumulative across both phases.

### Added

- **Title format settings** (phase 1): configure where the quality badge sits (`prefix` / `middle` / `suffix`), which separator joins the segments (`—` / `-` / `:` / `|`), and the badge case (`2K` / `2k`). Defaults reproduce v0.6 output byte-for-byte. Setting the trio to `prefix` + `hyphen` + `lower` produces e.g. `[2k] - Elden Ring - phần 1 - Gameplay No Commentary`.
- **Settings page reorganized** (phase 1) from 5 → 7 sections: Appearance, Language & Defaults, Editor, **Title**, **Description**, Tags, History.
- **Content Details** (phase 2): three new editor fields for framing a run.
  - `Playthrough status` — Blind / Replay / New Game+ / Post-game. Renders a `🎯 Playthrough: …` line right after the intro.
  - `Difficulty` — Easy / Normal / Hard / Nightmare / Custom. Custom reveals a free-form label so game-specific names like "Lethal" or "NG+7" survive a locale switch unchanged.
  - `Content warnings` — multi-select chips for Flashing lights / Loud noises / Jump scares. Renders a `⚠️ CONTENT WARNINGS` bulleted block between spoiler and mature warnings.
- **Pinned-comment template system** (phase 2): opt-in Settings toggle generates a ready-to-paste pinned comment per video. Per-video-type greetings (boss / ending / speedrun / …) sit atop four shared CTA lines (thanks / playlist / engage / ask-next-game). Shown as a third section on the Output page alongside the user's freeform pinned comment; Batch generates one per part per language with its own copy button.

### Changed

- **Settings store**: v4 → v6. Heal migration back-fills `titleFormat` (v4→v5) and the two pinned-comment toggles (v5→v6) with sensible defaults — upgrading from v0.6 requires no manual action.
- **Editor store**: v3 → v4. Heal migration back-fills `playthroughStatus`, `difficulty`, `difficultyCustomLabel`, and `contentWarnings` — existing drafts round-trip cleanly.
- **Shared `useCurrentGeneratorInput` hook**: the editor → `GeneratorInput` shape used to be copy-pasted across four call sites (two hooks + Batch + OutputExtras). Extracted into one hook; future input-field additions now touch one file instead of four.
- **`buildTitle` options bag**: third arg accepts either the legacy boolean (`showQualityBadge`) OR a full options object. Legacy callers (including `title-variants.ts`) don't need to change.

### Fixed

- `useMultilangOutput` was silently missing `showSponsorCredit` and the sponsor fields on its built `GeneratorInput`, so multi-language output hid the sponsor credit line even when the setting was on. Fixed while threading the new `titleFormat` options through.

### Under the hood

- `engine/types.ts` gained `TitleFormatConfig`, `PlaythroughStatus`, `DifficultyLevel`, `ContentWarning` + the const-tuple ID registries that back them. Engine stays pure; `store/settings-heal.ts` re-exports.
- New pure module `engine/pinned-comment-builder.ts` (10 unit tests).
- Description builder gained 9 new cases; title builder has 10 new options-bag cases; settings-heal has 5 new migration cases. Full suite: 175 tests green.
- All 6 locales (`en`, `vi`, `ja`, `es`, `ko`, `zh`) now in sync at 314 UI + 125 template keys each.

### Migration notes

- No manual action required. First launch after upgrade heals any missing keys in place.
- If you've been hand-editing `settings.json` or `ytdescgen-editor-draft.json`, the new optional fields will be back-filled to sensible defaults (playthrough/difficulty default to `"none"` → section is skipped; content warnings default to `[]`; pinned-comment template defaults to off).
