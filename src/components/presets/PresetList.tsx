import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Gamepad2, Plus } from "lucide-react";
import { Button } from "@components/ui/Button";
import { EmptyState } from "@components/ui/EmptyState";
import { LibraryList } from "@components/library/LibraryCard";
import { usePresetStore } from "@store/preset-store";
import { PresetCard } from "./PresetCard";
import { PresetSaveForm } from "./PresetSaveForm";

export function PresetList() {
  const { t } = useTranslation("ui");
  const presets = usePresetStore((s) => s.presets);
  const [showCreate, setShowCreate] = useState(false);
  const create = (
    <Button size="sm" onClick={() => setShowCreate(true)}>
      <Plus />
      {t("presets.createNew")}
    </Button>
  );

  return (
    <>
      <LibraryList
        hint={t("presets.hint")}
        action={presets.length > 0 ? create : undefined}
        empty={
          presets.length === 0 ? (
            <EmptyState icon={Gamepad2} title={t("presets.emptyState")} action={create} />
          ) : undefined
        }
      >
        {presets.map((preset) => (
          <PresetCard key={preset.id} preset={preset} />
        ))}
      </LibraryList>
      <PresetSaveForm open={showCreate} onClose={() => setShowCreate(false)} />
    </>
  );
}
