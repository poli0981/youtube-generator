import { useState } from "react";
import { useTranslation } from "react-i18next";
import { History, Search, SearchX, Trash2 } from "lucide-react";
import { useDocumentTitle } from "@hooks/use-document-title";
import { Input } from "@components/ui/Input";
import { Button } from "@components/ui/Button";
import { ConfirmDialog } from "@components/ui/ConfirmDialog";
import { EmptyState } from "@components/ui/EmptyState";
import { PageContainer, PageHeader } from "@components/ui/PageHeader";
import { Badge } from "@components/ui/Badge";
import { HistoryCard } from "@components/history/HistoryCard";
import { useHistoryStore } from "@store/history-store";

export function HistoryPage() {
  const { t } = useTranslation("ui");
  useDocumentTitle(t("tabs.history"));
  const entries = useHistoryStore((s) => s.entries);
  const clearAll = useHistoryStore((s) => s.clearAll);
  const [search, setSearch] = useState("");
  const [showClearAll, setShowClearAll] = useState(false);

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
            <Button variant="ghost" size="sm" onClick={() => setShowClearAll(true)}>
              <Trash2 />
              {t("history.clearAll")}
            </Button>
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
