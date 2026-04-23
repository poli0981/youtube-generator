import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { generateId } from "@utils/uuid";
import { saveSettings } from "@utils/storage-adapter";
import type { VideoType, Genre, SupportedLanguage, StoreLinkType } from "@engine/types";

/**
 * Full snapshot of the editor form. Matches the `partialize` output of
 * editor-store so a template can be applied back via `loadProfile` /
 * `loadPreset` (both accept `Partial<EditorData>`) and restore every
 * field the creator had set.
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
  resolution: string;
  fps: string;
  graphicsPreset: string;
  timestamps: string;
  playlistLink: string;
  contactEmail: string;
  musicAttribution: string;
  thumbnailText: string;
  pinnedComment: string;
  spoilerWarning: boolean;
  matureWarning: boolean;
  storeLinks: Record<string, string>;
  storeLinkTypes: Record<string, StoreLinkType>;
  social: Record<string, string>;
  rig: Record<string, string>;
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
      partialize: (state) => ({ templates: state.templates }),
    },
  ),
);

useTemplateStore.subscribe((state) => {
  saveSettings(STORE_KEY, { templates: state.templates });
});
