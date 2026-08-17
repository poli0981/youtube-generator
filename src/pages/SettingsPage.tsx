import { useTranslation } from "react-i18next";
import { useDocumentTitle } from "@hooks/use-document-title";
import { Save, Upload } from "lucide-react";
import { Toggle } from "@components/ui/Toggle";
import { Select } from "@components/ui/Select";
import { Input } from "@components/ui/Input";
import { Button } from "@components/ui/Button";
import { Accordion } from "@components/ui/Accordion";
import { SUPPORTED_LANGUAGES } from "@i18n/index";
import { useSettingsStore } from "@store/settings-store";
import { exportSettingsToFile, importSettingsFromFile } from "./settings/settings-io";
import { GenrePlaylistsSection } from "./settings/GenrePlaylistsSection";
import {
  type SupportedLanguage,
  type TitleBadgePosition,
  type TitleSeparatorId,
  type TitleBadgeCase,
} from "@engine/types";

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

        <GenrePlaylistsSection />

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
