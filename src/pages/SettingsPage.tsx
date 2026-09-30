import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useDocumentTitle } from "@hooks/use-document-title";
import {
  Download,
  FileText,
  History,
  Languages,
  Moon,
  Palette,
  PenLine,
  ScrollText,
  ShieldCheck,
  Sun,
  Tags,
  Type,
  Upload,
} from "lucide-react";
import { Toggle } from "@components/ui/Toggle";
import { Select } from "@components/ui/Select";
import { Button } from "@components/ui/Button";
import { Accordion } from "@components/ui/Accordion";
import { NumberField } from "@components/ui/NumberField";
import { SegmentedControl } from "@components/ui/SegmentedControl";
import { PageContainer, PageHeader } from "@components/ui/PageHeader";
import { SUPPORTED_LANGUAGES } from "@i18n/index";
import { useSettingsStore } from "@store/settings-store";
import { BackupSection } from "@components/backup/BackupSection";
import { ExportBackupDialog } from "@components/backup/ExportBackupDialog";
import { pickFileToRestore } from "@utils/backup/restore-flow";
import { GenrePlaylistsSection } from "./settings/GenrePlaylistsSection";
import {
  type SupportedLanguage,
  type TitleBadgePosition,
  type TitleSeparatorId,
  type TitleBadgeCase,
} from "@engine/types";

export function SettingsPage() {
  const { t } = useTranslation("ui");
  useDocumentTitle(t("tabs.settings"));
  const settings = useSettingsStore();
  const [exportOpen, setExportOpen] = useState(false);
  const accordion = useSettingsStore((s) => s.settingsAccordionState);
  const toggleAccordion = useSettingsStore((s) => s.toggleSettingsAccordion);
  // Unknown ids default OPEN here — the opposite of EditorPage. A section
  // added in a later version must not silently vanish for a user whose
  // persisted map predates it. Only Genre Playlists ships collapsed, because
  // it renders one input per genre.
  const isOpen = (id: string): boolean => accordion[id] ?? true;
  const section = (id: string) => ({
    id,
    open: isOpen(id),
    onToggle: () => toggleAccordion(id),
  });

  const langOptions = SUPPORTED_LANGUAGES.map((l) => ({
    value: l.id,
    label: `${l.nativeName} (${l.id})`,
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
    <PageContainer width="narrow">
      <PageHeader
        title={t("settings.title")}
        actions={
          <>
            <Button variant="ghost" size="sm" onClick={() => void pickFileToRestore()}>
              <Upload />
              {t("backup.restore")}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setExportOpen(true)}>
              <Download />
              {t("backup.export")}
            </Button>
          </>
        }
      />

      <div className="flex flex-col gap-3">
        <Accordion {...section("appearance")} icon={Palette} title={t("settings.appearance")}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-text-secondary text-sm">{t("settings.theme")}</span>
            <SegmentedControl
              ariaLabel={t("settings.theme")}
              layoutId="settings-theme"
              value={settings.theme}
              onChange={(v) => settings.setTheme(v)}
              options={[
                {
                  value: "dark",
                  label: (
                    <>
                      <Moon className="size-3.5" aria-hidden="true" />
                      {t("settings.themeDark")}
                    </>
                  ),
                },
                {
                  value: "light",
                  label: (
                    <>
                      <Sun className="size-3.5" aria-hidden="true" />
                      {t("settings.themeLight")}
                    </>
                  ),
                },
              ]}
            />
          </div>
        </Accordion>

        <Accordion {...section("defaults")} icon={Languages} title={t("settings.defaults")}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label={t("settings.appLanguage")}
              options={langOptions}
              value={settings.appLanguage}
              onChange={(v) => settings.setAppLanguage(v as SupportedLanguage)}
            />
            <Select
              label={t("settings.defaultOutputLanguage")}
              options={langOptions}
              value={settings.defaultOutputLanguage}
              onChange={(v) => settings.setDefaultOutputLanguage(v as SupportedLanguage)}
            />
          </div>
        </Accordion>

        <Accordion
          {...section("editorSettings")}
          icon={PenLine}
          title={t("settings.editorSettings")}
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

        {/* Strict Mode is off by default: the app's whole premise is getting a
            description out quickly, so the seatbelt is opt-in for creators who
            publish in bulk and would rather be stopped than fix it after upload. */}
        <Accordion {...section("guardrails")} icon={ShieldCheck} title={t("settings.guardrails")}>
          <Toggle
            label={t("settings.strictMode")}
            description={t("settings.strictModeHint")}
            checked={settings.strictMode}
            onChange={(v) => settings.setSetting("strictMode", v)}
          />
        </Accordion>

        <Accordion {...section("titleFormat")} icon={Type} title={t("settings.titleFormatTitle")}>
          <Toggle
            label={t("settings.showQualityBadge")}
            checked={settings.showQualityBadge}
            onChange={(v) => settings.setSetting("showQualityBadge", v)}
          />
          <div className="grid gap-4 sm:grid-cols-2">
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
          </div>
        </Accordion>

        <Accordion
          {...section("description")}
          icon={FileText}
          title={t("settings.descriptionSettingsTitle")}
        >
          <Toggle
            label={t("settings.showCopyright")}
            checked={settings.showCopyright}
            onChange={(v) => settings.setSetting("showCopyright", v)}
          />
          <Toggle
            label={t("settings.showGameCopyright")}
            description={t("settings.showGameCopyrightHint")}
            checked={settings.showGameCopyright}
            onChange={(v) => settings.setSetting("showGameCopyright", v)}
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
            description={settings.showThirdPartyAds ? t("settings.thirdPartyAdsHint") : undefined}
            checked={settings.showThirdPartyAds}
            onChange={(v) => settings.setSetting("showThirdPartyAds", v)}
          />
          <Toggle
            label={t("settings.splitContactEmail")}
            description={
              settings.splitContactEmail ? t("settings.splitContactEmailHint") : undefined
            }
            checked={settings.splitContactEmail}
            onChange={(v) => settings.setSetting("splitContactEmail", v)}
          />
          <Toggle
            label={t("settings.showTranslationQuality")}
            description={t("settings.showTranslationQualityHint")}
            checked={settings.showTranslationQuality}
            onChange={(v) => settings.setSetting("showTranslationQuality", v)}
          />
          <Toggle
            label={t("settings.showPinnedCommentTemplate")}
            checked={settings.showPinnedCommentTemplate}
            onChange={(v) => settings.setSetting("showPinnedCommentTemplate", v)}
          />
          {settings.showPinnedCommentTemplate && (
            <div className="border-border ml-4 flex flex-col gap-3 border-l-2 pl-4">
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
            className="max-w-40"
          />
        </Accordion>

        <Accordion {...section("tags")} icon={Tags} title={t("settings.tagSettings")}>
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

        <Accordion {...section("history")} icon={History} title={t("settings.historySettings")}>
          <NumberField
            label={t("settings.historyLimit")}
            value={settings.historyLimit}
            min={10}
            max={500}
            onCommit={(v) => settings.setSetting("historyLimit", v)}
          />
        </Accordion>

        <Accordion {...section("logs")} icon={ScrollText} title={t("settings.logSettings")}>
          {/* Same bounds as `healSettings`. */}
          <NumberField
            label={t("settings.logRetentionDays")}
            value={settings.logRetentionDays}
            min={1}
            max={90}
            onCommit={(v) => settings.setSetting("logRetentionDays", v)}
            help={t("settings.logRetentionHint")}
          />
        </Accordion>

        <BackupSection {...section("backup")} />
      </div>

      <ExportBackupDialog open={exportOpen} onClose={() => setExportOpen(false)} />
    </PageContainer>
  );
}
