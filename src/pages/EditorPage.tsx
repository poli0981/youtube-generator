import { VideoTypeSelector } from "@components/editor/VideoTypeSelector";
import { LanguageSelector } from "@components/editor/LanguageSelector";
import { GenreSelector } from "@components/editor/GenreSelector";
import { GameInfoForm } from "@components/editor/GameInfoForm";
import { ExtraFieldsInput } from "@components/editor/ExtraFieldsInput";
import { VideoSettingsForm } from "@components/editor/VideoSettingsForm";
import { TimestampEditor } from "@components/editor/TimestampEditor";
import { StoreLinkEditor } from "@components/editor/StoreLinkEditor";
import { RigEditor } from "@components/editor/RigEditor";
import { SocialEditor } from "@components/editor/SocialEditor";
import { WarningToggles } from "@components/editor/WarningToggles";
import { ContentDetailsForm } from "@components/editor/ContentDetailsForm";
import { ThumbnailHelper } from "@components/editor/ThumbnailHelper";
import { PinnedCommentEditor } from "@components/editor/PinnedCommentEditor";
import { MusicAttributionEditor } from "@components/editor/MusicAttributionEditor";
import { SponsorCreditEditor } from "@components/editor/SponsorCreditEditor";
import { QuickPreview } from "@components/editor/QuickPreview";
import { DraftIndicator } from "@components/editor/DraftIndicator";
import { PresetSelector } from "@components/presets/PresetSelector";
import { ValidatedInput } from "@components/ui/ValidatedInput";
import { Button } from "@components/ui/Button";
import { ConfirmDialog } from "@components/ui/ConfirmDialog";
import { Accordion } from "@components/ui/Accordion";
import { useEditorStore } from "@store/editor-store";
import { useSettingsStore } from "@store/settings-store";
import { useTranslation } from "react-i18next";
import { validateEmails, validatePlaylistUrl } from "@utils/validation";
import { RotateCcw } from "lucide-react";
import { useState } from "react";

export function EditorPage() {
  const { t } = useTranslation("ui");
  const store = useEditorStore();
  const accordion = useSettingsStore((s) => s.editorAccordionState);
  const toggleAccordion = useSettingsStore((s) => s.toggleEditorAccordion);
  const [showClearDraft, setShowClearDraft] = useState(false);

  const isOpen = (id: string): boolean => accordion[id] ?? false;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 p-6 lg:flex-row">
      {/* Form */}
      <div className="flex flex-1 flex-col gap-4">
        <div className="flex items-center justify-between">
          <DraftIndicator />
          <Button variant="ghost" size="sm" onClick={() => setShowClearDraft(true)}>
            <RotateCcw className="h-3.5 w-3.5" />
            {t("editor.clearDraft")}
          </Button>
        </div>
        <ConfirmDialog
          open={showClearDraft}
          onConfirm={() => {
            store.reset();
            setShowClearDraft(false);
          }}
          onCancel={() => setShowClearDraft(false)}
          title={t("editor.clearDraft")}
          message={t("editor.clearDraftConfirm")}
          variant="danger"
        />

        <Accordion
          id="gameInfo"
          title={t("editor.sections.gameInfo")}
          icon="🎮"
          open={isOpen("gameInfo")}
          onToggle={() => toggleAccordion("gameInfo")}
        >
          <LanguageSelector />
          <GenreSelector />
          <PresetSelector />
          <GameInfoForm />
        </Accordion>

        <Accordion
          id="videoSettings"
          title={t("editor.sections.videoSettings")}
          icon="🎬"
          open={isOpen("videoSettings")}
          onToggle={() => toggleAccordion("videoSettings")}
        >
          <VideoTypeSelector />
          <ExtraFieldsInput />
          <VideoSettingsForm />
        </Accordion>

        <Accordion
          id="contentDetails"
          title={t("editor.sections.contentDetails")}
          icon="⏱"
          open={isOpen("contentDetails")}
          onToggle={() => toggleAccordion("contentDetails")}
        >
          <TimestampEditor />
          <ContentDetailsForm />
          <WarningToggles />
          <ValidatedInput
            label={t("editor.playlistLink")}
            placeholder={t("editor.playlistLinkPlaceholder")}
            value={store.playlistLink ?? ""}
            onChange={(v) => store.set("playlistLink", v)}
            validate={validatePlaylistUrl}
          />
          <ValidatedInput
            label={t("editor.contactEmail")}
            placeholder={t("editor.contactEmailPlaceholder")}
            value={store.contactEmail ?? ""}
            onChange={(v) => store.set("contactEmail", v)}
            validate={validateEmails}
            helpText={t("editor.contactEmailHelp")}
          />
        </Accordion>

        <Accordion
          id="attribution"
          title={t("editor.sections.attribution")}
          icon="🎵"
          open={isOpen("attribution")}
          onToggle={() => toggleAccordion("attribution")}
        >
          <MusicAttributionEditor />
          <SponsorCreditEditor />
          <ThumbnailHelper />
          <PinnedCommentEditor />
        </Accordion>

        <Accordion
          id="rig"
          title={t("editor.sections.rig")}
          icon="💻"
          open={isOpen("rig")}
          onToggle={() => toggleAccordion("rig")}
        >
          <RigEditor />
        </Accordion>

        <Accordion
          id="storeAndSocial"
          title={t("editor.sections.storeAndSocial")}
          icon="🔗"
          open={isOpen("storeAndSocial")}
          onToggle={() => toggleAccordion("storeAndSocial")}
        >
          <StoreLinkEditor />
          <SocialEditor />
        </Accordion>
      </div>

      {/* Sidebar: Quick Preview */}
      <div className="w-full shrink-0 lg:w-80">
        <div className="sticky top-6">
          <QuickPreview />
        </div>
      </div>
    </div>
  );
}
