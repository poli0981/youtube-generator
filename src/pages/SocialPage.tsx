import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import i18n from "i18next";
import { Download, Upload } from "lucide-react";
import { useDocumentTitle } from "@hooks/use-document-title";
import { Button } from "@components/ui/Button";
import { Input } from "@components/ui/Input";
import { CopyButton } from "@components/output/CopyButton";
import { CharCounter } from "@components/output/CharCounter";
import { useEditorStore } from "@store/editor-store";
import { useSettingsStore } from "@store/settings-store";
import { SUPPORTED_LANGUAGES, ensureLanguagesLoaded } from "@i18n/index";
import { SOCIAL_PLATFORMS } from "@config/social-platforms";
import { useSocialPosts } from "@hooks/use-social-posts";
import { buildAllSocialPosts, type SocialPostOutput } from "@engine/social-post-builder";
import { useCurrentGeneratorInput } from "@hooks/use-current-generator-input";
import { validateBatchRange } from "@utils/validation";
import { useStrictBlock } from "@hooks/use-strict-block";
import { StrictModeBanner } from "@components/ui/StrictModeBanner";
import { exportTypedToJsonFile, importTypedFromJsonFile } from "@utils/import-export";
import type { SupportedLanguage } from "@engine/types";
import toast from "react-hot-toast";
import { logger } from "@utils/logger";
import clsx from "clsx";

/** One platform's caption inside an exported bundle. */
interface SocialPostExport {
  platform: string;
  charLimit: number;
  text: string;
  charCount: number;
  isOver: boolean;
}

/** The JSON payload written by Export / read by Import — the generated
 *  captions for one source (captions are derived artifacts, so import is
 *  display-only; there's no store to merge into). */
interface SocialExportBundle {
  gameName: string;
  language: SupportedLanguage;
  partNumber?: string;
  posts: SocialPostExport[];
}

interface BulkRow {
  partNumber: string;
  language: SupportedLanguage;
  posts: Record<string, SocialPostOutput>;
}

export function SocialPage() {
  const { t } = useTranslation("ui");
  useDocumentTitle(t("tabs.social"));

  const gameName = useEditorStore((s) => s.gameName);
  const language = useEditorStore((s) => s.language);
  const baseInput = useCurrentGeneratorInput();
  const { showCopyright, showSponsorCredit } = useSettingsStore();

  const strictBlocked = useStrictBlock();
  const posts = useSocialPosts();
  const [mode, setMode] = useState<"single" | "bulk">("single");
  const [activePlatform, setActivePlatform] = useState<string>(SOCIAL_PLATFORMS[0]?.id ?? "tiktok");

  // Bulk state
  const [startPart, setStartPart] = useState("1");
  const [endPart, setEndPart] = useState("5");
  const [selectedLangs, setSelectedLangs] = useState<SupportedLanguage[]>([language]);
  const [bulkResults, setBulkResults] = useState<BulkRow[]>([]);
  const [generating, setGenerating] = useState(false);

  // Block bulk generation on an invalid part range (mirrors BatchPage).
  const rangeResult = useMemo(
    () => validateBatchRange(startPart, endPart, { maxSpan: 100 }),
    [startPart, endPart],
  );
  const rangeError = rangeResult.valid
    ? undefined
    : t(rangeResult.error ?? "", rangeResult.errorParams);

  // Import display (read-only)
  const [imported, setImported] = useState<SocialExportBundle | null>(null);

  const activeConfig = SOCIAL_PLATFORMS.find((p) => p.id === activePlatform) ?? SOCIAL_PLATFORMS[0];
  const activePost = posts[activePlatform];

  const platformLabel = (id: string) =>
    t(SOCIAL_PLATFORMS.find((p) => p.id === id)?.labelKey ?? id);

  const handleExport = async () => {
    // The bundle is built synchronously and `exportTypedToJsonFile` is the
    // first await — the web file picker needs the click's transient user
    // activation, which any earlier await would spend.
    const bundle: SocialExportBundle = {
      gameName: baseInput.gameName,
      language: baseInput.language,
      posts: SOCIAL_PLATFORMS.map((p) => ({
        platform: p.id,
        charLimit: p.charLimit,
        text: posts[p.id]?.text ?? "",
        charCount: posts[p.id]?.charCount ?? 0,
        isOver: posts[p.id]?.isOver ?? false,
      })),
    };
    const safeName = (baseInput.gameName || "captions")
      .replace(/[^\p{L}\p{N}]+/gu, "-")
      .toLowerCase();
    const outcome = await exportTypedToJsonFile(
      "social",
      bundle,
      `ytdescgen-social-${safeName}.json`,
    );
    // Dismissing the save dialog is a decision, not a failure — stay silent.
    if (outcome === "cancelled") return;
    if (outcome === "failed") {
      toast.error(t("socialPost.exportFailed"));
      logger.error("social", "Failed to export captions");
      return;
    }
    toast.success(t("socialPost.exported"));
  };

  const handleImport = async () => {
    const result = await importTypedFromJsonFile("social");
    if (!result.ok) {
      if (result.failure.kind === "cancelled") return;
      toast.error(t("socialPost.importFailed"));
      logger.warn("social", `Import failed: ${result.failure.kind}`);
      return;
    }
    const data = result.data as Partial<SocialExportBundle> | null;
    if (!data || !Array.isArray(data.posts)) {
      toast.error(t("socialPost.importFailed"));
      return;
    }
    setImported({
      gameName: typeof data.gameName === "string" ? data.gameName : "",
      language: (data.language ?? "en") as SupportedLanguage,
      partNumber: typeof data.partNumber === "string" ? data.partNumber : undefined,
      posts: data.posts as SocialPostExport[],
    });
    toast.success(t("socialPost.imported"));
  };

  const toggleLang = (lang: SupportedLanguage) => {
    setSelectedLangs((prev) => {
      if (prev.includes(lang)) {
        return prev.length <= 1 ? prev : prev.filter((l) => l !== lang);
      }
      return [...prev, lang];
    });
  };

  const bulkGenerate = () => {
    const start = parseInt(startPart) || 1;
    const end = parseInt(endPart) || start;
    const rows: BulkRow[] = [];
    // Loop-invariant English translator for the bilingual content-warnings
    // block — `en` is eagerly bundled, so it needs no readiness gate.
    const tEn = i18n.getFixedT("en", "templates");
    for (let i = start; i <= Math.min(end, start + 99); i++) {
      for (const lang of selectedLangs) {
        const tFn = i18n.getFixedT(lang, "templates");
        const input = {
          ...baseInput,
          videoType: "part" as const,
          language: lang,
          partNumber: String(i),
          timestamps: "",
        };
        rows.push({
          partNumber: String(i),
          language: lang,
          posts: buildAllSocialPosts(input, tFn, SOCIAL_PLATFORMS, {
            showCopyright,
            showSponsorCredit,
            tEn,
          }),
        });
      }
    }
    setBulkResults(rows);
  };

  const handleBulkGenerate = async () => {
    setGenerating(true);
    try {
      // Lazy-loaded locales (v0.26): bulk generates across multiple
      // languages in one pass — every selected bundle must be in memory
      // before the loop, or getFixedT silently renders English.
      await ensureLanguagesLoaded(selectedLangs);
      bulkGenerate();
    } finally {
      setGenerating(false);
    }
  };

  const bulkCombined = useMemo(
    () =>
      bulkResults
        .map((row) =>
          SOCIAL_PLATFORMS.map(
            (p) =>
              `[${t(p.labelKey)} · ${row.language.toUpperCase()} · ${row.partNumber}]\n${row.posts[p.id]?.text ?? ""}`,
          ).join("\n\n---\n\n"),
        )
        .join("\n\n===\n\n"),
    [bulkResults, t],
  );

  // Bulk "Copy All" concatenates every caption, so one over-limit post makes
  // the blob unusable. Each platform has its own cap (TikTok 4000, Reels 2200),
  // which is why this reads the per-post `isOver` the builder already computed
  // rather than a single shared limit.
  const bulkHasOverflow = useMemo(
    () => bulkResults.some((row) => Object.values(row.posts).some((post) => post.isOver)),
    [bulkResults],
  );

  // SOCIAL_PLATFORMS is a non-empty literal, so this never fires — it just
  // narrows `activeConfig` to non-undefined for the JSX below without a `!`.
  if (!activeConfig) return null;
  const ActiveIcon = activeConfig.icon;

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg font-bold text-text-primary">{t("socialPost.title")}</h1>
        <div className="flex gap-1 rounded-lg bg-surface-1 p-1">
          {(["single", "bulk"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={clsx(
                "rounded-md px-3 py-1 text-sm font-medium transition-colors",
                mode === m ? "bg-accent text-white" : "text-text-muted hover:text-text-primary",
              )}
            >
              {t(`socialPost.${m}`)}
            </button>
          ))}
        </div>
      </div>

      {mode === "single" ? (
        <>
          {/* Platform switcher */}
          <div className="mb-4 flex flex-wrap gap-1 rounded-lg bg-surface-1 p-1">
            {SOCIAL_PLATFORMS.map((p) => {
              const Icon = p.icon;
              return (
                <button
                  key={p.id}
                  onClick={() => setActivePlatform(p.id)}
                  className={clsx(
                    "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                    activePlatform === p.id
                      ? "bg-accent text-white"
                      : "text-text-muted hover:text-text-primary",
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {t(p.labelKey)}
                </button>
              );
            })}
            <div className="ml-auto flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => void handleExport()}
                disabled={!gameName}
              >
                <Download className="h-3.5 w-3.5" />
                {t("common.export")}
              </Button>
              <Button variant="ghost" size="sm" onClick={handleImport}>
                <Upload className="h-3.5 w-3.5" />
                {t("common.import")}
              </Button>
            </div>
          </div>

          {!gameName ? (
            <p className="rounded-lg border border-dashed border-border py-8 text-center text-sm text-text-muted">
              {t("socialPost.emptyState")}
            </p>
          ) : (
            activePost && (
              <div className="rounded-lg border border-border bg-surface-1 p-4">
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ActiveIcon className="h-4 w-4 text-accent" />
                    <span className="text-sm font-semibold text-text-primary">
                      {t(activeConfig.labelKey)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CharCounter text={activePost.text} limit={activeConfig.charLimit} />
                    <CopyButton
                      text={activePost.text}
                      label={t("socialPost.copyCaption")}
                      limit={activeConfig.charLimit}
                      fieldLabel={t(activeConfig.labelKey)}
                    />
                  </div>
                </div>
                {activePost.isOver && (
                  <p className="mb-2 text-xs text-danger">
                    {t("socialPost.overLimitHint", {
                      platform: t(activeConfig.labelKey),
                    })}
                  </p>
                )}
                {activePost.droppedBlocks.length > 0 && (
                  <p className="mb-2 text-xs text-warning">
                    {t("socialPost.trimmedHint", {
                      count: activePost.droppedBlocks.length,
                    })}
                  </p>
                )}
                <pre className="whitespace-pre-wrap break-words font-sans text-sm text-text-secondary">
                  {activePost.text}
                </pre>
              </div>
            )
          )}

          {imported && (
            <div className="border-accent/40 bg-accent/5 mt-6 rounded-lg border p-4">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-text-primary">
                  {t("socialPost.importedHeading")}
                  {imported.gameName ? ` — ${imported.gameName}` : ""}
                </h2>
                <Button variant="ghost" size="sm" onClick={() => setImported(null)}>
                  {t("common.dismiss")}
                </Button>
              </div>
              <div className="flex flex-col gap-3">
                {imported.posts.map((p) => (
                  <div key={p.platform} className="rounded-lg bg-surface-2 p-3">
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-xs font-medium uppercase text-text-muted">
                        {platformLabel(p.platform)}
                      </span>
                      <CopyButton
                        text={p.text}
                        label={t("socialPost.copyCaption")}
                        limit={p.charLimit}
                      />
                    </div>
                    <pre className="whitespace-pre-wrap break-words font-sans text-xs text-text-secondary">
                      {p.text}
                    </pre>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-col gap-4">
          {/* Language selector */}
          <div>
            <span className="mb-2 block text-sm font-medium text-text-secondary">
              {t("output.selectLanguages")}
            </span>
            <div className="flex flex-wrap gap-2">
              {SUPPORTED_LANGUAGES.map((lang) => (
                <button
                  key={lang.id}
                  onClick={() => toggleLang(lang.id as SupportedLanguage)}
                  className={clsx(
                    "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                    selectedLangs.includes(lang.id as SupportedLanguage)
                      ? "bg-accent text-white"
                      : "bg-surface-2 text-text-muted hover:text-text-primary",
                  )}
                >
                  {lang.flag} {lang.nativeName}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-end gap-4">
            <Input
              label={t("batch.startPart")}
              type="number"
              min={1}
              step={1}
              inputMode="numeric"
              error={!rangeResult.valid}
              value={startPart}
              onChange={(e) => setStartPart(e.target.value)}
            />
            <Input
              label={t("batch.endPart")}
              type="number"
              min={1}
              step={1}
              inputMode="numeric"
              error={!rangeResult.valid}
              value={endPart}
              onChange={(e) => setEndPart(e.target.value)}
            />
            <Button
              onClick={() => void handleBulkGenerate()}
              disabled={!gameName || generating || !rangeResult.valid || strictBlocked}
            >
              {t("common.generate")}
            </Button>
          </div>
          {rangeError && (
            <p
              role="alert"
              className="border-warning/40 bg-warning/10 rounded-lg border px-3 py-2 text-xs text-warning"
            >
              {rangeError}
            </p>
          )}
          <StrictModeBanner />

          {bulkResults.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border py-8 text-center text-sm text-text-muted">
              {t("batch.emptyState")}
            </p>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-secondary">
                  {bulkResults.length} × {SOCIAL_PLATFORMS.length}
                </span>
                <CopyButton
                  text={bulkCombined}
                  label={t("output.copyAll")}
                  blocked={bulkHasOverflow}
                />
              </div>
              <div className="flex flex-col gap-4">
                {bulkResults.map((row) => (
                  <div
                    key={`${row.partNumber}-${row.language}`}
                    className="rounded-lg border border-border bg-surface-1 p-4"
                  >
                    <h3 className="mb-3 text-sm font-semibold text-text-primary">
                      {row.partNumber} · {row.language.toUpperCase()}
                    </h3>
                    <div className="flex flex-col gap-3">
                      {SOCIAL_PLATFORMS.map((p) => {
                        const post = row.posts[p.id];
                        if (!post) return null;
                        return (
                          <div key={p.id} className="rounded-lg bg-surface-2 p-3">
                            <div className="mb-1 flex items-center justify-between">
                              <span className="text-xs font-medium uppercase text-text-muted">
                                {t(p.labelKey)}
                              </span>
                              <div className="flex items-center gap-2">
                                <CharCounter text={post.text} limit={p.charLimit} />
                                <CopyButton
                                  text={post.text}
                                  label={t("socialPost.copyCaption")}
                                  limit={p.charLimit}
                                />
                              </div>
                            </div>
                            <pre className="max-h-24 overflow-y-auto whitespace-pre-wrap break-words font-sans text-xs text-text-secondary">
                              {post.text}
                            </pre>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
