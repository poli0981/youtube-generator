import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { generateId } from "@utils/uuid";
import { saveSettings } from "@utils/storage-adapter";
import type { GraphicsPreset } from "@config/graphics-settings";

/**
 * `graphicsPreset` was free-form text pre-v0.8. The type uses the v0.8
 * enum so call sites pass the value cleanly into `loadProfile` — TS
 * believes legacy strings like "Ultra" are valid enum values, but
 * `editor-store.normalizeEditorPatch` runs on load and maps them
 * through the same v4→v5 logic as the persist migration.
 *
 * v0.11: `thirdPartyAdText` joined the schema. Optional only on
 * persisted shapes — pre-v0.11 profiles get a `""` back-fill via the
 * profile-store v0→v1 migrate fn. Held on the profile (not per-video)
 * because partner / affiliate copy is channel-stable.
 *
 * v0.34.0: `adEmail` / `gameKeyEmail` joined the schema (the email-split
 * fields). Channel-stable business addresses, so persisted on the profile
 * like `contactEmail`. Pre-v0.34 profiles get a `""` back-fill via the
 * v1→v2 migrate fn.
 */
export interface Profile {
  id: string;
  name: string;
  channelName: string;
  contactEmail: string;
  adEmail: string;
  gameKeyEmail: string;
  social: Record<string, string>;
  rig: Record<string, string>;
  resolution: string;
  fps: string;
  graphicsPreset: GraphicsPreset;
  thirdPartyAdText: string;
  createdAt: string;
  updatedAt: string;
}

interface ProfileState {
  profiles: Profile[];
  addProfile: (data: Omit<Profile, "id" | "createdAt" | "updatedAt">) => string;
  updateProfile: (
    id: string,
    data: Partial<Omit<Profile, "id" | "createdAt" | "updatedAt">>,
  ) => void;
  deleteProfile: (id: string) => void;
  getProfile: (id: string) => Profile | undefined;
  importProfiles: (profiles: Profile[]) => void;
}

export const useProfileStore = create<ProfileState>()(
  persist(
    (set, get) => ({
      profiles: [],

      addProfile: (data) => {
        const id = generateId();
        const now = new Date().toISOString();
        const profile: Profile = { ...data, id, createdAt: now, updatedAt: now };
        set((state) => ({ profiles: [...state.profiles, profile] }));
        return id;
      },

      updateProfile: (id, data) => {
        set((state) => ({
          profiles: state.profiles.map((p) =>
            p.id === id ? { ...p, ...data, updatedAt: new Date().toISOString() } : p,
          ),
        }));
      },

      deleteProfile: (id) => {
        set((state) => ({ profiles: state.profiles.filter((p) => p.id !== id) }));
      },

      getProfile: (id) => {
        return get().profiles.find((p) => p.id === id);
      },

      importProfiles: (profiles) => {
        // v0.15.0: defensive shape check on each incoming row. A
        // malformed import previously silently injected entries with
        // `id: null` / `social: null` etc.; the next render then
        // exploded on `Object.values(null)` and black-screened the
        // app. Filter to objects with a non-empty string `id` before
        // merging — anything that fails the check is dropped and
        // logged via the caller's toast (ProfilesPage).
        if (!Array.isArray(profiles)) return;
        set((state) => {
          const existingIds = new Set(state.profiles.map((p) => p.id));
          const newProfiles = profiles.filter(
            (p): p is Profile =>
              !!p &&
              typeof p === "object" &&
              typeof p.id === "string" &&
              p.id.length > 0 &&
              !existingIds.has(p.id),
          );
          return { profiles: [...state.profiles, ...newProfiles] };
        });
      },
    }),
    {
      name: "ytdescgen-profiles",
      storage: createJSONStorage(() => localStorage),
      // v0 (unversioned) → v1: v0.11 added `thirdPartyAdText`. The store
      // had no version field before — anything `version < 1` is treated
      // as "pre-v0.11" and gets the empty-string back-fill.
      // v1 → v2: v0.34.0 added `adEmail` / `gameKeyEmail` (email split).
      // Additive — pre-v0.34 profiles get a `""` back-fill.
      version: 2,
      migrate: (persistedState: unknown, version: number) => {
        if (!persistedState || typeof persistedState !== "object") return persistedState;
        const state = persistedState as { profiles?: Array<Record<string, unknown>> };
        if (version < 1 && Array.isArray(state.profiles)) {
          state.profiles = state.profiles.map((p) =>
            typeof p.thirdPartyAdText === "string" ? p : { ...p, thirdPartyAdText: "" },
          );
        }
        if (version < 2 && Array.isArray(state.profiles)) {
          state.profiles = state.profiles.map((p) => ({
            ...p,
            adEmail: typeof p.adEmail === "string" ? p.adEmail : "",
            gameKeyEmail: typeof p.gameKeyEmail === "string" ? p.gameKeyEmail : "",
          }));
        }
        return persistedState as { profiles: Profile[] };
      },
      partialize: (state) => ({ profiles: state.profiles }),
    },
  ),
);

useProfileStore.subscribe((state) => {
  saveSettings("ytdescgen-profiles", { profiles: state.profiles });
});
