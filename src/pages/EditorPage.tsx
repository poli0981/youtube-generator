import { VideoTypeSelector } from "@components/editor/VideoTypeSelector";
import { LanguageSelector } from "@components/editor/LanguageSelector";
import { GenreSelector } from "@components/editor/GenreSelector";
import { GameInfoForm } from "@components/editor/GameInfoForm";
import { VideoSettingsForm } from "@components/editor/VideoSettingsForm";
import { TimestampEditor } from "@components/editor/TimestampEditor";
import { StoreLinkEditor } from "@components/editor/StoreLinkEditor";
import { RigEditor } from "@components/editor/RigEditor";
import { SocialEditor } from "@components/editor/SocialEditor";
import { WarningToggles } from "@components/editor/WarningToggles";
import { ThumbnailHelper } from "@components/editor/ThumbnailHelper";
import { PinnedCommentEditor } from "@components/editor/PinnedCommentEditor";
import { MusicAttributionEditor } from "@components/editor/MusicAttributionEditor";
import { QuickPreview } from "@components/editor/QuickPreview";
import { DraftIndicator } from "@components/editor/DraftIndicator";
import { PresetSelector } from "@components/presets/PresetSelector";
import { ValidatedInput } from "@components/ui/ValidatedInput";
import { Button } from "@components/ui/Button";
import { ConfirmDialog } from "@components/ui/ConfirmDialog";
import { useEditorStore } from "@store/editor-store";
import { useTranslation } from "react-i18next";
import { validateEmails, validateUrl } from "@utils/validation";
import { RotateCcw } from "lucide-react";
import { useState } from "react";

export function EditorPage() {
  const { t } = useTranslation("ui");
  const store = useEditorStore();
  const [showClearDraft, setShowClearDraft] = useState(false);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 p-6 lg:flex-row">
      {/* Form */}
      <div className="flex flex-1 flex-col gap-6">
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
        <VideoTypeSelector />
        <div className="grid grid-cols-2 gap-4">
          <LanguageSelector />
          <div />
        </div>
        <GenreSelector />
        <PresetSelector />
        <GameInfoForm />
        <VideoSettingsForm />
        <TimestampEditor />

        <ValidatedInput
          label={t("editor.playlistLink")}
          placeholder={t("editor.playlistLinkPlaceholder")}
          value={store.playlistLink ?? ""}
          onChange={(v) => store.set("playlistLink", v)}
          validate={validateUrl}
        />
        <ValidatedInput
          label={t("editor.contactEmail")}
          placeholder={t("editor.contactEmailPlaceholder")}
          value={store.contactEmail ?? ""}
          onChange={(v) => store.set("contactEmail", v)}
          validate={validateEmails}
          helpText={t("editor.contactEmailHelp")}
        />

        <WarningToggles />
        <MusicAttributionEditor />
        <ThumbnailHelper />
        <PinnedCommentEditor />
        <StoreLinkEditor />
        <RigEditor />
        <SocialEditor />
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
