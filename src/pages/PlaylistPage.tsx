import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useDocumentTitle } from "@hooks/use-document-title";
import i18n from "i18next";
import { Input } from "@components/ui/Input";
import { Textarea } from "@components/ui/Textarea";
import { Button } from "@components/ui/Button";
import { ChipGroup } from "@components/ui/ChipGroup";
import { Select } from "@components/ui/Select";
import { CopyButton } from "@components/output/CopyButton";
import { useEditorStore } from "@store/editor-store";
import { validateIntegerInRange } from "@utils/validation";
import { SUPPORTED_LANGUAGES } from "@i18n/index";
import { useLanguagesReady } from "@hooks/use-languages-ready";
import {
  buildPlaylistTitle,
  buildPlaylistDescription,
  buildPlaylistComment,
  type PlaylistStatus,
  type PlaylistContentType,
  type PlaylistInput,
} from "@engine/playlist-builder";
import { DROPPED_REASONS } from "@config/dropped-reasons";
import type { SupportedLanguage } from "@engine/types";

const STATUS_OPTIONS = [
  { id: "completed", label: "✅ Completed", icon: "" },
  { id: "dropped", label: "❌ Dropped", icon: "" },
  { id: "incomplete", label: "🔄 Incomplete", icon: "" },
  { id: "in_progress", label: "▶️ In Progress", icon: "" },
] as const;

const CONTENT_TYPE_OPTIONS = [
  { id: "full_gameplay", label: "Full Gameplay", icon: "🎮" },
  { id: "boss_fights", label: "Boss Fights", icon: "👹" },
  { id: "speedrun", label: "Speedrun", icon: "⚡" },
  { id: "all_endings", label: "All Endings", icon: "🏁" },
  { id: "dlc", label: "DLC", icon: "📦" },
  { id: "100_percent", label: "100%", icon: "💯" },
  { id: "guide", label: "Guide", icon: "📘" },
  { id: "highlights", label: "Highlights", icon: "⭐" },
] as const;

export function PlaylistPage() {
  const { t } = useTranslation("ui");
  useDocumentTitle(t("tabs.playlist"));
  const editor = useEditorStore();

  const [status, setStatus] = useState<PlaylistStatus>("completed");
  const [contentType, setContentType] = useState<PlaylistContentType>("full_gameplay");
  const [totalVideos, setTotalVideos] = useState("");
  const [customNote, setCustomNote] = useState("");
  const [droppedReasons, setDroppedReasons] = useState<string[]>([]);
  const [droppedReasonCustom, setDroppedReasonCustom] = useState("");
  const [language, setLanguage] = useState<SupportedLanguage>(editor.language);

  const langOptions = SUPPORTED_LANGUAGES.map((l) => ({
    value: l.id,
    label: `${l.flag} ${l.nativeName}`,
  }));

  // Guard the output: only forward a valid whole number in range so a
  // negative / decimal / out-of-range entry simply omits the count line
  // instead of producing a broken "X videos" string.
  const totalVideosValidation = validateIntegerInRange(totalVideos, {
    min: 1,
    max: 1000,
    allowEmpty: true,
  });
  const totalVideosError = totalVideosValidation.valid
    ? undefined
    : t(totalVideosValidation.error ?? "", totalVideosValidation.errorParams);

  const playlistInput: PlaylistInput = useMemo(
    () => ({
      gameName: editor.gameName,
      channelName: editor.channelName,
      status,
      contentType,
      totalVideos:
        totalVideosValidation.valid && totalVideos.trim()
          ? parseInt(totalVideos)
          : undefined,
      storeLinks: editor.storeLinks,
      playlistNote: customNote,
      droppedReasons,
      droppedReasonCustom,
      playlistLink: editor.playlistLink,
    }),
    [
      editor.gameName,
      editor.channelName,
      status,
      contentType,
      totalVideos,
      totalVideosValidation.valid,
      editor.storeLinks,
      customNote,
      droppedReasons,
      droppedReasonCustom,
      editor.playlistLink,
    ],
  );

  // Lazy-loaded locales (v0.26): the dropdown can pick a language whose
  // bundle isn't fetched yet — hold the placeholder until it is.
  const ready = useLanguagesReady([language]);

  const output = useMemo(() => {
    if (!ready) return { title: "", description: "", comment: "" };
    const tFn = i18n.getFixedT(language, "templates");
    return {
      title: buildPlaylistTitle(playlistInput, tFn),
      description: buildPlaylistDescription(playlistInput, tFn),
      comment: buildPlaylistComment(playlistInput, tFn),
    };
  }, [ready, playlistInput, language]);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 p-6 lg:flex-row">
      {/* Form */}
      <div className="flex flex-1 flex-col gap-5">
        <h1 className="text-lg font-bold text-text-primary">{t("playlist.title")}</h1>

        <Select
          label={t("editor.language")}
          options={langOptions}
          value={language}
          onChange={(v) => setLanguage(v as SupportedLanguage)}
        />

        <ChipGroup
          label={t("playlist.status")}
          options={STATUS_OPTIONS}
          value={status}
          onChange={(v) => setStatus(v as PlaylistStatus)}
        />

        {status === "dropped" && (
          <>
            <ChipGroup
              label={t("playlist.droppedReasonsLabel")}
              multiple
              options={DROPPED_REASONS.map((r) => ({
                id: r.id,
                label: t(`playlist.droppedReasons.${r.id}`),
                icon: r.icon,
              }))}
              value={droppedReasons}
              onChange={setDroppedReasons}
            />
            <Textarea
              label={t("playlist.droppedReasonCustomLabel")}
              placeholder={t("playlist.droppedReasonCustomPlaceholder")}
              value={droppedReasonCustom}
              onChange={(e) => setDroppedReasonCustom(e.target.value)}
              rows={2}
            />
          </>
        )}

        <ChipGroup
          label={t("playlist.contentType")}
          options={CONTENT_TYPE_OPTIONS}
          value={contentType}
          onChange={(v) => setContentType(v as PlaylistContentType)}
        />

        <Input
          label={t("playlist.totalVideos")}
          type="number"
          min={1}
          step={1}
          inputMode="numeric"
          placeholder="e.g. 25"
          value={totalVideos}
          errorText={totalVideosError}
          onChange={(e) => setTotalVideos(e.target.value)}
        />

        <Textarea
          label={t("playlist.customNote")}
          placeholder="Optional note..."
          value={customNote}
          onChange={(e) => setCustomNote(e.target.value)}
          rows={3}
        />
      </div>

      {/* Output */}
      <div className="w-full shrink-0 lg:w-96">
        <div className="sticky top-6 flex flex-col gap-4 rounded-lg border border-border bg-surface-1 p-4">
          <div>
            <div className="mb-1 flex items-center justify-between">
              <span className="text-xs font-medium uppercase text-text-muted">
                {t("output.title")}
              </span>
              <CopyButton text={output.title} label={t("output.copyTitle")} />
            </div>
            <p className="text-sm font-medium text-text-primary">{output.title || "..."}</p>
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between">
              <span className="text-xs font-medium uppercase text-text-muted">
                {t("output.description")}
              </span>
              <CopyButton text={output.description} label={t("output.copyDescription")} />
            </div>
            <pre className="max-h-64 overflow-y-auto whitespace-pre-wrap rounded bg-surface-2 p-2 font-sans text-xs text-text-secondary">
              {output.description || "..."}
            </pre>
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between">
              <span className="text-xs font-medium uppercase text-text-muted">
                {t("playlist.pinnedComment")}
              </span>
              <CopyButton text={output.comment} label={t("output.copyComment")} />
            </div>
            <pre className="max-h-64 overflow-y-auto whitespace-pre-wrap rounded bg-surface-2 p-2 font-sans text-xs text-text-secondary">
              {output.comment || "..."}
            </pre>
          </div>

          <Button
            onClick={() => {
              navigator.clipboard.writeText(`${output.title}\n\n${output.description}`);
            }}
          >
            {t("output.copyAll")}
          </Button>
        </div>
      </div>
    </div>
  );
}
