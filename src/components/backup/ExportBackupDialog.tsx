import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Modal } from "@components/ui/Modal";
import { Button } from "@components/ui/Button";
import { Checkbox } from "@components/ui/Checkbox";
import { useFileExport } from "@hooks/use-file-export";
import { saveTextFile } from "@utils/file-ops";
import { SECTIONS, datedFileName, type Section } from "@utils/backup/format";
import { collectBackup, sectionSize } from "@utils/backup/collect";

/** Pick what goes into a backup file, then save it. */
export function ExportBackupDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation("ui");
  const { report } = useFileExport();
  const [chosen, setChosen] = useState<Set<Section>>(() => new Set(SECTIONS));

  const toggle = (section: Section, on: boolean) =>
    setChosen((prev) => {
      const next = new Set(prev);
      if (on) next.add(section);
      else next.delete(section);
      return next;
    });

  const exportNow = async () => {
    // Built before the first await: the web file picker needs the click's
    // user activation, which an earlier await would spend.
    const content = JSON.stringify(collectBackup(SECTIONS.filter((s) => chosen.has(s))), null, 2);
    const outcome = await saveTextFile({ content, filename: datedFileName("backup", "json") });
    report(outcome);
    if (outcome === "saved") onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t("backup.exportTitle")}
      description={t("backup.exportHint")}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button onClick={() => void exportNow()} disabled={chosen.size === 0}>
            {t("common.export")}
          </Button>
        </>
      }
    >
      <ul className="flex flex-col gap-3">
        {SECTIONS.map((section) => {
          const size = open ? sectionSize(section) : 0;
          return (
            <li key={section}>
              <Checkbox
                checked={chosen.has(section)}
                onChange={(on) => toggle(section, on)}
                label={
                  <span className="flex items-baseline gap-2">
                    <span className="text-text-primary text-sm">
                      {t(`backup.sections.${section}`)}
                    </span>
                    {section !== "settings" && section !== "draft" && (
                      <span className="text-text-muted text-xs tabular-nums">{size}</span>
                    )}
                  </span>
                }
              />
            </li>
          );
        })}
      </ul>
    </Modal>
  );
}
