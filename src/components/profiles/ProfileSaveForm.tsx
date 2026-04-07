import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Modal } from "@components/ui/Modal";
import { Button } from "@components/ui/Button";
import { Input } from "@components/ui/Input";
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

  const handleSave = () => {
    const data = {
      name: name.trim() || "Unnamed Profile",
      channelName: editProfile?.channelName ?? editor.channelName,
      contactEmail: editProfile?.contactEmail ?? editor.contactEmail,
      social: editProfile?.social ?? { ...editor.social },
      rig: editProfile?.rig ?? { ...editor.rig },
      resolution: editProfile?.resolution ?? editor.resolution,
      fps: editProfile?.fps ?? editor.fps,
      graphicsPreset: editProfile?.graphicsPreset ?? editor.graphicsPreset,
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
        <p className="text-xs text-text-muted">
          {editProfile
            ? "Update this profile's name. Other fields are saved from the editor."
            : "Profile will save your current channel name, social links, rig info, and video settings."}
        </p>
      </div>
    </Modal>
  );
}
