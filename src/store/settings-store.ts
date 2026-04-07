import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { DEFAULTS } from "@config/defaults";
import type { GenreId } from "@config/genres";

interface SettingsState {
  theme: "dark" | "light";
  defaultLanguage: string;
  defaultGenre: GenreId;
  setTheme: (theme: "dark" | "light") => void;
  setDefaultLanguage: (lang: string) => void;
  setDefaultGenre: (genre: GenreId) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...DEFAULTS.settings,

      setTheme: (theme) => {
        document.documentElement.classList.toggle("dark", theme === "dark");
        document.documentElement.classList.toggle("light", theme === "light");
        set({ theme });
      },

      setDefaultLanguage: (lang) => set({ defaultLanguage: lang }),

      setDefaultGenre: (genre) => set({ defaultGenre: genre }),
    }),
    {
      name: "ytdescgen-settings",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => {
        const {
          setTheme: _st,
          setDefaultLanguage: _sdl,
          setDefaultGenre: _sdg,
          ...data
        } = state;
        return data;
      },
    },
  ),
);
