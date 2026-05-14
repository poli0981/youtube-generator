import { useTranslation } from "react-i18next";
import { useDocumentTitle } from "@hooks/use-document-title";
import { FolderOpen, Save, Upload } from "lucide-react";
import { Toggle } from "@components/ui/Toggle";
import { Select } from "@components/ui/Select";
import { Input } from "@components/ui/Input";
import { Button } from "@components/ui/Button";
import { ChipGroup } from "@components/ui/ChipGroup";
import { ValidatedInput } from "@components/ui/ValidatedInput";
import { SUPPORTED_LANGUAGES } from "@i18n/index";
import { GENRES, type GenreId } from "@config/genres";
import { useSettingsStore, healSettings } from "@store/settings-store";
import { validatePlaylistUrl } from "@utils/validation";
import { IS_TAURI } from "@utils/platform";
import {
  MAX_GENRES,
  type SupportedLanguage,
  type TitleBadgePosition,
  type TitleSeparatorId,
  type TitleBadgeCase,
} from "@engine/types";
import toast from "react-hot-toast";
import { logger } from "@utils/logger";

const SETTINGS_STORE_KEY = "ytdescgen-settings";

async function openSettingsFolder() {
  try {
    const { appDataDir } = await import("@tauri-apps/api/path");
    const { openPath } = await import("@tauri-apps/plugin-opener");
    const { invoke } = await import("@tauri-apps/api/core");
    const dir = await appDataDir();
    // Windows fix (v0.14.0): `appDataDir()` only returns the path string —
    // the folder itself is created lazily, on the first call to
    // `save_to_file`. On a fresh install where no setting has yet been
    // written, the directory doesn't exist, and `openPath()` falls through
    // to Explorer which surfaces "Windows cannot find ... com.skullmute
    // .ytdescgen". Pre-create the folder so the shell never sees a
    // non-existent path.
    await invoke("ensure_dir", { path: dir });
    await openPath(dir);
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
    // Ensure the folder exists — same reason as `openSettingsFolder`.
    // On a fresh install nobody may have triggered a settings write yet.
    await invoke("ensure_dir", { path: dir });
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

/**
 * Import settings from a user-picked `.json` file. Accepts either the
 * full multi-store dump that {@link exportSettingsToFile} produces
 * (object keyed by `ytdescgen-settings` etc.) or a bare `SettingsData`
 * payload — the latter so hand-edited / partial files keep working.
 *
 * All five failure modes from the v0.14 plan are reported as distinct
 * toasts (cancel, empty, parse, shape, unknown). `healSettings()` then
 * back-fills any missing keys, so a partial import never leaves the
 * store in an incomplete state. The healed payload is dispatched via
 * `setState`, which both updates React and triggers the persist
 * `subscribe` → `saveSettings`, syncing localStorage *and* the on-disk
 * `settings.json` (so re-opening the app doesn't undo the import).
 */
async function importSettingsFromFile() {
  try {
    const { open } = await import("@tauri-apps/plugin-dialog");
    const { invoke } = await import("@tauri-apps/api/core");
    const path = await open({
      filters: [{ name: "JSON", extensions: ["json"] }],
    });
    if (typeof path !== "string") return; // user cancelled

    let content: string;
    try {
      content = await invoke("read_from_file", { path });
    } catch (e) {
      toast.error("Could not read file");
      logger.error("settings", `read_from_file failed for "${path}"`, String(e));
      return;
    }

    if (!content.trim()) {
      toast.error("File is empty");
      logger.warn("settings", `Import file is empty: "${path}"`);
      return;
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch (e) {
      toast.error("Invalid JSON syntax");
      logger.error("settings", `JSON parse failed for "${path}"`, String(e));
      return;
    }

    if (!parsed || typeof parsed !== "object") {
      toast.error("Invalid settings file");
      logger.warn("settings", "Imported JSON is not an object");
      return;
    }

    // Accept both shapes: full multi-store dump (matches the file
    // produced by `exportSettingsToFile`) or a bare SettingsData
    // object. The latter lets users hand-edit / share partial files.
    const asRecord = parsed as Record<string, unknown>;
    const raw =
      SETTINGS_STORE_KEY in asRecord ? asRecord[SETTINGS_STORE_KEY] : parsed;

    const healed = healSettings(raw);
    useSettingsStore.setState(healed);
    // Re-apply the theme class on <html> — `setTheme` does this in the
    // store action, but `setState` bypasses actions, so the class can
    // get out of sync if the imported theme differs from the current.
    document.documentElement.classList.toggle("dark", healed.theme === "dark");
    document.documentElement.classList.toggle("light", healed.theme === "light");

    toast.success("Settings imported");
    logger.info("settings", `Imported settings from "${path}"`);
  } catch (e) {
    toast.error("Import failed");
    logger.error("settings", "Unexpected error during settings import", String(e));
  }
}

export function SettingsPage() {
  const { t, i18n } = useTranslation("ui");
  useDocumentTitle(t("tabs.settings"));
  const settings = useSettingsStore();

  const langOptions = SUPPORTED_LANGUAGES.map((l) => ({
    value: l.id,
    label: `${l.flag} ${l.nativeName}`,
  }));

  const genreOptions = GENRES.map((g) => ({
    id: g.id,
    label: t(g.labelKey),
    icon: g.icon,
  }));

  const hashtagOptions = [
    { value: "1", label: "1" },
    { value: "2", label: "2" },
    { value: "3", label: "3" },
  ];

  const badgePositionOptions = [
    { value: "prefix", label: t("settings.badgePositionPrefix") },
    { value: "middle", label: t("settings.badgePositionMiddle") },
    { value: "suffix", label: t("settings.badgePositionSuffix") },
  ];

  const titleSeparatorOptions = [
    { value: "emDash", label: t("settings.titleSeparatorEmDash") },
    { value: "hyphen", label: t("settings.titleSeparatorHyphen") },
    { value: "colon", label: t("settings.titleSeparatorColon") },
    { value: "pipe", label: t("settings.titleSeparatorPipe") },
  ];

  const badgeCaseOptions = [
    { value: "upper", label: t("settings.badgeCaseUpper") },
    { value: "lower", label: t("settings.badgeCaseLower") },
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
            <Button variant="ghost" size="sm" onClick={importSettingsFromFile}>
              <Upload className="h-3.5 w-3.5" />
              Import
            </Button>
            <Button variant="ghost" size="sm" onClick={exportSettingsToFile}>
              <Save className="h-3.5 w-3.5" />
              Export
            </Button>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-8">
        {/* 1. Appearance — theme toggle only. */}
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-text-secondary">{t("settings.appearance")}</h2>
          <Toggle
            label={t("settings.theme") + (settings.theme === "dark" ? " (Dark)" : " (Light)")}
            checked={settings.theme === "dark"}
            onChange={(v) => settings.setTheme(v ? "dark" : "light")}
          />
        </section>

        {/* 2. Language & Defaults — app + output language, default genres. */}
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
          <ChipGroup
            label={t("settings.defaultGenre")}
            multiple
            max={MAX_GENRES}
            options={genreOptions}
            value={settings.defaultGenres}
            onChange={(next) => settings.setDefaultGenres(next as GenreId[])}
          />
        </section>

        {/* 3. Editor — UI knobs that affect the editor page itself. */}
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-text-secondary">{t("settings.editorSettings")}</h2>
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

        {/* 4. Title format — NEW in v0.7. Quality badge + format knobs. */}
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-text-secondary">
            {t("settings.titleFormatTitle")}
          </h2>
          <Toggle
            label={t("settings.showQualityBadge")}
            checked={settings.showQualityBadge}
            onChange={(v) => settings.setSetting("showQualityBadge", v)}
          />
          <Select
            label={t("settings.badgePosition")}
            options={badgePositionOptions}
            value={settings.titleFormat.badgePosition}
            onChange={(v) =>
              settings.setTitleFormat({ badgePosition: v as TitleBadgePosition })
            }
          />
          <Select
            label={t("settings.titleSeparator")}
            options={titleSeparatorOptions}
            value={settings.titleFormat.separator}
            onChange={(v) =>
              settings.setTitleFormat({ separator: v as TitleSeparatorId })
            }
          />
          <Select
            label={t("settings.badgeCase")}
            options={badgeCaseOptions}
            value={settings.titleFormat.badgeCase}
            onChange={(v) =>
              settings.setTitleFormat({ badgeCase: v as TitleBadgeCase })
            }
          />
        </section>

        {/* 5. Description — controls for auto-generated description blocks. */}
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-text-secondary">
            {t("settings.descriptionSettingsTitle")}
          </h2>
          <Toggle
            label={t("settings.showCopyright")}
            checked={settings.showCopyright}
            onChange={(v) => settings.setSetting("showCopyright", v)}
          />
          <Toggle
            label={t("settings.showUsagePolicy")}
            checked={settings.showUsagePolicy}
            onChange={(v) => settings.setSetting("showUsagePolicy", v)}
          />
          <Toggle
            label={t("settings.showSponsorCredit")}
            checked={settings.showSponsorCredit}
            onChange={(v) => settings.setSetting("showSponsorCredit", v)}
          />
          <Toggle
            label={t("settings.showThirdPartyAds")}
            checked={settings.showThirdPartyAds}
            onChange={(v) => settings.setSetting("showThirdPartyAds", v)}
          />
          {settings.showThirdPartyAds && (
            <p className="-mt-1 ml-14 text-xs text-text-muted">
              {t("settings.thirdPartyAdsHint")}
            </p>
          )}
          <Toggle
            label={t("settings.showPinnedCommentTemplate")}
            checked={settings.showPinnedCommentTemplate}
            onChange={(v) => settings.setSetting("showPinnedCommentTemplate", v)}
          />
          {settings.showPinnedCommentTemplate && (
            <div className="ml-4 flex flex-col gap-2 border-l-2 border-border pl-4">
              <Toggle
                label={t("settings.pinnedCommentIncludeAskNextGame")}
                checked={settings.pinnedCommentIncludeAskNextGame}
                onChange={(v) =>
                  settings.setSetting("pinnedCommentIncludeAskNextGame", v)
                }
              />
              <Toggle
                label={t("settings.pinnedCommentIncludeGenrePlaylist")}
                checked={settings.pinnedCommentIncludeGenrePlaylist}
                onChange={(v) =>
                  settings.setSetting("pinnedCommentIncludeGenrePlaylist", v)
                }
              />
            </div>
          )}
          <Select
            label={t("settings.hashtagCount")}
            options={hashtagOptions}
            value={String(settings.hashtagCount)}
            onChange={(v) => settings.setSetting("hashtagCount", Number(v))}
          />
        </section>

        {/* 6. Tags — tag-pool controls (narrowed from the old mixed section). */}
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
        </section>

        {/* 6.5 Genre Playlists — per-genre YouTube playlist URLs that the
            pinned-comment template can auto-suggest based on the video's
            primary genre. v0.8 phase 2. */}
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-text-secondary">
            {t("settings.genrePlaylistsTitle")}
          </h2>
          <p className="text-xs text-text-muted">{t("settings.genrePlaylistsHelp")}</p>
          <p className="text-xs text-text-muted">{t("settings.genrePlaylistsEmptyHint")}</p>
          <div className="flex flex-col gap-2">
            {GENRES.map((g) => (
              <ValidatedInput
                key={g.id}
                label={`${g.icon} ${t(g.labelKey)}`}
                placeholder="https://www.youtube.com/playlist?list=..."
                value={settings.genrePlaylists[g.id] ?? ""}
                onChange={(v) => {
                  const trimmed = v.trim();
                  if (trimmed) {
                    settings.setSetting("genrePlaylists", {
                      ...settings.genrePlaylists,
                      [g.id]: trimmed,
                    });
                  } else {
                    // Empty input → drop this genre's entry entirely so the
                    // map stays sparse. Filter pattern instead of `delete`
                    // satisfies @typescript-eslint/no-dynamic-delete.
                    const next = Object.fromEntries(
                      Object.entries(settings.genrePlaylists).filter(
                        ([k]) => k !== g.id,
                      ),
                    );
                    settings.setSetting("genrePlaylists", next);
                  }
                }}
                validate={validatePlaylistUrl}
              />
            ))}
          </div>
        </section>

        {/* 7. History. */}
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

        {/* 8. Logs — v0.17.0 retention. */}
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-text-secondary">{t("settings.logSettings")}</h2>
          <Input
            label={t("settings.logRetentionDays")}
            type="number"
            min={1}
            max={90}
            value={String(settings.logRetentionDays)}
            onChange={(e) => {
              // Same clamp as `healSettings` so the in-memory value
              // never goes out of bounds before persistence runs.
              const val = Math.max(1, Math.min(90, Number(e.target.value) || 7));
              settings.setSetting("logRetentionDays", val);
            }}
          />
          <p className="text-xs text-text-muted">{t("settings.logRetentionHint")}</p>
        </section>
      </div>
    </div>
  );
}
