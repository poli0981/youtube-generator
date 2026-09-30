import { toast } from "sonner";
import i18n from "@i18n/index";
import {
  editorDataOf,
  initialEditorData,
  useEditorStore,
  type EditorData,
} from "@store/editor-store";
import { useSettingsStore } from "@store/settings-store";
import type { Profile } from "@store/profile-store";
import type { GamePreset } from "@store/preset-store";
import type { EditorTemplate } from "@store/template-store";
import {
  PER_VIDEO_FIELDS,
  PRESET_FIELDS,
  PROFILE_FIELDS,
  type PresetField,
  type ProfileField,
} from "@config/library-fields";

/**
 * Everything that fills or clears the editor in one go — applying a saved
 * profile / preset / template, Next part, New video, Start over — in one
 * place, each with Undo: the editor's data is snapshotted first and put back
 * if the user changes their mind.
 */

const t = (key: string, options?: Record<string, unknown>) => i18n.t(key, { ns: "ui", ...options });

function withUndo(message: string, apply: () => void): void {
  const before = editorDataOf(useEditorStore.getState());
  apply();
  toast.success(message, {
    duration: 6000,
    action: {
      label: t("common.undo"),
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

/** Nothing typed: an empty string, list or map (a map of empty strings too). */
function isBlank(value: unknown): boolean {
  if (value === undefined || value === null || value === "") return true;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === "object") return Object.values(value).every(isBlank);
  return false;
}

/** JSON with sorted keys, so equal maps compare equal whatever their order. */
function stable(value: unknown): string {
  return JSON.stringify(value, (_key, v: unknown) =>
    v && typeof v === "object" && !Array.isArray(v)
      ? Object.fromEntries(
          Object.entries(v as Record<string, unknown>).sort(([a], [b]) => (a < b ? -1 : 1)),
        )
      : v,
  );
}

/**
 * Fields a patch would overwrite that hold something else in the editor
 * right now — what "Replace N filled fields?" counts. Empty fields and
 * fields that already match don't count.
 */
export function overwrittenFields(editor: EditorData, patch: Partial<EditorData>): string[] {
  const now = editor as unknown as Record<string, unknown>;
  // A field still at its starting value ("1080p", "Medium"…) wasn't filled in.
  const blank = initialEditorData() as unknown as Record<string, unknown>;
  return Object.entries(patch)
    .filter(
      ([key, value]) =>
        !isBlank(now[key]) &&
        stable(now[key]) !== stable(blank[key]) &&
        stable(now[key]) !== stable(value),
    )
    .map(([key]) => key);
}

/**
 * Fields where the editor has drifted from a saved profile or preset —
 * only the ones the item saved, so an older item doesn't nag about fields
 * added since.
 */
export function changedSince(editor: EditorData, patch: Partial<EditorData>): string[] {
  const now = editor as unknown as Record<string, unknown>;
  return Object.entries(patch)
    .filter(([key, value]) => stable(now[key] ?? "") !== stable(value ?? ""))
    .map(([key]) => key);
}

/** The per-video fields back to empty (the part number is left alone). */
function perVideoReset(): Partial<EditorData> {
  const blank = initialEditorData();
  return Object.fromEntries(
    PER_VIDEO_FIELDS.map((key) => [key, blank[key]]),
  ) as Partial<EditorData>;
}

export function applyProfile(profile: Profile): void {
  withUndo(t("library.profileApplied", { name: profile.name }), () =>
    useEditorStore.getState().loadProfile(profilePatch(profile)),
  );
  useSettingsStore.getState().setSetting("lastProfileId", profile.id);
}

export function applyPreset(preset: GamePreset): void {
  withUndo(t("library.presetApplied", { name: preset.gameName }), () => {
    const editor = useEditorStore.getState();
    // Another game means another video: what was specific to the last one
    // (boss, timestamps, endings…) must not ride along.
    const sameGame = editor.gameName.trim().toLowerCase() === preset.gameName.trim().toLowerCase();
    if (!sameGame) editor.loadPreset(perVideoReset());
    useEditorStore.getState().loadPreset(presetPatch(preset));
    // Only when the preset explicitly carries it, so older presets don't
    // silently reset the user's preference.
    if (preset.showGameCopyright !== undefined) {
      useSettingsStore.getState().setSetting("showGameCopyright", preset.showGameCopyright);
    }
  });
  useSettingsStore.getState().setSetting("lastPresetId", preset.id);
}

/** Returns false (and says so) when the template is unusable. */
export function applyTemplate(template: EditorTemplate): boolean {
  if (!template.snapshot || typeof template.snapshot !== "object") {
    toast.error(t("templates.applyFailed"));
    return false;
  }
  withUndo(t("templates.appliedToast", { name: template.name }), () => {
    // A template saved before v1.0.0 holds only part of the form; the
    // per-video fields it doesn't hold must not keep the last video's values.
    useEditorStore.getState().loadProfile(perVideoReset());
    useEditorStore.getState().loadProfile(template.snapshot);
  });
  return true;
}

/** The next number after a part number ("7" → "8"), or null when it isn't one. */
export function nextPartNumber(partNumber: string): string | null {
  const trimmed = partNumber.trim();
  return /^\d+$/.test(trimmed) ? String(Number(trimmed) + 1) : null;
}

/** Same game, next part: the part number goes up, the per-video fields empty. */
export function startNextPart(): void {
  const next = nextPartNumber(useEditorStore.getState().partNumber) ?? "1";
  withUndo(t("editor.quick.nextPartDone", { n: next }), () =>
    useEditorStore.getState().loadProfile({ ...perVideoReset(), partNumber: next }),
  );
}

/** Same game, a different video: the per-video fields empty. */
export function startNewVideo(): void {
  withUndo(t("editor.quick.newVideoDone"), () =>
    useEditorStore.getState().loadProfile(perVideoReset()),
  );
}

/**
 * A blank form for a new game — but the channel (profile fields) stays, and
 * the output language is the default one from Settings.
 */
export function startOver(): void {
  withUndo(t("editor.quick.startOverDone"), () => {
    const editor = editorDataOf(useEditorStore.getState());
    useEditorStore.setState({
      ...initialEditorData(),
      ...pickFields(editor, PROFILE_FIELDS),
      language: useSettingsStore.getState().defaultOutputLanguage,
    });
  });
}
