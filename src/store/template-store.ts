import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { generateId } from "@utils/uuid";
import { saveSettings } from "@utils/storage-adapter";
import type {
  VideoType,
  Genre,
  SupportedLanguage,
  StoreLinkType,
  PlaythroughStatus,
  DifficultyLevel,
  ContentWarning,
} from "@engine/types";
import type {
  GraphicsPreset,
  RTMode,
  FrameGenVendor,
  FrameGenMultiplier,
  UpscaleQuality,
  ArtStyle,
} from "@config/graphics-settings";
import {
  coerceUpscaleQuality,
  coerceFrameGenMultiplier,
} from "@engine/graphics-vendor";
import type { GachaQuestType } from "@config/gacha-quest-types";

/**
 * Full snapshot of the editor form. Matches the `partialize` output of
 * editor-store so a template can be applied back via `loadProfile` /
 * `loadPreset` (both accept `Partial<EditorData>`) and restore every
 * field the creator had set.
 *
 * Pre-v0.8 snapshots persisted `graphicsPreset` as free-form text. The
 * type here uses the v0.8 enum — TS believes legacy strings like "Ultra"
 * are `GraphicsPreset`, but `editor-store.normalizeEditorPatch` runs on
 * `loadProfile` / `loadPreset` and maps them through the same logic as
 * the persist v4→v5 migration, so behaviour is correct at runtime.
 */
export interface TemplateSnapshot {
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
  /** Long-form mod credit list (v0.8 polish). Optional for back-compat. */
  modList?: string;
  /** Livestream-only (v0.8 phase 2). Optional for back-compat. */
  liveUrl?: string;
  scheduledTime?: string;
  /** Gacha-quest extras (v0.9 phase 1). Optional for back-compat. */
  gachaQuestType?: GachaQuestType;
  chapterName?: string;
  questName?: string;
  resolution: string;
  fps: string;
  graphicsPreset: GraphicsPreset;
  /** v0.8 phase 2 fields — optional for back-compat with pre-v0.8 templates. */
  graphicsPresetCustom?: string;
  skipGraphicsSettings?: boolean;
  rayTracingModes?: RTMode[];
  frameGenVendor?: FrameGenVendor;
  frameGenMultiplier?: FrameGenMultiplier;
  upscaleQuality?: UpscaleQuality;
  artStyle?: ArtStyle;
  versionInfo?: string;
  timestamps: string;
  playlistLink: string;
  contactEmail: string;
  musicAttribution: string;
  thumbnailText: string;
  pinnedComment: string;
  spoilerWarning: boolean;
  matureWarning: boolean;
  /**
   * v0.7 phase 2 fields. Marked optional because templates saved before
   * v0.8 polish don't carry them; `loadProfile` spreads `...patch` onto
   * the editor state, so missing keys keep the editor's existing values.
   */
  playthroughStatus?: PlaythroughStatus;
  difficulty?: DifficultyLevel;
  difficultyCustomLabel?: string;
  contentWarnings?: ContentWarning[];
  storeLinks: Record<string, string>;
  storeLinkTypes: Record<string, StoreLinkType>;
  social: Record<string, string>;
  rig: Record<string, string>;
  /** Vietnam donate (v0.8 polish). Optional for back-compat. */
  vnBankName?: string;
  vnBankAccount?: string;
  vnBankHolder?: string;
  vnMomo?: string;
  vnZalopay?: string;
  /** Channel-level third-party advertising copy (v0.11). Optional for
   *  back-compat with pre-v0.11 templates. */
  thirdPartyAdText?: string;
}

export interface EditorTemplate {
  id: string;
  name: string;
  createdAt: string;
  snapshot: TemplateSnapshot;
}

interface TemplateState {
  templates: EditorTemplate[];
  addTemplate: (name: string, snapshot: TemplateSnapshot) => string;
  deleteTemplate: (id: string) => void;
  renameTemplate: (id: string, name: string) => void;
  getTemplate: (id: string) => EditorTemplate | undefined;
  importTemplates: (templates: EditorTemplate[]) => void;
}

const STORE_KEY = "ytdescgen-templates";

export const useTemplateStore = create<TemplateState>()(
  persist(
    (set, get) => ({
      templates: [],

      addTemplate: (name, snapshot) => {
        const id = generateId();
        const template: EditorTemplate = {
          id,
          name: name.trim() || "Untitled",
          createdAt: new Date().toISOString(),
          snapshot,
        };
        set((state) => ({ templates: [...state.templates, template] }));
        return id;
      },

      deleteTemplate: (id) => {
        set((state) => ({ templates: state.templates.filter((tpl) => tpl.id !== id) }));
      },

      renameTemplate: (id, name) => {
        set((state) => ({
          templates: state.templates.map((tpl) =>
            tpl.id === id ? { ...tpl, name: name.trim() || tpl.name } : tpl,
          ),
        }));
      },

      getTemplate: (id) => get().templates.find((tpl) => tpl.id === id),

      importTemplates: (templates) => {
        set((state) => {
          const existing = new Set(state.templates.map((tpl) => tpl.id));
          const incoming = templates.filter((tpl) => !existing.has(tpl.id));
          return { templates: [...state.templates, ...incoming] };
        });
      },
    }),
    {
      name: STORE_KEY,
      storage: createJSONStorage(() => localStorage),
      // v0 (unversioned) → v1: v0.11 added vendor-specific filtering on
      // upscaleQuality / frameGenMultiplier. A snapshot saved before
      // v0.11 may carry e.g. `frameGenVendor: "nvidia"` +
      // `upscaleQuality: "native_aa"` (no longer a valid combo since
      // DLSS uses `dlaa`). Coerce invalid pairs to "none" so loadPreset
      // doesn't push a stale value into the editor's Select. The
      // editor's own normalizeEditorPatch repeats this coercion as a
      // belt-and-suspenders measure.
      version: 1,
      migrate: (persistedState: unknown, version: number) => {
        if (!persistedState || typeof persistedState !== "object") return persistedState;
        if (version < 1) {
          const state = persistedState as { templates?: EditorTemplate[] };
          if (Array.isArray(state.templates)) {
            for (const tpl of state.templates) {
              const snap = tpl.snapshot as TemplateSnapshot;
              const vendor = (snap.frameGenVendor ?? "none") as FrameGenVendor;
              if (snap.upscaleQuality) {
                snap.upscaleQuality = coerceUpscaleQuality(vendor, snap.upscaleQuality);
              }
              if (snap.frameGenMultiplier) {
                snap.frameGenMultiplier = coerceFrameGenMultiplier(
                  vendor,
                  snap.frameGenMultiplier,
                );
              }
            }
          }
        }
        return persistedState as { templates: EditorTemplate[] };
      },
      partialize: (state) => ({ templates: state.templates }),
    },
  ),
);

useTemplateStore.subscribe((state) => {
  saveSettings(STORE_KEY, { templates: state.templates });
});
