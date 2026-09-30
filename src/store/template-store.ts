import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { generateId } from "@utils/uuid";
import type { EditorData } from "@store/editor-store";
import type { FrameGenVendor, FrameGenMultiplier, UpscaleQuality } from "@config/graphics-settings";
import { coerceUpscaleQuality, coerceFrameGenMultiplier } from "@engine/graphics-vendor";
import { migrateRig } from "@config/rig-fields";

/**
 * A snapshot of the editor form. Since v1.0.0 a template saves every editor
 * field (`editorDataOf`); templates saved before that carry a subset, and
 * applying one leaves the missing fields alone. Legacy values (free-text
 * `graphicsPreset`, `spoilerWarning`…) are mapped by
 * `editor-store.normalizeEditorPatch` when the template is applied.
 */
export type TemplateSnapshot = Partial<EditorData>;

export interface EditorTemplate {
  id: string;
  name: string;
  createdAt: string;
  /** v1.0.0. Missing on older templates — treat `createdAt` as the last change. */
  updatedAt?: string;
  snapshot: TemplateSnapshot;
}

interface TemplateState {
  templates: EditorTemplate[];
  addTemplate: (name: string, snapshot: TemplateSnapshot) => string;
  updateTemplate: (id: string, data: { name?: string; snapshot?: TemplateSnapshot }) => void;
  deleteTemplate: (id: string) => void;
  getTemplate: (id: string) => EditorTemplate | undefined;
}

const STORE_KEY = "ytdescgen-templates";

/**
 * v0 (unversioned) → v1: v0.11 added vendor-specific filtering on
 * upscaleQuality / frameGenMultiplier. A snapshot saved before v0.11 may
 * carry e.g. `frameGenVendor: "nvidia"` + `upscaleQuality: "native_aa"`
 * (no longer a valid combo since DLSS uses `dlaa`); coerce invalid pairs to
 * "none" so applying it doesn't push a stale value into the editor's Select.
 * v1 → v2: v1.0.0 GPU catalog (`brand|series|model` → `gpu:<id>`).
 */
export const TEMPLATE_STORE_VERSION = 2;

/** The persist migration, shared with backup import. Every step is idempotent. */
export function migrateTemplatesState(persistedState: unknown, version: number): unknown {
  if (!persistedState || typeof persistedState !== "object") return persistedState;
  const state = persistedState as { templates?: Array<{ snapshot?: unknown }> };
  if (!Array.isArray(state.templates)) return persistedState;
  for (const tpl of state.templates) {
    const snap = tpl?.snapshot;
    if (!snap || typeof snap !== "object") continue;
    const s = snap as Record<string, unknown>;
    if (version < 1) {
      const vendor = (
        typeof s.frameGenVendor === "string" ? s.frameGenVendor : "none"
      ) as FrameGenVendor;
      if (typeof s.upscaleQuality === "string") {
        s.upscaleQuality = coerceUpscaleQuality(vendor, s.upscaleQuality as UpscaleQuality);
      }
      if (typeof s.frameGenMultiplier === "string") {
        s.frameGenMultiplier = coerceFrameGenMultiplier(
          vendor,
          s.frameGenMultiplier as FrameGenMultiplier,
        );
      }
    }
    if (version < 2) s.rig = migrateRig(s.rig);
  }
  return persistedState;
}

export const useTemplateStore = create<TemplateState>()(
  persist(
    (set, get) => ({
      templates: [],

      addTemplate: (name, snapshot) => {
        const id = generateId();
        const now = new Date().toISOString();
        const template: EditorTemplate = {
          id,
          name: name.trim() || "Untitled",
          createdAt: now,
          updatedAt: now,
          snapshot,
        };
        set((state) => ({ templates: [...state.templates, template] }));
        return id;
      },

      updateTemplate: (id, { name, snapshot }) => {
        set((state) => ({
          templates: state.templates.map((tpl) =>
            tpl.id === id
              ? {
                  ...tpl,
                  name: name?.trim() || tpl.name,
                  snapshot: snapshot ?? tpl.snapshot,
                  updatedAt: new Date().toISOString(),
                }
              : tpl,
          ),
        }));
      },

      deleteTemplate: (id) => {
        set((state) => ({ templates: state.templates.filter((tpl) => tpl.id !== id) }));
      },

      getTemplate: (id) => get().templates.find((tpl) => tpl.id === id),
    }),
    {
      name: STORE_KEY,
      storage: createJSONStorage(() => localStorage),
      version: TEMPLATE_STORE_VERSION,
      migrate: (persistedState, version) =>
        migrateTemplatesState(persistedState, version) as { templates: EditorTemplate[] },
      partialize: (state) => ({ templates: state.templates }),
    },
  ),
);
