import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Modal } from "@components/ui/Modal";
import { Button } from "@components/ui/Button";
import { Input } from "@components/ui/Input";
import { Textarea } from "@components/ui/Textarea";
import { useEditorStore } from "@store/editor-store";
import { useProfileStore, type Profile } from "@store/profile-store";

interface ProfileSaveFormProps {
  open: boolean;
  onClose: () => void;
  editProfile?: Profile;
}

export function ProfileSaveForm({ open, onClose, editProfile }: ProfileSaveFormProps) {
  const { t } = useTranslation("ui");
  const editor = useEditorStore();
  const { addProfile, updateProfile } = useProfileStore();

  const [name, setName] = useState(editProfile?.name ?? "");
  // v0.11: third-party ad copy is the only Profile field that doesn't
  // round-trip through the editor. Edit it inline here so the user can
  // set it once per channel without round-tripping through the editor
  // form. New profiles inherit from `editor.thirdPartyAdText` (so a
  // fresh profile picks up whatever the user typed in the editor); edit
  // mode reads the existing value.
  const [adText, setAdText] = useState(
    editProfile?.thirdPartyAdText ?? editor.thirdPartyAdText ?? "",
  );

  const handleSave = () => {
    const data = {
      name: name.trim() || "Unnamed Profile",
      channelName: editProfile?.channelName ?? editor.channelName,
      contactEmail: editProfile?.contactEmail ?? editor.contactEmail,
      adEmail: editProfile?.adEmail ?? editor.adEmail,
      gameKeyEmail: editProfile?.gameKeyEmail ?? editor.gameKeyEmail,
      social: editProfile?.social ?? { ...editor.social },
      rig: editProfile?.rig ?? { ...editor.rig },
      resolution: editProfile?.resolution ?? editor.resolution,
      fps: editProfile?.fps ?? editor.fps,
      graphicsPreset: editProfile?.graphicsPreset ?? editor.graphicsPreset,
      thirdPartyAdText: adText,
    };

    if (editProfile) {
      updateProfile(editProfile.id, { ...data });
    } else {
      addProfile(data);
    }
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editProfile ? t("profiles.editProfile") : t("profiles.createNew")}
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
          label={t("profiles.profileName")}
          placeholder={t("profiles.profileNamePlaceholder")}
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
        />
        <Textarea
          label={t("profiles.thirdPartyAdText")}
          placeholder={t("profiles.thirdPartyAdTextPlaceholder")}
          value={adText}
          onChange={(e) => setAdText(e.target.value)}
          rows={4}
        />
        <p className="text-xs text-text-muted">{t("profiles.thirdPartyAdTextHelp")}</p>
        <p className="text-xs text-text-muted">
          {editProfile
            ? "Update this profile's name and ad copy. Other fields are saved from the editor."
            : "Profile will save your current channel name, social links, rig info, and video settings."}
        </p>
      </div>
    </Modal>
  );
}
