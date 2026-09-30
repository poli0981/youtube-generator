import { toast } from "sonner";
import i18n from "@i18n/index";
import { useEditorStore } from "@store/editor-store";
import { useSettingsStore } from "@store/settings-store";
import type { Profile } from "@store/profile-store";
import type { GamePreset } from "@store/preset-store";
import type { EditorTemplate } from "@store/template-store";

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

/** Channel identity fields a profile carries. */
export function profilePatch(profile: Profile) {
  // `?? {}` / `?? ""`: an imported profile may carry nulls, and spreading
  // null throws ("Cannot convert undefined or null to object").
  return {
    channelName: profile.channelName,
    contactEmail: profile.contactEmail,
    adEmail: profile.adEmail ?? "",
    gameKeyEmail: profile.gameKeyEmail ?? "",
    social: { ...(profile.social ?? {}) },
    rig: { ...(profile.rig ?? {}) },
    resolution: profile.resolution,
    fps: profile.fps,
    graphicsPreset: profile.graphicsPreset,
    thirdPartyAdText: profile.thirdPartyAdText ?? "",
  };
}

/** Game identity fields a preset carries. */
export function presetPatch(preset: GamePreset) {
  return {
    gameName: preset.gameName,
    gameNameLocalized: preset.gameNameLocalized ? { ...preset.gameNameLocalized } : {},
    genres: [...preset.genres],
    platform: preset.platform,
    storeLinks: { ...(preset.storeLinks ?? {}) },
    spoilerWarning: preset.spoilerWarning,
    matureWarning: preset.matureWarning,
    pubDevName: preset.pubDevName ?? "",
  };
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
