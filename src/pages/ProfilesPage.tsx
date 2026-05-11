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
import { exportToJsonFile, importFromJsonFile } from "@utils/import-export";
import toast from "react-hot-toast";
import clsx from "clsx";

type Tab = "profiles" | "presets" | "templates";

export function ProfilesPage() {
  const { t } = useTranslation("ui");
  useDocumentTitle(t("tabs.profiles"));
  const [tab, setTab] = useState<Tab>("profiles");
  const { profiles, importProfiles } = useProfileStore();
  const { presets, importPresets } = usePresetStore();
  const { templates, importTemplates } = useTemplateStore();

  const handleExportProfiles = () => {
    exportToJsonFile(profiles, "ytdescgen-profiles.json");
    toast.success("Exported!");
  };

  const handleImportProfiles = async () => {
    try {
      const data = await importFromJsonFile<Profile[]>();
      if (!Array.isArray(data)) throw new Error("Invalid format");
      importProfiles(data);
      toast.success("Imported!");
    } catch {
      toast.error("Import failed");
    }
  };

  const handleExportPresets = () => {
    exportToJsonFile(presets, "ytdescgen-presets.json");
    toast.success("Exported!");
  };

  const handleImportPresets = async () => {
    try {
      const data = await importFromJsonFile<GamePreset[]>();
      if (!Array.isArray(data)) throw new Error("Invalid format");
      importPresets(data);
      toast.success("Imported!");
    } catch {
      toast.error("Import failed");
    }
  };

  const handleExportTemplates = () => {
    exportToJsonFile(templates, "ytdescgen-templates.json");
    toast.success("Exported!");
  };

  const handleImportTemplates = async () => {
    try {
      const data = await importFromJsonFile<EditorTemplate[]>();
      if (!Array.isArray(data)) throw new Error("Invalid format");
      importTemplates(data);
      toast.success("Imported!");
    } catch {
      toast.error("Import failed");
    }
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
