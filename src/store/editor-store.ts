import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  VideoType,
  Genre,
  SupportedLanguage,
  StoreLinkType,
  PlaythroughStatus,
  DifficultyLevel,
  ContentWarning,
  LanguagePatch,
  GameVersion,
  TechNote,
  EndingEntry,
  EndingVideoRange,
} from "@engine/types";
import {
  LANGUAGE_PATCH_OPTIONS,
  GAME_VERSION_OPTIONS,
  TECH_NOTES,
} from "@engine/types";
import {
  GRAPHICS_PRESETS,
  type GraphicsPreset,
  type RTMode,
  type FrameGenVendor,
  type FrameGenMultiplier,
  type UpscaleQuality,
  type ArtStyle,
} from "@config/graphics-settings";
import { isVideoStyleEra, type VideoStyleEra } from "@config/video-styles";
import {
  coerceUpscaleQuality,
  coerceFrameGenMultiplier,
} from "@engine/graphics-vendor";
import {
  GACHA_QUEST_TYPES,
  DEFAULT_GACHA_QUEST_TYPE,
  type GachaQuestType,
} from "@config/gacha-quest-types";
import {
  PLAYTEST_PLATFORMS,
  PLAYTEST_MAX_INVITES_CAP,
  DEFAULT_PLAYTEST_PLATFORM,
} from "@config/playtest-platforms";
import { DEFAULTS } from "@config/defaults";

export interface EditorData {
  videoType: VideoType;
  language: SupportedLanguage;
  genres: Genre[];
  gameName: string;
  gameNameLocalized: Record<string, string>;
  channelName: string;
  platform: string;
  partNumber: string;
  bossName: string;
  dlcName: string;
  challengeName: string;
  modName: string;
  modList: string;
  liveUrl: string;
  scheduledTime: string;
  gachaQuestType: GachaQuestType;
  chapterName: string;
  questName: string;
  /** Gacha-quest character name (v0.13) — used for `showcase` quest type. */
  characterName: string;
  /** Gacha-quest anniversary year (v0.13) — 1–20 or null. */
  anniversaryYear: number | null;
  /** Gacha-quest game version (v0.13) — e.g. "1.2", "2.4". Only used for gacha_quest videoType. */
  gachaVersion: string;
  resolution: string;
  fps: string;
  graphicsPreset: GraphicsPreset;
  graphicsPresetCustom: string;
  skipGraphicsSettings: boolean;
  rayTracingModes: RTMode[];
  frameGenVendor: FrameGenVendor;
  frameGenMultiplier: FrameGenMultiplier;
  upscaleQuality: UpscaleQuality;
  artStyle: ArtStyle;
  /**
   * Video-style era opt-in (v0.22.0). When non-empty, the description
   * renderer emits a one-line "Edited in {era} style using {video_editor}"
   * credit. Empty string = off. See `@config/video-styles` for the list
   * of valid eras and the {@link isVideoStyleEra} coercion helper used
   * by the v13 → v14 migration.
   *
   * Renders independently of `skipGraphicsSettings` — creators of 2D /
   * pixel-art games still edit their footage, so the style line should
   * survive when the graphics block is suppressed.
   */
  videoStyleEra: VideoStyleEra;
  versionInfo: string;
  timestamps: string;
  playlistLink: string;
  contactEmail: string;
  musicAttribution: string;
  sponsorName: string;
  sponsorPlatform: string;
  pubDevName: string;
  thirdPartyAdText: string;
  thumbnailText: string;
  pinnedComment: string;
  /** @deprecated v0.11 — merged into `contentWarnings` (spoiler_story).
   *  Field retained on state so persisted v8 drafts round-trip through
   *  the v8→v9 migration without dropping data; the editor UI no longer
   *  exposes a toggle for it. */
  spoilerWarning: boolean;
  /** @deprecated v0.11 — merged into `contentWarnings` (mature_18plus). */
  matureWarning: boolean;
  playthroughStatus: PlaythroughStatus;
  difficulty: DifficultyLevel;
  difficultyCustomLabel: string;
  /**
   * Free-text endings descriptor for Playthrough Notes (v0.12).
   * @deprecated v0.16.0 — kept on the type for migration round-trip,
   *   but the editor UI no longer reads or writes this field. Persisted
   *   v0.12–v0.15 drafts get lifted into a single-row `endings` entry
   *   by `migrateEditorState` v11 → v12.
   */
  endingsShown: string;
  /**
   * Structured ending list (v0.16.0). Empty array = "no endings to
   * declare"; the description renderer falls back to the legacy
   * `endingsShown` freeform only when this array is empty AND the
   * legacy string is non-empty (covers post-migration drafts that
   * still carry both). Editor cap is 100 rows.
   */
  endings: EndingEntry[];
  /**
   * Number of separate videos the playthrough is split across
   * (v0.16.0). Always 1 when `endings.length <= 1`. Editor input
   * clamps to `[1, endings.length]`.
   */
  endingVideoCount: number;
  /**
   * Per-video ending range (v0.16.0). 1-indexed inclusive bounds into
   * `endings[]`. Length always equals `endingVideoCount`; auto-derived
   * as a contiguous balanced split on edit, persisted so the creator
   * can override.
   */
  endingVideoRanges: EndingVideoRange[];
  /**
   * Which per-video slice the Output page should preview (v0.17.1).
   * 1-indexed to match the user-facing "Video 1, Video 2…" labels.
   * Only meaningful when `endingVideoCount > 1`; in single-video
   * mode the index is ignored and the engine renders the union.
   *
   * Stored on the editor (vs. derived per-render) so the creator's
   * choice survives page navigation — flipping to Profiles and back
   * shouldn't reset the preview to video 1.
   */
  endingVideoIndex: number;
  /** Language-patch enum for Playthrough Notes (v0.12). */
  languagePatch: LanguagePatch;
  /** Free-form label paired with `languagePatch === "official_other" | "custom"`. */
  languagePatchCustom: string;
  /** Game-version enum for Playthrough Notes (v0.12). */
  gameVersion: GameVersion;
  /** Free-form label paired with `gameVersion === "custom"`. */
  gameVersionCustom: string;
  contentWarnings: ContentWarning[];
  /** Tech / production / playstyle disclaimer checklist items (v0.12). */
  techNotes: TechNote[];
  storeLinks: Record<string, string>;
  storeLinkTypes: Record<string, StoreLinkType>;
  social: Record<string, string>;
  rig: Record<string, string>;
  vnBankName: string;
  vnBankAccount: string;
  vnBankHolder: string;
  vnMomo: string;
  vnZalopay: string;
  /** Playtest signup link (v0.30.0). Empty = no Playtest description block. */
  playtestLink: string;
  /** Playtest platform id (see `@config/playtest-platforms`). */
  playtestPlatform: string;
  /** Playtest invites available — 0 = unset; clamped to the platform max (≤100). */
  playtestInvites: number;
  /** Messenger community invite link (v0.32.0). Empty = no community line. */
  messengerCommunityLink: string;
  /** Zalo group invite link (v0.32.0). Rendered into the description only for Vietnamese output. */
  zaloGroupLink: string;
  /** Signal group invite link (v0.33.0). `https://signal.group/#<id>`. All languages. */
  signalGroupLink: string;
  /** Instagram group-chat invite link (v0.33.0). `https://www.instagram.com/j/<id>` or `https://ig.me/j/<id>`. All languages. */
  instagramGroupLink: string;
  /** Facebook group invite link (v0.33.0). `https://facebook.com/groups/<id>`. Moved here from the generic `social` map. */
  facebookGroupLink: string;
}

/**
 * Map a free-form pre-v0.8 `graphicsPreset` string ("Ultra", "Very High",
 * "Epic"…) to the v0.8 enum. Anything unrecognised is captured into the
 * Custom slot rather than dropped, so an existing draft round-trips
 * lossless through the migration. Exported for unit tests.
 */
export function legacyGraphicsPresetToEnum(legacy: string): {
  preset: GraphicsPreset;
  custom: string;
} {
  const trimmed = legacy.trim();
  if (!trimmed) return { preset: "medium", custom: "" };
  const normalised = trimmed.toLowerCase();
  const known = GRAPHICS_PRESETS.find(
    (p) => p !== "custom" && p.replace(/_/g, " ") === normalised,
  );
  if (known) return { preset: known, custom: "" };
  return { preset: "custom", custom: trimmed };
}

/**
 * Normalise a partial editor patch coming from a profile / preset /
 * template snapshot. Reused by `loadProfile` and `loadPreset` so legacy
 * string `graphicsPreset` values from before v0.8 are mapped through the
 * same logic as the persist-store v4→v5 migration. Pre-v0.8 snapshots
 * declare `graphicsPreset: string` rather than the v0.8 enum, which TS
 * accepts via structural compatibility — we sniff the runtime value here
 * via an `unknown` cast.
 */
function normalizeEditorPatch(
  patch: Partial<EditorData> | null | undefined,
): Partial<EditorData> {
  // v0.15.0: guard against malformed input. Previously a `null` patch
  // — typically from an imported template whose `snapshot` field was
  // null/undefined — reached the spread on the next line and threw
  // "Cannot convert undefined or null to object", which bubbled out of
  // `set()` as an unhandled render error and black-screened the app.
  // Returning an empty patch lets the caller's `{ ...state, ...patch }`
  // become a no-op instead of crashing.
  if (!patch || typeof patch !== "object") return {};
  const out: Partial<EditorData> = { ...patch };
  const raw: unknown = (patch as { graphicsPreset?: unknown }).graphicsPreset;
  if (typeof raw === "string" && !(GRAPHICS_PRESETS as readonly string[]).includes(raw)) {
    const { preset, custom } = legacyGraphicsPresetToEnum(raw);
    out.graphicsPreset = preset;
    if (typeof patch.graphicsPresetCustom !== "string") {
      out.graphicsPresetCustom = custom;
    }
  }
  // v0.11: when a profile / preset / template carries an upscale-quality
  // or frame-gen multiplier that's no longer valid for the chosen vendor
  // (DLSS lost `native_aa`, FSR lost `dlaa`, etc.), coerce to "none" so
  // the editor doesn't end up with a Select stuck on a value missing
  // from its options. The vendor itself is left as-is.
  const vendor =
    typeof patch.frameGenVendor === "string" ? patch.frameGenVendor : undefined;
  if (vendor) {
    if (typeof patch.upscaleQuality === "string") {
      out.upscaleQuality = coerceUpscaleQuality(vendor, patch.upscaleQuality);
    }
    if (typeof patch.frameGenMultiplier === "string") {
      out.frameGenMultiplier = coerceFrameGenMultiplier(vendor, patch.frameGenMultiplier);
    }
  }
  // v0.11: legacy `spoilerWarning` / `matureWarning` booleans on profiles
  // / presets / templates need to be expressed as checklist items in the
  // unified `contentWarnings` array. Merge them in (preserving any
  // existing entries) so loading a pre-v0.11 preset still surfaces the
  // warning the creator originally selected.
  const cwSrc: unknown = (patch as { contentWarnings?: unknown }).contentWarnings;
  if (
    (patch as { spoilerWarning?: boolean }).spoilerWarning === true ||
    (patch as { matureWarning?: boolean }).matureWarning === true
  ) {
    const seed = Array.isArray(cwSrc) ? [...(cwSrc as ContentWarning[])] : [];
    if (
      (patch as { spoilerWarning?: boolean }).spoilerWarning === true &&
      !seed.includes("spoiler_story")
    ) {
      seed.push("spoiler_story");
    }
    if (
      (patch as { matureWarning?: boolean }).matureWarning === true &&
      !seed.includes("mature_18plus")
    ) {
      seed.push("mature_18plus");
    }
    out.contentWarnings = seed;
    out.spoilerWarning = false;
    out.matureWarning = false;
  }
  // v0.33.0: Facebook Group moved from the generic `social` map to the
  // dedicated `facebookGroupLink` community field. A profile / preset /
  // template snapshot saved before the move still carries the value under
  // `social.fb_group`; lift it so applying the snapshot doesn't silently
  // drop the link. Don't override an explicit `facebookGroupLink` in the
  // patch. The stale `social.fb_group` entry is harmless at render time
  // (it's no longer in SOCIAL_FIELDS, so the Social block filters it out).
  const socialPatch: unknown = (patch as { social?: unknown }).social;
  if (socialPatch && typeof socialPatch === "object") {
    const legacyFbGroup = (socialPatch as Record<string, unknown>).fb_group;
    if (
      typeof legacyFbGroup === "string" &&
      legacyFbGroup.trim() !== "" &&
      typeof out.facebookGroupLink !== "string"
    ) {
      out.facebookGroupLink = legacyFbGroup;
    }
  }
  return out;
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

type EditorState = EditorData & EditorActions;

const initialState: EditorData = {
  videoType: DEFAULTS.editor.videoType as VideoType,
  language: DEFAULTS.editor.language as SupportedLanguage,
  genres: [...DEFAULTS.editor.genres] as Genre[],
  gameName: DEFAULTS.editor.gameName,
  gameNameLocalized: { ...DEFAULTS.editor.gameNameLocalized },
  channelName: DEFAULTS.editor.channelName,
  platform: DEFAULTS.editor.platform,
  partNumber: DEFAULTS.editor.partNumber,
  bossName: DEFAULTS.editor.bossName,
  dlcName: DEFAULTS.editor.dlcName,
  challengeName: DEFAULTS.editor.challengeName,
  modName: DEFAULTS.editor.modName,
  modList: DEFAULTS.editor.modList,
  liveUrl: DEFAULTS.editor.liveUrl,
  scheduledTime: DEFAULTS.editor.scheduledTime,
  gachaQuestType: DEFAULTS.editor.gachaQuestType,
  chapterName: DEFAULTS.editor.chapterName,
  questName: DEFAULTS.editor.questName,
  characterName: DEFAULTS.editor.characterName,
  anniversaryYear: DEFAULTS.editor.anniversaryYear,
  gachaVersion: DEFAULTS.editor.gachaVersion,
  resolution: DEFAULTS.editor.resolution,
  fps: DEFAULTS.editor.fps,
  graphicsPreset: DEFAULTS.editor.graphicsPreset,
  graphicsPresetCustom: DEFAULTS.editor.graphicsPresetCustom,
  skipGraphicsSettings: DEFAULTS.editor.skipGraphicsSettings,
  rayTracingModes: [...DEFAULTS.editor.rayTracingModes],
  frameGenVendor: DEFAULTS.editor.frameGenVendor,
  frameGenMultiplier: DEFAULTS.editor.frameGenMultiplier,
  upscaleQuality: DEFAULTS.editor.upscaleQuality,
  artStyle: DEFAULTS.editor.artStyle,
  videoStyleEra: DEFAULTS.editor.videoStyleEra,
  versionInfo: DEFAULTS.editor.versionInfo,
  timestamps: DEFAULTS.editor.timestamps,
  playlistLink: DEFAULTS.editor.playlistLink,
  contactEmail: DEFAULTS.editor.contactEmail,
  musicAttribution: DEFAULTS.editor.musicAttribution,
  sponsorName: DEFAULTS.editor.sponsorName,
  sponsorPlatform: DEFAULTS.editor.sponsorPlatform,
  pubDevName: DEFAULTS.editor.pubDevName,
  thirdPartyAdText: DEFAULTS.editor.thirdPartyAdText,
  thumbnailText: DEFAULTS.editor.thumbnailText,
  pinnedComment: DEFAULTS.editor.pinnedComment,
  spoilerWarning: DEFAULTS.editor.spoilerWarning,
  matureWarning: DEFAULTS.editor.matureWarning,
  playthroughStatus: DEFAULTS.editor.playthroughStatus as PlaythroughStatus,
  difficulty: DEFAULTS.editor.difficulty as DifficultyLevel,
  difficultyCustomLabel: DEFAULTS.editor.difficultyCustomLabel,
  endingsShown: DEFAULTS.editor.endingsShown,
  endings: [...DEFAULTS.editor.endings] as EndingEntry[],
  endingVideoCount: DEFAULTS.editor.endingVideoCount,
  endingVideoRanges: [...DEFAULTS.editor.endingVideoRanges] as EndingVideoRange[],
  endingVideoIndex: DEFAULTS.editor.endingVideoIndex,
  languagePatch: DEFAULTS.editor.languagePatch,
  languagePatchCustom: DEFAULTS.editor.languagePatchCustom,
  gameVersion: DEFAULTS.editor.gameVersion,
  gameVersionCustom: DEFAULTS.editor.gameVersionCustom,
  contentWarnings: [...DEFAULTS.editor.contentWarnings] as ContentWarning[],
  techNotes: [...DEFAULTS.editor.techNotes] as TechNote[],
  storeLinks: { ...DEFAULTS.editor.storeLinks },
  storeLinkTypes: { ...DEFAULTS.editor.storeLinkTypes },
  social: { ...DEFAULTS.editor.social },
  rig: { ...DEFAULTS.editor.rig },
  vnBankName: DEFAULTS.editor.vnBankName,
  vnBankAccount: DEFAULTS.editor.vnBankAccount,
  vnBankHolder: DEFAULTS.editor.vnBankHolder,
  vnMomo: DEFAULTS.editor.vnMomo,
  vnZalopay: DEFAULTS.editor.vnZalopay,
  playtestLink: DEFAULTS.editor.playtestLink,
  playtestPlatform: DEFAULTS.editor.playtestPlatform,
  playtestInvites: DEFAULTS.editor.playtestInvites,
  messengerCommunityLink: DEFAULTS.editor.messengerCommunityLink,
  zaloGroupLink: DEFAULTS.editor.zaloGroupLink,
  signalGroupLink: DEFAULTS.editor.signalGroupLink,
  instagramGroupLink: DEFAULTS.editor.instagramGroupLink,
  facebookGroupLink: DEFAULTS.editor.facebookGroupLink,
};

export const useEditorStore = create<EditorState>()(
  persist(
    (set) => ({
      ...initialState,

      set: (key, value) => set({ [key]: value }),

      setNested: (group, key, value) =>
        set((state) => ({
          [group]: { ...state[group], [key]: value },
        })),

      setStoreLinkType: (platformId, type) =>
        set((state) => ({
          storeLinkTypes: { ...state.storeLinkTypes, [platformId]: type },
        })),

      // `normalizeEditorPatch` now null-guards internally (v0.15.0) so
      // a malformed profile / template snapshot is treated as a no-op
      // rather than crashing the render. The action signature still
      // requires a non-null patch in TypeScript — runtime safety covers
      // the persisted-blob case where types lie.
      loadProfile: (profile) =>
        set((state) => ({ ...state, ...normalizeEditorPatch(profile) })),

      loadPreset: (preset) =>
        set((state) => ({ ...state, ...normalizeEditorPatch(preset) })),

      reset: () => set(initialState),
    }),
    {
      name: "ytdescgen-editor-draft",
      storage: createJSONStorage(() => localStorage),
      // v1 → v2: `genre: Genre` became `genres: Genre[]` in v0.5.
      // v2 → v3: sponsor credit fields added in v0.6.
      // v3 → v4: playthroughStatus / difficulty / difficultyCustomLabel /
      //         contentWarnings added in v0.7 phase 2. Missing entries
      //         fall back to the spread of `initialState`, but we still
      //         normalise the blob here so legacy drafts round-trip
      //         cleanly through the engine.
      // v4 → v5: graphics-settings v2 (v0.8 phase 2). Free-form
      //         `graphicsPreset` text became an enum + `Custom` field;
      //         RT modes, frame-gen vendor + multiplier, upscaling
      //         quality, art style, version info, and the livestream
      //         extras (liveUrl, scheduledTime) joined the schema.
      //         Missing fields fall through to `initialState`, but
      //         legacy `graphicsPreset` text needs explicit mapping so
      //         "Ultra"-era drafts don't end up with an enum value
      //         outside the GraphicsPreset literal union.
      // v5 → v6: v0.8 polish. Vietnam-specific donate fields
      //         (vnBankName / vnBankAccount / vnBankHolder / vnMomo /
      //         vnZalopay) and a long-form modList textarea joined the
      //         schema. All additive — empty-string defaults round-trip
      //         cleanly without any value mapping.
      // v6 → v7: v0.9 phase 1. Gacha-quest extras
      //         (gachaQuestType / chapterName / questName) joined the
      //         schema. Additive — pre-v0.9 drafts get the
      //         `"main_story"` default for the enum + empty strings for
      //         the free-form labels.
      // v7 → v8: v0.10. `pubDevName` (free-text publisher / developer
      //         label paired with the Publisher / Developer site URL)
      //         joined the schema. Additive — empty-string default
      //         round-trips cleanly.
      // v8 → v9: v0.11. Three concerns rolled into one bump:
      //         1. `thirdPartyAdText` (per-profile partner / affiliate
      //            copy) joined the schema with empty-string default.
      //         2. The unified `contentWarnings` checklist replaced
      //            standalone `spoilerWarning` / `matureWarning` boolean
      //            toggles. Pre-v0.11 drafts with either boolean = true
      //            are translated into checklist items
      //            (`spoiler_story` / `mature_18plus`) so the equivalent
      //            warning still renders after upgrade.
      //         3. UPSCALE_QUALITIES / FRAMEGEN_MULTIPLIERS gained
      //            vendor-specific filtering. A persisted draft with
      //            e.g. `frameGenVendor: "nvidia"` + `upscaleQuality:
      //            "native_aa"` is no longer a valid combo (DLSS uses
      //            `dlaa`); coerce invalid pairs to `"none"` so the
      //            editor Select doesn't render with a stale value.
      // v9 → v10: v0.12. Playthrough Notes section consolidated the v0.7
      //         standalone "🎯 Playthrough" + "🎮 DIFFICULTY" blocks into
      //         a single `▸ 🎮 PLAYTHROUGH NOTES` description block, and
      //         added three new structured fields (`endingsShown`,
      //         `languagePatch` + custom, `gameVersion` + custom). A new
      //         `techNotes` checklist (`▸ 🛠 TECH NOTES`) sits after
      //         content warnings. Migration is purely additive — the
      //         existing `playthroughStatus` / `difficulty` /
      //         `difficultyCustomLabel` values are preserved; only the
      //         description-builder render path changed.
      // v11 → v12: v0.16.0. Free-form `endingsShown` string is being
      //         superseded by a structured `endings` array of
      //         {number, name} entries plus `endingVideoCount` +
      //         `endingVideoRanges` for multi-video splits. Migration
      //         lifts the legacy string into a single-row
      //         `endings` entry so the renderer (which now reads
      //         the array first, falls back to the freeform when the
      //         array is empty) produces identical output for
      //         existing drafts.
      // v12 → v13: v0.17.1. `endingVideoIndex` joined the schema —
      //         which per-video slice the Output preview renders
      //         when `endingVideoCount > 1`. Additive — defaults to
      //         1; the rehydrate spread of `initialState` covers the
      //         back-fill for pre-v0.17.1 drafts.
      // v10 → v11: v0.13. Gacha-quest gained three new structured fields:
      //         `characterName` (used for the Showcase quest type, replacing
      //         chapter/quest in templates), `anniversaryYear` (1–20 number
      //         used by the Anniversary quest type), and `gachaVersion`
      //         (free-form game version like "1.2"). All additive — empty
      //         / null defaults round-trip cleanly.
      // v13 → v14: v0.22.0. `videoStyleEra` joined the schema — an opt-in
      //         era / aesthetic descriptor that combines with
      //         `rig.video_editor` to emit a one-line style credit in the
      //         description. Additive — defaults to `""` (off); the
      //         migration defensively coerces unrecognised values to `""`
      //         so a hand-edited blob or downgrade from a future version
      //         can't leave the Select stuck on a missing option.
      // v14 → v15: v0.30.0. Playtest section — `playtestLink`,
      //         `playtestPlatform`, `playtestInvites` joined the schema.
      //         Additive: empty link / default platform / 0 invites
      //         back-fill. The migration coerces an unknown platform id to
      //         the default and clamps the invite count to an integer in
      //         [0, 100], so a hand-edited blob can't strand the editor's
      //         platform Select or number input on a bad value.
      // v15 → v16: v0.32.0. Community links — `messengerCommunityLink`
      //         (`https://m.me/ch/<id>`) and `zaloGroupLink`
      //         (`https://zalo.me/g/<code>`) joined the schema. Additive:
      //         both back-fill to "". Messenger renders for every output
      //         language; the Zalo line only renders for Vietnamese output.
      //         Non-string values coerce to "".
      // v16 → v17: v0.33.0. Community expansion — `signalGroupLink`
      //         (`https://signal.group/#<id>`), `instagramGroupLink` (the
      //         Instagram group-chat invite), and `facebookGroupLink`
      //         (`https://facebook.com/groups/<id>`) joined the schema, all
      //         rendered for every output language. Facebook Group also
      //         moved OUT of the generic `social` map: the migration lifts a
      //         legacy `social.fb_group` value into `facebookGroupLink` and
      //         drops the dead key. Other fields back-fill to "".
      version: 17,
      migrate: (persistedState, version) =>
        migrateEditorState(persistedState, version),
      partialize: (state) => ({
        videoType: state.videoType,
        language: state.language,
        genres: state.genres,
        gameName: state.gameName,
        gameNameLocalized: state.gameNameLocalized,
        channelName: state.channelName,
        platform: state.platform,
        partNumber: state.partNumber,
        bossName: state.bossName,
        dlcName: state.dlcName,
        challengeName: state.challengeName,
        modName: state.modName,
        modList: state.modList,
        liveUrl: state.liveUrl,
        scheduledTime: state.scheduledTime,
        gachaQuestType: state.gachaQuestType,
        chapterName: state.chapterName,
        questName: state.questName,
        characterName: state.characterName,
        anniversaryYear: state.anniversaryYear,
        gachaVersion: state.gachaVersion,
        resolution: state.resolution,
        fps: state.fps,
        graphicsPreset: state.graphicsPreset,
        graphicsPresetCustom: state.graphicsPresetCustom,
        skipGraphicsSettings: state.skipGraphicsSettings,
        rayTracingModes: state.rayTracingModes,
        frameGenVendor: state.frameGenVendor,
        frameGenMultiplier: state.frameGenMultiplier,
        upscaleQuality: state.upscaleQuality,
        artStyle: state.artStyle,
        videoStyleEra: state.videoStyleEra,
        versionInfo: state.versionInfo,
        timestamps: state.timestamps,
        playlistLink: state.playlistLink,
        contactEmail: state.contactEmail,
        musicAttribution: state.musicAttribution,
        sponsorName: state.sponsorName,
        sponsorPlatform: state.sponsorPlatform,
        pubDevName: state.pubDevName,
        thirdPartyAdText: state.thirdPartyAdText,
        thumbnailText: state.thumbnailText,
        pinnedComment: state.pinnedComment,
        spoilerWarning: state.spoilerWarning,
        matureWarning: state.matureWarning,
        playthroughStatus: state.playthroughStatus,
        difficulty: state.difficulty,
        difficultyCustomLabel: state.difficultyCustomLabel,
        endingsShown: state.endingsShown,
        endings: state.endings,
        endingVideoCount: state.endingVideoCount,
        endingVideoRanges: state.endingVideoRanges,
        endingVideoIndex: state.endingVideoIndex,
        languagePatch: state.languagePatch,
        languagePatchCustom: state.languagePatchCustom,
        gameVersion: state.gameVersion,
        gameVersionCustom: state.gameVersionCustom,
        contentWarnings: state.contentWarnings,
        techNotes: state.techNotes,
        storeLinks: state.storeLinks,
        storeLinkTypes: state.storeLinkTypes,
        social: state.social,
        rig: state.rig,
        vnBankName: state.vnBankName,
        vnBankAccount: state.vnBankAccount,
        vnBankHolder: state.vnBankHolder,
        vnMomo: state.vnMomo,
        vnZalopay: state.vnZalopay,
        playtestLink: state.playtestLink,
        playtestPlatform: state.playtestPlatform,
        playtestInvites: state.playtestInvites,
        messengerCommunityLink: state.messengerCommunityLink,
        zaloGroupLink: state.zaloGroupLink,
        signalGroupLink: state.signalGroupLink,
        instagramGroupLink: state.instagramGroupLink,
        facebookGroupLink: state.facebookGroupLink,
      }),
    },
  ),
);

/**
 * Editor-store persist migration (extracted from the inline `migrate`
 * config so it's directly testable). Each `if (version < N)` block
 * back-fills the schema delta introduced in version `N`. Exported so
 * tests can feed in a known persisted blob and assert the migrated
 * result without going through localStorage.
 */
export function migrateEditorState(
  persistedState: unknown,
  version: number,
): EditorData {
  if (!persistedState || typeof persistedState !== "object") {
    return { ...initialState };
  }
  const state = persistedState as Record<string, unknown> & {
    genre?: unknown;
    sponsorName?: unknown;
    sponsorPlatform?: unknown;
  };
  if (version < 2 && typeof state.genre === "string" && !Array.isArray(state.genres)) {
    state.genres = [state.genre];
    delete state.genre;
  }
  if (version < 3) {
    if (typeof state.sponsorName !== "string") state.sponsorName = "";
    if (typeof state.sponsorPlatform !== "string") state.sponsorPlatform = "";
  }
  if (version < 4) {
    if (typeof state.playthroughStatus !== "string") state.playthroughStatus = "none";
    if (typeof state.difficulty !== "string") state.difficulty = "none";
    if (typeof state.difficultyCustomLabel !== "string") {
      state.difficultyCustomLabel = "";
    }
    if (!Array.isArray(state.contentWarnings)) state.contentWarnings = [];
  }
  if (version < 5) {
    // Map legacy free-form preset text to the new enum + Custom slot.
    const legacy = typeof state.graphicsPreset === "string" ? state.graphicsPreset : "";
    const isAlreadyEnum = (GRAPHICS_PRESETS as readonly string[]).includes(legacy);
    if (!isAlreadyEnum) {
      const { preset, custom } = legacyGraphicsPresetToEnum(legacy);
      state.graphicsPreset = preset;
      if (typeof state.graphicsPresetCustom !== "string") {
        state.graphicsPresetCustom = custom;
      }
    } else if (typeof state.graphicsPresetCustom !== "string") {
      state.graphicsPresetCustom = "";
    }
    if (typeof state.skipGraphicsSettings !== "boolean") {
      state.skipGraphicsSettings = false;
    }
    if (!Array.isArray(state.rayTracingModes)) state.rayTracingModes = [];
    if (typeof state.frameGenVendor !== "string") state.frameGenVendor = "none";
    if (typeof state.frameGenMultiplier !== "string") state.frameGenMultiplier = "none";
    if (typeof state.upscaleQuality !== "string") state.upscaleQuality = "none";
    if (typeof state.artStyle !== "string") state.artStyle = "none";
    if (typeof state.versionInfo !== "string") state.versionInfo = "";
    if (typeof state.liveUrl !== "string") state.liveUrl = "";
    if (typeof state.scheduledTime !== "string") state.scheduledTime = "";
  }
  if (version < 6) {
    if (typeof state.modList !== "string") state.modList = "";
    if (typeof state.vnBankName !== "string") state.vnBankName = "";
    if (typeof state.vnBankAccount !== "string") state.vnBankAccount = "";
    if (typeof state.vnBankHolder !== "string") state.vnBankHolder = "";
    if (typeof state.vnMomo !== "string") state.vnMomo = "";
    if (typeof state.vnZalopay !== "string") state.vnZalopay = "";
  }
  if (version < 7) {
    const gqt = state.gachaQuestType;
    if (
      typeof gqt !== "string" ||
      !(GACHA_QUEST_TYPES as readonly string[]).includes(gqt)
    ) {
      state.gachaQuestType = DEFAULT_GACHA_QUEST_TYPE;
    }
    if (typeof state.chapterName !== "string") state.chapterName = "";
    if (typeof state.questName !== "string") state.questName = "";
  }
  if (version < 8) {
    if (typeof state.pubDevName !== "string") state.pubDevName = "";
  }
  if (version < 9) {
    // 1. New per-profile ads field — empty-string back-fill.
    if (typeof state.thirdPartyAdText !== "string") state.thirdPartyAdText = "";

    // 2. Merge legacy boolean toggles into the unified checklist.
    //    `Array.isArray` defensive — pre-v0.4 drafts that never
    //    saw the v3→v4 migration may still have a non-array here.
    const cw: ContentWarning[] = Array.isArray(state.contentWarnings)
      ? (state.contentWarnings as ContentWarning[])
      : [];
    if (state.spoilerWarning === true && !cw.includes("spoiler_story")) {
      cw.push("spoiler_story");
    }
    if (state.matureWarning === true && !cw.includes("mature_18plus")) {
      cw.push("mature_18plus");
    }
    state.contentWarnings = cw;
    state.spoilerWarning = false;
    state.matureWarning = false;

    // 3. Coerce vendor-incompatible upscale / frame-gen combos.
    const persistedVendor =
      typeof state.frameGenVendor === "string"
        ? (state.frameGenVendor as FrameGenVendor)
        : "none";
    state.upscaleQuality = coerceUpscaleQuality(
      persistedVendor,
      typeof state.upscaleQuality === "string"
        ? (state.upscaleQuality as UpscaleQuality)
        : "none",
    );
    state.frameGenMultiplier = coerceFrameGenMultiplier(
      persistedVendor,
      typeof state.frameGenMultiplier === "string"
        ? (state.frameGenMultiplier as FrameGenMultiplier)
        : "none",
    );
  }
  if (version < 10) {
    // Playthrough Notes new fields — empty / sentinel back-fill.
    if (typeof state.endingsShown !== "string") state.endingsShown = "";
    if (
      typeof state.languagePatch !== "string" ||
      !(LANGUAGE_PATCH_OPTIONS as readonly string[]).includes(state.languagePatch as string)
    ) {
      state.languagePatch = "none";
    }
    if (typeof state.languagePatchCustom !== "string") {
      state.languagePatchCustom = "";
    }
    if (
      typeof state.gameVersion !== "string" ||
      !(GAME_VERSION_OPTIONS as readonly string[]).includes(state.gameVersion as string)
    ) {
      state.gameVersion = "full_release";
    }
    if (typeof state.gameVersionCustom !== "string") {
      state.gameVersionCustom = "";
    }
    // Tech Notes checklist — empty array back-fill, with a defensive
    // filter so a hand-edited persistent blob with stale ids doesn't
    // crash the engine on first read.
    if (!Array.isArray(state.techNotes)) {
      state.techNotes = [];
    } else {
      state.techNotes = (state.techNotes as unknown[]).filter(
        (id): id is TechNote =>
          typeof id === "string" &&
          (TECH_NOTES as readonly string[]).includes(id),
      );
    }
  }
  if (version < 11) {
    // v0.13 Gacha additions — empty / null back-fill.
    if (typeof state.characterName !== "string") state.characterName = "";
    if (typeof state.gachaVersion !== "string") state.gachaVersion = "";
    const ay = state.anniversaryYear;
    if (typeof ay === "number" && Number.isInteger(ay) && ay >= 1 && ay <= 20) {
      state.anniversaryYear = ay;
    } else {
      state.anniversaryYear = null;
    }
  }
  if (version < 12) {
    // v0.16.0 ending redesign. Two concerns:
    //
    // 1. Lift the legacy `endingsShown` freeform into the structured
    //    `endings` array if no array is already present. The string is
    //    kept in place (the deprecated field still exists on
    //    EditorData) so a render path that's mid-migration won't lose
    //    data, but the structured renderer reads the array first.
    //
    // 2. Initialise the multi-video split fields. Default
    //    endingVideoCount = 1, ranges = single span covering all
    //    endings (or empty when endings.length === 0).
    if (!Array.isArray(state.endings)) {
      const legacy = typeof state.endingsShown === "string" ? state.endingsShown.trim() : "";
      state.endings = liftLegacyEndingString(legacy);
    }
    if (typeof state.endingVideoCount !== "number" || state.endingVideoCount < 1) {
      state.endingVideoCount = 1;
    }
    const endingsLen = (state.endings as EndingEntry[]).length;
    // Clamp video count to [1, endings.length || 1].
    state.endingVideoCount = Math.min(
      Math.max(1, state.endingVideoCount as number),
      endingsLen > 0 ? endingsLen : 1,
    );
    if (
      !Array.isArray(state.endingVideoRanges) ||
      (state.endingVideoRanges as EndingVideoRange[]).length !== state.endingVideoCount
    ) {
      state.endingVideoRanges =
        endingsLen === 0
          ? []
          : computeContiguousRanges(endingsLen, state.endingVideoCount as number);
    }
  }
  if (version < 13) {
    // v0.17.1 per-video Output selector. Clamp to [1, videoCount]
    // so a stale higher index (e.g. user shrank videoCount before
    // upgrade) doesn't slice off-the-end and surface a confusing
    // "empty video" preview.
    const vc = typeof state.endingVideoCount === "number" ? state.endingVideoCount : 1;
    const idx = typeof state.endingVideoIndex === "number" ? state.endingVideoIndex : 1;
    state.endingVideoIndex = Math.max(1, Math.min(vc, Math.floor(idx)));
  }
  if (version < 14) {
    // v0.22.0 video-style era. Coerce any unrecognised value back to ""
    // so the form Select never lands on an option that doesn't exist —
    // covers both pre-v0.22 drafts (no key) and hand-edited blobs.
    state.videoStyleEra = isVideoStyleEra(state.videoStyleEra)
      ? state.videoStyleEra
      : "";
  }
  if (version < 15) {
    // v0.30.0 Playtest section. Additive back-fill + defensive coercion.
    if (typeof state.playtestLink !== "string") state.playtestLink = "";
    if (
      typeof state.playtestPlatform !== "string" ||
      !PLAYTEST_PLATFORMS.some((p) => p.id === state.playtestPlatform)
    ) {
      state.playtestPlatform = DEFAULT_PLAYTEST_PLATFORM;
    }
    const inv = state.playtestInvites;
    state.playtestInvites =
      typeof inv === "number" && Number.isInteger(inv) && inv >= 0
        ? Math.min(inv, PLAYTEST_MAX_INVITES_CAP)
        : 0;
  }
  if (version < 16) {
    // v0.32.0 Community links. Additive back-fill + defensive coercion.
    if (typeof state.messengerCommunityLink !== "string") {
      state.messengerCommunityLink = "";
    }
    if (typeof state.zaloGroupLink !== "string") state.zaloGroupLink = "";
  }
  if (version < 17) {
    // v0.33.0 Community expansion. Additive back-fill + defensive coercion,
    // plus a lift of the legacy `social.fb_group` link into the new
    // dedicated `facebookGroupLink` field (Facebook Group moved out of the
    // generic Social map into the Community section).
    if (typeof state.signalGroupLink !== "string") state.signalGroupLink = "";
    if (typeof state.instagramGroupLink !== "string") {
      state.instagramGroupLink = "";
    }
    if (typeof state.facebookGroupLink !== "string") {
      state.facebookGroupLink = "";
    }
    const social = state.social;
    if (social && typeof social === "object") {
      const legacyFbGroup = (social as Record<string, unknown>).fb_group;
      if (
        typeof legacyFbGroup === "string" &&
        legacyFbGroup.trim() !== "" &&
        state.facebookGroupLink === ""
      ) {
        state.facebookGroupLink = legacyFbGroup;
      }
      // Drop the dead key so the moved link doesn't linger in `social`.
      delete (social as Record<string, unknown>).fb_group;
    }
  }
  return { ...initialState, ...state } as EditorData;
}

/**
 * Parse a legacy `endingsShown` freeform string into one structured
 * {@link EndingEntry} row. Recognises a handful of common shapes so
 * persisted v0.12–v0.15 drafts surface the same value after migration:
 *
 *   - "Ending 3: Best End"  → { number: 3, name: "Best End" }
 *   - "Ending 3"            → { number: 3, name: "" }
 *   - "True Ending"         → { number: null, name: "True Ending" }
 *   - ""                    → [] (no row)
 *
 * Anything that doesn't match the "Ending {N}: …" pattern falls
 * through to a single name-only row. Pure — exported for unit tests.
 */
export function liftLegacyEndingString(raw: string): EndingEntry[] {
  const trimmed = raw.trim();
  if (!trimmed) return [];
  // Match optional "Ending" prefix + number + optional ": rest" tail.
  // Case-insensitive on the keyword; localised variants ("kết thúc",
  // "エンディング", "结局") are accepted too. Anything else → name-only.
  const m = trimmed.match(
    /^(?:ending|kết\s+thúc|エンディング|final|엔딩|结局)\s*(\d+)\s*(?::\s*(.+))?\s*$/i,
  );
  if (m) {
    const num = parseInt(m[1] ?? "", 10);
    const name = (m[2] ?? "").trim();
    if (Number.isFinite(num)) {
      return [{ number: num, name }];
    }
  }
  return [{ number: null, name: trimmed }];
}

/**
 * Split an `endings.length` integer into `videoCount` contiguous
 * balanced 1-indexed inclusive ranges. Extra endings spill into the
 * tail videos: e.g. 7 endings / 3 videos → [[1,2],[3,4],[5,7]].
 *
 * Used by both the persist migration (initial range) and the
 * `ending-split.ts` UI utility (on user-driven count changes). Pure.
 */
export function computeContiguousRanges(
  endingsLength: number,
  videoCount: number,
): EndingVideoRange[] {
  if (endingsLength <= 0 || videoCount <= 0) return [];
  const safeCount = Math.min(videoCount, endingsLength);
  const base = Math.floor(endingsLength / safeCount);
  const rem = endingsLength % safeCount;
  const ranges: EndingVideoRange[] = [];
  let cursor = 1;
  for (let i = 0; i < safeCount; i++) {
    // Spill the remainder onto the *last* video, not the first — most
    // creators expect the early-ending videos to feel "lighter" than
    // the climactic final video, which justifies the convention.
    const size = base + (i === safeCount - 1 ? rem : 0);
    ranges.push({ from: cursor, to: cursor + size - 1 });
    cursor += size;
  }
  return ranges;
}
