import { useTranslation } from "react-i18next";
import { Toggle } from "@components/ui/Toggle";
import { Select } from "@components/ui/Select";
import { Input } from "@components/ui/Input";
import { SUPPORTED_LANGUAGES } from "@i18n/index";
import { GENRES } from "@config/genres";
import { useSettingsStore } from "@store/settings-store";

export function SettingsPage() {
  const { t } = useTranslation("ui");
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
      <h1 className="mb-6 text-lg font-bold text-text-primary">{t("settings.title")}</h1>

      <div className="flex flex-col gap-8">
        {/* Appearance */}
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-text-secondary">{t("settings.appearance")}</h2>
          <Toggle
            label={t("settings.theme") + (settings.theme === "dark" ? " (Dark)" : " (Light)")}
            checked={settings.theme === "dark"}
            onChange={(v) => settings.setTheme(v ? "dark" : "light")}
          />
        </section>

        {/* Defaults */}
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-text-secondary">{t("settings.defaults")}</h2>
          <Select
            label={t("settings.defaultUILanguage")}
            options={langOptions}
            value={settings.defaultLanguage}
            onChange={(v) => settings.setDefaultLanguage(v)}
          />
          <Select
            label={t("settings.defaultOutputLanguage")}
            options={langOptions}
            value={settings.defaultOutputLanguage}
            onChange={(v) => settings.setDefaultOutputLanguage(v as typeof settings.defaultOutputLanguage)}
          />
          <Select
            label={t("settings.defaultGenre")}
            options={genreOptions}
            value={settings.defaultGenre}
            onChange={(v) => settings.setDefaultGenre(v as typeof settings.defaultGenre)}
          />
        </section>

        {/* Editor */}
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

        {/* Tags */}
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

        {/* History */}
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
