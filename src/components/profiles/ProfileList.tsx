import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus } from "lucide-react";
import { Button } from "@components/ui/Button";
import { useProfileStore } from "@store/profile-store";
import { ProfileCard } from "./ProfileCard";
import { ProfileSaveForm } from "./ProfileSaveForm";

export function ProfileList() {
  const { t } = useTranslation("ui");
  const profiles = useProfileStore((s) => s.profiles);
  const [showCreate, setShowCreate] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-text-primary text-base font-semibold">{t("profiles.title")}</h2>
        <Button size="sm" onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4" />
          {t("profiles.createNew")}
        </Button>
      </div>

      {profiles.length === 0 ? (
        <p className="border-border text-text-muted rounded-lg border border-dashed py-8 text-center text-sm">
          {t("profiles.emptyState")}
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {profiles.map((profile) => (
            <ProfileCard key={profile.id} profile={profile} />
          ))}
        </div>
      )}

      <ProfileSaveForm open={showCreate} onClose={() => setShowCreate(false)} />
    </div>
  );
}
