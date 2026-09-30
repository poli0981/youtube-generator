import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronDown, Download, History, Search, SearchX, Trash2 } from "lucide-react";
import { useDocumentTitle } from "@hooks/use-document-title";
import { Input } from "@components/ui/Input";
import { Button } from "@components/ui/Button";
import { ConfirmDialog } from "@components/ui/ConfirmDialog";
import { EmptyState } from "@components/ui/EmptyState";
import { PageContainer, PageHeader } from "@components/ui/PageHeader";
import { Badge } from "@components/ui/Badge";
import { HistoryCard } from "@components/history/HistoryCard";
import { PopoverContent, PopoverRoot, PopoverTrigger } from "@components/ui/Popover";
import { useHistoryStore } from "@store/history-store";
import { useFileExport } from "@hooks/use-file-export";
import { saveTextFile } from "@utils/file-ops";
import { datedFileName } from "@utils/backup/format";
import { collectSection, historyToCsv } from "@utils/backup/collect";

export function HistoryPage() {
  const { t } = useTranslation("ui");
  useDocumentTitle(t("tabs.history"));
  const entries = useHistoryStore((s) => s.entries);
  const clearAll = useHistoryStore((s) => s.clearAll);
  const [search, setSearch] = useState("");
  const [showClearAll, setShowClearAll] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const { report } = useFileExport();

  // Each builds its file before the first await: the web file picker needs
  // the click's user activation, which an earlier await would spend.
  const exportCsv = async () => {
    setExportOpen(false);
    const content = historyToCsv(entries);
    report(
      await saveTextFile({
        content,
        filename: datedFileName("history", "csv"),
        mimeType: "text/csv",
        description: "CSV",
      }),
    );
  };
  const exportJson = async () => {
    setExportOpen(false);
    const content = JSON.stringify(collectSection("history"), null, 2);
    report(await saveTextFile({ content, filename: datedFileName("history", "json") }));
  };

  const query = search.trim().toLowerCase();
  const filtered = query
    ? entries.filter(
        (e) => e.gameName.toLowerCase().includes(query) || e.title.toLowerCase().includes(query),
      )
    : entries;

  return (
    <PageContainer width="narrow">
      <PageHeader
        title={t("history.title")}
        meta={entries.length > 0 ? <Badge>{entries.length}</Badge> : undefined}
        actions={
          entries.length > 0 && (
            <>
              <PopoverRoot open={exportOpen} onOpenChange={setExportOpen}>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Download />
                    {t("common.export")}
                    <ChevronDown />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  align="end"
                  className="w-auto min-w-44 p-1"
                  ariaLabel={t("common.export")}
                >
                  <button
                    type="button"
                    className="hover:bg-surface-2 text-text-primary w-full rounded-md px-3 py-2 text-left text-sm"
                    onClick={() => void exportCsv()}
                  >
                    {t("history.exportCsv")}
                  </button>
                  <button
                    type="button"
                    className="hover:bg-surface-2 text-text-primary w-full rounded-md px-3 py-2 text-left text-sm"
                    onClick={() => void exportJson()}
                  >
                    {t("history.exportJson")}
                  </button>
                </PopoverContent>
              </PopoverRoot>
              <Button variant="ghost" size="sm" onClick={() => setShowClearAll(true)}>
                <Trash2 />
                {t("history.clearAll")}
              </Button>
            </>
          )
        }
      />

      {entries.length === 0 ? (
        <EmptyState icon={History} title={t("history.emptyState")} />
      ) : (
        <>
          <Input
            type="search"
            aria-label={t("history.searchPlaceholder")}
            placeholder={t("history.searchPlaceholder")}
            leading={<Search />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {filtered.length === 0 ? (
            <EmptyState icon={SearchX} title={t("history.noResults")} compact />
          ) : (
            <div className="flex flex-col gap-2">
              {filtered.map((entry) => (
                <HistoryCard key={entry.id} entry={entry} />
              ))}
            </div>
          )}
        </>
      )}

      <ConfirmDialog
        open={showClearAll}
        onConfirm={() => {
          clearAll();
          setShowClearAll(false);
        }}
        onCancel={() => setShowClearAll(false)}
        title={t("history.clearAll")}
        message={t("history.clearConfirm")}
        variant="danger"
      />
    </PageContainer>
  );
}
