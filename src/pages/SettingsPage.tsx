import { useTranslation } from "react-i18next";
import { FolderOpen, Save } from "lucide-react";
import { Toggle } from "@components/ui/Toggle";
import { Select } from "@components/ui/Select";
import { Input } from "@components/ui/Input";
import { Button } from "@components/ui/Button";
import { SUPPORTED_LANGUAGES } from "@i18n/index";
import { GENRES } from "@config/genres";
import { useSettingsStore } from "@store/settings-store";
import { IS_TAURI } from "@utils/platform";
import type { SupportedLanguage } from "@engine/types";
import toast from "react-hot-toast";
import { logger } from "@utils/logger";

async function openSettingsFolder() {
  try {
    const { appDataDir } = await import("@tauri-apps/api/path");
    const { open } = await import("@tauri-apps/plugin-shell");
    const dir = await appDataDir();
    await open(dir);
  } catch (e) {
    toast.error("Could not open settings folder");
    logger.error("settings", "Failed to open settings folder", String(e));
  }
}

async function exportSettingsToFile() {
  try {
    const { save } = await import("@tauri-apps/plugin-dialog");
    const { invoke } = await import("@tauri-apps/api/core");
    const { appDataDir } = await import("@tauri-apps/api/path");
    const dir = await appDataDir();
    const srcPath = `${dir}settings.json`;
    const content: string = await invoke("read_from_file", { path: srcPath });
    const destPath = await save({ defaultPath: "ytdescgen-settings.json" });
    if (destPath) {
      await invoke("save_to_file", { path: destPath, content });
      toast.success("Settings exported!");
    }
  } catch (e) {
    toast.error("Export failed");
    logger.error("settings", "Failed to export settings", String(e));
  }
}

export function SettingsPage() {
  const { t, i18n } = useTranslation("ui");
  const settings = useSettingsStore();

  const langOptions = SUPPORTED_LANGUAGES.map((l) => ({
    value: l.id,
    label: `${l.flag} ${l.nativeName}`,
  }));

  const genreOptions = GENRES.map((g) => ({
    value: g.id,
    label: `${g.icon} ${t(g.labelKey)}`,
  }));

  const hashtagOptions = [
    { value: "1", label: "1" },
    { value: "2", label: "2" },
    { value: "3", label: "3" },
  ];

  return (
    <div className="mx-auto max-w-2xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-lg font-bold text-text-primary">{t("settings.title")}</h1>
        {IS_TAURI && (
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={openSettingsFolder}>
              <FolderOpen className="h-3.5 w-3.5" />
              Open Folder
            </Button>
            <Button variant="ghost" size="sm" onClick={exportSettingsToFile}>
              <Save className="h-3.5 w-3.5" />
              Export
            </Button>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-8">
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-text-secondary">{t("settings.appearance")}</h2>
          <Toggle
            label={t("settings.theme") + (settings.theme === "dark" ? " (Dark)" : " (Light)")}
            checked={settings.theme === "dark"}
            onChange={(v) => settings.setTheme(v ? "dark" : "light")}
          />
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-text-secondary">{t("settings.defaults")}</h2>
          <Select
            label={t("settings.appLanguage")}
            options={langOptions}
            value={settings.appLanguage}
            onChange={(v) => {
              settings.setAppLanguage(v as SupportedLanguage);
              i18n.changeLanguage(v);
            }}
          />
          <Select
            label={t("settings.defaultOutputLanguage")}
            options={langOptions}
            value={settings.defaultOutputLanguage}
            onChange={(v) => settings.setDefaultOutputLanguage(v as SupportedLanguage)}
          />
          <Select
            label={t("settings.defaultGenre")}
            options={genreOptions}
            value={settings.defaultGenre}
            onChange={(v) => settings.setDefaultGenre(v as typeof settings.defaultGenre)}
          />
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-text-secondary">{t("settings.editorSettings")}</h2>
          <Toggle
            label={t("settings.autoSaveDraft")}
            checked={settings.autoSaveDraft}
            onChange={(v) => settings.setSetting("autoSaveDraft", v)}
          />
          <Toggle
            label={t("settings.showCharCount")}
            checked={settings.showCharCount}
            onChange={(v) => settings.setSetting("showCharCount", v)}
          />
          <Toggle
            label={t("settings.compactTagDisplay")}
            checked={settings.compactTagDisplay}
            onChange={(v) => settings.setSetting("compactTagDisplay", v)}
          />
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-text-secondary">{t("settings.tagSettings")}</h2>
          <Toggle
            label={t("settings.multilingualTags")}
            checked={settings.includeMultilingualTags}
            onChange={(v) => settings.setSetting("includeMultilingualTags", v)}
          />
          <Toggle
            label={t("settings.trendingTags")}
            checked={settings.includeTrendingTags}
            onChange={(v) => settings.setSetting("includeTrendingTags", v)}
          />
          <Select
            label={t("settings.hashtagCount")}
            options={hashtagOptions}
            value={String(settings.hashtagCount)}
            onChange={(v) => settings.setSetting("hashtagCount", Number(v))}
          />
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-text-secondary">{t("settings.historySettings")}</h2>
          <Input
            label={t("settings.historyLimit")}
            type="number"
            value={String(settings.historyLimit)}
            onChange={(e) => {
              const val = Math.max(10, Math.min(500, Number(e.target.value) || 100));
              settings.setSetting("historyLimit", val);
            }}
          />
        </section>
      </div>
    </div>
  );
}
