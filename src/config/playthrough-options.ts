import {
  LANGUAGE_PATCH_OPTIONS,
  GAME_VERSION_OPTIONS,
  type LanguagePatch,
  type GameVersion,
} from "@engine/types";

/**
 * UI-friendly option lists for the Playthrough Notes form (v0.12).
 * Mirrors the const arrays from `@engine/types` but as `{ id, labelKey }`
 * objects so Select renders both an i18n key and a stable value. The
 * engine continues to read straight from the typed unions — these
 * helpers exist purely so the editor doesn't repeat the i18n-key
 * convention in every component.
 */
export interface PlaythroughOption<T extends string> {
  id: T;
  /** i18n key for the localised display label. */
  labelKey: string;
}

export const LANGUAGE_PATCH_UI_OPTIONS: readonly PlaythroughOption<LanguagePatch>[] =
  LANGUAGE_PATCH_OPTIONS.map((id) => ({
    id,
    labelKey: `editor.playthroughNotes.languagePatchOptions.${id}`,
  }));

export const GAME_VERSION_UI_OPTIONS: readonly PlaythroughOption<GameVersion>[] =
  GAME_VERSION_OPTIONS.map((id) => ({
    id,
    labelKey: `editor.playthroughNotes.gameVersionOptions.${id}`,
  }));

/**
 * Whether the language-patch enum value pairs with a free-form custom
 * label slot (`languagePatchCustom`). True for `"official_other"` (e.g.
 * "Official KR") and `"custom"` (everything else); false for the
 * canonical EN / fan / MTL options whose labels come from i18n.
 */
export function languagePatchHasCustomSlot(value: LanguagePatch): boolean {
  return value === "official_other" || value === "custom";
}

/**
 * Whether the game-version enum value pairs with a free-form custom
 * label slot (`gameVersionCustom`). Only `"custom"` does — used for
 * niche cases like "Steam Next Fest demo", "Kickstarter backer build".
 */
export function gameVersionHasCustomSlot(value: GameVersion): boolean {
  return value === "custom";
}
