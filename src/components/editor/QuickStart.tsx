import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FilePlus2, RefreshCw, SkipForward } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@components/ui/Card";
import { Button } from "@components/ui/Button";
import { Select } from "@components/ui/Select";
import { ConfirmDialog } from "@components/ui/ConfirmDialog";
import { VIDEO_TYPES } from "@config/video-types";
import { editorDataOf, normalizeEditorPatch, useEditorStore } from "@store/editor-store";
import { useProfileStore, type Profile } from "@store/profile-store";
import { usePresetStore, type GamePreset } from "@store/preset-store";
import { useSettingsStore } from "@store/settings-store";
import {
  applyPreset,
  applyProfile,
  changedSince,
  nextPartNumber,
  overwrittenFields,
  presetFieldsFromEditor,
  presetPatch,
  profileFieldsFromEditor,
  profilePatch,
  startNewVideo,
  startNextPart,
} from "@utils/library-apply";

type Pending =
  | { kind: "profile"; item: Profile; count: number }
  | { kind: "preset"; item: GamePreset; count: number };

/**
 * The top of the editor: fill the channel from a profile and the game from
 * a preset, or move on to the next video of the same game. Replacing fields
 * that already hold something else asks first; everything offers Undo.
 */
export function QuickStart() {
  const { t } = useTranslation("ui");
  const profiles = useProfileStore((s) => s.profiles);
  const presets = usePresetStore((s) => s.presets);
  const updateProfile = useProfileStore((s) => s.updateProfile);
  const updatePreset = usePresetStore((s) => s.updatePreset);
  const lastProfileId = useSettingsStore((s) => s.lastProfileId);
  const lastPresetId = useSettingsStore((s) => s.lastPresetId);
  // The drift hints compare against the whole form, so this re-renders with
  // it — a card of two selects and two buttons.
  const editor = useEditorStore();
  const [pending, setPending] = useState<Pending | null>(null);

  const activeProfile = profiles.find((p) => p.id === lastProfileId);
  const activePreset = presets.find((p) => p.id === lastPresetId);
  const data = editorDataOf(editor);
  // Compared the way applying would write them (legacy values mapped), so a
  // freshly applied item never shows as changed.
  const profileDrift = activeProfile
    ? changedSince(data, normalizeEditorPatch(profilePatch(activeProfile)))
    : [];
  const presetDrift = activePreset
    ? changedSince(data, normalizeEditorPatch(presetPatch(activePreset)))
    : [];

  const usesPart = VIDEO_TYPES.find((v) => v.id === editor.videoType)?.extraFields.some(
    (f) => f === "partNumber",
  );
  const nextPart = nextPartNumber(editor.partNumber);

  const apply = (target: Pending) => {
    if (target.kind === "profile") applyProfile(target.item);
    else applyPreset(target.item);
  };

  const choose = (target: Omit<Pending, "count">) => {
    const patch =
      target.kind === "profile"
        ? profilePatch(target.item as Profile)
        : presetPatch(target.item as GamePreset);
    const count = overwrittenFields(data, normalizeEditorPatch(patch)).length;
    const full = { ...target, count } as Pending;
    if (count > 0) setPending(full);
    else apply(full);
  };

  const hasLibrary = profiles.length > 0 || presets.length > 0;

  return (
    <Card className="flex flex-col gap-3 p-3 sm:p-4">
      {hasLibrary ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <Select
            label={t("editor.quick.profile")}
            value={activeProfile?.id ?? ""}
            disabled={profiles.length === 0}
            options={[
              { value: "", label: t("editor.quick.chooseProfile") },
              ...profiles.map((p) => ({ value: p.id, label: p.name })),
            ]}
            onChange={(id) => {
              const item = profiles.find((p) => p.id === id);
              if (item) choose({ kind: "profile", item });
            }}
          />
          <Select
            label={t("editor.quick.preset")}
            value={activePreset?.id ?? ""}
            disabled={presets.length === 0}
            options={[
              { value: "", label: t("editor.quick.choosePreset") },
              ...presets.map((p) => ({ value: p.id, label: p.gameName })),
            ]}
            onChange={(id) => {
              const item = presets.find((p) => p.id === id);
              if (item) choose({ kind: "preset", item });
            }}
          />
        </div>
      ) : (
        <p className="text-text-muted text-xs">
          {t("editor.quick.emptyLibrary")}{" "}
          <Link to="/profiles" className="text-accent font-medium hover:underline">
            {t("tabs.profiles")}
          </Link>
        </p>
      )}

      {activeProfile && profileDrift.length > 0 && (
        <DriftHint
          text={t("editor.quick.profileChanged", { name: activeProfile.name })}
          action={t("editor.quick.updateProfile")}
          onUpdate={() => {
            updateProfile(activeProfile.id, profileFieldsFromEditor(data));
            toast.success(t("profiles.updated", { name: activeProfile.name }));
          }}
        />
      )}
      {activePreset && presetDrift.length > 0 && (
        <DriftHint
          text={t("editor.quick.presetChanged", { name: activePreset.gameName })}
          action={t("editor.quick.updatePreset")}
          onUpdate={() => {
            updatePreset(activePreset.id, presetFieldsFromEditor(data));
            toast.success(t("presets.updated", { name: activePreset.gameName }));
          }}
        />
      )}

      <div className="flex flex-wrap gap-2">
        {usesPart && (
          <Button variant="secondary" size="sm" onClick={startNextPart}>
            <SkipForward />
            {nextPart
              ? t("editor.quick.nextPart", { n: nextPart })
              : t("editor.quick.nextPartPlain")}
          </Button>
        )}
        <Button variant="secondary" size="sm" onClick={startNewVideo}>
          <FilePlus2 />
          {t("editor.quick.newVideo")}
        </Button>
      </div>

      <ConfirmDialog
        open={pending !== null}
        title={
          pending?.kind === "profile"
            ? t("editor.quick.applyProfileTitle", { name: pending.item.name })
            : t("editor.quick.applyPresetTitle", {
                name: pending?.kind === "preset" ? pending.item.gameName : "",
              })
        }
        message={t("editor.quick.overwrite", { n: pending?.count ?? 0 })}
        confirmLabel={t("editor.quick.replace")}
        onConfirm={() => {
          if (pending) apply(pending);
          setPending(null);
        }}
        onCancel={() => setPending(null)}
      />
    </Card>
  );
}

function DriftHint({
  text,
  action,
  onUpdate,
}: {
  text: string;
  action: string;
  onUpdate: () => void;
}) {
  return (
    <div className="bg-surface-2/60 flex flex-wrap items-center justify-between gap-2 rounded-lg px-3 py-2">
      <p className="text-text-secondary text-xs">{text}</p>
      <Button variant="ghost" size="sm" onClick={onUpdate}>
        <RefreshCw />
        {action}
      </Button>
    </div>
  );
}
