import { useId, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Modal } from "@components/ui/Modal";
import { Button } from "@components/ui/Button";
import { Input } from "@components/ui/Input";
import { Textarea } from "@components/ui/Textarea";
import { Checkbox } from "@components/ui/Checkbox";
import { editorDataOf, useEditorStore } from "@store/editor-store";
import { useProfileStore, type Profile } from "@store/profile-store";
import { profileFieldsFromEditor } from "@utils/library-apply";
import { FIELD_LIMITS } from "@config/field-limits";

interface ProfileSaveFormProps {
  open: boolean;
  onClose: () => void;
  editProfile?: Profile;
}

/**
 * Create a profile from the editor's channel fields, or rename / update one.
 * Mounted only while open, so it always starts from the profile as it is now.
 */
export function ProfileSaveForm(props: ProfileSaveFormProps) {
  return props.open ? <ProfileSaveFormBody {...props} /> : null;
}

function ProfileSaveFormBody({ onClose, editProfile }: ProfileSaveFormProps) {
  const { t } = useTranslation("ui");
  const formId = useId();
  const addProfile = useProfileStore((s) => s.addProfile);
  const updateProfile = useProfileStore((s) => s.updateProfile);
  const [name, setName] = useState(editProfile?.name ?? "");
  // Third-party ad copy is the one profile field edited here rather than in
  // the editor, so it can be set once per channel.
  const [adText, setAdText] = useState(
    editProfile?.thirdPartyAdText ?? useEditorStore.getState().thirdPartyAdText,
  );
  const [fromEditor, setFromEditor] = useState(false);

  const save = (e: FormEvent) => {
    e.preventDefault();
    const fields = profileFieldsFromEditor(editorDataOf(useEditorStore.getState()));
    const finalName = name.trim() || fields.channelName.trim() || t("profiles.unnamed");
    if (editProfile) {
      updateProfile(editProfile.id, {
        ...(fromEditor ? fields : {}),
        name: finalName,
        thirdPartyAdText: adText,
      });
      toast.success(t("profiles.updated", { name: finalName }));
    } else {
      addProfile({ ...fields, name: finalName, thirdPartyAdText: adText });
      toast.success(t("profiles.saved", { name: finalName }));
    }
    onClose();
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={editProfile ? t("profiles.editProfile") : t("profiles.createNew")}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button type="submit" form={formId}>
            {t("common.save")}
          </Button>
        </>
      }
    >
      <form id={formId} onSubmit={save} className="flex flex-col gap-3">
        <Input
          label={t("profiles.profileName")}
          maxLength={FIELD_LIMITS.SHORT_NAME}
          placeholder={t("profiles.profileNamePlaceholder")}
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
        />
        <Textarea
          label={t("profiles.thirdPartyAdText")}
          maxLength={FIELD_LIMITS.LONG_TEXT}
          placeholder={t("profiles.thirdPartyAdTextPlaceholder")}
          value={adText}
          onChange={(e) => setAdText(e.target.value)}
          rows={4}
          helpText={t("profiles.thirdPartyAdTextHelp")}
        />
        {editProfile ? (
          <Checkbox
            checked={fromEditor}
            onChange={setFromEditor}
            label={
              <span className="flex flex-col gap-0.5">
                <span className="text-text-primary text-sm">{t("profiles.updateFromEditor")}</span>
                <span className="text-text-muted text-xs">{t("profiles.saveHint")}</span>
              </span>
            }
          />
        ) : (
          <p className="text-text-muted text-xs">{t("profiles.saveHint")}</p>
        )}
      </form>
    </Modal>
  );
}
