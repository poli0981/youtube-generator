import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useDocumentTitle } from "@hooks/use-document-title";
import { Download, Upload } from "lucide-react";
import { Button } from "@components/ui/Button";
import { ProfileList } from "@components/profiles/ProfileList";
import { PresetList } from "@components/presets/PresetList";
import { TemplateList } from "@components/templates/TemplateList";
import { useProfileStore, type Profile } from "@store/profile-store";
import { usePresetStore, type GamePreset } from "@store/preset-store";
import { useTemplateStore, type EditorTemplate } from "@store/template-store";
import {
  exportTypedToJsonFile,
  importTypedFromJsonFile,
  type ImportFailure,
} from "@utils/import-export";
import type { ExportType } from "@utils/file-schema";
import { logger } from "@utils/logger";
import toast from "react-hot-toast";
import clsx from "clsx";

type Tab = "profiles" | "presets" | "templates";

/** Map a tab id to the envelope `_type` discriminator. The tab labels
 *  are plural for UI; the envelope type is singular ("profile" not
 *  "profiles") so it reads as the *kind* of each row, not the file. */
const TAB_TO_TYPE: Record<Tab, ExportType> = {
  profiles: "profile",
  presets: "preset",
  templates: "template",
};

/** Reverse map for the tab-switch suggestion when an import lands in
 *  the wrong tab — see `renderFailureToast`. */
const TYPE_TO_TAB: Partial<Record<ExportType, Tab>> = {
  profile: "profiles",
  preset: "presets",
  template: "templates",
};

export function ProfilesPage() {
  const { t } = useTranslation("ui");
  useDocumentTitle(t("tabs.profiles"));
  const [tab, setTab] = useState<Tab>("profiles");
  const { profiles, importProfiles } = useProfileStore();
  const { presets, importPresets } = usePresetStore();
  const { templates, importTemplates } = useTemplateStore();

  /**
   * Render a tab-specific toast for an import failure. Each failure
   * kind gets its own copy so the user can actually fix the problem
   * (the old "Import failed" toast was almost useless for debugging).
   * "wrong-shape" with a known actual type also offers a one-click
   * fix via the toast action (`onClick` on the toast itself wouldn't
   * work — react-hot-toast doesn't surface actions on the default
   * `toast.error`, so we surface a follow-up `toast(`…`)` with the
   * switch hint instead).
   */
  function renderFailureToast(failure: ImportFailure, expected: ExportType): void {
    switch (failure.kind) {
      case "cancelled":
        return; // silent
      case "read-failed":
        toast.error(`Could not read file: ${failure.message}`);
        logger.error("import", `read-failed for ${expected}`, failure.message);
        return;
      case "empty":
        toast.error("File is empty");
        logger.warn("import", `empty file for ${expected}`);
        return;
      case "parse-error":
        toast.error(`Invalid JSON: ${failure.message}`);
        logger.error("import", `parse-error for ${expected}`, failure.message);
        return;
      case "wrong-shape": {
        if (failure.actual) {
          const suggestedTab = TYPE_TO_TAB[failure.actual];
          const label = failure.actual.charAt(0).toUpperCase() + failure.actual.slice(1);
          if (suggestedTab) {
            toast.error(
              `This file looks like a ${label} export. Switching tabs…`,
              { duration: 4000 },
            );
            setTab(suggestedTab);
            logger.info(
              "import",
              `auto-switched tab from ${expected} to ${failure.actual}`,
            );
            return;
          }
          toast.error(`This file is a ${label} export, not ${expected}.`);
          return;
        }
        toast.error("File shape is not recognised — choose a YTDescGen export.");
        logger.warn("import", `unknown-shape for ${expected}`);
        return;
      }
      case "newer-schema":
        toast.error(
          `File was exported by a newer version (schema v${failure.actual}; this build supports up to v${failure.supported}). Update YTDescGen.`,
        );
        logger.warn(
          "import",
          `newer-schema for ${expected}: file=v${failure.actual} supported=v${failure.supported}`,
        );
        return;
    }
  }

  const handleExportProfiles = () => {
    exportTypedToJsonFile("profile", profiles, "ytdescgen-profiles.json");
    toast.success("Exported!");
  };

  const handleImportProfiles = async () => {
    const result = await importTypedFromJsonFile("profile");
    if (!result.ok) {
      renderFailureToast(result.failure, "profile");
      return;
    }
    // The detector only confirms the *shape* matches profile-ness; the
    // store-level `importProfiles` filters individual rows that fail
    // per-field validation (missing id, etc.). Two layers of validation
    // is intentional — keeps callers' contracts clean and prevents a
    // future tab-specific quirk from corrupting unrelated stores.
    const incoming = Array.isArray(result.data) ? (result.data as Profile[]) : [];
    importProfiles(incoming);
    const accepted = useProfileStore.getState().profiles.length - profiles.length;
    toast.success(
      accepted === incoming.length
        ? `Imported ${accepted} profile${accepted === 1 ? "" : "s"}.`
        : `Imported ${accepted} of ${incoming.length} profiles (some skipped).`,
    );
  };

  const handleExportPresets = () => {
    exportTypedToJsonFile("preset", presets, "ytdescgen-presets.json");
    toast.success("Exported!");
  };

  const handleImportPresets = async () => {
    const result = await importTypedFromJsonFile("preset");
    if (!result.ok) {
      renderFailureToast(result.failure, "preset");
      return;
    }
    const incoming = Array.isArray(result.data) ? (result.data as GamePreset[]) : [];
    importPresets(incoming);
    const accepted = usePresetStore.getState().presets.length - presets.length;
    toast.success(
      accepted === incoming.length
        ? `Imported ${accepted} preset${accepted === 1 ? "" : "s"}.`
        : `Imported ${accepted} of ${incoming.length} presets (some skipped).`,
    );
  };

  const handleExportTemplates = () => {
    exportTypedToJsonFile("template", templates, "ytdescgen-templates.json");
    toast.success("Exported!");
  };

  const handleImportTemplates = async () => {
    const result = await importTypedFromJsonFile("template");
    if (!result.ok) {
      renderFailureToast(result.failure, "template");
      return;
    }
    const incoming = Array.isArray(result.data) ? (result.data as EditorTemplate[]) : [];
    importTemplates(incoming);
    const accepted = useTemplateStore.getState().templates.length - templates.length;
    toast.success(
      accepted === incoming.length
        ? `Imported ${accepted} template${accepted === 1 ? "" : "s"}.`
        : `Imported ${accepted} of ${incoming.length} templates (some skipped).`,
    );
  };

  return (
    <div className="mx-auto max-w-3xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex gap-1 rounded-lg bg-surface-1 p-1">
          {(["profiles", "presets", "templates"] as const).map((t2) => (
            <button
              key={t2}
              onClick={() => setTab(t2)}
              className={clsx(
                "rounded-md px-4 py-1.5 text-sm font-medium transition-colors",
                tab === t2
                  ? "bg-accent text-white"
                  : "text-text-muted hover:text-text-primary",
              )}
            >
              {t(`${t2}.title`)}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          {tab === "profiles" && (
            <>
              <Button variant="ghost" size="sm" onClick={handleExportProfiles}>
                <Download className="h-3.5 w-3.5" />
                {t("profiles.exportProfiles")}
              </Button>
              <Button variant="ghost" size="sm" onClick={handleImportProfiles}>
                <Upload className="h-3.5 w-3.5" />
                {t("profiles.importProfiles")}
              </Button>
            </>
          )}
          {tab === "presets" && (
            <>
              <Button variant="ghost" size="sm" onClick={handleExportPresets}>
                <Download className="h-3.5 w-3.5" />
                {t("presets.exportPresets")}
              </Button>
              <Button variant="ghost" size="sm" onClick={handleImportPresets}>
                <Upload className="h-3.5 w-3.5" />
                {t("presets.importPresets")}
              </Button>
            </>
          )}
          {tab === "templates" && (
            <>
              <Button variant="ghost" size="sm" onClick={handleExportTemplates}>
                <Download className="h-3.5 w-3.5" />
                {t("templates.exportTemplates")}
              </Button>
              <Button variant="ghost" size="sm" onClick={handleImportTemplates}>
                <Upload className="h-3.5 w-3.5" />
                {t("templates.importTemplates")}
              </Button>
            </>
          )}
        </div>
      </div>

      {tab === "profiles" && <ProfileList />}
      {tab === "presets" && <PresetList />}
      {tab === "templates" && <TemplateList />}
    </div>
  );
}

// `TAB_TO_TYPE` kept exported-shaped (not exported) for now — currently
// only this file maps tabs to types. Promote to an export if a future
// page (e.g. a "Backup all" button on Settings) reuses the mapping.
void TAB_TO_TYPE;
