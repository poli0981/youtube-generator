# Changelog

All notable changes to YTDescGen ship as tagged releases on `main`.

## v0.23.0 — 2026-05-27

Extends audience-protection coverage with eight VFX-intensity warnings
and unlocks the new OS Rig field (introduced in v0.22.0) for macOS and
Linux creators via a cascading dropdown that adapts its slot semantics
to the chosen OS family.

### Added

- **8 new VFX content warnings in the `photosensitive` group** ([src/engine/types.ts](src/engine/types.ts), [src/config/content-warning-groups.ts](src/config/content-warning-groups.ts)). New IDs: `lens_flare_intense`, `bloom_excessive`, `particle_effects_dense`, `screen_overlay_flashing`, `color_saturation_extreme`, `motion_blur_heavy`, `depth_of_field_aggressive`, `post_processing_intense`. Closes the gap between blanket `flashing_lights` / `strobe_effects` and the AAA / horror games that ship intense visual-effects passes (bloom, particles, lens flares, post-processing) without ever triggering a strobe-style flash. Total content warnings 187 → 195 across 10 groups (no new group; `photosensitive` 5 → 13). Purely additive — engine renders each warning automatically; existing profiles round-trip unchanged. Fully translated across all 6 locales (`ui.json` short labels + `templates.json` description phrases) with `_schema.json` updated.
- **macOS support in the OS Rig field** ([src/config/rig-fields.ts](src/config/rig-fields.ts) `MACOS_VERSION_OPTIONS`). 7 macOS major versions: `10` (Mojave era), `11 Big Sur`, `12 Monterey`, `13 Ventura`, `14 Sonoma`, `15 Sequoia`, `26 Tahoe`. The intentional 15 → 26 jump matches Apple's 2025 year-aligned marketing-number reset. Stored values carry the human label (e.g. `"macos|15 Sequoia|"`) so the description output reads as a single recognisable string. macOS has no Edition tier, so the third dropdown is hidden when macOS is selected.
- **Linux support in the OS Rig field** ([src/config/rig-fields.ts](src/config/rig-fields.ts) `LINUX_DISTRO_OPTIONS`, `LINUX_VERSION_BY_DISTRO`). 7 distros gameplay creators actually use via Proton: Ubuntu (`20.04 / 22.04 / 24.04 / 26.04 LTS`), Fedora (`40 / 41 / 42`), Debian (`12 Bookworm / 13 Trixie`), Arch (`rolling`), Manjaro (`latest`), Pop!_OS (`22.04 / 24.04 LTS`), Linux Mint (`21 / 22`). When Linux is selected the second slot re-labels to "Distro" and the third slot re-labels to "Version" with a per-distro option list — so Ubuntu's versions don't bleed into Fedora's dropdown.
- **Cascading composite dropdown** ([src/config/rig-fields.ts](src/config/rig-fields.ts) `CompositePart`, `resolveCompositeOptions`, `resolveCompositeLabelKey`). `CompositePart.options` widened from `RigFieldOption[]` to a union with `(previousParts) => RigFieldOption[]` so a part can resolve its option list from previously-selected siblings. New optional `labelKeyResolver` lets a single part swap its i18n key (Version / Distro), and `hiddenWhen` removes a part from both the editor form and the description output. RAM (the existing 2-part static composite) is unaffected — the union accepts arrays unchanged.
- **`editor.os_distro` locale key** across all 6 locales (`Distro` / `Distro` / `ディストリ` / `Distro` / `배포판` / `发行版`) — the new Linux-only second-slot label.

### Changed

- **Editor form resets downstream parts on parent change** ([src/components/editor/RigEditor.tsx](src/components/editor/RigEditor.tsx) `renderComposite`). When a user switches OS name from Windows to macOS, any previously-selected version / edition values are cleared so the form can't end up in an invalid state (e.g. `macOS 11 Pro`). The new `setPart` clears all indices `>` the changed one, so the cascading dropdown is always self-consistent.

### Under the hood

- Composite dropdown `formatRigValue` walks parts with a `previousValues` accumulator now, calls `hiddenWhen` first to skip hidden parts entirely (so they don't leak empty tokens into the joined output), then resolves the option list with the accumulator. Stored shapes are unchanged — v0.22.0's `"windows|11|pro"` round-trips byte-for-byte.
- 9 new tests in [tests/engine/rig-fields.test.ts](tests/engine/rig-fields.test.ts) (24 → 33): 7 OS cascading cases (macOS Sequoia / Tahoe, Linux Ubuntu / Arch / Fedora / Debian, hidden macOS edition fallback, Windows backward-compat guard), 1 empty-name fallback (degenerate input), 1 RAM regression check that confirms the static-array path still works after the union widening.
- Five manifests bumped 0.22.0 → 0.23.0 (`package.json`, `package-lock.json` root + self-reference, `src-tauri/Cargo.toml`, `src-tauri/tauri.conf.json`).
- Pre-release gates run green: lint, typecheck, validate:locales (12/12 files complete; 844 ui + 495 template keys per locale), 454 tests, build.

## v0.22.0 — 2026-05-27

Adds a dedicated **Audio / Sensory** content-warning group, introduces an
opt-in video-style era credit that combines with the rig's Video Editor
field, surfaces a structured **Operating System** dropdown in My Rig, and
drops two stale Settings/About items (Default Genre, Dev Environment).

### Added

- **12 new audio content warnings in a new `audio` group** ([src/engine/types.ts](src/engine/types.ts), [src/config/content-warning-groups.ts](src/config/content-warning-groups.ts)). Splits audio-sensitive triggers out of the `photosensitive` group where they never quite fit. New IDs: `ear_piercing`, `jumpscare_audio`, `sudden_volume_changes`, `distorted_audio`, `screeching_metallic`, `persistent_high_pitch`, `audio_glitches`, `heavy_bass_rumble`, `screaming_audio`, `glass_breaking_audio`, `microphone_pops`, `white_noise_static`. `loud_noises` migrated out of `photosensitive` into this group. Total content warnings 175 → 187 across 9 → 10 groups. Purely additive; engine renders each warning automatically. Fully translated across all 6 locales (`ui.json` short labels + `templates.json` description phrases) with `_schema.json` updated.
- **Video-style era toggle** ([src/config/video-styles.ts](src/config/video-styles.ts), [src/components/editor/VideoSettingsForm.tsx](src/components/editor/VideoSettingsForm.tsx), [src/engine/description-builder.ts](src/engine/description-builder.ts)). New per-video opt-in field `videoStyleEra` on `EditorData` — empty string sentinel for "off", 12 valid eras: `1980s`/`1990s`/`2000s`/`2010s`/`2020s` + `modern`/`cinematic`/`retro`/`vhs`/`film_noir`/`anime_mv`/`documentary`. When set, the description renderer emits a single line at the end of the Video Settings section combining the era with the rig's video editor: `"Edited in 1990s VHS style using DaVinci Resolve 19.1"`. Falls back to an editor-less template (`"Edited in 1990s VHS style"`) when `rig.video_editor` is empty. **Renders even when `skipGraphicsSettings` is on** — 2D / pixel-art creators still edit their footage, so the style credit survives as a standalone one-line section under the same header. New file exports `VIDEO_STYLE_ERAS` literal union + `isVideoStyleEra` type guard. Field shape mirrors the existing `artStyle` / `playthroughStatus` / `difficulty` per-video sentinels — no parallel boolean toggle.
- **Operating System field in My Rig** ([src/config/rig-fields.ts](src/config/rig-fields.ts) `OS_COMPOSITE`). New `composite_dropdown` entry at the top of `RIG_FIELDS` modelled on the existing RAM pattern. Three parts: name → version → edition. Stored as `"windows|11|pro"` → renders `"Windows 11 Pro"` via `formatRigValue`. Windows 10 / 11 + Home / Pro / Enterprise / Education / IoT Enterprise. Pre-v0.22 profiles with no `rig.os` key pass through the existing empty-value filter chain in `description-builder.ts` — no migration needed. New schema keys `editor.os_name`, `editor.os_version`, `editor.os_edition` + `rig.os` across 6 locales.

### Removed

- **Default Genre setting** ([src/pages/SettingsPage.tsx](src/pages/SettingsPage.tsx), [src/store/settings-heal.ts](src/store/settings-heal.ts), [src/store/settings-store.ts](src/store/settings-store.ts), [src/config/defaults.ts](src/config/defaults.ts)). The `ChipGroup` never wired through to the editor — orphan field. Removed UI, `SettingsData.defaultGenres`, `setDefaultGenres` action, `initialSettings.defaultGenres`, `SettingsDefaults.defaultGenres`, `DEFAULTS.settings.defaultGenres`, `extractData` entry, and the v1→v2 migration block in `healSettings` (replaced by a single `delete incoming.defaultGenres` + `delete incoming.defaultGenre` so persisted blobs don't leak the dead field). Two migration tests removed from `settings-heal.test.ts`. `settings.defaultGenre` key removed from 6 `ui.json` + `_schema.json`.
- **Dev Environment section from About** ([src/pages/AboutPage.tsx](src/pages/AboutPage.tsx), [src/config/about.ts](src/config/about.ts)). Hardcoded specs drift on every box upgrade. Removed the entire `<section>` block (~33 lines of JSX + `devEnvRows` constant), `Cpu`/`Monitor` icon imports, `ABOUT.pcSpecDocUrl` and `ABOUT.devEnvDocUrl`, and all `about.devEnvHeading` / `devEnvHelp` / `devEnv.{os,cpu,gpu,ram,ide,toolchains,fullSpecLink,fullDevEnvLink}` keys from 6 `ui.json` + `_schema.json` (10 keys per locale).

### Changed

- **`loud_noises` migrated from `photosensitive` to `audio`.** Sudden-volume / high-frequency triggers affect a different audience than strobe / motion-sickness triggers, so the group split is cleaner. Stored ID unchanged — existing profiles using `loud_noises` round-trip without any per-warning migration.

### Under the hood

- **Editor-store persist version 13 → 14.** Adds `videoStyleEra` field with defensive coercion: unknown / hand-edited / future-downgrade values are coerced back to `""` via the `isVideoStyleEra` type guard so the form `Select` never lands on a missing option. Additive — pre-v0.22 drafts round-trip through the migration with `videoStyleEra` defaulting to off.
- **`healSettings` strips both legacy keys.** Whether the persisted blob carries the v1 shape (`defaultGenre: string`) or the v2 shape (`defaultGenres: GenreId[]`), the heal step now deletes both before the final `{ ...initialSettings, ...incoming }` spread — guarantees the field never resurfaces.
- **B3 "Localize My Rig labels" was a phantom task.** Initial planning assumed the `rig.{cpu,gpu,ram,storage,monitor,capture,motherboard,controller,video_editor}` locale keys didn't exist anywhere; verification showed all 6 locales already had them with proper translations. Only the new `rig.os` key was actually missing — folded into the OS-field work.
- Five manifests bumped 0.21.0 → 0.22.0 (`package.json`, `package-lock.json` root + self-reference, `src-tauri/Cargo.toml`, `src-tauri/tauri.conf.json`).
- Pre-release gates run green: lint, typecheck, validate:locales (12/12 files complete; 835 ui + 487 template keys per locale), 445 tests (was 416 — +5 video-style line render cases in `description-builder.test.ts`, +6 OS composite cases in `rig-fields.test.ts`, –2 deleted default-genre migration tests, plus pre-existing growth), build.

## v0.21.0 — 2026-05-27

Reduces YouTube auto-flag risk on Vietnamese descriptions, adds twelve
method-specific death/violence warnings, rewords the channel copyright
line to disambiguate video content from game IP, and adds an opt-in
toggle for crediting the game's studio/publisher in the description.

### Added

- **12 new content warnings** ([src/engine/types.ts](src/engine/types.ts), [src/config/content-warning-groups.ts](src/config/content-warning-groups.ts)). Extends the **Sensitive** group with method-specific death/violence depictions that YouTube's auto-moderation flags harder than the umbrella `blood_gore` / `war_violence` labels: `hanging_depiction`, `drowning_depiction`, `burning_alive`, `asphyxiation_depiction`, `restraint_torture`, `public_execution`, `decapitation`, `impalement`, `mass_casualty_event`, `vehicular_violence`, `overdose_depiction`, `defenestration`. Total content warnings 175 → 187 across the existing 9 groups. Purely additive — engine renders each warning automatically; existing profiles round-trip unchanged. Fully translated across all 6 locales (`ui.json` short labels + `templates.json` description phrases) with `_schema.json` updated. VI labels follow the v0.21.0 censoring policy (see below).
- **Game-copyright toggle** ([src/store/settings-heal.ts](src/store/settings-heal.ts) `showGameCopyright`, [src/engine/description-builder.ts](src/engine/description-builder.ts) section 4.5, [src/pages/SettingsPage.tsx](src/pages/SettingsPage.tsx)). New Settings → Description toggle (default **off**) that, when enabled with a non-empty `pubDevName`, emits a `© {publisher}. All rights reserved.` line right after the Store Links block. Decoupled from the publisher store-URL — the credit renders based on the studio name alone. Used by creators covering games whose dev/publisher contractually requires attribution in the description. New i18n key `description.sections.gameCopyright` across all 6 locales; new UI keys `settings.showGameCopyright` + `settings.showGameCopyrightHint`. Persists in `GamePreset` so a series spanning many episodes hydrates the studio name + toggle together on preset apply.
- **`pubDevName` promoted to first-class field** ([src/components/editor/GameInfoForm.tsx](src/components/editor/GameInfoForm.tsx), [src/store/preset-store.ts](src/store/preset-store.ts) `GamePreset.pubDevName?`). Previously a side-label that only appeared under a non-empty Publisher store URL; now an always-visible "Studio / Publisher" input in Game Info that also drives the game-copyright section. Removed from [StoreLinkEditor.tsx](src/components/editor/StoreLinkEditor.tsx) lines 140–172. Optional in `GamePreset` so older presets hydrate without breaking.

### Changed

- **Channel copyright line reworded across 6 locales** ([src/i18n/locales/*/templates.json](src/i18n/locales/) `description.sections.copyright`). Old: `© {year} {channelName}. All rights reserved.` (one short line, ambiguous about whether the channel claims the game's IP). New: a 2–3 sentence disclaimer making explicit that the copyright applies only to the video recording, and that the game, characters, music, and related IP belong to their respective owners. Same `{{year}}` / `{{channelName}}` placeholders — no engine change. JA/KO/ZH now ship a proper localised translation instead of falling back to English.
- **VI censoring sweep — consistency + euphemism policy** ([src/i18n/locales/vi/ui.json](src/i18n/locales/vi/ui.json), [src/i18n/locales/vi/templates.json](src/i18n/locales/vi/templates.json)). The Vietnamese warning labels previously used asterisk censoring on some terms (`t* tử`, `b*o h*nh`, `g*ết người`) but left others uncensored (`Bạo lực liên quan chiến tranh`, `Bạo lực từ cảnh sát`) and had a malformed `b* ng*y h*i` for `child_harm`. Sweep unifies them under a 2-tier policy: asterisk for graphic verbs with no natural euphemism (`tự` → `t*`, `giết` → `g*ết`, `treo cổ` → `treo c*`, `bạo hành` → `b*o h*nh`), euphemism for words with a natural softer register (`bạo lực` → `tác động vật lý`, `nổ súng` → `khai hỏa`, `xử bắn` → `hành quyết`). Fixes `child_harm` to use the unambiguous euphemism `chịu tác động`. Proper nouns (game titles, character names) untouched. Goal is to reduce YouTube auto-flag risk on Vietnamese descriptions — purely a static i18n edit, no runtime utility.

### Under the hood

- Persist version unchanged — `showGameCopyright` is additive (`healSettings` back-fills via `{ ...initialSettings, ...incoming }`) and `pubDevName` / `showGameCopyright` on `GamePreset` are optional. No migration step needed.
- Description-builder section ordering: Store Links → **Game Copyright (new)** → Video Settings → … → Channel Copyright. The two `©` lines (channel + game) are intentional when both toggles are on; the Settings help text is explicit so creators don't mistake it for a bug.
- Three test fixtures updated for the new wording / censoring / settings shape ([tests/engine/description-builder.test.ts](tests/engine/description-builder.test.ts), [tests/store/settings-heal.test.ts](tests/store/settings-heal.test.ts)). 435 tests still green.
- Five manifests bumped 0.20.0 → 0.21.0 (`package.json`, `src-tauri/Cargo.toml`, `src-tauri/Cargo.lock` `yt-desc-gen` entry, `src-tauri/tauri.conf.json`).
- Pre-release gates run green: lint, typecheck, validate:locales (12/12 files complete, 814 ui + 461 template keys), 435 tests, build.

## v0.20.0 — 2026-05-23

Fifty new content-warning IDs across three thematic axes — political /
religion / war, social-psychological phenomena (autism, hikikomori,
parasocial, etc.), and weather-related phobias — plus a tag-engine fix
for game names containing comma / semicolon / pipe characters.

### Added

- **50 new content warnings** ([src/engine/types.ts](src/engine/types.ts), [src/config/content-warning-groups.ts](src/config/content-warning-groups.ts)). The **Phobias** group gains 10 weather-related fears — `homichlophobia` (fog), `lilapsophobia` (tornadoes / hurricanes), `ombrophobia` (heavy rain), `nephophobia` (clouds), `ancraophobia` (strong wind), `cryophobia` (extreme cold, distinct from `chionophobia`/snow), `heliophobia` (sunlight), `cymophobia` (large waves), `limnophobia` (lakes), `potamophobia` (rivers); 41 → 51. The **Sensitive** group gains 20 political / religious / war themes — `political_extremism`, `religious_extremism`, `genocide`, `holy_war`, `holocaust_themes`, `civil_war`, `mass_shooting`, `colonialism`, `propaganda`, `dystopian_state`, `conspiracy_theories`, `censorship_themes`, `ethnic_conflict`, `refugee_crisis`, `revolution_themes`, `assassination`, `coup_themes`, `inquisition`, `forced_labor`, `ultranationalism`; 29 → 49. A new **Social phenomena** group (inserted between *Mental health* and *Sensitive*) carries 20 psychological-social IDs that don't fit clinical mental-health framing — `autism_themes`, `adhd_themes`, `hikikomori`, `neet_themes`, `social_anxiety_themes`, `social_isolation`, `schizophrenia_themes`, `burnout_themes`, `survivor_guilt`, `abandonment_themes`, `parasocial_themes`, `gaslighting_themes`, `stockholm_syndrome`, `behavioral_addiction`, `existential_crisis`, `impostor_syndrome`, `midlife_crisis`, `quarter_life_crisis`, `workplace_harassment`, `masculinity_pressure`. Total content warnings 125 → 175 across 9 groups (was 8). Purely additive — engine renders each warning automatically; existing profiles / templates round-trip unchanged. Fully translated across all 6 locales (`ui.json` short labels + `templates.json` description phrases) with `_schema.json` updated.
- **1 new locale key × 6 locales**: `editor.contentWarningGroups.social_phenomena` (the new group's heading). Initial-collapse default set in [ContentWarningChecklist.tsx](src/components/editor/ContentWarningChecklist.tsx) so the 20-item group stays scannable until expanded.

### Fixed

- **Tag generator splitting at commas / semicolons / pipes in game names** ([src/engine/tag-generator.ts](src/engine/tag-generator.ts)). YouTube treats `,` as a tag delimiter, so a game title like `Hello, World` previously produced composite tags such as `Hello, World gameplay` that YouTube split into two broken tags (`Hello` + `World gameplay`). New `sanitizeForTag` helper strips `,` `;` `|` from the game name before it enters bare / composite tags and is also called inside `tagFriendlyGameName` (idempotent). Title / description / hashtag paths still read `input.gameName` verbatim — the original punctuation is preserved for human-facing copy, only the tag list is cleaned. Nine new test cases in [tests/engine/tag-generator.test.ts](tests/engine/tag-generator.test.ts) cover the comma / semicolon / pipe paths plus idempotence.

### Under the hood

- **Documentation count sweep.** `README.md` content-warning total bumped 125 → 175 and group count 8 → 9; `docs/CONTENT-INVENTORY.md` heading updated, three group sections regenerated (Phobias 41 → 51, Sensitive 29 → 49, new Social phenomena 20), Vietnamese mirror at `docs/i18n/vi/CONTENT-INVENTORY.md` kept in lock-step.
- Persist version unchanged — this release adds no new persisted fields. Existing `contentWarnings: ContentWarning[]` profiles widen the allowed enum but reject nothing.
- Five manifests bumped 0.19.0 → 0.20.0 (`package.json`, `package-lock.json` root + self-reference, `src-tauri/Cargo.toml`, `src-tauri/Cargo.lock` `yt-desc-gen` entry, `src-tauri/tauri.conf.json`).
- Pre-release gates run green: lint, typecheck, validate:locales (12/12 files complete), 435 tests, knip, build, `npm audit` (zero vulnerabilities).

## v0.19.0 — 2026-05-20

Twenty-eight new content-warning IDs (twenty-five clinical phobias plus
three discrimination themes) + a scroll-to-top button + a moderate-severity
security patch + a dead-code sweep backed by new `knip` tooling + a
documentation accuracy pass.

### Added

- **28 new content warnings** ([src/engine/types.ts](src/engine/types.ts), [src/config/content-warning-groups.ts](src/config/content-warning-groups.ts)). The **Phobias** group gains 25 clinically-recognised fears relevant to gameplay / horror content — automatonophobia (animatronics), megalophobia (giant objects), submechanophobia (submerged man-made objects), necrophobia, spectrophobia, demonophobia, selachophobia (sharks), mysophobia, emetophobia, scopophobia, monophobia, musophobia, chiroptophobia, ornithophobia, ichthyophobia, herpetophobia, katsaridaphobia, apiphobia, astraphobia, agoraphobia, enochlophobia, chionophobia, nosocomephobia, aichmophobia, pnigophobia — 16 → 41. The **Sensitive** group gains 3 bigotry-content warnings — `homophobia`, `transphobia`, `xenophobia` — placed next to `discrimination` / `hate_speech`. These are prejudices, not involuntary fear responses, so they are deliberately kept out of the Phobias group. Total content warnings 97 → 125. Purely additive — the engine auto-renders each warning, no persist migration. Fully translated across all 6 locales (`ui.json` short labels + `templates.json` description phrases) with `_schema.json` updated.
- **Scroll-to-top button** ([src/components/layout/ScrollToTopButton.tsx](src/components/layout/ScrollToTopButton.tsx)). A floating up-arrow fixed to the bottom-right of the viewport that fades in once the page is scrolled past 300 px and smooth-scrolls back on click. The scroll target is the `<main>` element — the app's real scroll container, not `window` — which `AppShell` now passes down as a ref. Honors `prefers-reduced-motion`, uses a 44 px touch target with a focus ring, sits at `z-40` so toasts render above it, and re-checks visibility on route change. New `common.scrollToTop` locale key across all 6 locales.
- **`knip` dead-code tooling** ([knip.json](knip.json) + `npm run knip`). Authoritative cross-file detection of unused files, exports, and dependencies — coverage TypeScript strict mode (in-file only) cannot provide. Configured so `scripts/` and `tests/` are recognised entry points.

### Fixed

- **`brace-expansion` moderate-severity DoS** ([advisory GHSA-jxxr-4gwj-5jf2](https://github.com/advisories/GHSA-jxxr-4gwj-5jf2)). `npm audit fix` bumped the transitive dependency (reached through `@typescript-eslint`) 5.0.5 → 5.0.6. A dev/lint-time dependency only — no effect on shipped web or desktop binaries. `npm audit` now reports zero vulnerabilities.

### Removed

- **Dead-code sweep** (knip-driven). Deleted the unused `use-debounce.ts` hook plus ~13 unreferenced exports across config / engine / store / utils (`findGpuSeries`, `formatSingleEndingForTitle`, `PlaylistOutput`, `loadFile`, `exportToJsonFile`, `importFromJsonFile`, `EnglishTranslationFn`, `PlatformId`, `SocialFieldId`, `SocialCategory`, `VietnameseBank`, `RigFieldId`, `SupportedLanguageId`). A further ~12 symbols were tightened from `export` to module-private and the settings layer's redundant type re-exports were trimmed. No behaviour change — all 426 tests still pass.

### Under the hood

- **Documentation accuracy pass.** `TECH-SPEC.md` package version (`0.1.0` → `0.19.0`) and CI Node version (`20` → `22`); `ROADMAP.md` corrected a never-built `TabBar` component reference to `Sidebar`; `FEATURES.md` video-type / genre / language counts refreshed, with the stale duplicate tables replaced by links to `CONTENT-INVENTORY.md` (the maintained source of truth); `CONTENT-INVENTORY.md` and its Vietnamese mirror updated for the new warning counts; `README.md` content-warning count corrected (91 → 125).
- Persist version unchanged — this release adds no new persisted fields.
- Five dependencies knip flagged as unused are intentionally kept and listed under `knip.json` `ignoreDependencies`: the three Tauri plugin packages cannot be safely verified without a desktop build, and `@testing-library/*` is documented test infrastructure.

## v0.18.0 — 2026-05-15

Vietnamese-bank dropdown for the donate form + two persistence-layer
bug fixes (UI language reverting to English after relaunch, Settings
export bundling unrelated stores) + one cleanup (Open Folder button
removed) + a new content-inventory documentation page (EN + VI).

### Added

- **Vietnamese bank dropdown** in `VietnameseDonateEditor` ([src/components/editor/VietnameseDonateEditor.tsx](src/components/editor/VietnameseDonateEditor.tsx), [src/config/vietnamese-banks.ts](src/config/vietnamese-banks.ts)). When the output language is Vietnamese, the "Bank name" field upgrades from a plain text input to a `<Select>` listing 30 of Vietnam's most-used banks (Big 4 state-owned + top 22 joint-stock commercial banks by retail presence + 4 foreign banks with the strongest Vietnam footprint). Sourced from the State Bank of Vietnam's 2026 register via [bankervn.com](https://bankervn.com/danh-sach-ngan-hang/). Picking "Khác (nhập tay)" reveals an inline text input so unlisted / digital-only / regional banks still work. Persisted shape is unchanged — `vnBankName` stays a plain string — so saved profiles and exports round-trip cleanly. When the output language is not Vietnamese, the field falls back to the legacy text input.
- **`docs/CONTENT-INVENTORY.md`** + **Vietnamese mirror** ([docs/i18n/vi/CONTENT-INVENTORY.md](docs/i18n/vi/CONTENT-INVENTORY.md)). Static, hand-maintained manifest of every video type (20), game genre (41), and content warning (96 across 8 groups) the editor surfaces. Linked from the main `README.md` Documentation table. Transparency aid for anyone evaluating the editor's coverage without reading source.
- **2 new locale keys × 6 locales**: `editor.vnBankNameSelectPlaceholder`, `editor.vnBankNameOther`. Localised for VI; left in English for JA/KO/ZH/ES to match the existing convention for VN-donate fields. Schema (`src/i18n/locales/_schema.json`) updated accordingly.

### Fixed

- **UI language reverts to English after app relaunch** ([src/App.tsx](src/App.tsx)). i18next initialises synchronously with `fallbackLng: "en"` while Zustand's persist middleware rehydrates `appLanguage` either synchronously (localStorage) or asynchronously (Tauri `settings.json`). Neither path bridged the persisted value back to i18n, so the UI rendered English even when the saved setting was Vietnamese / Japanese / etc. App.tsx now reads `appLanguage` at mount and calls `i18n.changeLanguage` once, then subscribes to subsequent store changes so the async Tauri rehydrate (and any future external mutation) propagate to i18n automatically.
- **Settings JSON export was a multi-store dump** ([src/pages/SettingsPage.tsx](src/pages/SettingsPage.tsx)). The pre-v0.18.0 "Export Settings" button copied the whole on-disk `settings.json` — which the storage adapter writes as a gross dump of every Zustand store (settings + profiles + presets + templates + history). The new exporter writes only the Settings data through `exportTypedToJsonFile("settings", …)` — the same envelope-typed flow the Profiles tab already uses. Importer is the matching `importParsedFromJsonFile` + `resolveForType("settings")` chain, with an explicit reject for the legacy multi-store dump (friendly toast instead of silent profile-store pollution). `extractData` was promoted from a private helper in `settings-store` to a named export for this. The IS_TAURI gate stays — surfacing the buttons on the web build is out of scope for this release.

### Removed

- **"Open Folder" button** in Settings → top bar ([src/pages/SettingsPage.tsx](src/pages/SettingsPage.tsx)). Niche utility — most users never opened the app-data folder, and Tauri-only meant web builds never saw it. The `ensure_dir` Tauri command stays in the Rust side for the export/import paths that still rely on it. ~25 LOC removed including the unused `FolderOpen` icon import.

### Under the hood

- `App.tsx` mount effect now subscribes to `useSettingsStore` for `appLanguage` changes — Header and SettingsPage still call `i18n.changeLanguage` directly when the user switches, which is now redundant but harmless. Cleanup deferred to a future PR.
- Persist version unchanged — this release adds no new persisted fields.
- Bundle: under the 500 KB cap. The bank list is a 33-entry static array, negligible weight; the new envelope flow is a net-negative on SettingsPage size (Tauri dialog + ensure_dir + read_from_file paths replaced with one browser-API call).

### Migration notes

- **Pre-v0.18.0 settings export files (multi-store dump)** are rejected with a friendly "Legacy export format from v0.17.x or earlier is no longer supported" toast on import. Re-export from v0.18.0+ to get a clean settings-only envelope file.
- **Profiles, presets, templates, history** export/import flows on the Profiles tab are unchanged. v0.17.x exports of those types still import unmodified.
- **Saved `vnBankName` values** that don't match any of the 30 preset banks auto-detect as "custom" on first render — the dropdown shows "Khác" and the inline text input is pre-filled with the saved value. No persisted data is lost.

## v0.17.1 — 2026-05-15

Per-video Output selector — closes the last deferred piece from the
v0.16 ending redesign. Multi-video ending playthroughs (case C) can
now flip between per-video previews of title / description / tags
without leaving the editor.

### Added

- **`endingVideoIndex` field on `EditorData`** (1-indexed, default 1). Stored on the editor (vs. recomputed per render) so the creator's pick survives navigating away and back. Engine already respected the corresponding `GeneratorInput.endingVideoIndex` since v0.17.0 — this just persists it.
- **"Preview video" Select dropdown** in `EndingsEditor` case C ([src/components/editor/EndingsEditor.tsx](src/components/editor/EndingsEditor.tsx)). Renders `endingVideoCount` options labelled `"Video N (X–Y)"` where X–Y are the matching ending-range bounds. Changing it pipes `endingVideoIndex` into the engine, which slices `endings[]` for both title (via `buildStructuredEndingLabel`) and description (via `sliceEndingsForVideo`).
- **"Previewing Video X of Y — Endings A–B" banner** at the top of the Output page when in case C ([src/pages/OutputPage.tsx](src/pages/OutputPage.tsx)). Persistent reminder so a creator flipping through videos doesn't forget which slice they're looking at.
- **3 new locale keys × 6 locales**: `editor.endings.videoIndexLabel`, `editor.endings.videoIndexHint`, `output.previewingVideo`. All 718/718 ui keys per locale (up from 715).

### Changed

- **`use-current-generator-input`** forwards `endingVideoIndex` only when `endingVideoCount > 1` — single-video mode passes `undefined` so the slice helpers short-circuit to "render the union", keeping the input cleaner for tests.
- **`EndingsEditor.setVideoCount`** now clamps `endingVideoIndex` down when the creator shrinks `endingVideoCount` (e.g. 6 → 2 with index = 4 → snaps to 2), so the preview never targets a non-existent video.
- **Persist version 12 → 13**. Additive — `endingVideoIndex` back-fills to 1 on first rehydrate; pre-v0.17.1 drafts with a stale higher index get clamped to `endingVideoCount` by `migrateEditorState`.

### Tests

- 4 new tests in `editor-store.endings.test.ts` for the v12 → v13 migration (default back-fill, valid value preserved, clamp above max, clamp below 1). Total 426/426 pass.

### Under the hood

- The banner copy is locale-aware and pluralised inline via i18next interpolation (`{{index}} / {{total}} / {{from}} / {{to}}`).
- `OutputPage` selects `endingVideoCount`, `endingVideoIndex`, `endingVideoRanges` as individual store slices so the page only re-renders when those specific fields change — no broader subscription drag.
- Bundle: index 473.91 KB (+3 KB for Select + banner + migration). Under the 500 KB cap.

## v0.17.0 — 2026-05-14

Combined release: logging overhaul + the deferred ending title piece
from v0.16.0. The Output title now reflects the structured endings
the creator filled in (case-A/B/C aware), and the Logs tab persists
entries across app restarts with session-grouped navigation and
JSON/TXT export.

### Added

- **Structured ending titles** ([src/engine/title-builder.ts](src/engine/title-builder.ts)). When `videoType === "ending"` AND `endings[]` is filled, the title's video-type segment swaps from the static `"Ending"` to a context-aware label, picked by a four-tier resolver:
  1. Single entry → `formatEndingEntry()` (e.g. `"Ending 3: Best End"`, `"Ending 3"`, or `"Best End"` depending on which fields are filled).
  2. Multi-entry, every entry named → comma-joined names (`"True End, Bad End, Hidden"`).
  3. Multi-entry, every entry numbered + contiguous run → `title.endingLabel.range` (`"Endings 1–3"` / `"Kết thúc 1–3"`).
  4. Mixed / non-contiguous → `title.endingLabel.count` (`"3 Endings"`).
  Falls back to the legacy locale label when no usable entries — pre-v0.16 single-ending creators see byte-identical output. Slicing respects `endingVideoIndex` + `endingVideoRanges` so a per-video title renders only that video's slice (foundation for the v0.17.1 per-video Output selector).
- **Persistent log storage** ([src/utils/log-storage.ts](src/utils/log-storage.ts)). Logs now survive app restarts:
  - Tauri: append-only JSONL file `{appData}/logs/ytdescgen-YYYYMMDD.jsonl`. Daily rotation; cleanup deletes whole files older than `logRetentionDays` so retention sweeps are O(files) not O(entries). Three new Tauri commands feed this: `append_to_file`, `list_dir`, `delete_file`.
  - Web: localStorage key `ytdescgen-logs`, FIFO-capped at 5000 entries.
  - Best-effort: persistence failures never throw, so a disk hiccup can't recurse into a log loop.
- **Session-grouped LogPage** ([src/pages/LogPage.tsx](src/pages/LogPage.tsx)). Each entry now carries a `sessionId` (one per app boot). The page renders one collapsible block per session — current session expanded, prior sessions collapsed — with a per-session "Clear this session" affordance. Header shows entry count + error/warning counts + time range per session.
- **Log export buttons**:
  - **JSON** — envelope-wrapped via the v0.15 `exportTypedToJsonFile` (currently keyed `_type: "history"`; promote to a dedicated `log` type later when re-import becomes a use case).
  - **TXT** — `[ISO time] [LEVEL] [source] message — details` one line per entry, chronological. Pastes cleanly into bug reports.
- **`logRetentionDays` setting** ([src/store/settings-store.ts](src/store/settings-store.ts), [src/store/settings-heal.ts](src/store/settings-heal.ts)). Default 7 days; clamped to `[1, 90]` by `healSettings`. New section in Settings → Logs with inline hint. Persist-store version bumped 9 → 10.
- **Boot-time log hydration** ([src/App.tsx](src/App.tsx)). `hydrateLogStore(retentionDays)` runs in the root `useEffect`, loads recent persisted entries before the UI mounts, then schedules `pruneOldLogs` so the AppData folder stays trim.
- **Locale keys (10 new × 6 locales)**: `title.endingLabel.{range,count}` (2 templates keys), `settings.{logSettings,logRetentionDays,logRetentionHint}` + `logs.{clearPersistedConfirm,clearSession,exportJson,exportTxt,sessionCurrent,sessionLabel,entriesShort}` (10 ui keys). All 715 ui + 370 templates keys per locale.

### Changed

- **`log-store` schema** — `LogEntry` gained a `sessionId` field; in-memory cap raised from 500 → 2000 with persistence in play so a current session can fully populate the accordion without pagination. New actions: `clearAllPersisted` (in-memory + disk), `clearSession(id)`.
- **LogPage "Clear All"** now clears in-memory state AND deletes persisted JSONL files / localStorage. Two-step confirm via `clearPersistedConfirm` toast.
- **File envelope** — `SCHEMA_VERSIONS.settings` bumped 9 → 10 to match the persist version. v0.15+ settings exports still import unchanged via the `healSettings` defensive merge.

### Tests

- 11 new title-builder tests covering all four ending-label tiers + Vietnamese localisation + slice + fallback. 422/422 pass overall.
- 3 new settings-heal tests for the `logRetentionDays` default and `[1, 90]` clamp.

### Under the hood

- Tauri command surface gained 3 entries (`append_to_file`, `list_dir`, `delete_file`). All stdlib — no new crates.
- `pruneOldLogs` runs *after* `loadRecentLogs` at boot, so an entry on the retention edge is read into memory before being deleted from disk (last-chance access).
- Bundle: index 470.51 KB (+7 KB for title-builder ending logic), LogPage chunk 8.37 KB (+3 KB for session accordion + export buttons). Still under the 500 KB cap.

### Migration notes

- **Settings persist version 9 → 10**. Additive — `logRetentionDays` back-fills to 7 on first rehydrate, no user action required.
- **First-run on Tauri**: app creates `%APPDATA%\com.skullmute.ytdescgen\logs\` on the first log entry. The new `append_to_file` command auto-creates the parent dir via `std::fs::create_dir_all`.
- **Web users**: persisted entries live in `localStorage["ytdescgen-logs"]`; nothing to migrate.
- **Pre-v0.16 ending creators**: title behaviour unchanged unless they fill the new structured fields. Filling triggers the new resolver immediately.

## v0.16.0 — 2026-05-14

Structured ending editor + multi-video split. The Playthrough Notes
section's free-form "Endings shown" Input is replaced with a
structured row table that knows about ending numbers, names,
multi-video splits, and timeline cross-validation.

### Added

- **`EndingsEditor` component ([src/components/editor/EndingsEditor.tsx](src/components/editor/EndingsEditor.tsx))** — three logical cases driven by ending count + video count:
  - **Case A** (1 ending) — `Number` + `Name` pair with live preview. At least one of the two must be filled; otherwise an inline warning explains the bullet will be dropped.
  - **Case B** (≥2 endings, 1 video) — full table row per ending. A gate inspects the Timestamps textarea — if it doesn't contain at least `endings.length` lines tagged with the `ending` keyword, a warning banner surfaces ("Timeline needs N markers; only M found").
  - **Case C** (≥2 endings, ≥2 videos) — endings table + per-video range table. Default ranges are contiguous and balanced via the new `computeContiguousRanges` helper (extras spill into the *last* video for the climactic-final convention); the creator can override per-row. Overlap / gap / out-of-bounds errors surface inline.
- **Structured `endings: EndingEntry[]` schema** in `EditorData` (v0.16.0). Each entry pairs an optional `number` (1–100) with an optional `name`. Empty entries are dropped silently. Companions: `endingVideoCount`, `endingVideoRanges: EndingVideoRange[]`, `endingVideoIndex?` (engine-only — picks which video's slice to render).
- **Engine `endings-format.ts`** — pure helpers `formatEndingEntry`, `sliceEndingsForVideo`, `clampRange`. Used by both the description builder and the editor's live preview so creators see exactly what will render.
- **Ending ordinal capture in `timeline-parser.ts`** — the `ending` keyword pattern now captures an optional trailing number, so timeline lines like `1:23:45 Ending 3: Best End` parse into `{ keyword: "ending", number: 3, rest: ": Best End" }`. Unblocks the case-B timeline gate.
- **Locale keys (19 new × 6 locales)** under `editor.endings.*` covering count / video-count labels, per-row labels, the preview line, warnings (`singleEmpty`, `timelineShort`, `rangeInvalid`, `rangeGap`, `rangeOverlap`, `rangeShort`), and helper hints. Schema bumped from 686 to 705 ui keys.
- **Tests** — 42 new tests (367 → 409): `endings-format.test.ts` (15), `editor-store.endings.test.ts` (16), `description-builder.test.ts` (5 added inline), `timeline-parser.test.ts` (6 added inline).

### Changed

- **`PlaythroughNotesForm`** — the old single `<Input label="Endings shown">` is replaced by `<EndingsEditor />`. The legacy `endingsShown` freeform is kept on the editor type for migration round-trip but no longer surfaces in the UI.
- **`description-builder` endings bullet** — reads from structured `endings[]` first, falls back to legacy `endingsShown` only when the array is empty (covers migrated drafts that still carry both). Multi-row entries render as comma-joined: `Ending 1: True End, Ending 3: Bad End, Hidden`. When `endingVideoIndex` is supplied, only that video's slice renders.
- **`timeline-parser` keyword templates** — every locale's `timeline.keywords.ending` is now `"Ending {{n}}"` instead of `"Ending"`. The renderer collapses trailing whitespace so a bare `Boss` (no ordinal) still renders cleanly as `Boss` instead of `Boss `.
- **`TemplateSnapshot`** in `template-store.ts` — gained `endings?`, `endingVideoCount?`, `endingVideoRanges?` (all optional for back-compat with pre-v0.16 templates).

### Migration

- **`migrateEditorState` v11 → v12** — `liftLegacyEndingString` parses the freeform `endingsShown` into a single-row structured entry:
  - `"Ending 3: Best End"` → `{ number: 3, name: "Best End" }`
  - `"Ending 3"` → `{ number: 3, name: "" }`
  - `"True ending only"` → `{ number: null, name: "True ending only" }`
  - `""` → `[]` (no entry)
  Localised "Kết thúc N", "エンディングN", etc. are also recognised. After lifting, `endingVideoCount` defaults to 1, `endingVideoRanges` to a single span; the existing `endingsShown` string is left in place but unused.

### Under the hood

- `EndingEntry` and `EndingVideoRange` types live in `src/engine/types.ts`. The 1-indexed inclusive `from/to` convention matches the user-facing "Video 1, Video 2…" labels.
- The Output preview for case C currently renders the *union* of all endings (same as case B) — per-video output rendering is wired into the engine via `endingVideoIndex` but the UI selector for it lands in a follow-up patch. Documented inline in `EndingsEditor` as `multiVideoOutputNote`.
- Bundle: index 463.08 KB (+62 KB for EndingsEditor + endings-format + table-row UI). Still under the 500 KB cap.
- 409/409 tests pass. Lint + typecheck + locale-validate all clean.

## v0.15.0 — 2026-05-14

Import / export overhaul + stability hardening. Closes the "black
screen on bad file" class of bugs and gives every JSON export an
auto-detect header so users can no longer confuse profile / preset /
template files with each other.

### Added

- **`ErrorBoundary` ([src/components/ErrorBoundary.tsx](src/components/ErrorBoundary.tsx))** wrapping every `<Route>` plus a top-level boundary in `main.tsx`. Catches render-time errors that previously black-screened the app, surfaces a fallback UI with `Try again` (remount the subtree) + `Reload page` actions, and copies the error into the Logs tab via the in-app `logger`. Per-route boundaries mean a crash on the Profiles tab doesn't take down the Editor — the user can navigate elsewhere and recover.
- **File envelope format ([src/utils/file-schema.ts](src/utils/file-schema.ts))** — every `.json` export written from this version onwards is wrapped in `{ _app: "ytdescgen", _type, _schemaVersion, _exportedAt, data }`. The `_type` discriminator (`"profile" | "preset" | "template" | "settings" | "history"`) lets imports detect "you opened a Template file in the Profiles importer" and offer to switch tabs instead of silently failing.
- **`detectShape` / `resolveForType`** — shape inspector handles envelope files (authoritative `_type`), legacy bare arrays (best-effort guess from `snapshot` / `channelName` + `social` + `rig` / `gameName` + `storeLinks` / `createdAt` + title), and the multi-store settings dump (recognised by the `ytdescgen-settings` key). 17 new unit tests in `tests/utils/file-schema.test.ts` cover the round-trip + every detection branch.
- **`importTypedFromJsonFile(expectedType)`** — high-level reader that resolves to a tagged-union `ImportResult`: either `{ ok: true; data; sourceVersion? }` or `{ ok: false; failure }` with one of five kinds (`cancelled`, `read-failed`, `empty`, `parse-error`, `wrong-shape`, `newer-schema`). Replaces the throw/catch-and-show-generic-toast pattern.
- **Auto tab-switch on wrong-type import** — when the user clicks Import on the Profiles tab but the file is detected as a Templates export, the toast says "This file looks like a Templates export. Switching tabs…" and `setTab("templates")` runs immediately. One click instead of three.
- **Import-result summary** in toasts — `Imported 5 of 7 profiles (some skipped).` when the store-level validator drops malformed rows. Previously a partial success surfaced as a plain "Imported!" even when half the file got rejected.

### Fixed

- **Black-screen crash** on loading a corrupt profile or template ("Cannot convert undefined or null to object"). Root cause was three unguarded spreads/`Object.values` chained together:
  - [src/components/profiles/TemplateCard.tsx:21](src/components/profiles/TemplateCard.tsx) `loadProfile(template.snapshot)` with `snapshot: null` →
  - [src/store/editor-store.ts:149](src/store/editor-store.ts) `normalizeEditorPatch` spread of `null` patch →
  - [src/components/profiles/ProfileCard.tsx:34](src/components/profiles/ProfileCard.tsx) `Object.values(profile.social)` with `social: null`.
  All three now null-guard. `normalizeEditorPatch` returns `{}` for a falsy patch; `loadProfile`-chain spreads degrade to a no-op; `Object.values(profile.social ?? {})` returns 0 instead of throwing. The new ErrorBoundary catches anything that still slips through.
- **Store-level import validators** in [profile-store.ts](src/store/profile-store.ts), [preset-store.ts](src/store/preset-store.ts), [template-store.ts](src/store/template-store.ts) now filter incoming arrays for rows with a string `id` of non-zero length; templates additionally require a non-null `snapshot` object. Bad rows are silently dropped (count surfaces in the import toast).

### Changed

- **`exportToJsonFile` → `exportTypedToJsonFile`** at every ProfilesPage call site. The legacy bare-value exporter is retained for back-compat but unused.
- **`importFromJsonFile<T>` → `importTypedFromJsonFile`** at every ProfilesPage handler. Legacy bare reader retained for the same reason — callers outside Profiles can migrate later.
- **`detectShape` is forward-compatible**: an envelope from a future version (whose `_schemaVersion` exceeds `SCHEMA_VERSIONS[expected]`) returns `newer-schema` instead of importing silently. Tells the user to upgrade the app.

### Under the hood

- Two layers of validation by design: `detectShape` confirms the file *kind*; per-store `importX` rejects malformed *rows*. A future tab-specific quirk in one validator can't corrupt other stores' data.
- `normalizeEditorPatch` signature widened to `Partial<EditorData> | null | undefined` so TS forces null-handling at call sites. Existing callers still work — `Partial<T>` is assignable to the new union.
- Vite reports one dynamic-import-also-statically-imported warning for `logger.ts`. Intentional: the boundary uses a dynamic import so logger init failures during the *primary* render error don't escalate into a secondary boundary crash. Bundle is not split.
- Bundle: index 401.06 KB (+2.49 KB), ProfilesPage chunk 18.44 KB (+4.38 KB for envelope + failure-toast rendering). Total still well under the 500 KB cap.
- 367/367 tests pass (350 + 17 new for file-schema).

### Migration notes

- **No store schema bump**. v0.14.x persisted state loads unchanged in v0.15.0; new envelope only affects on-disk JSON export files.
- **Legacy export files still import** via the shape-detector path. Re-export to get the envelope header + tab-switch hints.
- **Envelope schema versions**: profile=1, preset=2, template=1, settings=9, history=2. Bump per-type when introducing a non-additive change to that store's shape.

## v0.14.1 — 2026-05-14

Same-day patch on v0.14.0. Two desktop-only items closing user-reported
issues on Windows + a small Settings convenience.

### Fixed

- **Windows "cannot find ... `AppData\Roaming\com.skullmute.ytdescgen`"** when clicking *Settings → Open Folder* on a fresh install ([`src/pages/SettingsPage.tsx:25-35`](src/pages/SettingsPage.tsx)). Root cause: `appDataDir()` only resolves the path string — the directory itself is created lazily on the first `save_to_file` write, so first-run users hit the OS shell before any setting had been persisted. New Rust command `ensure_dir(path)` ([`src-tauri/src/lib.rs:18-27`](src-tauri/src/lib.rs)) wraps `std::fs::create_dir_all` and is invoked before both `openPath(dir)` and `read_from_file` in `exportSettingsToFile`, so the shell + read paths can never encounter a non-existent folder.

### Added

- **Settings → Import button** (Tauri-only, next to *Export*). Reads a `.json` settings file via the existing `loadFile()` Tauri dialog, accepts either the full multi-store dump produced by *Export* (object keyed by `ytdescgen-settings`) or a bare `SettingsData` payload, runs it through `healSettings()` to back-fill any missing keys, then dispatches via `useSettingsStore.setState`. Theme class on `<html>` is re-applied directly because `setState` bypasses the `setTheme` action. Five distinct failure modes get their own toast: dialog-cancel (silent), `read_from_file` error, empty file, JSON parse error, non-object root. Each failure logs to the in-app logger with the source `"settings"` so it surfaces in the Logs tab without leaving the UI.

### Under the hood

- New Tauri command `ensure_dir` registered in `invoke_handler!` macro alongside `save_to_file` and `read_from_file`. Pure stdlib — no new crates.
- `exportSettingsToFile` also pre-creates the data folder so *Export* works on a fresh install without first triggering any other write.
- Settings store gained no schema fields; the import path reuses the existing `healSettings` (v9) for back-fill so no `version` bump on the persist store.
- 350/350 tests still pass; lint + typecheck clean.
- Bundle: SettingsPage chunk grew ~0.18 KB raw for the new icon import + import handler; main bundle and overall gzip totals unchanged.

### Migration notes

- No store schema bump. Existing v0.14.0 installs upgrade in place.
- Web (GitHub Pages) build is unchanged — both fixes are Tauri-only by virtue of the `IS_TAURI` gate on the Settings toolbar.

## v0.14.0 — 2026-05-14

Three independent strands land together:

1. **License flip MIT → Apache-2.0.** The repo previously claimed MIT in README/CLAUDE.md but had no `LICENSE` file. Adds canonical Apache License 2.0 text, a `NOTICE` asserting copyright + AI-assisted-development disclosure, and the `license` field in `package.json` + `src-tauri/Cargo.toml`. Per the production-docs spec.
2. **Content warnings 69 → 91** across a new 8th group `gameplay_disclosure`. Adds horror-channel staples plus transparency disclosures for non-vanilla play. See "Added" below for the full ID list.
3. **Mobile-responsive web** without PWA or Tauri-mobile. The GitHub Pages build is now usable on phones (drawer nav below `md`, touch-sized form controls, iOS-safe focus behavior, safe-area-inset padding for notch/home indicator).

Plus a documentation sweep: full `README.md` rewrite, new root policy files for public release (`SECURITY`, `CONTRIBUTING`, `CODE_OF_CONDUCT`, `PRIVACY`, `DISCLAIMER`, `TERMS`, `THIRD_PARTY_NOTICES`, `MAINTAINERS`), `docs/DEVELOPMENT.md` merging the deleted `pc_spec.md` + `dev_env.md`, Vietnamese mirrors for DEVELOPMENT and DISCLAIMER, and a `.github/PULL_REQUEST_TEMPLATE.md`.

### Added

- **`LICENSE`** (root) — canonical Apache License 2.0 text. **`NOTICE`** asserting `Copyright 2026 poli0981` + Claude Code 4.7 Opus (1M context) co-authorship disclosure. `license` field added to `package.json` and `src-tauri/Cargo.toml`.
- **22 new content-warning IDs** across 8 groups ([src/engine/types.ts](src/engine/types.ts), [src/config/content-warning-groups.ts](src/config/content-warning-groups.ts)):
  - Phobias (+3): `coulrophobia` (clowns), `ablutophobia` (drowning), `taphophobia` (live burial).
  - Photosensitive (+2): `strobe_effects`, `screen_shake_intense`.
  - Mental Health (+3): `paranoia_themes`, `intrusive_thoughts`, `medical_horror`.
  - Sensitive (+3): `human_experimentation`, `cannibalism`, `nuclear_themes`.
  - Horror-Specific (+5): `liminal_spaces`, `analog_horror`, `unreality_themes`, `pursuit_chase`, `entity_horror`.
  - Playstyle (+2): `first_time_playing`, `returning_player`.
  - **NEW group Gameplay Disclosure (+4)**: `mods_used`, `cheats_enabled`, `glitch_exploits`, `assisted_run`.
- **`src/components/ui/Drawer.tsx`** — slide-in mobile-nav drawer. Reuses overlay + Esc patterns from `Modal.tsx`; body-scroll lock + safe-area-inset padding; tap-outside-to-close.
- **`tailwind.config.ts`** — `theme.extend.spacing.touch = "44px"` (iOS HIG minimum), exposed via `min-h-touch` / `h-touch` utilities.
- **Mobile keyboard hints** — `inputMode` / `autoComplete` / `enterKeyHint` on game-name, channel-name, contact-email, and playlist-URL fields so iOS shows the right keyboard.
- **Root policy file set** for public release: `SECURITY.md` (private-disclosure flow), `CONTRIBUTING.md` (PR process, validate:locales gate, auto-ignore rules), `CODE_OF_CONDUCT.md` (Contributor Covenant v2.1 link), `PRIVACY.md` (offline-first, localStorage keys listed, GDPR/CCPA), `DISCLAIMER.md` (AI-assistance + translation-quality disclosure), `TERMS.md` (Apache-2.0 + GitHub ToS + GDPR/CCPA/PIPL/LGPD/VN Cybersecurity), `THIRD_PARTY_NOTICES.md` (full dep table + AI disclosure paragraph), `MAINTAINERS.md`. Plus `.github/PULL_REQUEST_TEMPLATE.md`.
- **`docs/DEVELOPMENT.md`** (EN) + **`docs/i18n/vi/DEVELOPMENT.md`** (VI) — merge of the deleted `pc_spec.md` + `dev_env.md`. Covers toolchain (Node ≥ 22, Rust stable, Tauri 2), JetBrains 2026.x + VS Code setup, build commands, per-OS Tauri prerequisites, troubleshooting.
- **`docs/i18n/vi/DISCLAIMER.md`** — VI mirror of `DISCLAIMER.md`.

### Changed

- **`Sidebar.tsx`** — extracts `<SidebarNavList collapsed onItemClick?>` so the same nav can render inside the desktop sidebar **and** the new mobile Drawer. Outer `<aside>` now `hidden md:flex`.
- **`AppShell.tsx`** — wires `mobileNavOpen` state + renders `<Drawer side="left">` containing `<SidebarNavList />` for mobile. Header gets `onOpenMobileNav` prop.
- **`Header.tsx`** — adds `Menu` hamburger (md:hidden), `pt-[max(0.75rem,env(safe-area-inset-top))]` for iOS notch, donate icon-only below md, language dropdown width `min-w-[200px] max-w-[calc(100vw-2rem)]` so it never overflows at 360px width.
- **`Button.tsx` / `Input.tsx` / `Textarea.tsx` / `ValidatedInput.tsx`** — bump heights to `min-h-touch` (44 px) for `md` / `lg`; `sm` to `min-h-[36px]` (iOS minimum). Inputs / textareas use `text-base sm:text-sm` to prevent iOS Safari focus zoom (Safari zooms when font-size < 16 px).
- **`EditorPage.tsx`** — responsive padding `gap-6 p-6 lg:flex-row` → `gap-4 p-3 sm:p-4 md:gap-6 md:p-6 lg:flex-row`. Sticky preview wrapper changed to `lg:sticky lg:top-6` so mobile portrait doesn't lock the preview.
- **`OutputPreview.tsx`** — description scroll-box `max-h-[400px]` → `max-h-[60vh] sm:max-h-[400px]`.
- **`CopyAllBar.tsx`** — `pb-[max(0.75rem,env(safe-area-inset-bottom))]` for iOS home indicator; button class compaction below `sm`.
- **`README.md`** — full rewrite (~200 lines). Badges (Apache-2.0 / Node ≥ 22 / latest release / last commit), Use Cases (esp. horror gameplay), Privacy section, full doc table, AI disclosure, channel/socials block.
- **`CLAUDE.md`** — license MIT → Apache-2.0; project-structure tree updated (`PRD.md` removed, `DEVELOPMENT.md` added with VI mirror sibling).
- **`src/config/about.ts`** — `license` MIT → Apache-2.0. `pcSpecDocUrl` / `devEnvDocUrl` field names preserved for About-page layout compat but now point to `docs/DEVELOPMENT.md` (EN) and `docs/i18n/vi/DEVELOPMENT.md` (VI) respectively.
- **`webapp/TAURI.md`** — cross-links updated to `docs/DEVELOPMENT.md`.

### Removed

- **`docs/PRD.md`** — Product Requirements Document V1.0 (2026-04-07). Shipped through v0.13.1; no longer load-bearing for public readers.
- **`docs/pc_spec.md`** + **`docs/dev_env.md`** — merged into `docs/DEVELOPMENT.md`.
- **`docs/i18n/vi/pc_spec.md`** + **`docs/i18n/vi/dev_env.md`** — merged into `docs/i18n/vi/DEVELOPMENT.md`.

### Under the hood

- **`_schema.json`** updated with the 23 new keys (1 new group label + 22 new option keys + 22 new long-description keys). All 6 locales × 2 files now at 686/686 ui + 368/368 templates.
- **No engine logic changes.** `description-builder.ts:415-431` already loops content warnings by user selection order — the new IDs are pure-data additions.
- 350/350 tests still pass — no engine math changed.
- Bundle: 443.55 KB raw / 136.55 KB gzip (under the 500 KB cap; ~+30 KB vs v0.13.1 from the docs imports being inlined).
- Repository URL canonicalized — all README / CLAUDE / DEVELOPMENT references that pointed to `github.com/poli0981/yt-desc-gen` now correctly resolve `github.com/poli0981/youtube-generator`. `src/config/about.ts` still uses the canonical name; no behavior change.
- Tauri app-data identifier (`com.skullmute.ytdescgen`) documented correctly in `PRIVACY.md`.

### Migration notes

- **License change is not a code migration** — your build environment doesn't need any action. If you redistribute the source, the new `LICENSE` + `NOTICE` apply per Apache 2.0 §§ 4(a)–4(d). Pre-v0.14 forks may continue under their snapshot's license; this is a forward change.
- **No store schema bump.** Editor / settings / profile / preset / template store versions unchanged. Persisted drafts containing the legacy `contentWarnings` array round-trip unchanged — the array just renders against the expanded ID set.
- **Mobile users** get the new layout automatically on next visit; nothing to opt in to.

## v0.13.1 — 2026-05-11

Same-day hotfix for v0.13.0. Three small but load-bearing pieces:

### Added

- **GitHub-side housekeeping** — `.github/FUNDING.yml` (mirrors `Donate.txt`), `.github/ISSUE_TEMPLATE/{config,bug_report,feature_request}.yml`, `docs/pc_spec.md` + `docs/dev_env.md` (+ VI mirrors), `webapp/TAURI.md`. Auto-link-discussion job added to `announce-release.yml` (`gh release edit --discussion-category "Announcements"`) so every future release auto-creates a linked Discussion thread.
- **AboutPage restructure** — split into Repository / Donate / Connect / Dev Environment / Third-Party sections. Ko-fi / Patreon moved out of `ABOUT.socials` into a new `@config/donate` (`PRIMARY_DONATE_URL` constant feeds the Header donate button). Socials expanded with Bluesky, Mastodon, Steam, Telegram (bot + user), email, game-server Discord.
- **Header donate button** — persistent pink Ko-fi link to the left of the language switcher.
- **Sidebar external link** — Report Bug item added to the tabs array via a new `external?: boolean` field on `TabItem`; branches render between `<NavLink>` and plain `<a target="_blank">`.
- **Basic SEO** — expanded `<head>` (description, OG, Twitter card, JSON-LD `WebApplication`, 6 locale alternates) + new `useDocumentTitle(title)` hook applied to all 9 page components + `public/{robots.txt,sitemap.xml,manifest.webmanifest,favicon.svg}` (favicon is a placeholder SVG).
- **Heavy-horror content-warning group** (7 IDs: `eye_horror`, `body_horror`, `face_horror`, `cosmic_horror`, `extreme_gore`, `decay_rot`, `mutilation`) translated to all 6 locales in both short-label and long-description forms.

### Changed

- **Workflow `workflow_run` filters narrowed** — `notify-ci-failure.yml` / `notify-deploy.yml` / `notify-release-pipeline.yml` switched from `workflows: ["*"]` to specific producer names. Eliminates Skipped-row spam in the Actions tab.
- **`@tauri-apps/api` 2.10.1 → 2.11.0** to match Rust `tauri` 2.11.1 (Dependabot bumped Rust side; tauri-action requires the npm and Rust minors to match).

### Fixed

- **Tauri-action `releaseDraft: true` is search-by-version, not search-by-tag.** The initial v0.13.1 tag push silently uploaded `0.13.0`-labelled binaries to the existing v0.13.0 release object because `src-tauri/{tauri.conf.json, Cargo.toml, Cargo.lock}` stayed at `0.13.0`. Recovered with PR #58 (Tauri-side manifests to 0.13.1), then PR #59 (`@tauri-apps/api` bump), then force-moving the signed `v0.13.1` tag twice via `git tag -fs` + `git push origin v0.13.1 --force`, finally `gh workflow run release-desktop.yml -f tag=v0.13.0` to rebuild and restore v0.13.0's binaries.

### Migration notes

- **Version-bump ritual is now SIX files**, not five: `package.json`, `package-lock.json`, `src-tauri/Cargo.toml`, `src-tauri/Cargo.lock` (the `yt-desc-gen` entry only), `src-tauri/tauri.conf.json`, and — when Rust `tauri` minor moves — `@tauri-apps/api` in `package.json` (its minor must equal Rust `tauri` crate minor).

## v0.13.0 — 2026-05-08

A scope-broadening release: two UI/Gacha bugs squashed, Gacha-quest editor extended with three structured fields (Anniversary year dropdown, Showcase character name, free-form `gachaVersion`), copy buttons hard-stop when text exceeds YouTube's title/description/tags limits, the Tauri desktop window is now locked at 1100×750 (no resize, no maximize), 27 new content warnings — including a brand-new "Playstyle disclosures" group — fill the phobia / mental-health / sensitive / playstyle gaps, and the My Rig editor's free-text GPU and RAM inputs are replaced with structured cascading dropdowns (Brand → Series → Model for GPU, Size + DDR generation for RAM) covering ~200+ GPU models across 14 series and 4 brands. Two QoL touches round it out: per-quest-type smart placeholders ("Day 12" for Daily Commission, "Floor 12" for Endgame, "Part 1" for Main Story) and inline validation badges that nudge the creator when a rig field is half-filled.

### Added

- **Anniversary year dropdown (1–20)** ([src/components/editor/ExtraFieldsInput.tsx](src/components/editor/ExtraFieldsInput.tsx)) — replaces the v0.12 `chapterName` text input for the `anniversary` quest type. Title and description templates render `"{{anniversaryYear}}{{ordinalSuffix}} Anniversary"` (e.g. "2nd Anniversary", "11th Anniversary") with a locale-aware `ordinalSuffix()` helper that returns `st/nd/rd/th` for English and an empty string for non-English locales (so "周年記念" / "주년" / "周年纪念" don't pick up an English suffix).
- **Showcase character name** — when `gachaQuestType === "showcase"`, the editor swaps Chapter/Quest/Part for a single `characterName` input. The description renders the user's exact requested phrasing: "This video showcases the skills, appearance, and details of {{characterName}} in {{gameName}}{{versionLabel}} on {{channelName}}." Title becomes "{{gameName}} — Character Showcase: {{characterName}}".
- **Gacha `gachaVersion` field** ([src/store/editor-store.ts](src/store/editor-store.ts)) — free-form game version label like "1.2", "2.4", scoped to the Gacha Quest video type. Distinct from `versionInfo` (driver/general game version, rendered in the 🖥 VIDEO SETTINGS block for any video type). Surfaces in Gacha-specific intros via a new `description.intro.versionInline` template helper that renders only when non-empty (so the parenthetical "(version 1.2)" disappears entirely when the field is blank — no "(version )" artifact).
- **Cascading GPU dropdown** ([src/config/gpu-catalog.ts](src/config/gpu-catalog.ts), [src/config/rig-fields.ts](src/config/rig-fields.ts)) — three-level Brand → Series → Model picker covering NVIDIA (GTX 700/900/10/16, RTX 20/30/40/50), AMD (HD 7000, R7/R9 200/300, RX 400/500/Vega/5000/6000/7000/9000), Intel Arc (A and B series), and Apple Silicon (M1–M4 with Pro/Max/Ultra variants). A `Custom` brand swap-in keeps free-text entry available for niche cards. Stored as pipe-delimited `"<brand>|<series>|<model>"` so the rig store stays a flat `Record<string, string>` — no schema migration vs. v0.12. `formatRigValue("gpu", …)` outputs `"NVIDIA RTX 4090"` (drops the redundant series label).
- **Composite RAM input** — two cascading dropdowns (Size + DDR) replace the free-text RAM field. Sizes: 4/6/8/12/16/32/64/96/128/256 GB plus a `Custom…` numeric input for unusual sticks. DDR generations: DDR1–DDR7. Output renders as `"32 GB DDR5"` / `"48 GB DDR5"` (custom). Same flat-string storage approach as GPU (`"<size>|<ddr>"`, with `"custom:48|DDR5"` for custom numeric).
- **27 new content warnings + Playstyle disclosures group** ([src/engine/types.ts](src/engine/types.ts), [src/config/content-warning-groups.ts](src/config/content-warning-groups.ts)) — Phobias gain `cynophobia / nyctophobia / pyrophobia / pediophobia / hemophobia` (5). Mental health gains `bipolar_themes / ocd_themes / panic_attacks / dissociation` (4). Sensitive gains `hate_speech / historical_atrocity / slavery_themes / terrorism_themes / bullying_themes` (5). A brand-new **Playstyle disclosures** group (8 items) covers `blind_playthrough / no_spoilers_chat / casual_difficulty / hardcore_difficulty / permadeath_run / speedrun_attempt / completionist_run / learning_mechanics` — disclosure-style warnings that aren't really "content" but viewers benefit from knowing (e.g. "Blind playthrough — first time" sets expectations for repeated dying).
- **Smart placeholders per Quest Type** ([src/config/gacha-quest-types.ts](src/config/gacha-quest-types.ts)) — `GACHA_QUEST_PLACEHOLDERS` map drives the Chapter / Quest / Part inputs to show context-specific hints based on the selected quest type: `"Day 12"` for Daily Commission, `"Floor 12"` for Endgame, `"Part 1"` and `"Chapter 5 Act 2"` for Main Story, etc. Placeholders only — no value clearing or auto-fill, so user input is preserved when switching types.
- **Inline rig validation badges** ([src/utils/rig-validation.ts](src/utils/rig-validation.ts)) — `validateGpuValue` / `validateRamValue` flag half-filled selections (brand picked but no model, RAM size set but DDR missing, custom numeric empty) and the rig editor renders a small ⚠️ warning under the affected field. Soft warning only — the description still renders, but the badge nudges the creator to complete the field.
- **Copy-over-limit guard** ([src/hooks/use-clipboard.ts](src/hooks/use-clipboard.ts)) — `useClipboard().copy(text, { limit, fieldLabel })` now refuses to write to the clipboard when `text.length > limit`. Surfaces a toast like "Title is too long: 117/100 chars. Trim before copying." Each output button (Title / Description / Tags) passes its respective `YT_LIMITS.*` cap; the Copy All bar pre-validates Title and Description and shows a combined error if either is over. Over-limit copy buttons render with a `text-danger` style and a ⚠️ icon so the lock state is visible before the user clicks.

### Changed

- **Editor store v10 → v11** ([src/store/editor-store.ts](src/store/editor-store.ts)) — additive only: `characterName: ""`, `anniversaryYear: null`, `gachaVersion: ""` back-fills. Out-of-range or non-integer `anniversaryYear` values coerce to `null` so a hand-edited persistent blob with `anniversaryYear: 99` doesn't render "99th Anniversary" in titles. Existing fields round-trip unchanged.
- **Tauri window locked** ([src-tauri/tauri.conf.json](src-tauri/tauri.conf.json)) — `resizable: false`, `maximizable: false`, and `minWidth = maxWidth = 1100` / `minHeight = maxHeight = 750` ensure the desktop binary opens at the design resolution and stays there. Eliminates layout drift from users dragging the window to ultra-wide ratios where the editor → preview split breaks.
- **AppShell layout reflow** ([src/components/layout/AppShell.tsx](src/components/layout/AppShell.tsx)) — root `min-h-screen` swapped for `h-screen overflow-hidden` so the outer container can't grow beyond viewport height. The `<main>` scroll container now actually constrains content, fixing the v0.12 bug where long descriptions caused the entire page (sidebar + header included) to scroll instead of just the main pane.
- **Showcase template renders character, not quest** — `gachaQuestType.showcase` title and `description.intro.gacha_quest_showcase` now consume `characterName` instead of `questName`. Pre-v0.13 drafts that picked `showcase` and filled `questName` will see `characterName` empty after upgrade — re-enter the character into the new field.
- **Anniversary template renders year + ordinal** — `gachaQuestType.anniversary` and `description.intro.gacha_quest_anniversary` consume `anniversaryYear` (number) instead of `chapterName` (free text). The English title is now `"<game> — 2nd Anniversary - Day N"` driven by the new ordinal helper; locale variants render in their native conventions ("2周年記念", "2주년 기념", "Aniversario 2", etc.).
- **`formatRigValue()` extended** — switches on `field.type` to handle the two new cascading / composite types. Pre-v0.13 free-text GPU and RAM values (no pipes) pass through unchanged so existing profiles render the same string they did before; the editor displays them under the Custom brand for further editing.

### Under the hood

- **Schema-driven locale validation** still passes with 629 ui keys + 339 templates keys across all 6 locales (en/es/ja/ko/vi/zh) — every new key is mirrored in the schema and translated where applicable. Validation errors are caught at the build / pre-merge step via `npm run validate:locales`.
- **`tests/engine/rig-fields.test.ts`** grew from 7 → 18 cases — new coverage for `cascading_dropdown` (brand+model formatting, custom-brand verbatim, brand-only fallback, legacy free-text passthrough) and `composite_dropdown` (size+DDR, custom numeric, partial values, legacy passthrough).
- **`tests/store/editor-store.migrate.test.ts`** grew from 9 → 13 cases — new v10 → v11 migration tests assert the Gacha field back-fills, the 1–20 anniversary-year range guard, and the round-trip preservation of valid persisted values.
- **`tests/engine/title-builder.test.ts`** updated — the Anniversary test now passes `anniversaryYear: 7` instead of `chapterName: "7th"` to match the new template shape.
- Test count: 350/350 (was 335/335).

### Migration notes

- v10 → v11 is automatic and additive; the migration runs once on first launch of v0.13. Existing drafts are preserved.
- **Showcase users**: the `questName` you previously typed for showcase videos won't be carried into `characterName`. Open the editor, pick Showcase, and re-enter the character — the field name change is intentional (Showcase = character, not quest).
- **Anniversary users**: the free-text `chapterName` you used to type "2nd" / "Year 2" / etc. is no longer used by the Anniversary template. Pick the year from the new dropdown instead.
- **Free-text GPU / RAM users**: existing profiles render identically. The editor will show your old free-text under the Custom brand / RAM legacy fallback; switch to the structured dropdowns when convenient.

## v0.12.1 — 2026-05-06

Hotfix for v0.12.0. Ticking a Tech Notes checkbox (or filling any of the new Playthrough Notes structured fields — Endings shown, Language patch, Game version) updated the editor state but never reached the description preview, because the editor → engine mapping in `useCurrentGeneratorInput` wasn't kept in sync when the new fields were added. The unit-test suite caught nothing because every v0.12 description-builder test passed `GeneratorInput` directly to the engine, bypassing the hook.

### Fixed

- **Editor → engine pipeline carries every v0.12 field** ([src/hooks/use-current-generator-input.ts](src/hooks/use-current-generator-input.ts)) — `endingsShown`, `languagePatch`, `languagePatchCustom`, `gameVersion`, `gameVersionCustom`, and `techNotes` are now forwarded into `GeneratorInput`. Symptom of the bug was that the description preview (and Output / Batch tabs) didn't change when the user ticked tech-note items or filled language-patch / game-version, even though the editor checkboxes / selects reflected the change correctly.
- **Save-as-template captures every v0.12 field** ([src/components/templates/TemplateSaveForm.tsx](src/components/templates/TemplateSaveForm.tsx)) — the snapshot builder explicitly enumerates each editor field and was missing the same six fields. A v0.12.0 user saving a template lost their Tech Notes / Playthrough Notes selections; loading the template later didn't restore them.

### Changed

- **Hook field-mapping extracted into a pure helper** — `buildGeneratorInputFromEditor(state, languageOverride?)` is now exported alongside the React hook. Pure function so it's directly unit-testable; the hook just wraps it in `useMemo`. Same change pattern used for `migrateEditorState` in v0.12.0 — pull the load-bearing logic out of React-coupled wrappers so tests can hit it without a render harness.
- **Hook `useMemo` deps simplified** — the previous list enumerated every field individually (50+ entries); a missing field would silently freeze that field's value in the memoised output. Replaced with a single `[state, languageOverride]` since `useEditorStore()` returns a fresh state reference on every store update — equivalent invalidation, fewer footguns.
- **`TemplateSnapshot` carries the v0.12 fields as optional** ([src/store/template-store.ts](src/store/template-store.ts)) — `endingsShown`, `languagePatch`, `languagePatchCustom`, `gameVersion`, `gameVersionCustom`, `techNotes` joined the snapshot type. Optional for back-compat with templates saved before this hotfix; the editor's `loadProfile` spread keeps existing values when the patch lacks them.
- **`EditorData` is now `export interface`** in `src/store/editor-store.ts` so the shared snapshot helper can reference it.
- **package-lock.json** synced to the v0.12 / v0.12.1 version line — was carrying a stale v0.11.0 root version since the v0.12.0 PR forgot it (the v0.9.0 lockfile-bump-miss memory note reminded us, but only after the v0.12.0 ship).

### Under the hood

- New `tests/hooks/generator-input-mapping.test.ts` (6 cases) — direct assertions that each v0.12 field reaches `GeneratorInput` (`endingsShown`, `languagePatch + custom`, `gameVersion + custom`, `techNotes` selection-order), plus a parity guard that walks every key of an `EditorData` instance and fails if any non-allowlisted field is dropped from the resulting `GeneratorInput`. The allowlist is exactly two keys (`thumbnailText`, `pinnedComment` — both feed the pinned-comment builder via a separate code path); anything else added in the future will trip the assertion immediately.
- Test count: 335/335 (was 329/329). Bundle: 345.50 KB raw / 115.52 KB gzipped (essentially flat versus v0.12.0 — only swapped a deps array for a single ref).

### Migration notes

- No state migration needed. `loadProfile` / `loadPreset` continue to spread snapshots over current state, and the new fields are all optional on `TemplateSnapshot`. A v0.12.0 user with templates saved during the bug window will see those templates load with empty Tech Notes / Playthrough Notes — re-save the template after upgrading to capture the fields properly.

## v0.12.0 — 2026-05-06

A bug fix and a description overhaul. The Tauri desktop build picks up `tauri-plugin-single-instance` so launching the app twice no longer stacks tray icons / orphan processes — second launches refocus the existing window. The description's Playthrough block consolidates the v0.7 standalone "🎯 Playthrough" line and the standalone "🎮 DIFFICULTY" block into a unified `▸ 🎮 PLAYTHROUGH NOTES` section with three new structured fields (`endingsShown`, `languagePatch`, `gameVersion`), and a new `▸ 🛠 TECH NOTES` bilingual checklist (24 items across 5 groups) sits alongside Content Warnings for production / playstyle disclaimers.

### Added

- **Single-instance enforcement (desktop)** — `src-tauri/Cargo.toml` adds `tauri-plugin-single-instance = "2"`, registered first in the `Builder` chain in `src-tauri/src/lib.rs` with a `get_webview_window("main")` → show + unminimize + focus callback. Closing-to-tray then double-clicking the launcher / start-menu shortcut surfaces the existing window instead of spawning a fresh process with its own tray icon.
- **Unified `▸ 🎮 PLAYTHROUGH NOTES` description block** — replaces the v0.7 standalone "🎯 Playthrough:" line and the v0.7 standalone "🎮 DIFFICULTY" block with one bulleted section that renders five fields: Run type (reads from existing `playthroughStatus`), Difficulty (reads from existing `difficulty` + `difficultyCustomLabel`), Endings shown (NEW free text), Language patch (NEW enum + custom slot), Game version (NEW enum + custom slot). Empty bullets are skipped; the whole block is skipped when every field is empty. Bilingual `EN · LOCAL` rendering for both label and value when `tEn` is provided and output language ≠ English. Section sits in slot 1.5 (right after the intro), matching the position of the pre-v0.12 standalone playthrough line.
- **`▸ 🛠 TECH NOTES` checklist** — a 24-item, 5-group bilingual multi-select for production / playstyle disclaimers: audio (5: copyright muting, volume reduction, music replacement, cutscene-only mute, original-audio kept), video quality (3: low resolution, low graphics, FPS drops with FPS counter pointer), recording issues (4: bug-from-game, crash kept, loading cut, OBS artifacts), playstyle (8: not no-hit, not clean walkthrough, casual no-commentary, many deaths, slow exploration, puzzle-stuck, grinding cut, not speedrun), production (4: exploration-focused, edited-for-pacing, support-developers, online-connectivity-issues). Same render pattern as v0.11 Content Warnings — header / two-line intro / `EN · LOCAL` bullets with U+00B7 MIDDLE DOT separator. Section sits right after Content Warnings; both transparency blocks group together.
- **`languagePatch` enum** with options `none / official_en / official_other / fan_translation / mtl / custom` and a paired free-form `languagePatchCustom` slot — covers the most common patch states (canonical EN release, official non-EN locale, fan TL, machine TL) plus an escape hatch for niche cases. `none` is the skip-bullet sentinel; `official_other` and `custom` both surface the free-form input under the Select.
- **`gameVersion` enum** with options `full_release / demo / early_access / beta / prologue / pre_release / custom` and a paired `gameVersionCustom` slot — `full_release` is the implicit default (no bullet rendered) so creators recording the released game don't have to fill anything; "Steam Next Fest demo" / "Kickstarter backer build" / similar niche cases go through `custom`.
- **Free-text `endingsShown` field** — captures values like "1 of 3", "True ending only", "All routes 100%", "Normal + True". Free text on purpose — the natural value space is too varied for an enum, and a `custom` escape hatch would catch 80% of selections anyway.

### Changed

- **Editor store** v9 → v10 — additive only: `endingsShown: ""`, `languagePatch: "none"`, `languagePatchCustom: ""`, `gameVersion: "full_release"`, `gameVersionCustom: ""`, `techNotes: []` back-fills. Existing `playthroughStatus` / `difficulty` / `difficultyCustomLabel` values round-trip unchanged — only the description-builder render path moves them into the unified block. Invalid persisted enum values coerce to their skip-sentinel default; unknown `techNotes` ids are filtered out (defensive against hand-edited blobs). The `migrate` function is now extracted into a named `migrateEditorState` export so the v9→v10 path can be unit-tested without going through localStorage.
- **`ContentDetailsForm.tsx`** is removed and replaced with the v0.12 `PlaythroughNotesForm.tsx` — the new component owns all five PN fields (Run type, Difficulty + custom, Endings shown, Language patch + custom, Game version + custom) in one block, with the custom-slot inputs only appearing when their parent enum carries one. The Editor page mounts `PlaythroughNotesForm` then `ContentWarningChecklist` then `TechNotesChecklist` inside the Content Details accordion.
- **`description-builder.ts`** — the v0.7 standalone playthrough conditional (`if (input.playthroughStatus !== "none") sections.push(...)`) and the standalone difficulty conditional (`if (input.difficulty !== "none") sections.push(...)`) are gone; replaced with one call to a new `buildPlaythroughNotesSection(input, t, tEn)` helper at slot 1.5. A new `buildTechNotesSection(input, t, tEn)` helper at slot 7.5 mirrors the v0.11 content-warnings render pattern.

### Removed

- **`description.sections.playthrough` / `description.sections.difficulty`** template keys — section heading is now bullet-formatted inside the `▸ 🎮 PLAYTHROUGH NOTES` block via `description.playthroughNotes.labels.*`. The per-status / per-level value labels (`description.playthrough.{blind,replay,…}`, `description.difficulty.{easy,normal,…}`) are kept — the new block reads them for the "Run type" and "Difficulty" bullet values.
- **`ContentDetailsForm.tsx`** — superseded by `PlaythroughNotesForm.tsx`.

### Under the hood

- New `src/config/tech-note-groups.ts` carries the 5-group UI structure (`audio` / `video_quality` / `recording_issues` / `playstyle` / `production`). Engine doesn't read groups — output follows selection order — but the editor uses them to render collapsible sections.
- New `src/config/playthrough-options.ts` exports `LANGUAGE_PATCH_UI_OPTIONS` / `GAME_VERSION_UI_OPTIONS` (Select-friendly `{id, labelKey}` shapes) plus `languagePatchHasCustomSlot` / `gameVersionHasCustomSlot` predicates so the editor knows when to show the paired custom-text input.
- `src/engine/types.ts` adds `LANGUAGE_PATCH_OPTIONS` / `LanguagePatch`, `GAME_VERSION_OPTIONS` / `GameVersion`, `TECH_NOTES` / `TechNote` const-and-type pairs, plus six new optional fields on `GeneratorInput`.
- All 6 locales (en / vi / ja / es / ko / zh) updated with `description.playthroughNotes.{header,intro,labels,languagePatchOptions,gameVersionOptions}` + `description.techNotes.{header,intro,items}` (24 items) + matching editor short labels (`editor.playthroughNotes.*`, `editor.techNoteOptions.*`, `editor.techNoteGroups.*`). `validate:locales` clean at 585 ui + 316 templates per locale.
- Engine tests grow by 14 cases: PN block bullet formatting (en single-language, all five filled), PN block omission when every field is empty, regression that the old standalone `🎯 Playthrough:` and `🎮 DIFFICULTY` lines no longer render, custom-difficulty label passthrough, custom-difficulty blank-label skip, PN bilingual VI mode, PN with `languagePatch: official_other` + custom slot, PN with `gameVersion: custom` + custom slot, TN selection-order preservation, TN bilingual VI / JA modes, TN single-language fallback when `tEn` omitted, TN block omission when list is empty. Plus a new `tests/store/editor-store.migrate.test.ts` with 9 cases covering the v9→v10 migration: default back-fills, preservation of existing playthrough / difficulty / contentWarnings, invalid enum coercion, unknown tech-note id filtering, idempotency on a v10 blob, and null / undefined handling. Full suite: 329 / 329 green.
- Bundle: main chunk 345.85 KB raw / 115.78 KB gzipped (under the 500 KB constraint).

### Migration notes

- No manual action required. First launch after upgrade migrates state in place: pre-v0.12 drafts gain the new PN + TN field defaults; existing `playthroughStatus` / `difficulty` keep their values, the description just renders them under the unified PN header now.
- The Tauri single-instance fix only takes effect after a fresh install of the v0.12 build; existing v0.11 desktop installs need to be uninstalled / replaced. Web builds are unaffected.

## v0.11.0 — 2026-05-06

Three independent features: vendor-aware graphics dropdowns (DLAA + XeSS Ultra Quality joined the ladder, multipliers cap per vendor), a third-party advertising block driven by a per-profile copy field, and a major content-warning overhaul — the v0.7 trio (`spoilerWarning` / `matureWarning` toggles + 3-item checklist) becomes a unified bilingual checklist of 44 items across 5 categories with `EN · output-language` rendering and asterisk-masked Vietnamese terms for YouTube ToS safety.

### Added

- **Vendor-aware upscaling & frame-gen options** — when the creator picks an FG vendor, the upscale-quality and frame-gen-multiplier dropdowns filter to that vendor's actual ladder. NVIDIA exposes DLAA + Quality / Balanced / Performance / Ultra Performance and goes up to x4 multi-frame-gen; AMD keeps FSR Native AA + 4 quality bins and caps at x3 (FSR 3.1); Intel adds XeSS Ultra Quality (its own tier) and ships only x2 (XeFG). Description-builder uses vendor-keyed full labels — `NVIDIA DLAA`, `AMD FSR Quality`, `Intel XeSS Ultra Quality`, `AMD Fluid Motion Frames x3` — instead of the old "brand prefix in code" pattern, so `dlaa` reads `NVIDIA DLAA` not `NVIDIA DLSS DLAA`. Pre-v0.11 drafts / presets / templates with stale combos (e.g. NVIDIA + `native_aa`) coerce to `none` on rehydrate via `coerceUpscaleQuality` + `coerceFrameGenMultiplier` in `src/engine/graphics-vendor.ts`.
- **Third-party advertising block** — new `showThirdPartyAds` toggle in Settings → Description renders a `🤝 SPONSORS & PARTNERS` block in the description, sourced from a new `thirdPartyAdText` Textarea on the channel Profile (multi-line preserved verbatim). Block is gated on toggle ON AND profile field non-empty; toggling on without text is a no-op and surfaces an inline hint pointing the user to Profiles → Edit. Per-profile (not per-video) — partner copy is channel-stable.
- **Bilingual content-warning checklist** — replaces `WarningToggles` with `ContentWarningChecklist`: a searchable, collapsible-grouped checkbox grid covering 44 items across Spoilers / Photosensitive / Phobias / Mental health / Mature & Sensitive. Description format becomes `▸ ⚠️ CONTENT WARNINGS / CẢNH BÁO NỘI DUNG` header (bilingual when output language ≠ English), a two-line intro, then bullets `• {EN} · {local}` separated by U+00B7 MIDDLE DOT — matches the visual format in the v0.11 spec exactly. Selection order is preserved in the rendered output. Vietnamese translations apply asterisk masking on YouTube-ToS-prone terms (`t* tử`, `x*m h*i t*nh d*c`, `g*ết người`, `b*o h*nh`, `ng*y h*i`); other locales use clinical wording (`Sexual assault references`, `Self-harm / suicide themes`, `Violence against minors`).

### Changed

- **Editor store** v8 → v9 (three concerns rolled into one bump): `thirdPartyAdText: ""` default, legacy `spoilerWarning: true` → push `"spoiler_story"` into `contentWarnings` (same for `matureWarning` → `"mature_18plus"`), and vendor-incompatible upscale-quality / multiplier combos coerce to `"none"`. `normalizeEditorPatch` runs the same coercion + boolean-merge logic on every `loadProfile` / `loadPreset` / `loadTemplate` call so legacy snapshots round-trip cleanly.
- **Settings store** v8 → v9 (additive — `showThirdPartyAds: false` default; healed via `initialSettings` spread).
- **Profile store** unversioned → v1 (additive — `thirdPartyAdText: ""` back-fill for pre-v0.11 profiles).
- **Template store** unversioned → v1 (vendor-quality coercion on persisted snapshots).
- **`UPSCALE_QUALITIES`** enum gains `"dlaa"` and `"ultra_quality"`. The flat enum stays — vendor filtering happens at the UI / engine layer via `getValidUpscaleQualities(vendor)` so storage shape doesn't fork per vendor.
- **`ContentDetailsForm`** drops its content-warning ChipGroup (the new `ContentWarningChecklist` mounted in the Editor's Content Details accordion is the new home). Playthrough + difficulty stay where they were.
- **`description-builder`** drops the v0.7 "skip brand on second mention" optimization — both halves of `upscale + framegen` now carry the brand. Worth the mild verbosity for AMD / Intel: AMD's frame-gen brand is `Fluid Motion Frames` (not `Frame Generation`), Intel's is `XeFG`; the old code emitted `Frame Generation` regardless. The 3 separate warning blocks (`spoilerWarning` header, `contentWarnings` bullet list, `matureWarning` header) collapse into one unified bilingual block, placed at the same description position.

### Removed

- **`WarningToggles.tsx`** — superseded by `ContentWarningChecklist.tsx`. Editor-state fields `spoilerWarning` / `matureWarning` stay (marked `@deprecated`) so v8-shaped persisted drafts round-trip through the migration without data loss; they're no longer exposed in the UI and no longer drive description rendering.
- **`description.sections.spoilerWarning` / `matureWarning` / `contentWarnings`** template keys — section heading lives at `description.contentWarnings.header` now. The old per-warning `description.contentWarnings.{flashing_lights,loud_noises,jump_scares}` keys moved under `description.contentWarnings.items.*` alongside 41 new entries.

### Under the hood

- New `src/engine/graphics-vendor.ts` exports `getValidUpscaleQualities` / `getValidFrameGenMultipliers` / `coerceUpscaleQuality` / `coerceFrameGenMultiplier` — pure functions reused by the editor-store migration, the template-store migration, `normalizeEditorPatch`, the `VideoSettingsForm` Select option lists, and the `handleVendorChange` reset path so changing vendors mid-edit doesn't leave the Selects stuck on a stale value.
- New `src/config/content-warning-groups.ts` carries the 5-group UI structure (`spoilers` / `photosensitive` / `phobias` / `mental_health` / `sensitive`). Engine never reads the groups — output ordering follows user selection — but the editor uses them to render collapsible sections with per-group counts so 44 items stay scannable.
- `BuildDescriptionOptions` extends with `tEn?: TranslationFn` — the engine stays framework-agnostic; the caller (`use-generated-output`) builds it via `i18next.getFixedT("en", "templates")` and passes it in alongside the locale-fixed `t`. Falls back to `t` when omitted, so existing callers / unit tests keep working.
- All 6 locales (en / vi / ja / es / ko / zh) updated with vendor-keyed `description.graphics.upscale.{vendor}.{q}` + `description.graphics.frameGen.{vendor}.{m}` maps, vendor-keyed editor short labels (`editor.upscaleQuality.{vendor}.*` / `editor.frameGenMultiplier.{vendor}.*`), 5 group headings, 44 bilingual warning items, 44 short editor labels, plus `settings.showThirdPartyAds` / `settings.thirdPartyAdsHint` and `profiles.thirdPartyAdText{,Placeholder,Help}`. `validate:locales` clean at 529 ui + 274 templates per locale.
- Engine tests grow by 9 cases: vendor-aware DLAA / XeSS Ultra Quality / AMD label rendering, content-warning bilingual EN · VI block, EN-only single-language output, single-language fallback when `tEn` is omitted, censoring snapshot for VI, third-party-ads gating (toggle on + text non-empty, toggle off + text non-empty, toggle on + text empty), multi-line preservation, and selection-order preservation. Two legacy-deprecation tests replace the old `spoilerWarning` / `matureWarning` standalone-block tests. Full suite: 310 / 310 green.
- Bundle: main chunk 313 KB (under the 500 KB constraint).

### Migration notes

- No manual action required. First launch after upgrade migrates state in place: pre-v0.11 drafts with `spoilerWarning: true` / `matureWarning: true` get the equivalent items checked in `contentWarnings`; vendor-incompatible upscale combos coerce to `none`; profile / settings stores back-fill their new defaults.
- Channel partners / affiliates: the toggle in Settings → Description does nothing until you fill `Third-party ad copy` in your profile (Profiles → Edit). The inline hint in Settings calls this out when the toggle is on but the text is empty.

## v0.10.0 — 2026-05-05

Three independent features shipped in [#44](https://github.com/poli0981/youtube-generator/pull/44): a publisher-name tag for the Store Links editor, a hotfix for the live web build that had been serving a blank page since the v0.5 scaffold, and a vertical collapsible sidebar with a new About page.

### Added

- **Pub/Dev Name → tag** ([#44](https://github.com/poli0981/youtube-generator/pull/44)) — when the `Publisher / Developer site` URL is filled in, a free-text "Pub/Dev Name" input appears underneath. Whatever the user types becomes a bare YouTube tag (e.g. `Ubisoft`, `FromSoftware`) via the existing dedup + 30-char trim pipeline. Independent from `sponsorName` / `sponsorPlatform`, which still drive the description's "🎁 Thanks to …" line — different semantic, different output.
- **Vertical collapsible sidebar** ([#44](https://github.com/poli0981/youtube-generator/pull/44)) — replaces the horizontal top tab bar. Hamburger toggle (`PanelLeftClose` / `PanelLeftOpen` from lucide), `w-56 ↔ w-14` width transition, persisted across reloads via the settings store. `Ctrl+B` shortcut wired (VS Code convention) and surfaced in the keyboard help cheatsheet.
- **About page** ([#44](https://github.com/poli0981/youtube-generator/pull/44)) — new `/about` route with app metadata (version pulled live from `package.json`), repo / issues / author / license links, configurable social links (YouTube / X / Discord / Ko-fi / Patreon — empty entries hide their row), and a third-party credits list with versions read live from `package.json` deps. shadcn/ui evaluated and skipped — would have forced a 10+ component retrofit and a token-system swap (`--background` / `--foreground` / `--primary`) for one feature.

### Fixed

- **GitHub Pages white page** ([#44](https://github.com/poli0981/youtube-generator/pull/44)) — the deployed site at `https://poli0981.github.io/youtube-generator/` was blank because Vite's `base` was hardcoded to `/yt-desc-gen/` (an old project name carried over from the v0.5 scaffold). Every asset 404'd. Aligning the base with the actual repo name unblocks the live web build. `public/.nojekyll` added defensively.

### Changed

- **Editor store** v7 → v8 (additive — `pubDevName: ""` default).
- **Settings store** v7 → v8 (additive — `sidebarCollapsed: false` default; healed automatically through `initialSettings` spread).
- **AppShell** layout changed from `flex flex-col` (`Header` / `TabBar` / `main`) to a left-sidebar / right-pane (`Sidebar` / `Header` / `main`). Header stays at the top of the right pane.

### Under the hood

- `tag-generator.ts` gains a `pubDevName` step before the dedup pass; reuses `tagFriendlyGameName(name, 30)` for the per-tag char limit. 4 new tag-generator tests cover emission, empty / whitespace skip, dedup against `sponsorName`, and over-long truncation.
- `TabBar.tsx` renamed to `Sidebar.tsx` (`git mv` to preserve blame).
- New `src/config/about.ts` (single source of truth for app metadata + socials) and `src/config/third-party.ts` (credits with versions auto-derived from `package.json`).
- All 6 locales (en / vi / ja / es / ko / zh) updated with `editor.pubDevName` + `editor.pubDevNamePlaceholder` (F1), plus `tabs.about`, `sidebar.{expand,collapse}`, the full `about.*` namespace including `about.socials.*`, and `shortcuts.toggleSidebar` (F3). `validate:locales` clean at 448 / 448 keys.
- Full suite: 301 tests green; main bundle 277 KB.

### Migration notes

- No manual action required. First launch after upgrade heals any missing keys in place.
- Pre-v0.10 drafts get `pubDevName: ""` and `sidebarCollapsed: false` by default — the fields only become visible once the user fills the publisher URL or toggles the sidebar.

## v0.9.0 — 2026-05-03

Two-phase release. Phase 1 covered the gacha video type and four new URL extractors with a typed-name-mismatch banner; phase 2 wrapped the version with a QoL trio and a four-platform CI release matrix. PRs that landed: [#37](https://github.com/poli0981/youtube-generator/pull/37) (phase 1 B2), [#40](https://github.com/poli0981/youtube-generator/pull/40) (phase 1 B1, re-ship of #38), [#41](https://github.com/poli0981/youtube-generator/pull/41) (phase 2).

### Added

- **Gacha-quest video type** ([#40](https://github.com/poli0981/youtube-generator/pull/40)) — new `VideoType: "gacha_quest"` with a 17-value `gachaQuestType` enum grouped by use case (Story / Events / Tutorial-Trial / Endgame-Multiplayer / Showcase) plus free-form `chapterName` and `questName` extras. `partNumber` is reused, with the suffix wording driven by quest type — `main_story` → `"- Part N"`, `anniversary` + `daily_commission` → `"- Day N"`, `endgame` → `"- Floor N"`, every other quest type drops the suffix. Per-quest-type title format and intro template, single shared pinned-comment greeting.
- **4 new URL extractors** ([#37](https://github.com/poli0981/youtube-generator/pull/37)) — Epic Games Store (locale-prefixed `/p/<slug>`, strips trailing 6+-char hex hash), Nintendo US (`/us/store/products/<slug>`, strips `-switch` / `-switch-2` platform suffix), Nintendo EU (`/<locale>/Games/<segment>/<slug>-<id>.html`, strips trailing numeric id), and Humble Bundle. PlayStation / Xbox / Amazon Luna stay unsupported because their canonical URLs use opaque product IDs.
- **Name-mismatch warning banner** ([#37](https://github.com/poli0981/youtube-generator/pull/37)) — `StoreLinkEditor` shows a reactive banner above the platform grid when any filled link extracts to a name whose tokens aren't a subset of the typed Game Name. New `isLinkNameMismatch(gameName, url)` helper applies a subset-tolerant token comparison; apostrophes are stripped (not spaced) so `Marvel's` matches `Marvels` in Steam slugs. Per-pair dismissal (`gameName|url` fingerprint); banner re-shows automatically when either side changes.
- **Keyboard-shortcuts cheatsheet** ([#41](https://github.com/poli0981/youtube-generator/pull/41)) — bare `?` key now opens the existing modal (Ctrl+/ still works); the `?` handler skips firing when the keydown target is an input / textarea / select / contentEditable element. The modal grows a search input that filters by translated label OR by the literal key combo string.
- **Genre selector search + bulk-toggle** ([#41](https://github.com/poli0981/youtube-generator/pull/41)) — case-insensitive substring filter above the chip group, plus three bulk-select buttons ("All RPGs" / "All Shooters" / "All Horror") that replace the current selection with the first `MAX_GENRES` (3) ids of the matching `GENRE_GROUPS` entry. Filter clears on bulk-toggle.

### Changed

- **Editor store** v6 → v7 (additive — gacha extras `gachaQuestType` / `chapterName` / `questName`).
- **TemplateSnapshot** — extends with the gacha extras as optional so legacy templates load cleanly.

### CI / Release

- **`release-desktop.yml`** ([#41](https://github.com/poli0981/youtube-generator/pull/41)) grows from a Windows-only build to a four-entry matrix: `windows-latest`, `macos-13` (Intel), `macos-14` (ARM), `ubuntu-latest`. `fail-fast: false` so one platform breaking doesn't cancel the others. Linux runner installs `libwebkit2gtk-4.1-dev` + companions for Tauri's webview + AppImage tooling. `tauri-action@v0` collects all artifacts onto a single draft GitHub Release named `YTDescGen v__VERSION__`. No code signing; release notes come from the tag message.

### Under the hood

- New `src/config/gacha-quest-types.ts` houses the 17-value enum, display-order grouping, and the per-quest-type partNumber suffix style map (`GACHA_PART_SUFFIX_STYLES`).
- New `src/config/genres.ts:GENRE_GROUPS` typed `Record<GenreGroupId, readonly GenreId[]>` drives the bulk-toggle buttons.
- All 6 locales updated: 428 ui + 203 template keys each (up from 391 + 164 in v0.8). en + vi fully translated; ja / es / ko / zh seeded with English placeholders for the new strings.
- Full suite: 297 tests green; main bundle 270 KB.

### Migration notes

- No manual action required. First launch after upgrade heals any missing keys in place.
- Pre-v0.9 drafts get `gachaQuestType: "main_story"` and empty `chapterName` / `questName` defaults. The fields only matter when `videoType === "gacha_quest"`.

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
