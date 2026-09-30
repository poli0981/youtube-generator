import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { CircleCheck, TriangleAlert, WandSparkles } from "lucide-react";
import { Textarea } from "@components/ui/Textarea";
import { Button } from "@components/ui/Button";
import { useEditorStore } from "@store/editor-store";
import { FIELD_LIMITS } from "@config/field-limits";
import {
  checkChapters,
  normalizeTimeline,
  parseTimeline,
  type ChapterIssue,
} from "@engine/timeline-parser";

/**
 * Timestamps, with a live check against YouTube's chapter rules (first at
 * 0:00, at least three, ten seconds apart, in order) and a button that
 * rewrites pasted lists ("[00:00] – Intro", editor frame counts) into the
 * plain "0:00 Intro" form.
 */
export function TimestampEditor() {
  const { t } = useTranslation("ui");
  const timestamps = useEditorStore((s) => s.timestamps) ?? "";
  const set = useEditorStore((s) => s.set);

  const entries = useMemo(() => parseTimeline(timestamps), [timestamps]);
  const timedCount = entries.filter((e) => e.time).length;
  const issues = useMemo(() => checkChapters(entries), [entries]);
  const normalized = useMemo(() => normalizeTimeline(timestamps), [timestamps]);
  const canNormalize = timedCount > 0 && normalized !== timestamps.trim();

  const describe = (issue: ChapterIssue): string => {
    switch (issue.kind) {
      case "firstNotZero":
        return t("editor.chapters.firstNotZero");
      case "tooFew":
        return t("editor.chapters.tooFew", { n: issue.count });
      case "tooShort":
        return t("editor.chapters.tooShort", { time: issue.time });
      case "outOfOrder":
        return t("editor.chapters.outOfOrder", { time: issue.time });
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <Textarea
        label={t("editor.timestamps")}
        maxLength={FIELD_LIMITS.TIMESTAMPS}
        placeholder={t("editor.timestampsPlaceholder")}
        value={timestamps}
        onChange={(e) => set("timestamps", e.target.value)}
        rows={4}
        labelExtra={
          canNormalize ? (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2"
              onClick={() => set("timestamps", normalized)}
            >
              <WandSparkles />
              {t("editor.timestampsNormalize")}
            </Button>
          ) : undefined
        }
      />
      {timedCount > 0 &&
        (issues.length === 0 ? (
          <p className="text-success flex items-center gap-1.5 text-xs">
            <CircleCheck className="size-3.5 shrink-0" aria-hidden="true" />
            {t("editor.chapters.ok", { n: timedCount })}
          </p>
        ) : (
          <ul className="text-warning flex flex-col gap-0.5 text-xs" aria-live="polite">
            {issues.map((issue, i) => (
              <li key={i} className="flex items-start gap-1.5">
                <TriangleAlert className="mt-px size-3.5 shrink-0" aria-hidden="true" />
                {describe(issue)}
              </li>
            ))}
          </ul>
        ))}
    </div>
  );
}
