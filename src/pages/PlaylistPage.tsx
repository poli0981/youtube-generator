import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import i18n from "i18next";
import {
  BookOpen,
  Bug,
  CircleCheckBig,
  CirclePause,
  CirclePlay,
  CircleX,
  ClipboardCopy,
  Flag,
  Frown,
  Gamepad2,
  Gauge,
  Hourglass,
  Package,
  Star,
  Swords,
  Trash2,
  TrendingDown,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { useDocumentTitle } from "@hooks/use-document-title";
import { useClipboard } from "@hooks/use-clipboard";
import { Input } from "@components/ui/Input";
import { Textarea } from "@components/ui/Textarea";
import { Button } from "@components/ui/Button";
import { Card } from "@components/ui/Card";
import { ChipGroup } from "@components/ui/ChipGroup";
import { Select } from "@components/ui/Select";
import { PageContainer, PageHeader } from "@components/ui/PageHeader";
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
import { DROPPED_REASONS, type DroppedReasonId } from "@config/dropped-reasons";
import type { SupportedLanguage } from "@engine/types";
import { FIELD_LIMITS } from "@config/field-limits";

const STATUS_ICONS: Record<PlaylistStatus, LucideIcon> = {
  completed: CircleCheckBig,
  dropped: CircleX,
  incomplete: CirclePause,
  in_progress: CirclePlay,
};

const CONTENT_TYPE_ICONS: Record<PlaylistContentType, LucideIcon> = {
  full_gameplay: Gamepad2,
  boss_fights: Swords,
  speedrun: Zap,
  all_endings: Flag,
  dlc: Package,
  "100_percent": CircleCheckBig,
  guide: BookOpen,
  highlights: Star,
};

const DROPPED_REASON_ICONS: Record<DroppedReasonId, LucideIcon> = {
  boring: Frown,
  performance: Gauge,
  bugs: Bug,
  delisted: Trash2,
  low_views: TrendingDown,
  time: Hourglass,
};

function OutputBlock({
  label,
  text,
  copyLabel,
  multiline,
}: {
  label: string;
  text: string;
  copyLabel: string;
  multiline?: boolean;
}) {
  return (
    <section className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-text-muted text-xs font-semibold tracking-wide uppercase">{label}</h2>
        <CopyButton text={text} label={copyLabel} />
      </div>
      {multiline ? (
        <pre className="bg-surface-0 border-border text-text-secondary max-h-64 scrollbar-thin overflow-y-auto rounded-lg border p-2.5 font-sans text-xs leading-relaxed whitespace-pre-wrap">
          {text || "…"}
        </pre>
      ) : (
        <p className="text-text-primary text-sm font-medium">{text || "…"}</p>
      )}
    </section>
  );
}

export function PlaylistPage() {
  const { t } = useTranslation("ui");
  useDocumentTitle(t("tabs.playlist"));
  const editor = useEditorStore();
  const { copy } = useClipboard();

  const [status, setStatus] = useState<PlaylistStatus>("completed");
  const [contentType, setContentType] = useState<PlaylistContentType>("full_gameplay");
  const [totalVideos, setTotalVideos] = useState("");
  const [customNote, setCustomNote] = useState("");
  const [droppedReasons, setDroppedReasons] = useState<DroppedReasonId[]>([]);
  const [droppedReasonCustom, setDroppedReasonCustom] = useState("");
  const [language, setLanguage] = useState<SupportedLanguage>(editor.language);

  const langOptions = SUPPORTED_LANGUAGES.map((l) => ({
    value: l.id,
    label: `${l.nativeName} (${l.id})`,
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
        totalVideosValidation.valid && totalVideos.trim() ? parseInt(totalVideos) : undefined,
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
    <PageContainer>
      <PageHeader title={t("playlist.title")} description={t("playlist.intro")} />

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_24rem]">
        <Card className="flex flex-col gap-5 p-4 sm:p-5">
          <Select
            label={t("editor.language")}
            options={langOptions}
            value={language}
            onChange={(v) => setLanguage(v as SupportedLanguage)}
            className="sm:max-w-64"
          />

          <ChipGroup
            label={t("playlist.status")}
            options={(Object.keys(STATUS_ICONS) as PlaylistStatus[]).map((id) => ({
              id,
              label: t(`playlist.statuses.${id}`),
              icon: STATUS_ICONS[id],
            }))}
            value={status}
            onChange={(v) => setStatus(v as PlaylistStatus)}
          />

          {status === "dropped" && (
            <div className="border-border flex flex-col gap-4 border-l-2 pl-4">
              <ChipGroup
                label={t("playlist.droppedReasonsLabel")}
                multiple
                options={DROPPED_REASONS.map((r) => ({
                  id: r.id,
                  label: t(`playlist.droppedReasons.${r.id}`),
                  icon: DROPPED_REASON_ICONS[r.id],
                }))}
                value={droppedReasons}
                // ChipGroup is id-agnostic (`string[]`); the options come straight
                // from DROPPED_REASONS, so every id it hands back is a
                // DroppedReasonId. Narrowing here keeps the state typed.
                onChange={(v) => setDroppedReasons(v as DroppedReasonId[])}
              />
              <Textarea
                label={t("playlist.droppedReasonCustomLabel")}
                maxLength={FIELD_LIMITS.LONG_TEXT}
                placeholder={t("playlist.droppedReasonCustomPlaceholder")}
                value={droppedReasonCustom}
                onChange={(e) => setDroppedReasonCustom(e.target.value)}
                rows={2}
              />
            </div>
          )}

          <ChipGroup
            label={t("playlist.contentType")}
            options={(Object.keys(CONTENT_TYPE_ICONS) as PlaylistContentType[]).map((id) => ({
              id,
              label: t(`playlist.contentTypes.${id}`),
              icon: CONTENT_TYPE_ICONS[id],
            }))}
            value={contentType}
            onChange={(v) => setContentType(v as PlaylistContentType)}
          />

          <Input
            label={t("playlist.totalVideos")}
            type="number"
            min={1}
            step={1}
            inputMode="numeric"
            placeholder={t("playlist.totalVideosPlaceholder")}
            value={totalVideos}
            errorText={totalVideosError}
            onChange={(e) => setTotalVideos(e.target.value)}
            className="max-w-40"
          />

          <Textarea
            label={t("playlist.customNote")}
            maxLength={FIELD_LIMITS.LONG_TEXT}
            placeholder={t("playlist.customNotePlaceholder")}
            value={customNote}
            onChange={(e) => setCustomNote(e.target.value)}
            rows={3}
          />
        </Card>

        <Card className="flex flex-col gap-5 p-4 lg:sticky lg:top-6">
          <OutputBlock
            label={t("output.title")}
            text={output.title}
            copyLabel={t("output.copyTitle")}
          />
          <OutputBlock
            label={t("output.description")}
            text={output.description}
            copyLabel={t("output.copyDescription")}
            multiline
          />
          <OutputBlock
            label={t("playlist.pinnedComment")}
            text={output.comment}
            copyLabel={t("output.copyComment")}
            multiline
          />
          <Button
            disabled={!output.title}
            onClick={() => void copy(`${output.title}\n\n${output.description}`)}
          >
            <ClipboardCopy />
            {t("output.copyAll")}
          </Button>
        </Card>
      </div>
    </PageContainer>
  );
}
