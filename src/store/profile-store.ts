import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { generateId } from "@utils/uuid";
import { saveSettings } from "@utils/storage-adapter";

export interface Profile {
  id: string;
  name: string;
  channelName: string;
  contactEmail: string;
  social: Record<string, string>;
  rig: Record<string, string>;
  resolution: string;
  fps: string;
  graphicsPreset: string;
  createdAt: string;
  updatedAt: string;
}

interface ProfileState {
  profiles: Profile[];
  addProfile: (data: Omit<Profile, "id" | "createdAt" | "updatedAt">) => string;
  updateProfile: (id: string, data: Partial<Omit<Profile, "id" | "createdAt" | "updatedAt">>) => void;
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
        set((state) => {
          const existingIds = new Set(state.profiles.map((p) => p.id));
          const newProfiles = profiles.filter((p) => !existingIds.has(p.id));
          return { profiles: [...state.profiles, ...newProfiles] };
        });
      },
    }),
    {
      name: "ytdescgen-profiles",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ profiles: state.profiles }),
    },
  ),
);

useProfileStore.subscribe((state) => {
  saveSettings("ytdescgen-profiles", { profiles: state.profiles });
});
