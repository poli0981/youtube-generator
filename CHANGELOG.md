# Changelog

All notable changes to YTDescGen ship as tagged releases on `main`.

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
