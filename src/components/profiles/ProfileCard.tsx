import { useState } from "react";
import { useTranslation } from "react-i18next";
import { UserRound } from "lucide-react";
import { LibraryCard } from "@components/library/LibraryCard";
import { useProfileStore, type Profile } from "@store/profile-store";
import { applyProfile } from "@utils/library-apply";
import { ProfileSaveForm } from "./ProfileSaveForm";

export function ProfileCard({ profile }: { profile: Profile }) {
  const { t } = useTranslation("ui");
  const deleteProfile = useProfileStore((s) => s.deleteProfile);
  const [showEdit, setShowEdit] = useState(false);

  // An imported profile may carry null for either record, and
  // Object.values(null) throws.
  const socialCount = Object.values(profile.social ?? {}).filter((v) => v).length;
  const rigCount = Object.values(profile.rig ?? {}).filter((v) => v).length;
  const meta = [
    profile.channelName || t("profiles.noChannel"),
    socialCount > 0 ? t("profiles.socialLinks", { n: socialCount }) : null,
    rigCount > 0 ? t("profiles.rigFields", { n: rigCount }) : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <>
      <LibraryCard
        icon={UserRound}
        title={profile.name}
        meta={meta}
        applyLabel={t("profiles.loadProfile")}
        onApply={() => applyProfile(profile)}
        onEdit={() => setShowEdit(true)}
        onDelete={() => deleteProfile(profile.id)}
        deleteMessage={t("profiles.deleteConfirm")}
      />
      <ProfileSaveForm open={showEdit} onClose={() => setShowEdit(false)} editProfile={profile} />
    </>
  );
}
