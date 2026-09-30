import { toast } from "sonner";
import i18n from "@i18n/index";
import { useEditorStore, type EditorData } from "@store/editor-store";
import { useSettingsStore } from "@store/settings-store";
import type { Profile } from "@store/profile-store";
import type { GamePreset } from "@store/preset-store";
import type { EditorTemplate } from "@store/template-store";
import {
  PRESET_FIELDS,
  PROFILE_FIELDS,
  type PresetField,
  type ProfileField,
} from "@config/library-fields";

/**
 * Applying a saved profile / preset / template to the editor, in one place.
 *
 * The profile, preset and template cards and the command palette used to each
 * build their own patch; they drifted (one defended against a null `rig`, one
 * did not). Every apply now also offers Undo: the editor's data is
 * snapshotted first and restored if the user changes their mind.
 */

type EditorSnapshot = Record<string, unknown>;

function snapshotEditor(): EditorSnapshot {
  return Object.fromEntries(
    Object.entries(useEditorStore.getState()).filter(([, value]) => typeof value !== "function"),
  );
}

function withUndo(message: string, apply: () => void): void {
  const before = snapshotEditor();
  apply();
  toast.success(message, {
    duration: 6000,
    action: {
      label: i18n.t("common.undo", { ns: "ui" }),
      onClick: () => useEditorStore.setState(before),
    },
  });
}

/** Copies of the listed fields that are set (arrays and maps copied too). */
function pickFields(source: object, fields: readonly (keyof EditorData)[]): Partial<EditorData> {
  const from = source as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const key of fields) {
    const value = from[key];
    // An imported item may carry nulls, and spreading null throws.
    if (value === undefined || value === null) continue;
    out[key] = Array.isArray(value)
      ? [...(value as unknown[])]
      : typeof value === "object"
        ? { ...(value as object) }
        : value;
  }
  return out as Partial<EditorData>;
}

/** The editor fields a profile fills in. */
export function profilePatch(profile: Profile): Partial<EditorData> {
  return pickFields(profile, PROFILE_FIELDS);
}

/** The editor fields a preset fills in. */
export function presetPatch(preset: GamePreset): Partial<EditorData> {
  const patch = pickFields(preset, PRESET_FIELDS);
  // Presets saved before v0.11 carry the old warning toggles instead of
  // `contentWarnings`; the editor folds them into the checklist.
  if (preset.spoilerWarning) patch.spoilerWarning = true;
  if (preset.matureWarning) patch.matureWarning = true;
  return patch;
}

/** A profile's fields, taken from the editor (for Save / Update). */
export function profileFieldsFromEditor(editor: EditorData) {
  return pickFields(editor, PROFILE_FIELDS) as Pick<EditorData, ProfileField>;
}

/** A preset's fields, taken from the editor (for Save / Update). */
export function presetFieldsFromEditor(editor: EditorData) {
  return pickFields(editor, PRESET_FIELDS) as Pick<EditorData, PresetField>;
}

export function applyProfile(profile: Profile): void {
  withUndo(i18n.t("library.profileApplied", { ns: "ui", name: profile.name }), () =>
    useEditorStore.getState().loadProfile(profilePatch(profile)),
  );
}

export function applyPreset(preset: GamePreset): void {
  withUndo(i18n.t("library.presetApplied", { ns: "ui", name: preset.gameName }), () => {
    useEditorStore.getState().loadPreset(presetPatch(preset));
    // Only when the preset explicitly carries it, so older presets don't
    // silently reset the user's preference.
    if (preset.showGameCopyright !== undefined) {
      useSettingsStore.getState().setSetting("showGameCopyright", preset.showGameCopyright);
    }
  });
}

/** Returns false (and says so) when the template is unusable. */
export function applyTemplate(template: EditorTemplate): boolean {
  if (!template.snapshot || typeof template.snapshot !== "object") {
    toast.error(i18n.t("templates.applyFailed", { ns: "ui" }));
    return false;
  }
  withUndo(i18n.t("templates.appliedToast", { ns: "ui", name: template.name }), () =>
    useEditorStore.getState().loadProfile(template.snapshot),
  );
  return true;
}
