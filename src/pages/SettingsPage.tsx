import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { useDocumentTitle } from "@hooks/use-document-title";
import { Save, Upload } from "lucide-react";
import { Toggle } from "@components/ui/Toggle";
import { Select } from "@components/ui/Select";
import { Input } from "@components/ui/Input";
import { Button } from "@components/ui/Button";
import { ValidatedInput } from "@components/ui/ValidatedInput";
import { Accordion } from "@components/ui/Accordion";
import { FIELD_LIMITS } from "@config/field-limits";
import { SUPPORTED_LANGUAGES } from "@i18n/index";
import { GENRES } from "@config/genres";
import { useSettingsStore, healSettings, extractData } from "@store/settings-store";
import { validatePlaylistUrl } from "@utils/validation";
import { exportTypedToJsonFile, importParsedFromJsonFile } from "@utils/import-export";
import { resolveForType } from "@utils/file-schema";
import {
  type SupportedLanguage,
  type TitleBadgePosition,
  type TitleSeparatorId,
  type TitleBadgeCase,
} from "@engine/types";
import toast from "react-hot-toast";
import { logger } from "@utils/logger";

const SETTINGS_STORE_KEY = "ytdescgen-settings";

/**
 * Identifier-fingerprint check: pre-v0.18.0 exports were a raw dump of
 * the entire on-disk `settings.json`, keyed by every store's
 * localStorage name (`ytdescgen-settings`, `ytdescgen-profiles`, …).
 * v0.18.0 narrowed Export Settings to write only the Settings store,
 * wrapped in the typed envelope used by the rest of the Profiles tab.
 * Detect the legacy shape so we can refuse the import with a friendly
 * message instead of silently injecting profiles / templates / history
 * into the Settings store.
 */
function isLegacyMultiStoreDump(parsed: unknown): boolean {
  if (!parsed || typeof parsed !== "object") return false;
  const asRecord = parsed as Record<string, unknown>;
  if ("_type" in asRecord) return false; // already an envelope
  return SETTINGS_STORE_KEY in asRecord;
}

/**
 * Write the Settings store to disk as a typed envelope JSON file.
 * v0.18.0 replaced the old "dump the entire on-disk settings.json"
 * approach (which leaked Profiles / Templates / History into the
 * exported file). The envelope wrapper matches what the Profiles tab
 * produces, so users can swap export files between machines without
 * worrying about which tab they're using.
 */
async function exportSettingsToFile(t: TFunction<"ui">) {
  // `extractData` is synchronous, so the export call is the first await — the
  // web file picker needs the click's transient user activation.
  const data = extractData(useSettingsStore.getState());
  const outcome = await exportTypedToJsonFile("settings", data, "ytdescgen-settings.json");
  // Dismissing the save dialog is a decision, not a failure — stay silent.
  if (outcome === "cancelled") return;
  if (outcome === "failed") {
    toast.error(t("common.exportFailed"));
    logger.error("settings", "Failed to export settings");
    return;
  }
  toast.success(t("common.exported"));
}

/**
 * Import settings from a user-picked `.json` file. Accepts the
 * v0.18.0 envelope shape (`{ _type: "settings", data: {...} }`) and a
 * bare `SettingsData` object (hand-edited / shared partial files).
 * Pre-v0.18.0 multi-store dumps are rejected with a friendly toast —
 * see {@link isLegacyMultiStoreDump} for the rationale.
 *
 * `healSettings()` back-fills any missing keys, so a partial import
 * never leaves the store in an incomplete state. The healed payload is
 * dispatched via `setState`, which both updates React and triggers the
 * persist `subscribe` → `saveSettings`, syncing localStorage *and* the
 * on-disk `settings.json` (so re-opening the app doesn't undo the
 * import).
 */
async function importSettingsFromFile() {
  const read = await importParsedFromJsonFile();
  if (!read.ok) {
    // `importParsedFromJsonFile` only emits these four failure kinds —
    // `wrong-shape` / `newer-schema` come from `importTypedFromJsonFile`
    // (which layers `resolveForType` on top). The `default` keeps TS
    // happy with the wider `ImportFailure` union without being reachable
    // at runtime.
    switch (read.failure.kind) {
      case "cancelled":
        return; // silent
      case "read-failed":
        toast.error(`Could not read file: ${read.failure.message}`);
        logger.error("settings", "read-failed during settings import", read.failure.message);
        return;
      case "empty":
        toast.error("File is empty");
        logger.warn("settings", "Import file is empty");
        return;
      case "parse-error":
        toast.error(`Invalid JSON syntax: ${read.failure.message}`);
        logger.error("settings", "JSON parse failed during settings import", read.failure.message);
        return;
      default:
        toast.error("Import failed");
        logger.error("settings", "Unexpected import failure", JSON.stringify(read.failure));
        return;
    }
  }

  const { shape } = read;

  // Pre-v0.18.0 multi-store dump → refuse with a targeted message so
  // the user knows to re-export from v0.18.0+ rather than silently
  // accept a file that would pollute the settings store with profile /
  // template / history data.
  if (isLegacyMultiStoreDump(shape.data)) {
    toast.error(
      "Legacy export format from v0.17.x or earlier is no longer supported. Please re-export from v0.18.0+.",
    );
    logger.warn("settings", "Refused legacy multi-store dump on import");
    return;
  }

  const resolved = resolveForType(shape, "settings");
  if (!resolved.ok) {
    switch (resolved.reason.kind) {
      case "wrong-type":
        toast.error(`This file looks like a ${resolved.reason.actual} export, not settings.`);
        logger.warn(
          "settings",
          `Refused wrong-type file on settings import (got ${resolved.reason.actual})`,
        );
        return;
      case "unknown-shape":
        toast.error("File shape is not recognised — choose a YTDescGen settings export.");
        logger.warn("settings", "Refused unknown-shape file on settings import");
        return;
      case "newer-schema":
        toast.error(
          `File was exported by a newer version (schema v${resolved.reason.actual}; this build supports up to v${resolved.reason.supported}). Update YTDescGen.`,
        );
        logger.warn(
          "settings",
          `Refused newer-schema settings file (file=v${resolved.reason.actual} supported=v${resolved.reason.supported})`,
        );
        return;
    }
  }

  const healed = healSettings(resolved.data);
  useSettingsStore.setState(healed);
  // Re-apply the theme class on <html> — `setTheme` does this in the
  // store action, but `setState` bypasses actions, so the class can
  // get out of sync if the imported theme differs from the current.
  document.documentElement.classList.toggle("dark", healed.theme === "dark");
  document.documentElement.classList.toggle("light", healed.theme === "light");

  toast.success("Settings imported");
  logger.info("settings", "Imported settings from file");
}

export function SettingsPage() {
  const { t, i18n } = useTranslation("ui");
  useDocumentTitle(t("tabs.settings"));
  const settings = useSettingsStore();
  const accordion = useSettingsStore((s) => s.settingsAccordionState);
  const toggleAccordion = useSettingsStore((s) => s.toggleSettingsAccordion);
  // Unknown ids default OPEN here — the opposite of EditorPage. A section
  // added in a later version must not silently vanish for a user whose
  // persisted map predates it. Only Genre Playlists ships collapsed, because
  // it renders one input per genre.
  const isOpen = (id: string): boolean => accordion[id] ?? true;
  const filledGenrePlaylists = Object.values(settings.genrePlaylists).filter((v) =>
    v?.trim(),
  ).length;

  const langOptions = SUPPORTED_LANGUAGES.map((l) => ({
    value: l.id,
    label: `${l.flag} ${l.nativeName}`,
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
    <div className="mx-auto max-w-2xl p-4 sm:p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-lg font-bold text-text-primary">{t("settings.title")}</h1>
        {/* Ungated since v0.35.0. This pair used to be desktop-only, a leftover
            from when "export" meant dumping the on-disk settings.json. Import
            has always been a plain <input type="file"> that needs no Tauri, and
            export now offers a real save dialog on the web too — so hiding both
            on the web build was the odd one out among every other export button
            in the app. */}
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => void importSettingsFromFile()}>
            <Upload className="h-3.5 w-3.5" />
            {t("common.import")}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => void exportSettingsToFile(t)}>
            <Save className="h-3.5 w-3.5" />
            {t("common.export")}
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-8">
        {/* 1. Appearance — theme toggle only. */}
        <Accordion
          id="appearance"
          icon="🎨"
          title={t("settings.appearance")}
          open={isOpen("appearance")}
          onToggle={() => toggleAccordion("appearance")}
        >
          <Toggle
            label={t("settings.theme") + (settings.theme === "dark" ? " (Dark)" : " (Light)")}
            checked={settings.theme === "dark"}
            onChange={(v) => settings.setTheme(v ? "dark" : "light")}
          />
        </Accordion>

        {/* 2. Language & Defaults — app + output language. */}
        <Accordion
          id="defaults"
          icon="🌐"
          title={t("settings.defaults")}
          open={isOpen("defaults")}
          onToggle={() => toggleAccordion("defaults")}
        >
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
        </Accordion>

        {/* 3. Editor — UI knobs that affect the editor page itself. */}
        <Accordion
          id="editorSettings"
          icon="✏️"
          title={t("settings.editorSettings")}
          open={isOpen("editorSettings")}
          onToggle={() => toggleAccordion("editorSettings")}
        >
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
        </Accordion>

        {/* 3.5 Guardrails — v0.35.0 Strict Mode. Off by default: the app's
            whole premise is getting a description out quickly, so the seatbelt
            is opt-in for creators who publish in bulk and would rather be
            stopped than fix it after upload. */}
        <Accordion
          id="guardrails"
          icon="🛡️"
          title={t("settings.guardrails")}
          open={isOpen("guardrails")}
          onToggle={() => toggleAccordion("guardrails")}
        >
          <Toggle
            label={t("settings.strictMode")}
            checked={settings.strictMode}
            onChange={(v) => settings.setSetting("strictMode", v)}
          />
          <p className="text-xs text-text-muted">{t("settings.strictModeHint")}</p>
        </Accordion>

        {/* 4. Title format — NEW in v0.7. Quality badge + format knobs. */}
        <Accordion
          id="titleFormat"
          icon="🏷️"
          title={t("settings.titleFormatTitle")}
          open={isOpen("titleFormat")}
          onToggle={() => toggleAccordion("titleFormat")}
        >
          <Toggle
            label={t("settings.showQualityBadge")}
            checked={settings.showQualityBadge}
            onChange={(v) => settings.setSetting("showQualityBadge", v)}
          />
          <Select
            label={t("settings.badgePosition")}
            options={badgePositionOptions}
            value={settings.titleFormat.badgePosition}
            onChange={(v) => settings.setTitleFormat({ badgePosition: v as TitleBadgePosition })}
          />
          <Select
            label={t("settings.titleSeparator")}
            options={titleSeparatorOptions}
            value={settings.titleFormat.separator}
            onChange={(v) => settings.setTitleFormat({ separator: v as TitleSeparatorId })}
          />
          <Select
            label={t("settings.badgeCase")}
            options={badgeCaseOptions}
            value={settings.titleFormat.badgeCase}
            onChange={(v) => settings.setTitleFormat({ badgeCase: v as TitleBadgeCase })}
          />
        </Accordion>

        {/* 5. Description — controls for auto-generated description blocks. */}
        <Accordion
          id="description"
          icon="📝"
          title={t("settings.descriptionSettingsTitle")}
          open={isOpen("description")}
          onToggle={() => toggleAccordion("description")}
        >
          <Toggle
            label={t("settings.showCopyright")}
            checked={settings.showCopyright}
            onChange={(v) => settings.setSetting("showCopyright", v)}
          />
          <Toggle
            label={t("settings.showGameCopyright")}
            checked={settings.showGameCopyright}
            onChange={(v) => settings.setSetting("showGameCopyright", v)}
          />
          <p className="-mt-1 ml-14 text-xs text-text-muted">
            {t("settings.showGameCopyrightHint")}
          </p>
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
            <p className="-mt-1 ml-14 text-xs text-text-muted">{t("settings.thirdPartyAdsHint")}</p>
          )}
          <Toggle
            label={t("settings.splitContactEmail")}
            checked={settings.splitContactEmail}
            onChange={(v) => settings.setSetting("splitContactEmail", v)}
          />
          {settings.splitContactEmail && (
            <p className="-mt-1 ml-14 text-xs text-text-muted">
              {t("settings.splitContactEmailHint")}
            </p>
          )}
          <Toggle
            label={t("settings.showTranslationQuality")}
            checked={settings.showTranslationQuality}
            onChange={(v) => settings.setSetting("showTranslationQuality", v)}
          />
          <p className="-mt-1 ml-14 text-xs text-text-muted">
            {t("settings.showTranslationQualityHint")}
          </p>
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
                onChange={(v) => settings.setSetting("pinnedCommentIncludeAskNextGame", v)}
              />
              <Toggle
                label={t("settings.pinnedCommentIncludeGenrePlaylist")}
                checked={settings.pinnedCommentIncludeGenrePlaylist}
                onChange={(v) => settings.setSetting("pinnedCommentIncludeGenrePlaylist", v)}
              />
            </div>
          )}
          <Select
            label={t("settings.hashtagCount")}
            options={hashtagOptions}
            value={String(settings.hashtagCount)}
            onChange={(v) => settings.setSetting("hashtagCount", Number(v))}
          />
        </Accordion>

        {/* 6. Tags — tag-pool controls (narrowed from the old mixed section). */}
        <Accordion
          id="tags"
          icon="#️⃣"
          title={t("settings.tagSettings")}
          open={isOpen("tags")}
          onToggle={() => toggleAccordion("tags")}
        >
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
        </Accordion>

        {/* 6.5 Genre Playlists — per-genre YouTube playlist URLs that the
            pinned-comment template can auto-suggest based on the video's
            primary genre. v0.8 phase 2. */}
        <Accordion
          id="genrePlaylists"
          icon="🎵"
          title={t("settings.genrePlaylistsTitle")}
          open={isOpen("genrePlaylists")}
          onToggle={() => toggleAccordion("genrePlaylists")}
          badge={
            <span className="rounded bg-surface-2 px-1.5 py-0.5 text-xs text-text-muted">
              {t("settings.genrePlaylistsBadge", {
                filled: filledGenrePlaylists,
                total: GENRES.length,
              })}
            </span>
          }
        >
          <p className="text-xs text-text-muted">{t("settings.genrePlaylistsHelp")}</p>
          <p className="text-xs text-text-muted">{t("settings.genrePlaylistsEmptyHint")}</p>
          <div className="flex flex-col gap-2">
            {GENRES.map((g) => (
              <ValidatedInput
                key={g.id}
                label={`${g.icon} ${t(g.labelKey)}`}
                maxLength={FIELD_LIMITS.URL}
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
                      Object.entries(settings.genrePlaylists).filter(([k]) => k !== g.id),
                    );
                    settings.setSetting("genrePlaylists", next);
                  }
                }}
                validate={validatePlaylistUrl}
              />
            ))}
          </div>
        </Accordion>

        {/* 7. History. */}
        <Accordion
          id="history"
          icon="🕘"
          title={t("settings.historySettings")}
          open={isOpen("history")}
          onToggle={() => toggleAccordion("history")}
        >
          <Input
            label={t("settings.historyLimit")}
            type="number"
            value={String(settings.historyLimit)}
            onChange={(e) => {
              const val = Math.max(10, Math.min(500, Number(e.target.value) || 100));
              settings.setSetting("historyLimit", val);
            }}
          />
        </Accordion>

        {/* 8. Logs — v0.17.0 retention. */}
        <Accordion
          id="logs"
          icon="📋"
          title={t("settings.logSettings")}
          open={isOpen("logs")}
          onToggle={() => toggleAccordion("logs")}
        >
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
        </Accordion>
      </div>
    </div>
  );
}
