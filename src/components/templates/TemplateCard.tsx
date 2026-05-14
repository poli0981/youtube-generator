import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Upload, Trash2 } from "lucide-react";
import { Button } from "@components/ui/Button";
import { ConfirmDialog } from "@components/ui/ConfirmDialog";
import { useEditorStore } from "@store/editor-store";
import { useTemplateStore, type EditorTemplate } from "@store/template-store";
import toast from "react-hot-toast";

interface TemplateCardProps {
  template: EditorTemplate;
}

export function TemplateCard({ template }: TemplateCardProps) {
  const { t } = useTranslation("ui");
  const loadProfile = useEditorStore((s) => s.loadProfile);
  const deleteTemplate = useTemplateStore((s) => s.deleteTemplate);
  const [showDelete, setShowDelete] = useState(false);

  const handleApply = () => {
    // v0.15.0: defend against a template whose `snapshot` field is
    // null/undefined — most commonly when the template was imported
    // from a malformed JSON. `loadProfile` itself now ignores a null
    // patch via `normalizeEditorPatch`, but checking here lets us
    // surface a clearer toast and skip the no-op success message.
    if (!template.snapshot || typeof template.snapshot !== "object") {
      toast.error(t("templates.applyFailed", { defaultValue: "Template is corrupt — cannot apply" }));
      return;
    }
    loadProfile(template.snapshot);
    toast.success(t("templates.appliedToast", { name: template.name }));
  };

  const date = new Date(template.createdAt).toLocaleDateString();

  return (
    <>
      <div className="flex items-center justify-between rounded-lg border border-border-strong bg-surface-2 p-4 shadow-md shadow-black/10 transition-colors hover:border-accent/30">
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-text-primary">{template.name}</h3>
          <div className="mt-1.5 flex items-center gap-2 text-xs text-text-muted">
            <span>{template.snapshot.gameName || "—"}</span>
            <span>·</span>
            <span>{date}</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <Button variant="primary" size="sm" onClick={handleApply}>
            <Upload className="h-3.5 w-3.5" />
            {t("templates.loadTemplate")}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setShowDelete(true)}>
            <Trash2 className="h-3.5 w-3.5 text-danger" />
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={showDelete}
        onConfirm={() => {
          deleteTemplate(template.id);
          setShowDelete(false);
        }}
        onCancel={() => setShowDelete(false)}
        title={t("common.delete")}
        message={t("templates.deleteConfirm")}
        confirmLabel={t("common.delete")}
        variant="danger"
      />
    </>
  );
}
