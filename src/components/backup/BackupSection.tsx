import { useCallback, useEffect, useState, type DragEvent } from "react";
import { useTranslation } from "react-i18next";
import { DatabaseBackup, FileUp, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import clsx from "clsx";
import { Accordion } from "@components/ui/Accordion";
import { Badge } from "@components/ui/Badge";
import { Button } from "@components/ui/Button";
import { HAS_NATIVE_DIALOGS, appBackups, type AppBackupFile } from "@utils/native";
import { logger } from "@utils/logger";
import { restoreAppBackup, restoreDroppedFile } from "@utils/backup/restore-flow";
import { writeAppBackup } from "@utils/backup/auto-backup";

interface BackupSectionProps {
  open: boolean;
  onToggle: () => void;
}

/**
 * Settings › Backup & restore: a drop target for backup files and, in the
 * desktop app, the automatic backups it keeps in its own folder. Export and
 * restore themselves are the page's header buttons.
 */
export function BackupSection({ open, onToggle }: BackupSectionProps) {
  const { t } = useTranslation("ui");
  return (
    <Accordion
      id="backup"
      open={open}
      onToggle={onToggle}
      icon={DatabaseBackup}
      title={t("backup.sectionTitle")}
    >
      <p className="text-text-secondary text-sm">{t("backup.intro")}</p>
      <DropZone />
      {HAS_NATIVE_DIALOGS && <AutomaticBackups />}
    </Accordion>
  );
}

function DropZone() {
  const { t } = useTranslation("ui");
  const [over, setOver] = useState(false);

  const onDragOver = (e: DragEvent) => {
    if (!e.dataTransfer.types.includes("Files")) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    setOver(true);
  };
  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setOver(false);
    const file = e.dataTransfer.files[0];
    if (file) void restoreDroppedFile(file);
  };

  return (
    <div
      onDragOver={onDragOver}
      onDragLeave={() => setOver(false)}
      onDrop={onDrop}
      className={clsx(
        "rounded-card flex items-center justify-center gap-2 border border-dashed px-4 py-6 text-sm transition-colors",
        over ? "border-accent bg-accent-muted text-accent" : "border-border-strong text-text-muted",
      )}
    >
      <FileUp className="size-4" aria-hidden="true" />
      {over ? t("backup.dropActive") : t("backup.dropHint")}
    </div>
  );
}

function kind(name: string): "legacy" | "before-restore" | null {
  if (name.startsWith("ytdescgen-legacy-")) return "legacy";
  if (name.endsWith("-before-restore.json")) return "before-restore";
  return null;
}

function AutomaticBackups() {
  const { t, i18n } = useTranslation("ui");
  const [files, setFiles] = useState<AppBackupFile[] | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(() => {
    appBackups
      .list()
      .then(setFiles)
      .catch((e: unknown) => {
        setFiles([]);
        logger.warn("backup", "Could not list backups", String(e));
      });
  }, []);

  useEffect(refresh, [refresh]);

  const backUpNow = async () => {
    setBusy(true);
    try {
      await writeAppBackup("manual");
      toast.success(t("backup.auto.done"));
      refresh();
    } catch (e) {
      toast.error(t("backup.auto.failed"));
      logger.error("backup", "Manual backup failed", String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-text-primary text-sm font-medium">{t("backup.auto.title")}</h3>
          <p className="text-text-muted text-xs">{t("backup.auto.hint")}</p>
        </div>
        <Button variant="secondary" size="sm" onClick={() => void backUpNow()} loading={busy}>
          <DatabaseBackup />
          {t("backup.auto.backupNow")}
        </Button>
      </div>
      {files && files.length === 0 && (
        <p className="text-text-muted text-xs">{t("backup.auto.empty")}</p>
      )}
      {files && files.length > 0 && (
        <ul className="border-border divide-border divide-y rounded-xl border">
          {files.map((file) => {
            const tag = kind(file.name);
            return (
              <li key={file.name} className="flex items-center justify-between gap-3 px-3 py-2">
                <div className="min-w-0">
                  <p className="text-text-primary text-sm tabular-nums">
                    {new Date(file.modifiedMs).toLocaleString(i18n.language)}
                  </p>
                  <p className="text-text-muted flex flex-wrap items-center gap-2 text-xs">
                    <span className="tabular-nums">
                      {Math.max(1, Math.round(file.size / 1024))} KB
                    </span>
                    {tag && (
                      <Badge tone={tag === "legacy" ? "info" : "neutral"}>
                        {tag === "legacy"
                          ? t("backup.auto.legacy")
                          : t("backup.auto.beforeRestore")}
                      </Badge>
                    )}
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => void restoreAppBackup(file.name)}>
                  <RotateCcw />
                  {t("backup.auto.restore")}
                </Button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
