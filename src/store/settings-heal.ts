import type { GenreId } from "@config/genres";
import type { SupportedLanguage, TitleFormatConfig } from "@engine/types";

// Re-exported so the persist layer can import it alongside the heal helpers.
export type { TitleFormatConfig } from "@engine/types";

/**
 * Shape of the settings payload that is persisted to disk + localStorage.
 * Kept separate from the zustand store type so pure helpers (like
 * {@link healSettings}) can run in any environment — the store itself
 * pulls in browser-only modules (`window`, Tauri bridges) that break
 * when imported from a Node-based test runner.
 */
export interface SettingsData {
  appLanguage: SupportedLanguage;
  defaultOutputLanguage: SupportedLanguage;
  theme: "dark" | "light";
  showCharCount: boolean;
  compactTagDisplay: boolean;
  historyLimit: number;
  includeMultilingualTags: boolean;
  includeTrendingTags: boolean;
  hashtagCount: number;
  showQualityBadge: boolean;
  showCopyright: boolean;
  showUsagePolicy: boolean;
  showSponsorCredit: boolean;
  /**
   * v0.21.0 opt-in toggle. When true and the current editor has a
   * non-empty `pubDevName`, the description emits a single
   * `© {publisher}. All rights reserved.` line right after the Store
   * Links block. Used by creators covering games whose dev/publisher
   * contractually requires a copyright credit in the description.
   * Default off — see the help text in `settings.showGameCopyright.help`.
   */
  showGameCopyright: boolean;
  /**
   * When true, the description renders a "🤝 SPONSORS & PARTNERS" block
   * containing the active profile's `thirdPartyAdText`. Off by default
   * (v0.11) — opt-in so existing users don't see a new block after
   * upgrade without asking for it. The block is also skipped when the
   * profile field is empty, so flipping this toggle without filling the
   * profile is a no-op (the SettingsPage shows an inline hint to that
   * effect).
   */
  showThirdPartyAds: boolean;
  /**
   * v0.24.0 opt-in toggle. When true, descriptions generated in a
   * language outside the trusted set (English / Vietnamese, which are
   * human-reviewed) get an AI-translation disclaimer block. Off by
   * default so existing users don't see a new block after upgrade.
   */
  showTranslationQuality: boolean;
  /**
   * v0.34.0 opt-in toggle. When true, the description's contact block
   * splits into up to three labeled lines by purpose — general
   * (`contactEmail`), advertising / sponsorship (`adEmail`), and game
   * keys & playtest (`gameKeyEmail`) — and the editor exposes the two
   * extra fields. Off by default so existing users keep the single
   * "📧 Business inquiries" line and see no new fields after upgrade.
   */
  splitContactEmail: boolean;
  /**
   * When true, Output + Batch render a generated pinned-comment
   * template alongside the user's freeform pinnedComment field. Default
   * off — the template is opt-in, so v0.6 users don't see a new block
   * appear after upgrade without asking for it.
   */
  showPinnedCommentTemplate: boolean;
  /**
   * Child toggle for {@link showPinnedCommentTemplate}. When true (the
   * default), the generated template includes the "what game should I
   * play next?" prompt. Creators running a fixed series can turn this
   * off without disabling the whole template.
   */
  pinnedCommentIncludeAskNextGame: boolean;
  /**
   * Child toggle for {@link showPinnedCommentTemplate}. When true and the
   * primary genre has a configured playlist URL in {@link genrePlaylists},
   * the generated pinned comment includes a "More <genre> gameplay on the
   * channel" line pointing at that playlist. v0.8 phase 2.
   */
  pinnedCommentIncludeGenrePlaylist: boolean;
  /**
   * Per-genre YouTube playlist URLs. Configure once in Settings → Genre
   * Playlists, then the pinned-comment template auto-suggests the
   * matching playlist based on the video's primary genre. Validated
   * against {@link validatePlaylistUrl}; empty rows are not persisted.
   * v0.8 phase 2.
   */
  genrePlaylists: Partial<Record<GenreId, string>>;
  titleFormat: TitleFormatConfig;
  editorAccordionState: Record<string, boolean>;
  /**
   * Vertical sidebar collapsed state (v0.10). When true, the left
   * sidebar shows icons only; expanded shows icon + label. Toggled by
   * the hamburger button or `Ctrl+B`. Persisted across reloads so
   * narrow-screen users don't keep collapsing on every visit.
   */
  sidebarCollapsed: boolean;
  /**
   * How many days of log history to keep on disk / in localStorage
   * (v0.17.0). Files older than this are deleted at app boot.
   * Default 7 — long enough to investigate week-ago issues, short
   * enough to keep the AppData folder small. Clamped to `[1, 90]`
   * by `healSettings`.
   */
  logRetentionDays: number;
  /**
   * v0.28.0 legal consent. The `CURRENT_TERMS_VERSION` (see
   * `@config/legal`) the user last accepted on the first-run consent gate.
   * `0` = never accepted → the gate shows. Bumped via `acceptLegalConsent`;
   * re-shows whenever `CURRENT_TERMS_VERSION` is raised (terms changed).
   * Persisted inside the existing `ytdescgen-settings` record — no cookie,
   * no new storage key. A malformed value is coerced to `0` by
   * {@link healSettings} so a corrupt file re-shows the gate, never skips it.
   */
  legalConsentVersion: number;
  /** ISO timestamp of the most recent acceptance, or `null`. Audit-only. */
  legalConsentAt: string | null;
  /**
   * v0.35.0 "Strict Mode". When on, Generate / Copy / Export are blocked
   * while any field carries a hard validation **error** — a malformed URL, an
   * invalid or over-cap email address, or output past a YouTube character
   * limit.
   *
   * Soft warnings never block. `validateUrlWithPrefix` returns
   * `{ valid: true, error }` for a link that works but doesn't match the
   * platform's usual prefix; treating that as fatal would strand anyone using
   * a vanity domain or a regional mirror.
   *
   * Off by default: the app's whole premise is getting a description out
   * quickly, and an opt-in seatbelt is the right shape for someone who
   * publishes in bulk and would rather be stopped than fix it after upload.
   */
  strictMode: boolean;
  /**
   * Which Settings sections are expanded. Mirrors `editorAccordionState`,
   * separately keyed so the two pages can't clobber each other. Unknown ids
   * default to OPEN here (the editor defaults them closed) — a section added
   * in a later version must not vanish for an existing user whose persisted
   * map predates it.
   */
  settingsAccordionState: Record<string, boolean>;
}

function detectBrowserLanguage(): SupportedLanguage {
  if (typeof navigator === "undefined") return "en";
  const tag = navigator.language;
  // Region-qualified locales must be matched on the FULL tag before the bare
  // language, or `pt-BR` would be reduced to `pt` and never found. Currently
  // pt-BR is the only such locale; a future `pt-PT` would slot in beside it.
  const REGIONAL: SupportedLanguage[] = ["pt-BR"];
  const exact = REGIONAL.find((s) => s.toLowerCase() === tag.toLowerCase());
  if (exact) return exact;
  // Any other Portuguese variant still gets Brazilian Portuguese rather than
  // English — closer than the fallback, and the only Portuguese we ship.
  if (tag.toLowerCase().startsWith("pt")) return "pt-BR";
  const base = tag.split("-")[0];
  const supported: SupportedLanguage[] = ["en", "vi", "ja", "es", "ko", "zh", "id"];
  return (supported.find((s) => s === base) ?? "en") as SupportedLanguage;
}

/**
 * Single source of truth for settings defaults. Evaluated once at module
 * load so detection (e.g. browser language) happens before any rehydrate.
 */
export const initialSettings: SettingsData = {
  appLanguage: detectBrowserLanguage(),
  defaultOutputLanguage: detectBrowserLanguage(),
  theme: "dark",
  showCharCount: true,
  compactTagDisplay: false,
  historyLimit: 100,
  includeMultilingualTags: true,
  includeTrendingTags: true,
  hashtagCount: 3,
  showQualityBadge: true,
  showCopyright: true,
  showUsagePolicy: false,
  showSponsorCredit: false,
  showGameCopyright: false,
  showThirdPartyAds: false,
  showTranslationQuality: false,
  splitContactEmail: false,
  showPinnedCommentTemplate: false,
  pinnedCommentIncludeAskNextGame: true,
  pinnedCommentIncludeGenrePlaylist: false,
  genrePlaylists: {},
  titleFormat: {
    // Defaults reproduce v0.6 output byte-for-byte: badge glued to the
    // video-type segment, em-dash separator, upper-case badge label.
    badgePosition: "middle",
    separator: "emDash",
    badgeCase: "upper",
  },
  editorAccordionState: {
    gameInfo: true,
    videoSettings: true,
    contentDetails: false,
    attribution: false,
    rig: false,
    storeAndSocial: false,
  },
  sidebarCollapsed: false,
  logRetentionDays: 7,
  legalConsentVersion: 0,
  legalConsentAt: null,
  strictMode: false,
  settingsAccordionState: {
    // Only Genre Playlists starts collapsed — it renders one input per genre
    // (42 of them), which is by far the tallest block on the page. Everything
    // else keeps its current always-visible behaviour; the accordion is an
    // affordance here, not a default.
    appearance: true,
    defaults: true,
    editorSettings: true,
    guardrails: true,
    titleFormat: true,
    description: true,
    tags: true,
    genrePlaylists: false,
    history: true,
    logs: true,
  },
};

/**
 * Normalise persisted settings so missing keys are back-filled with the
 * current defaults, legacy shapes are upgraded, and removed keys are
 * stripped. Runs on every rehydrate so a hand-edited or partially-written
 * `settings.json` can never leave the store in an incomplete state.
 *
 * Pure — safe to call from unit tests.
 */
export function healSettings(raw: unknown): SettingsData {
  if (!raw || typeof raw !== "object") return { ...initialSettings };

  const incoming = { ...(raw as Record<string, unknown>) };

  // v0.22.0: `defaultGenre` and `defaultGenres` were both removed from
  // Settings — the editor never had a way to read them. Strip both
  // legacy keys so the spread on the way out doesn't leak them back
  // into the store as untyped dead state.
  delete incoming.defaultGenre;
  delete incoming.defaultGenres;

  // v2 → v3: `autoSaveDraft` removed (the draft autosaves unconditionally
  // via the editor store's persist middleware, so the toggle was dead).
  delete incoming.autoSaveDraft;

  // v4 → v5: `titleFormat` nested config added. Merge sub-keys defensively
  // so a hand-edited / partial object doesn't drop defaults and leave
  // downstream consumers with `undefined` badgePosition etc.
  const incomingTf =
    typeof incoming.titleFormat === "object" && incoming.titleFormat !== null
      ? (incoming.titleFormat as Partial<TitleFormatConfig>)
      : {};
  incoming.titleFormat = { ...initialSettings.titleFormat, ...incomingTf };

  // v6 → v7: `genrePlaylists` map and `pinnedCommentIncludeGenrePlaylist`
  // toggle added (v0.8 phase 2). Defensive merge for the nested map so
  // existing entries survive while missing genres fall through to {}.
  const incomingGp =
    typeof incoming.genrePlaylists === "object" && incoming.genrePlaylists !== null
      ? (incoming.genrePlaylists as Partial<Record<GenreId, string>>)
      : {};
  incoming.genrePlaylists = { ...initialSettings.genrePlaylists, ...incomingGp };

  // v9 → v10: v0.17.0. `logRetentionDays` added (default 7). Clamp
  // to [1, 90] so an extreme value can't either spam the disk or
  // wipe everything on boot.
  if (typeof incoming.logRetentionDays === "number") {
    incoming.logRetentionDays = Math.max(1, Math.min(90, Math.floor(incoming.logRetentionDays)));
  }

  // v0.28.0: `legalConsentVersion` added. A non-number / non-finite / negative
  // value must fall through to "never accepted" (0) so a corrupt or
  // hand-edited file re-shows the consent gate rather than silently skipping
  // it. (Additive — the trailing spread back-fills legacy payloads to 0.)
  if (
    typeof incoming.legalConsentVersion !== "number" ||
    !Number.isFinite(incoming.legalConsentVersion)
  ) {
    incoming.legalConsentVersion = initialSettings.legalConsentVersion;
  } else {
    incoming.legalConsentVersion = Math.max(0, Math.floor(incoming.legalConsentVersion));
  }

  // v11 → v12: v0.35.0. `strictMode` added. Coerced rather than merely
  // back-filled: a hand-edited `"strictMode": "yes"` is truthy in JS and would
  // silently turn the seatbelt on, which is the opposite of an opt-in.
  if (typeof incoming.strictMode !== "boolean") {
    incoming.strictMode = initialSettings.strictMode;
  }

  // v11 → v12: `settingsAccordionState` added. Merged like `titleFormat` and
  // `genrePlaylists` so a persisted map from an older version keeps the
  // sections the user collapsed while picking up defaults for any section
  // added since.
  const incomingSa =
    typeof incoming.settingsAccordionState === "object" && incoming.settingsAccordionState !== null
      ? (incoming.settingsAccordionState as Record<string, boolean>)
      : {};
  incoming.settingsAccordionState = {
    ...initialSettings.settingsAccordionState,
    ...incomingSa,
  };

  return { ...initialSettings, ...incoming } as SettingsData;
}
