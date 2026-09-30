import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import i18n from "i18next";
import { Download, Layers, Play, Share2, Upload } from "lucide-react";
import { useDocumentTitle } from "@hooks/use-document-title";
import { Button } from "@components/ui/Button";
import { Input } from "@components/ui/Input";
import { Badge } from "@components/ui/Badge";
import { Banner } from "@components/ui/Banner";
import { Card, CardHeader } from "@components/ui/Card";
import { ChipGroup } from "@components/ui/ChipGroup";
import { EmptyState } from "@components/ui/EmptyState";
import { PageContainer, PageHeader } from "@components/ui/PageHeader";
import { SegmentedControl } from "@components/ui/SegmentedControl";
import { OutputField, OutputText } from "@components/output/OutputField";
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
import { openTextFile, saveTextFile } from "@utils/file-ops";
import { makeEnvelope } from "@utils/backup/format";
import { readBackupText } from "@utils/backup/detect";
import type { SupportedLanguage } from "@engine/types";
import { toast } from "sonner";
import { logger } from "@utils/logger";

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
    // The bundle is built synchronously and `saveTextFile` is the first
    // await — the web file picker needs the click's transient user
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
    const outcome = await saveTextFile({
      content: JSON.stringify(makeEnvelope("social", 1, bundle), null, 2),
      filename: `ytdescgen-social-${safeName}.json`,
    });
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
    const picked = await openTextFile({ extensions: ["json"], description: "JSON" });
    if (picked.kind === "cancelled") return;
    const detected = picked.kind === "picked" ? readBackupText(picked.text) : null;
    if (!detected?.ok || detected.file.kind !== "social") {
      toast.error(t("socialPost.importFailed"));
      logger.warn(
        "social",
        `Import failed: ${picked.kind === "failed" ? picked.reason : "not a captions file"}`,
      );
      return;
    }
    const data = detected.file.data as Partial<SocialExportBundle> | null;
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
            year: new Date().getFullYear(),
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
    <PageContainer>
      <PageHeader
        title={t("socialPost.title")}
        actions={
          <>
            <Button variant="ghost" size="sm" onClick={() => void handleImport()}>
              <Upload />
              {t("common.import")}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => void handleExport()}
              disabled={!gameName}
            >
              <Download />
              {t("common.export")}
            </Button>
            <SegmentedControl
              ariaLabel={t("socialPost.title")}
              layoutId="social-mode"
              size="sm"
              value={mode}
              onChange={setMode}
              options={[
                { value: "single", label: t("socialPost.single") },
                { value: "bulk", label: t("socialPost.bulk") },
              ]}
            />
          </>
        }
      />

      <StrictModeBanner />

      {mode === "single" ? (
        <>
          <SegmentedControl
            ariaLabel={t("socialPost.title")}
            layoutId="social-platform"
            value={activePlatform}
            onChange={setActivePlatform}
            options={SOCIAL_PLATFORMS.map((p) => {
              const Icon = p.icon;
              return {
                value: p.id,
                label: (
                  <>
                    <Icon className="size-3.5" aria-hidden />
                    {t(p.labelKey)}
                  </>
                ),
              };
            })}
          />

          {!gameName ? (
            <EmptyState icon={Share2} title={t("socialPost.emptyState")} />
          ) : (
            activePost && (
              <OutputField
                title={t(activeConfig.labelKey)}
                icon={ActiveIcon}
                actions={
                  <>
                    <CharCounter text={activePost.text} limit={activeConfig.charLimit} />
                    <CopyButton
                      text={activePost.text}
                      label={t("socialPost.copyCaption")}
                      limit={activeConfig.charLimit}
                      fieldLabel={t(activeConfig.labelKey)}
                    />
                  </>
                }
              >
                <div className="flex flex-col gap-2">
                  {activePost.isOver && (
                    <Banner tone="danger">
                      {t("socialPost.overLimitHint", { platform: t(activeConfig.labelKey) })}
                    </Banner>
                  )}
                  {activePost.droppedBlocks.length > 0 && (
                    <Banner tone="warning">
                      {t("socialPost.trimmedHint", { count: activePost.droppedBlocks.length })}
                    </Banner>
                  )}
                  <OutputText>{activePost.text}</OutputText>
                </div>
              </OutputField>
            )
          )}

          {imported && (
            <Card className="border-accent/40">
              <CardHeader
                title={`${t("socialPost.importedHeading")}${imported.gameName ? ` — ${imported.gameName}` : ""}`}
                icon={<Upload aria-hidden="true" />}
                actions={
                  <Button variant="ghost" size="sm" onClick={() => setImported(null)}>
                    {t("common.dismiss")}
                  </Button>
                }
              />
              <div className="flex flex-col gap-3 p-4">
                {imported.posts.map((p) => (
                  <div
                    key={p.platform}
                    className="bg-surface-0 border-border rounded-lg border p-3"
                  >
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <Badge>{platformLabel(p.platform)}</Badge>
                      <CopyButton
                        text={p.text}
                        label={t("socialPost.copyCaption")}
                        limit={p.charLimit}
                      />
                    </div>
                    <pre className="text-text-secondary font-sans text-xs break-words whitespace-pre-wrap">
                      {p.text}
                    </pre>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </>
      ) : (
        <>
          <Card className="flex flex-col gap-4 p-4 sm:p-5">
            <ChipGroup
              label={t("output.selectLanguages")}
              multiple
              options={SUPPORTED_LANGUAGES.map((lang) => ({
                id: lang.id,
                label: `${lang.nativeName} (${lang.id})`,
              }))}
              value={selectedLangs}
              onChange={(next) => {
                if (next.length > 0) setSelectedLangs(next as SupportedLanguage[]);
              }}
            />
            <div className="grid gap-3 sm:grid-cols-[8rem_8rem_auto] sm:items-end">
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
                className="sm:justify-self-start"
                onClick={() => void handleBulkGenerate()}
                loading={generating}
                disabled={!gameName || !rangeResult.valid || strictBlocked}
              >
                <Play />
                {t("common.generate")}
              </Button>
            </div>
            {rangeError && (
              <Banner tone="warning" alert>
                {rangeError}
              </Banner>
            )}
          </Card>

          {bulkResults.length === 0 ? (
            <EmptyState icon={Layers} title={t("batch.emptyState")} />
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-text-secondary text-sm">
                  {t("socialPost.bulkSummary", {
                    captions: bulkResults.length * SOCIAL_PLATFORMS.length,
                  })}
                </span>
                <CopyButton
                  text={bulkCombined}
                  label={t("output.copyAll")}
                  blocked={bulkHasOverflow}
                />
              </div>
              <div className="flex flex-col gap-4">
                {bulkResults.map((row) => (
                  <Card key={`${row.partNumber}-${row.language}`} className="p-4">
                    <h2 className="text-text-primary mb-3 flex items-center gap-2 text-sm font-semibold">
                      {t("batch.partLabel", { n: row.partNumber })}
                      <Badge>{row.language.toUpperCase()}</Badge>
                    </h2>
                    <div className="flex flex-col gap-3">
                      {SOCIAL_PLATFORMS.map((p) => {
                        const post = row.posts[p.id];
                        if (!post) return null;
                        const Icon = p.icon;
                        return (
                          <div
                            key={p.id}
                            className="bg-surface-0 border-border rounded-lg border p-3"
                          >
                            <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                              <span className="text-text-secondary inline-flex items-center gap-1.5 text-xs font-medium">
                                <Icon className="size-3.5" aria-hidden />
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
                            <pre className="text-text-secondary max-h-24 scrollbar-thin overflow-y-auto font-sans text-xs break-words whitespace-pre-wrap">
                              {post.text}
                            </pre>
                          </div>
                        );
                      })}
                    </div>
                  </Card>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </PageContainer>
  );
}
