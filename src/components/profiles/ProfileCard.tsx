import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Upload, Pencil, Trash2 } from "lucide-react";
import { Button } from "@components/ui/Button";
import { ConfirmDialog } from "@components/ui/ConfirmDialog";
import { useEditorStore } from "@store/editor-store";
import { useProfileStore, type Profile } from "@store/profile-store";
import { ProfileSaveForm } from "./ProfileSaveForm";

interface ProfileCardProps {
  profile: Profile;
}

export function ProfileCard({ profile }: ProfileCardProps) {
  const { t } = useTranslation("ui");
  const loadProfile = useEditorStore((s) => s.loadProfile);
  const deleteProfile = useProfileStore((s) => s.deleteProfile);
  const [showDelete, setShowDelete] = useState(false);
  const [showEdit, setShowEdit] = useState(false);

  const handleLoad = () => {
    // v0.15.0: defensive nullish-coalesce on the two nested record
    // fields. A malformed imported profile may carry `social: null` /
    // `rig: null` — spreading null throws "Cannot convert undefined or
    // null to object", which used to black-screen the app. `?? {}`
    // turns the bad import into a partial load instead of a crash.
    loadProfile({
      channelName: profile.channelName,
      contactEmail: profile.contactEmail,
      social: { ...(profile.social ?? {}) },
      rig: { ...(profile.rig ?? {}) },
      resolution: profile.resolution,
      fps: profile.fps,
      graphicsPreset: profile.graphicsPreset,
      thirdPartyAdText: profile.thirdPartyAdText ?? "",
    });
  };

  // Same defence on render: `Object.values(null)` throws. With the
  // coalesce the count falls back to 0 and the chip just hides.
  const socialCount = Object.values(profile.social ?? {}).filter((v) => v).length;
  const rigCount = Object.values(profile.rig ?? {}).filter((v) => v).length;

  return (
    <>
      <div className="flex flex-col gap-3 rounded-lg border border-border-strong bg-surface-2 p-4 shadow-md shadow-black/10 transition-colors hover:border-accent/30 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-text-primary">{profile.name}</h3>
          <p className="mt-0.5 text-xs text-text-secondary">{profile.channelName || "No channel"}</p>
          <div className="mt-1.5 flex flex-wrap gap-3 text-xs text-text-muted">
            {socialCount > 0 && <span>{socialCount} social links</span>}
            {rigCount > 0 && <span>{rigCount} rig fields</span>}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <Button variant="primary" size="sm" onClick={handleLoad}>
            <Upload className="h-3.5 w-3.5" />
            {t("profiles.loadProfile")}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setShowEdit(true)}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setShowDelete(true)}>
            <Trash2 className="h-3.5 w-3.5 text-danger" />
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={showDelete}
        onConfirm={() => {
          deleteProfile(profile.id);
          setShowDelete(false);
        }}
        onCancel={() => setShowDelete(false)}
        title={t("common.delete")}
        message={t("profiles.deleteConfirm")}
        confirmLabel={t("common.delete")}
        variant="danger"
      />

      <ProfileSaveForm
        open={showEdit}
        onClose={() => setShowEdit(false)}
        editProfile={profile}
      />
    </>
  );
}
