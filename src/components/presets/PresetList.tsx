import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus } from "lucide-react";
import { Button } from "@components/ui/Button";
import { usePresetStore } from "@store/preset-store";
import { PresetCard } from "./PresetCard";
import { PresetSaveForm } from "./PresetSaveForm";

export function PresetList() {
  const { t } = useTranslation("ui");
  const presets = usePresetStore((s) => s.presets);
  const [showCreate, setShowCreate] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-text-primary">{t("presets.title")}</h2>
        <Button size="sm" onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4" />
          {t("presets.createNew")}
        </Button>
      </div>

      {presets.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border py-8 text-center text-sm text-text-muted">
          {t("presets.emptyState")}
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {presets.map((preset) => (
            <PresetCard key={preset.id} preset={preset} />
          ))}
        </div>
      )}

      <PresetSaveForm open={showCreate} onClose={() => setShowCreate(false)} />
    </div>
  );
}
