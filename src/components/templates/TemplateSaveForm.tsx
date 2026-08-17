import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Modal } from "@components/ui/Modal";
import { Button } from "@components/ui/Button";
import { Input } from "@components/ui/Input";
import { useEditorStore } from "@store/editor-store";
import { useTemplateStore, type TemplateSnapshot } from "@store/template-store";
import toast from "react-hot-toast";
import { FIELD_LIMITS } from "@config/field-limits";

interface TemplateSaveFormProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Prompts for a template name, then saves the entire editor form as a
 * reusable snapshot. Leaves the editor state untouched.
 */
export function TemplateSaveForm({ open, onClose }: TemplateSaveFormProps) {
  const { t } = useTranslation("ui");
  const editor = useEditorStore();
  const addTemplate = useTemplateStore((s) => s.addTemplate);
  const [name, setName] = useState("");

  const handleSave = () => {
    const snapshot: TemplateSnapshot = {
      videoType: editor.videoType,
      language: editor.language,
      genres: [...editor.genres],
      gameName: editor.gameName,
      gameNameLocalized: { ...editor.gameNameLocalized },
      channelName: editor.channelName,
      platform: editor.platform,
      partNumber: editor.partNumber,
      bossName: editor.bossName,
      dlcName: editor.dlcName,
      challengeName: editor.challengeName,
      modName: editor.modName,
      modList: editor.modList,
      liveUrl: editor.liveUrl,
      scheduledTime: editor.scheduledTime,
      gachaQuestType: editor.gachaQuestType,
      chapterName: editor.chapterName,
      questName: editor.questName,
      resolution: editor.resolution,
      fps: editor.fps,
      graphicsPreset: editor.graphicsPreset,
      graphicsPresetCustom: editor.graphicsPresetCustom,
      skipGraphicsSettings: editor.skipGraphicsSettings,
      rayTracingModes: [...editor.rayTracingModes],
      frameGenVendor: editor.frameGenVendor,
      frameGenMultiplier: editor.frameGenMultiplier,
      upscaleQuality: editor.upscaleQuality,
      artStyle: editor.artStyle,
      versionInfo: editor.versionInfo,
      timestamps: editor.timestamps,
      playlistLink: editor.playlistLink,
      contactEmail: editor.contactEmail,
      adEmail: editor.adEmail,
      gameKeyEmail: editor.gameKeyEmail,
      musicAttribution: editor.musicAttribution,
      thumbnailText: editor.thumbnailText,
      pinnedComment: editor.pinnedComment,
      spoilerWarning: editor.spoilerWarning,
      matureWarning: editor.matureWarning,
      playthroughStatus: editor.playthroughStatus,
      difficulty: editor.difficulty,
      difficultyCustomLabel: editor.difficultyCustomLabel,
      endingsShown: editor.endingsShown,
      languagePatch: editor.languagePatch,
      languagePatchCustom: editor.languagePatchCustom,
      gameVersion: editor.gameVersion,
      gameVersionCustom: editor.gameVersionCustom,
      contentWarnings: [...editor.contentWarnings],
      techNotes: [...editor.techNotes],
      storeLinks: { ...editor.storeLinks },
      storeLinkTypes: { ...editor.storeLinkTypes },
      social: { ...editor.social },
      rig: { ...editor.rig },
      vnBankName: editor.vnBankName,
      vnBankAccount: editor.vnBankAccount,
      vnBankHolder: editor.vnBankHolder,
      vnMomo: editor.vnMomo,
      vnZalopay: editor.vnZalopay,
      messengerCommunityLink: editor.messengerCommunityLink,
      zaloGroupLink: editor.zaloGroupLink,
      signalGroupLink: editor.signalGroupLink,
      instagramGroupLink: editor.instagramGroupLink,
      facebookGroupLink: editor.facebookGroupLink,
    };
    addTemplate(name, snapshot);
    toast.success(t("templates.savedAs", { name: name.trim() || "Untitled" }));
    setName("");
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t("templates.saveAsTemplate")}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button onClick={handleSave}>{t("common.save")}</Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <Input
          label={t("templates.templateName")}
          maxLength={FIELD_LIMITS.SHORT_NAME}
          placeholder={t("templates.templateNamePlaceholder")}
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
        />
        <p className="text-text-muted text-xs">{t("templates.saveHint")}</p>
      </div>
    </Modal>
  );
}
