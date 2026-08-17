import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useDocumentTitle } from "@hooks/use-document-title";
import { Trash2 } from "lucide-react";
import { Input } from "@components/ui/Input";
import { Button } from "@components/ui/Button";
import { ConfirmDialog } from "@components/ui/ConfirmDialog";
import { HistoryCard } from "@components/history/HistoryCard";
import { useHistoryStore } from "@store/history-store";

export function HistoryPage() {
  const { t } = useTranslation("ui");
  useDocumentTitle(t("tabs.history"));
  const { entries, clearAll } = useHistoryStore();
  const [search, setSearch] = useState("");
  const [showClearAll, setShowClearAll] = useState(false);

  const filtered = search
    ? entries.filter(
        (e) =>
          e.gameName.toLowerCase().includes(search.toLowerCase()) ||
          e.title.toLowerCase().includes(search.toLowerCase()),
      )
    : entries;

  return (
    <div className="mx-auto max-w-3xl p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-text-primary text-lg font-bold">{t("history.title")}</h1>
        {entries.length > 0 && (
          <Button variant="ghost" size="sm" onClick={() => setShowClearAll(true)}>
            <Trash2 className="h-3.5 w-3.5" />
            {t("history.clearAll")}
          </Button>
        )}
      </div>

      {entries.length > 0 && (
        <div className="mb-4">
          <Input
            placeholder={t("history.searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="border-border text-text-muted rounded-lg border border-dashed py-8 text-center text-sm">
          {t("history.emptyState")}
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((entry) => (
            <HistoryCard key={entry.id} entry={entry} />
          ))}
        </div>
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
    </div>
  );
}
