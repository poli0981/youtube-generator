import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ArrowRight,
  ChevronsDownUp,
  ChevronsUpDown,
  Clapperboard,
  Cpu,
  Eye,
  Gamepad2,
  Link2,
  ListChecks,
  Music,
  RotateCcw,
  type LucideIcon,
} from "lucide-react";
import { VideoTypeSelector } from "@components/editor/VideoTypeSelector";
import { LanguageSelector } from "@components/editor/LanguageSelector";
import { GenreSelector } from "@components/editor/GenreSelector";
import { GameInfoForm } from "@components/editor/GameInfoForm";
import { ExtraFieldsInput } from "@components/editor/ExtraFieldsInput";
import { VideoSettingsForm } from "@components/editor/VideoSettingsForm";
import { TimestampEditor } from "@components/editor/TimestampEditor";
import { StoreLinkEditor } from "@components/editor/StoreLinkEditor";
import { PlaytestEditor } from "@components/editor/PlaytestEditor";
import { RigEditor } from "@components/editor/RigEditor";
import { SocialEditor } from "@components/editor/SocialEditor";
import { VietnameseDonateEditor } from "@components/editor/VietnameseDonateEditor";
import { CommunityEditor } from "@components/editor/CommunityEditor";
import { ContactEmailEditor } from "@components/editor/ContactEmailEditor";
import { ContentWarningChecklist } from "@components/editor/ContentWarningChecklist";
import { PlaythroughNotesForm } from "@components/editor/PlaythroughNotesForm";
import { TechNotesChecklist } from "@components/editor/TechNotesChecklist";
import { ThumbnailHelper } from "@components/editor/ThumbnailHelper";
import { PinnedCommentEditor } from "@components/editor/PinnedCommentEditor";
import { MusicAttributionEditor } from "@components/editor/MusicAttributionEditor";
import { SponsorCreditEditor } from "@components/editor/SponsorCreditEditor";
import { LivePreview } from "@components/editor/LivePreview";
import { DraftIndicator } from "@components/editor/DraftIndicator";
import { PresetSelector } from "@components/presets/PresetSelector";
import { ValidatedInput } from "@components/ui/ValidatedInput";
import { Button } from "@components/ui/Button";
import { ConfirmDialog } from "@components/ui/ConfirmDialog";
import { Accordion } from "@components/ui/Accordion";
import { Drawer } from "@components/ui/Drawer";
import { PageContainer, PageHeader } from "@components/ui/PageHeader";
import { StrictModeBanner } from "@components/ui/StrictModeBanner";
import { FIELD_LIMITS } from "@config/field-limits";
import { VIDEO_TYPES } from "@config/video-types";
import { useEditorStore } from "@store/editor-store";
import { useSettingsStore } from "@store/settings-store";
import { useDocumentTitle } from "@hooks/use-document-title";
import { normalizePlaylistUrl, validatePlaylistUrl } from "@utils/validation";

interface Section {
  id: string;
  titleKey: string;
  icon: LucideIcon;
  content: ReactNode;
}

function PlaylistLinkField() {
  const { t } = useTranslation("ui");
  const playlistLink = useEditorStore((s) => s.playlistLink);
  const set = useEditorStore((s) => s.set);
  return (
    <ValidatedInput
      fieldId="playlistLink"
      labelKey="editor.playlistLink"
      label={t("editor.playlistLink")}
      maxLength={FIELD_LIMITS.URL}
      placeholder={t("editor.playlistLinkPlaceholder")}
      value={playlistLink ?? ""}
      onChange={(v) => set("playlistLink", normalizePlaylistUrl(v))}
      validate={validatePlaylistUrl}
      inputMode="url"
      autoComplete="off"
    />
  );
}

/**
 * Sections in the order a video is filled in: what it is (language, type,
 * game, genre) first, then how it was recorded, what happens in it, credits,
 * the rig and finally links. Video type used to sit in the second section,
 * below a wall of genre chips, although the title depends on it.
 */
const SECTIONS: readonly Section[] = [
  {
    id: "gameInfo",
    titleKey: "editor.sections.gameInfo",
    icon: Gamepad2,
    content: (
      <>
        <LanguageSelector />
        <VideoTypeSelector />
        <PresetSelector />
        <GameInfoForm />
        <ExtraFieldsInput />
        <GenreSelector />
      </>
    ),
  },
  {
    id: "videoSettings",
    titleKey: "editor.sections.videoSettings",
    icon: Clapperboard,
    content: <VideoSettingsForm />,
  },
  {
    id: "contentDetails",
    titleKey: "editor.sections.contentDetails",
    icon: ListChecks,
    content: (
      <>
        <TimestampEditor />
        <PlaythroughNotesForm />
        <ContentWarningChecklist />
        <TechNotesChecklist />
        <PlaylistLinkField />
        <ContactEmailEditor />
      </>
    ),
  },
  {
    id: "attribution",
    titleKey: "editor.sections.attribution",
    icon: Music,
    content: (
      <>
        <MusicAttributionEditor />
        <SponsorCreditEditor />
        <ThumbnailHelper />
        <PinnedCommentEditor />
      </>
    ),
  },
  { id: "rig", titleKey: "editor.sections.rig", icon: Cpu, content: <RigEditor /> },
  {
    id: "storeAndSocial",
    titleKey: "editor.sections.storeAndSocial",
    icon: Link2,
    content: (
      <>
        <StoreLinkEditor />
        <PlaytestEditor />
        <SocialEditor />
        <CommunityEditor />
        <VietnameseDonateEditor />
      </>
    ),
  },
];

const SECTION_IDS = SECTIONS.map((s) => s.id);

/** One line under a collapsed section header, so it is useful while closed. */
function useSectionSummaries(): Partial<Record<string, string>> {
  const { t } = useTranslation("ui");
  const gameName = useEditorStore((s) => s.gameName);
  const videoType = useEditorStore((s) => s.videoType);
  const language = useEditorStore((s) => s.language);
  const resolution = useEditorStore((s) => s.resolution);
  const fps = useEditorStore((s) => s.fps);
  const typeLabelKey = VIDEO_TYPES.find((vt) => vt.id === videoType)?.labelKey;
  return {
    gameInfo: [gameName || null, typeLabelKey ? t(typeLabelKey) : null, language.toUpperCase()]
      .filter(Boolean)
      .join(" · "),
    videoSettings: [resolution, fps && `${fps} FPS`].filter(Boolean).join(" · "),
  };
}

export function EditorPage() {
  const { t } = useTranslation("ui");
  useDocumentTitle(t("tabs.editor"));
  const reset = useEditorStore((s) => s.reset);
  const accordion = useSettingsStore((s) => s.editorAccordionState);
  const toggleAccordion = useSettingsStore((s) => s.toggleEditorAccordion);
  const setAccordions = useSettingsStore((s) => s.setEditorAccordions);
  const summaries = useSectionSummaries();
  const [showClearDraft, setShowClearDraft] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  const isOpen = (id: string): boolean => accordion[id] ?? false;
  const allOpen = SECTION_IDS.every(isOpen);

  return (
    <PageContainer width="wide" className="pb-24 lg:pb-8">
      <PageHeader
        title={t("tabs.editor")}
        meta={<DraftIndicator />}
        actions={
          <>
            <Button variant="ghost" size="sm" onClick={() => setAccordions(SECTION_IDS, !allOpen)}>
              {allOpen ? <ChevronsDownUp /> : <ChevronsUpDown />}
              {allOpen ? t("editor.collapseAll") : t("editor.expandAll")}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setShowClearDraft(true)}>
              <RotateCcw />
              {t("editor.clearDraft")}
            </Button>
            <Button asChild size="sm">
              <Link to="/output">
                {t("editor.viewOutput")}
                <ArrowRight />
              </Link>
            </Button>
          </>
        }
      />

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] xl:grid-cols-[minmax(0,1fr)_25rem]">
        <div className="flex min-w-0 flex-col gap-3">
          {/* Banner only — there is nothing to gate on the editor. This is where
              the user comes to FIX the fields Strict Mode is blocking on, so
              disabling anything here would be exactly backwards. */}
          <StrictModeBanner />
          {SECTIONS.map((section) => (
            <Accordion
              key={section.id}
              id={section.id}
              title={t(section.titleKey)}
              icon={section.icon}
              summary={summaries[section.id]}
              open={isOpen(section.id)}
              onToggle={() => toggleAccordion(section.id)}
            >
              {section.content}
            </Accordion>
          ))}
        </div>

        <aside className="sticky top-6 hidden lg:block" aria-label={t("editor.quickPreview")}>
          <LivePreview />
        </aside>
      </div>

      {/* Phones and tablets: the preview lives in a sheet behind this button. */}
      <Button
        onClick={() => setPreviewOpen(true)}
        className="shadow-pop fixed right-4 bottom-[calc(4.5rem_+_env(safe-area-inset-bottom))] z-30 rounded-full md:bottom-6 lg:hidden"
      >
        <Eye />
        {t("editor.quickPreview")}
      </Button>
      <Drawer
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        side="bottom"
        title={t("editor.quickPreview")}
      >
        <div className="p-3">
          <LivePreview layoutId="live-preview-tab-sheet" showHeading={false} />
        </div>
      </Drawer>

      <ConfirmDialog
        open={showClearDraft}
        onConfirm={() => {
          reset();
          setShowClearDraft(false);
        }}
        onCancel={() => setShowClearDraft(false)}
        title={t("editor.clearDraft")}
        message={t("editor.clearDraftConfirm")}
        variant="danger"
      />
    </PageContainer>
  );
}
