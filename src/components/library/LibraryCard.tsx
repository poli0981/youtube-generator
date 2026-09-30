import { useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Check, Pencil, Trash2 } from "lucide-react";
import { Button } from "@components/ui/Button";
import { Card } from "@components/ui/Card";
import { ConfirmDialog } from "@components/ui/ConfirmDialog";
import { IconButton } from "@components/ui/IconButton";
import type { IconComponent } from "@components/icons/brand";

interface LibraryCardProps {
  icon: IconComponent;
  title: string;
  /** Secondary line(s) under the title. */
  meta?: ReactNode;
  applyLabel: string;
  onApply: () => void;
  onEdit?: () => void;
  onDelete: () => void;
  deleteMessage: string;
}

/** One saved profile / preset / template: apply, edit, delete. */
export function LibraryCard({
  icon: Icon,
  title,
  meta,
  applyLabel,
  onApply,
  onEdit,
  onDelete,
  deleteMessage,
}: LibraryCardProps) {
  const { t } = useTranslation("ui");
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <>
      <Card className="hover:border-border-strong flex items-center gap-3 p-3 transition-colors sm:p-4">
        <span className="bg-accent-muted text-accent flex size-10 shrink-0 items-center justify-center rounded-xl">
          <Icon className="size-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-text-primary truncate text-sm font-semibold">{title}</h3>
          {meta && <div className="text-text-muted mt-0.5 text-xs">{meta}</div>}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Button variant="secondary" size="sm" onClick={onApply}>
            <Check />
            <span className="hidden sm:inline">{applyLabel}</span>
            <span className="sr-only sm:hidden">{`${applyLabel}: ${title}`}</span>
          </Button>
          {onEdit && (
            <IconButton label={t("common.edit")} size="icon-sm" onClick={onEdit}>
              <Pencil />
            </IconButton>
          )}
          <IconButton
            label={t("common.delete")}
            size="icon-sm"
            className="hover:text-danger"
            onClick={() => setConfirmDelete(true)}
          >
            <Trash2 />
          </IconButton>
        </div>
      </Card>

      <ConfirmDialog
        open={confirmDelete}
        onConfirm={() => {
          onDelete();
          setConfirmDelete(false);
        }}
        onCancel={() => setConfirmDelete(false)}
        title={`${t("common.delete")}: ${title}`}
        message={deleteMessage}
        confirmLabel={t("common.delete")}
        variant="danger"
      />
    </>
  );
}

/** Toolbar + list + empty state shared by the three library tabs. */
export function LibraryList({
  hint,
  action,
  empty,
  children,
}: {
  hint: ReactNode;
  action?: ReactNode;
  /** Rendered instead of the list when there is nothing saved. */
  empty?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-text-muted min-w-0 flex-1 text-xs">{hint}</p>
        {action}
      </div>
      {empty ?? <div className="flex flex-col gap-2">{children}</div>}
    </div>
  );
}
