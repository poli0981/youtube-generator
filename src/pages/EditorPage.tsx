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
import { QuickPreview } from "@components/editor/QuickPreview";
import { Input } from "@components/ui/Input";
import { useEditorStore } from "@store/editor-store";
import { useTranslation } from "react-i18next";

export function EditorPage() {
  const { t } = useTranslation("ui");
  const store = useEditorStore();

  return (
    <div className="mx-auto flex max-w-6xl gap-6 p-6">
      {/* Form */}
      <div className="flex flex-1 flex-col gap-6">
        <VideoTypeSelector />
        <div className="grid grid-cols-2 gap-4">
          <LanguageSelector />
          <div />
        </div>
        <GenreSelector />
        <GameInfoForm />
        <VideoSettingsForm />
        <TimestampEditor />

        <Input
          label={t("editor.playlistLink")}
          placeholder={t("editor.playlistLinkPlaceholder")}
          value={store.playlistLink ?? ""}
          onChange={(e) => store.set("playlistLink", e.target.value)}
        />
        <Input
          label={t("editor.contactEmail")}
          placeholder={t("editor.contactEmailPlaceholder")}
          value={store.contactEmail ?? ""}
          onChange={(e) => store.set("contactEmail", e.target.value)}
        />

        <WarningToggles />
        <StoreLinkEditor />
        <RigEditor />
        <SocialEditor />
      </div>

      {/* Sidebar: Quick Preview */}
      <div className="w-80 shrink-0">
        <div className="sticky top-6">
          <QuickPreview />
        </div>
      </div>
    </div>
  );
}
