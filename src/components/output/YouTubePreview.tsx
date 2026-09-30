import { useTranslation } from "react-i18next";
import { MonitorPlay, Play } from "lucide-react";
import { Card } from "@components/ui/Card";
import { Banner } from "@components/ui/Banner";

/**
 * Rough cut-offs, not exact: YouTube truncates by pixel width, which varies
 * with the device and the characters used. They are what creator guides quote
 * and are good enough to say "the end of this won't be seen".
 */
const SEARCH_TITLE_CHARS = 70;
const FOLD_DESCRIPTION_CHARS = 150;

interface YouTubePreviewProps {
  title: string;
  description: string;
  channelName: string;
  gameName: string;
}

/**
 * How the title and the start of the description read on YouTube — in a
 * search result and above the watch page's "…more". Most viewers never see
 * anything past those points, so this is where the important words must go.
 */
export function YouTubePreview({ title, description, channelName, gameName }: YouTubePreviewProps) {
  const { t } = useTranslation("ui");
  const titleCut = title.length > SEARCH_TITLE_CHARS;
  const descriptionCut = description.length > FOLD_DESCRIPTION_CHARS;
  const fold = description.slice(0, FOLD_DESCRIPTION_CHARS).trimEnd();
  const channel = channelName.trim() || t("output.youtubePreview.channelPlaceholder");

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center gap-2 px-4 pt-3.5 pb-3">
        <MonitorPlay className="text-text-muted size-4" aria-hidden="true" />
        <h2 className="text-text-primary text-sm font-semibold">
          {t("output.youtubePreview.heading")}
        </h2>
      </div>

      <div className="flex flex-col gap-4 px-4 pb-4 sm:flex-row">
        {/* Search result */}
        <div className="bg-brand-gradient relative flex aspect-video w-full shrink-0 items-center justify-center overflow-hidden rounded-xl sm:w-56">
          <span className="absolute inset-0 bg-black/25" aria-hidden="true" />
          <span className="relative line-clamp-2 px-4 text-center text-sm font-bold text-white drop-shadow">
            {gameName || "YTDescGen"}
          </span>
          <span className="absolute right-2 bottom-2 flex size-7 items-center justify-center rounded-full bg-black/60 text-white">
            <Play className="size-3.5 fill-current" aria-hidden="true" />
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-text-primary line-clamp-2 text-base leading-snug font-semibold">
            {title || "…"}
          </p>
          <p className="text-text-muted mt-1 text-xs">{channel}</p>
          <p className="text-text-muted mt-2 line-clamp-2 text-xs leading-relaxed">{description}</p>
        </div>
      </div>

      {/* Watch page, above "…more" */}
      <div className="border-border bg-surface-0/60 mx-4 mb-4 rounded-xl border p-3">
        <p className="text-text-secondary text-xs leading-relaxed whitespace-pre-line">
          {fold || "…"}
          {descriptionCut && (
            <span className="text-text-primary font-semibold">
              {" "}
              {t("output.youtubePreview.more")}
            </span>
          )}
        </p>
      </div>

      {(titleCut || descriptionCut) && (
        <div className="flex flex-col gap-2 px-4 pb-4">
          {titleCut && (
            <Banner tone="info">
              {t("output.youtubePreview.titleCut", { chars: SEARCH_TITLE_CHARS })}
            </Banner>
          )}
          {descriptionCut && (
            <Banner tone="info">
              {t("output.youtubePreview.foldHint", { chars: FOLD_DESCRIPTION_CHARS })}
            </Banner>
          )}
        </div>
      )}
    </Card>
  );
}
