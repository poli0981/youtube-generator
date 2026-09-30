import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, UserRound } from "lucide-react";
import { Button } from "@components/ui/Button";
import { EmptyState } from "@components/ui/EmptyState";
import { LibraryList } from "@components/library/LibraryCard";
import { useProfileStore } from "@store/profile-store";
import { ProfileCard } from "./ProfileCard";
import { ProfileSaveForm } from "./ProfileSaveForm";

export function ProfileList() {
  const { t } = useTranslation("ui");
  const profiles = useProfileStore((s) => s.profiles);
  const [showCreate, setShowCreate] = useState(false);
  const create = (
    <Button size="sm" onClick={() => setShowCreate(true)}>
      <Plus />
      {t("profiles.createNew")}
    </Button>
  );

  return (
    <>
      <LibraryList
        hint={t("profiles.hint")}
        action={profiles.length > 0 ? create : undefined}
        empty={
          profiles.length === 0 ? (
            <EmptyState icon={UserRound} title={t("profiles.emptyState")} action={create} />
          ) : undefined
        }
      >
        {profiles.map((profile) => (
          <ProfileCard key={profile.id} profile={profile} />
        ))}
      </LibraryList>
      <ProfileSaveForm open={showCreate} onClose={() => setShowCreate(false)} />
    </>
  );
}
