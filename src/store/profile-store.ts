import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { generateId } from "@utils/uuid";
import { migrateRig } from "@config/rig-fields";
import type { GraphicsPreset } from "@config/graphics-settings";

/**
 * A channel profile — the editor's channel-stable fields
 * (`PROFILE_FIELDS` in `@config/library-fields`) under a name.
 *
 * `graphicsPreset` was free-form text pre-v0.8. The type uses the v0.8
 * enum so call sites pass the value cleanly into `loadProfile` — TS
 * believes legacy strings like "Ultra" are valid enum values, but
 * `editor-store.normalizeEditorPatch` runs on load and maps them
 * through the same v4→v5 logic as the persist migration.
 *
 * v0.11 added `thirdPartyAdText`, v0.34.0 `adEmail` / `gameKeyEmail`
 * (back-filled by the migrations below). v1.0.0 added the Vietnamese
 * donate fields, the community invite links and `graphicsPresetCustom` —
 * optional, because profiles saved before then don't have them and
 * applying one must leave those editor fields alone. v1.1.0's
 * `copyrightEmail` is optional for the same reason.
 */
export interface Profile {
  id: string;
  name: string;
  channelName: string;
  contactEmail: string;
  adEmail: string;
  gameKeyEmail: string;
  copyrightEmail?: string;
  social: Record<string, string>;
  rig: Record<string, string>;
  resolution: string;
  fps: string;
  graphicsPreset: GraphicsPreset;
  graphicsPresetCustom?: string;
  thirdPartyAdText: string;
  vnBankName?: string;
  vnBankAccount?: string;
  vnBankHolder?: string;
  vnMomo?: string;
  vnZalopay?: string;
  messengerCommunityLink?: string;
  zaloGroupLink?: string;
  signalGroupLink?: string;
  instagramGroupLink?: string;
  facebookGroupLink?: string;
  createdAt: string;
  updatedAt: string;
}

export type ProfileData = Omit<Profile, "id" | "createdAt" | "updatedAt">;

interface ProfileState {
  profiles: Profile[];
  addProfile: (data: ProfileData) => string;
  updateProfile: (id: string, data: Partial<ProfileData>) => void;
  deleteProfile: (id: string) => void;
  getProfile: (id: string) => Profile | undefined;
}

/**
 * v0 (unversioned) → v1: v0.11 added `thirdPartyAdText`.
 * v1 → v2: v0.34.0 added `adEmail` / `gameKeyEmail` (email split).
 * v2 → v3: v1.0.0 GPU catalog (`brand|series|model` → `gpu:<id>`).
 * Bump together with a new step in {@link migrateProfilesState}; backups
 * record this number so an import can run the steps a file still needs.
 */
export const PROFILE_STORE_VERSION = 3;

/** The persist migration, shared with backup import. Every step is idempotent. */
export function migrateProfilesState(persistedState: unknown, version: number): unknown {
  if (!persistedState || typeof persistedState !== "object") return persistedState;
  const state = persistedState as { profiles?: Array<Record<string, unknown>> };
  if (!Array.isArray(state.profiles)) return persistedState;
  state.profiles = state.profiles.map((p) => {
    if (!p || typeof p !== "object") return p;
    let next = p;
    if (version < 1 && typeof next.thirdPartyAdText !== "string") {
      next = { ...next, thirdPartyAdText: "" };
    }
    if (version < 2) {
      next = {
        ...next,
        adEmail: typeof next.adEmail === "string" ? next.adEmail : "",
        gameKeyEmail: typeof next.gameKeyEmail === "string" ? next.gameKeyEmail : "",
      };
    }
    if (version < 3) next = { ...next, rig: migrateRig(next.rig) };
    return next;
  });
  return persistedState;
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
    }),
    {
      name: "ytdescgen-profiles",
      storage: createJSONStorage(() => localStorage),
      version: PROFILE_STORE_VERSION,
      migrate: (persistedState, version) =>
        migrateProfilesState(persistedState, version) as { profiles: Profile[] },
      partialize: (state) => ({ profiles: state.profiles }),
    },
  ),
);
