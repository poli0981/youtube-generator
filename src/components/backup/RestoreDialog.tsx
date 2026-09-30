import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronDown } from "lucide-react";
import { toast } from "sonner";
import clsx from "clsx";
import { Modal } from "@components/ui/Modal";
import { Button } from "@components/ui/Button";
import { Badge } from "@components/ui/Badge";
import { Banner } from "@components/ui/Banner";
import { Checkbox } from "@components/ui/Checkbox";
import { SegmentedControl } from "@components/ui/SegmentedControl";
import { HAS_NATIVE_DIALOGS } from "@utils/native";
import { logger } from "@utils/logger";
import { isListSection, type ListSection, type Section } from "@utils/backup/format";
import {
  applyRestore,
  defaultRows,
  planRestore,
  planSections,
  readCurrentData,
  type ConflictChoice,
  type ListPlan,
  type PlanRow,
  type RestoreChoice,
  type RestoreMode,
  type RestorePlan,
  type RowStatus,
} from "@utils/backup/restore";
import { useRestoreDialog, type RestoreRequest } from "@utils/backup/restore-request";
import { writeAppBackup } from "@utils/backup/auto-backup";

const STATUS_TONE: Record<RowStatus, "success" | "warning" | "neutral"> = {
  new: "success",
  changed: "warning",
  same: "neutral",
};

type AnyRow = PlanRow<{ id: string }>;

function listOf(plan: RestorePlan, section: ListSection): ListPlan<{ id: string }> | undefined {
  return plan[section] as ListPlan<{ id: string }> | undefined;
}

/** The restore dialog, mounted once; opens whenever a file is handed to it. */
export function RestoreDialog() {
  const request = useRestoreDialog((s) => s.request);
  const close = useRestoreDialog((s) => s.close);
  if (!request) return null;
  // A new file is a new dialog: `key` resets every choice.
  return (
    <RestoreDialogBody
      key={request.fileName + request.file.exportedAt}
      request={request}
      onClose={close}
    />
  );
}

function RestoreDialogBody({ request, onClose }: { request: RestoreRequest; onClose: () => void }) {
  const { t, i18n } = useTranslation("ui");
  const plan = useMemo(() => planRestore(request.file, readCurrentData()), [request]);
  const sections = planSections(plan);
  const [mode, setMode] = useState<RestoreMode>("merge");
  const [conflict, setConflict] = useState<ConflictChoice>("newer");
  // The draft starts unticked: restoring it replaces what's in the editor.
  const [included, setIncluded] = useState<Set<Section>>(
    () => new Set(sections.filter((s) => s !== "draft")),
  );
  const [rows, setRows] = useState(() => defaultRows(plan, "merge"));
  const [expanded, setExpanded] = useState<Set<Section>>(() => new Set());
  const [busy, setBusy] = useState(false);

  const current = useMemo(() => readCurrentData(), []);
  const choice: RestoreChoice = { mode, conflict, sections: included, rows };

  const changeMode = (next: RestoreMode) => {
    setMode(next);
    setRows(defaultRows(plan, next));
  };

  const toggleSet = <T,>(set: Set<T>, value: T, on: boolean): Set<T> => {
    const next = new Set(set);
    if (on) next.add(value);
    else next.delete(value);
    return next;
  };

  const toggleRow = (section: ListSection, key: string, on: boolean) =>
    setRows((prev) => ({ ...prev, [section]: toggleSet(new Set(prev[section]), key, on) }));

  const selectedRows = (section: ListSection): AnyRow[] => {
    const list = listOf(plan, section);
    const keys = rows[section];
    return list && keys ? list.rows.filter((row) => keys.has(row.key)) : [];
  };

  /** Items a Replace would delete: here now, not matched by a selected row. */
  const removedBy = (section: ListSection): number => {
    const kept = new Set(selectedRows(section).map((row) => row.existing?.id));
    const now = section === "history" ? current.history : current[section];
    return (now as { id: string }[]).filter((item) => !kept.has(item.id)).length;
  };

  const willChange = (section: Section): boolean => {
    if (!included.has(section)) return false;
    if (section === "settings") return plan.settings?.status === "changed";
    if (section === "draft") return plan.draft?.status === "changed";
    const chosen = selectedRows(section);
    if (mode === "replace")
      return removedBy(section) > 0 || chosen.some((r) => r.status !== "same");
    return chosen.some(
      (row) =>
        row.status === "new" ||
        (row.status === "changed" && (conflict === "both" || row.incomingNewer)),
    );
  };

  const anyChange = sections.some(willChange);
  const hasConflicts =
    mode === "merge" &&
    sections.some(
      (s) =>
        isListSection(s) && s !== "history" && selectedRows(s).some((r) => r.status === "changed"),
    );
  const replaceRemoves =
    mode === "replace"
      ? sections
          .filter(isListSection)
          .filter((s) => included.has(s))
          .reduce((n, s) => n + removedBy(s), 0)
      : 0;

  const exportedAt = request.file.exportedAt
    ? new Date(request.file.exportedAt).toLocaleString(i18n.language)
    : null;

  const restore = async () => {
    setBusy(true);
    if (HAS_NATIVE_DIALOGS) {
      // One more way back on desktop, on top of Undo.
      await writeAppBackup("before-restore").catch((e: unknown) =>
        logger.warn("backup", "Backup before restore failed", String(e)),
      );
    }
    const result = applyRestore(plan, choice);
    onClose();
    if (result.changed.length === 0) {
      toast.info(t("restore.nothing"));
      return;
    }
    logger.info(
      "import",
      `Restored ${result.changed.join(", ")} from ${request.fileName} (${mode})`,
      JSON.stringify(result.counts),
    );
    toast.success(t("restore.done"), {
      description: t("restore.doneDetail", { ...result.counts }),
      duration: 10_000,
      action: {
        label: t("common.undo"),
        onClick: () => {
          result.undo();
          toast.success(t("restore.undone"));
        },
      },
    });
  };

  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      title={t("restore.title")}
      description={
        <>
          <span className="text-text-secondary font-medium break-all">{request.fileName}</span>
          {" · "}
          {exportedAt && request.file.appVersion
            ? t("restore.meta", { date: exportedAt, version: request.file.appVersion })
            : t("restore.metaUnknown")}
        </>
      }
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button onClick={() => void restore()} disabled={!anyChange || busy} loading={busy}>
            {t("restore.apply")}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <span className="text-text-secondary text-xs font-medium">{t("restore.mode")}</span>
          <SegmentedControl
            ariaLabel={t("restore.mode")}
            layoutId="restore-mode"
            value={mode}
            onChange={changeMode}
            options={[
              { value: "merge", label: t("restore.merge") },
              { value: "replace", label: t("restore.replace") },
            ]}
          />
          <p className="text-text-muted text-xs">
            {mode === "merge" ? t("restore.mergeHint") : t("restore.replaceHint")}
          </p>
        </div>

        {plan.tooNew.length > 0 && (
          <Banner tone="warning" title={t("restore.tooNewTitle")}>
            {t("restore.tooNew", {
              sections: plan.tooNew.map((s) => t(`backup.sections.${s}`)).join(", "),
            })}
          </Banner>
        )}

        {sections.length === 0 ? (
          <p className="text-text-muted text-sm">{t("restore.empty")}</p>
        ) : (
          <ul className="border-border divide-border flex flex-col divide-y rounded-xl border">
            {sections.map((section) => (
              <SectionRow
                key={section}
                section={section}
                plan={plan}
                mode={mode}
                included={included.has(section)}
                onInclude={(on) => setIncluded((prev) => toggleSet(prev, section, on))}
                expanded={expanded.has(section)}
                onExpand={() => setExpanded((prev) => toggleSet(prev, section, !prev.has(section)))}
                selected={isListSection(section) ? (rows[section] ?? new Set()) : new Set()}
                onToggleRow={(key, on) => isListSection(section) && toggleRow(section, key, on)}
              />
            ))}
          </ul>
        )}

        {hasConflicts && (
          <div className="flex flex-col gap-1.5">
            <span className="text-text-secondary text-xs font-medium">
              {t("restore.conflicts")}
            </span>
            <SegmentedControl
              ariaLabel={t("restore.conflicts")}
              layoutId="restore-conflict"
              value={conflict}
              onChange={setConflict}
              options={[
                { value: "newer", label: t("restore.newer") },
                { value: "both", label: t("restore.both") },
              ]}
            />
            <p className="text-text-muted text-xs">
              {conflict === "newer" ? t("restore.newerHint") : t("restore.bothHint")}
            </p>
          </div>
        )}

        {replaceRemoves > 0 && (
          <Banner tone="danger">{t("restore.replaceRemoves", { n: replaceRemoves })}</Banner>
        )}
      </div>
    </Modal>
  );
}

function SectionRow({
  section,
  plan,
  mode,
  included,
  onInclude,
  expanded,
  onExpand,
  selected,
  onToggleRow,
}: {
  section: Section;
  plan: RestorePlan;
  mode: RestoreMode;
  included: boolean;
  onInclude: (on: boolean) => void;
  expanded: boolean;
  onExpand: () => void;
  selected: ReadonlySet<string>;
  onToggleRow: (key: string, on: boolean) => void;
}) {
  const { t } = useTranslation("ui");
  const list = isListSection(section) ? listOf(plan, section) : undefined;
  const counts = list
    ? {
        new: list.rows.filter((r) => r.status === "new").length,
        changed: list.rows.filter((r) => r.status === "changed").length,
        same: list.rows.filter((r) => r.status === "same").length,
      }
    : null;
  const value = section === "settings" ? plan.settings : section === "draft" ? plan.draft : null;
  const panelId = `restore-items-${section}`;

  return (
    <li className="flex flex-col gap-2 p-3">
      <div className="flex items-start justify-between gap-3">
        <Checkbox
          checked={included}
          onChange={onInclude}
          label={
            <span className="flex flex-col gap-0.5">
              <span className="text-text-primary text-sm font-medium">
                {t(`backup.sections.${section}`)}
              </span>
              <span className="text-text-muted text-xs">
                {counts
                  ? t("restore.counts", counts)
                  : value?.status === "same"
                    ? t("restore.sameAsHere")
                    : section === "settings"
                      ? t("restore.settingsNote")
                      : t("restore.draftNote")}
              </span>
              {list && list.dropped > 0 && (
                <span className="text-warning text-xs">
                  {t("restore.dropped", { n: list.dropped })}
                </span>
              )}
            </span>
          }
        />
        {list && list.rows.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onExpand}
            aria-expanded={expanded}
            aria-controls={panelId}
          >
            {expanded ? t("restore.hideItems") : t("restore.showItems")}
            <ChevronDown className={clsx("transition-transform", expanded && "rotate-180")} />
          </Button>
        )}
      </div>

      {list && expanded && (
        <ul
          id={panelId}
          className="bg-surface-2/50 flex max-h-64 flex-col gap-1 overflow-y-auto rounded-lg p-2"
        >
          {list.rows.map((row) => {
            // Merge leaves identical items alone, so there's nothing to choose.
            const fixed = mode === "merge" && row.status === "same";
            return (
              <li key={row.key} className="flex items-center justify-between gap-2">
                <Checkbox
                  checked={!fixed && selected.has(row.key)}
                  onChange={(on) => onToggleRow(row.key, on)}
                  disabled={!included || fixed}
                  className="min-w-0"
                  label={
                    <span className="flex min-w-0 flex-col">
                      <span className="text-text-primary truncate text-xs">{row.label || "—"}</span>
                      {row.detail && (
                        <span className="text-text-muted truncate text-[0.6875rem]">
                          {row.detail}
                        </span>
                      )}
                    </span>
                  }
                />
                <Badge tone={STATUS_TONE[row.status]}>{t(`restore.status.${row.status}`)}</Badge>
              </li>
            );
          })}
        </ul>
      )}
    </li>
  );
}
