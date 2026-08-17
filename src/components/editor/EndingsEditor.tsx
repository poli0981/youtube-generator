import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Minus, AlertTriangle } from "lucide-react";
import { Input } from "@components/ui/Input";
import { Button } from "@components/ui/Button";
import { Select } from "@components/ui/Select";
import { useEditorStore, computeContiguousRanges } from "@store/editor-store";
import { parseTimeline } from "@engine/timeline-parser";
import { formatEndingEntry } from "@engine/endings-format";
import type { EndingEntry, EndingVideoRange } from "@engine/types";
import { FIELD_LIMITS } from "@config/field-limits";

/** Editor cap, matching the original spec ("Giá trị từ 1 - 100"). */
const MAX_ENDINGS = 100;

/**
 * Structured ending editor (v0.16.0). Replaces the freeform
 * "Endings shown" single Input that used to live in
 * `PlaythroughNotesForm`.
 *
 * Three logical cases drive the layout:
 *
 *   • Case A — `endings.length <= 1`:
 *       Single Number + Name pair. At least one of the two must be
 *       filled; otherwise a banner explains that the entry will be
 *       dropped from the description bullet.
 *
 *   • Case B — `endings.length >= 2` AND `endingVideoCount === 1`:
 *       Table with one row per ending. A gate inspects the
 *       Timestamps textarea — if it doesn't contain at least
 *       `endings.length` lines matching the `ending` keyword, a
 *       warning banner surfaces. (The actual copy-blocking is wired
 *       in CopyAllBar; this component just renders the banner so the
 *       creator sees the problem inline with the field that caused
 *       it.)
 *
 *   • Case C — `endings.length >= 2` AND `endingVideoCount >= 2`:
 *       Endings table + a per-video range table. Default ranges are
 *       contiguous and balanced (extras spill into the last video);
 *       the creator can override per-row. Invalid overlaps /
 *       coverage gaps surface as inline warnings.
 *
 * The "Ending shown" preview line under each entry mirrors the
 * formatter used by the description builder so creators see exactly
 * what will land in the rendered bullet.
 */
export function EndingsEditor() {
  const { t } = useTranslation("ui");
  const endings = useEditorStore((s) => s.endings);
  const endingVideoCount = useEditorStore((s) => s.endingVideoCount);
  const endingVideoRanges = useEditorStore((s) => s.endingVideoRanges);
  const endingVideoIndex = useEditorStore((s) => s.endingVideoIndex);
  const timestamps = useEditorStore((s) => s.timestamps);
  const set = useEditorStore((s) => s.set);

  const count = endings.length;
  const isMultiEnding = count >= 2;
  const isMultiVideo = isMultiEnding && endingVideoCount >= 2;

  /**
   * Count timeline lines tagged as the "ending" keyword. Used by case
   * B as a copy-time validity gate — the creator must declare at
   * least as many timeline markers as the structured array claims.
   */
  const timelineEndingCount = useMemo(() => {
    if (!isMultiEnding || isMultiVideo) return 0;
    const parsed = parseTimeline(timestamps);
    return parsed.filter((e) => e.keyword === "ending").length;
  }, [timestamps, isMultiEnding, isMultiVideo]);

  /** Resize the structured `endings[]` array to a new length, padding
   *  with empty entries or truncating. Triggers a range recompute so
   *  case C stays in sync when going from 6→4 endings etc. */
  const setEndingCount = (next: number) => {
    const clamped = Math.max(0, Math.min(MAX_ENDINGS, Math.floor(next)));
    const nextEndings: EndingEntry[] =
      clamped <= count
        ? endings.slice(0, clamped)
        : [
            ...endings,
            ...Array.from({ length: clamped - count }, () => ({ number: null, name: "" })),
          ];
    set("endings", nextEndings);

    // Re-derive endingVideoCount + ranges so the schema invariants
    // (videoCount <= endings.length, ranges.length === videoCount)
    // stay true after a shrink/grow.
    const nextVideoCount = clamped === 0 ? 1 : Math.min(endingVideoCount, clamped);
    set("endingVideoCount", nextVideoCount);
    set("endingVideoRanges", clamped === 0 ? [] : computeContiguousRanges(clamped, nextVideoCount));
  };

  /** Update one ending row's number / name. */
  const updateEnding = (i: number, patch: Partial<EndingEntry>) => {
    const next = endings.map((e, idx) => (idx === i ? { ...e, ...patch } : e));
    set("endings", next);
  };

  /** Update the multi-video count (case C). Recomputes default ranges
   *  on change unless the creator has already customised them — we
   *  always reset on count change because a manual override at the old
   *  count is unlikely to make sense at the new one. Also clamps
   *  `endingVideoIndex` so a shrink doesn't leave us previewing a
   *  video that no longer exists. */
  const setVideoCount = (next: number) => {
    if (count === 0) return;
    const clamped = Math.max(1, Math.min(count, Math.floor(next)));
    set("endingVideoCount", clamped);
    set("endingVideoRanges", computeContiguousRanges(count, clamped));
    if (endingVideoIndex > clamped) {
      set("endingVideoIndex", clamped);
    }
  };

  /** Update one video's `from` / `to` bound (case C). Doesn't enforce
   *  non-overlap inline — the warning banner surfaces invalid
   *  configurations after the fact, since mid-edit overlaps are
   *  expected. */
  const updateRange = (i: number, patch: Partial<EndingVideoRange>) => {
    const next = endingVideoRanges.map((r, idx) => (idx === i ? { ...r, ...patch } : r));
    set("endingVideoRanges", next);
  };

  /**
   * Inspect the current ranges array for overlap / gap / out-of-bounds
   * errors. Returns a translation-key list that the warning banner
   * iterates. Pure-ish — closes over `endingVideoRanges` + `count`.
   */
  const rangeWarnings: string[] = useMemo(() => {
    if (!isMultiVideo) return [];
    const warnings: string[] = [];
    const sorted = [...endingVideoRanges]
      .map((r, idx) => ({ idx, ...r }))
      .sort((a, b) => a.from - b.from);
    for (const r of sorted) {
      if (r.from < 1 || r.to > count || r.from > r.to) {
        warnings.push(
          t("editor.endings.warnings.rangeInvalid", {
            video: r.idx + 1,
            from: r.from,
            to: r.to,
          }),
        );
      }
    }
    // Coverage + overlap pass.
    let covered = 0;
    for (let i = 0; i < sorted.length; i++) {
      const r = sorted[i];
      if (!r) continue;
      if (r.from > covered + 1) {
        warnings.push(t("editor.endings.warnings.rangeGap", { at: covered + 1 }));
      }
      if (r.from <= covered) {
        warnings.push(t("editor.endings.warnings.rangeOverlap", { at: r.from }));
      }
      if (r.to > covered) covered = r.to;
    }
    if (covered < count) {
      warnings.push(t("editor.endings.warnings.rangeShort", { at: covered + 1, total: count }));
    }
    return warnings;
  }, [endingVideoRanges, count, isMultiVideo, t]);

  /** Build the "Ending shown" preview string for a single entry. */
  const previewFor = (entry: EndingEntry): string =>
    formatEndingEntry(entry) ?? t("editor.endings.previewEmpty");

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <Input
            label={t("editor.endings.countLabel")}
            type="number"
            min={0}
            max={MAX_ENDINGS}
            value={String(count)}
            onChange={(e) => setEndingCount(Number(e.target.value) || 0)}
          />
        </div>
        {count > 0 && (
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setEndingCount(count - 1)}
              aria-label={t("editor.endings.removeLast")}
            >
              <Minus className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setEndingCount(count + 1)}
              aria-label={t("editor.endings.addOne")}
              disabled={count >= MAX_ENDINGS}
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>

      {count === 0 && <p className="text-text-muted text-xs">{t("editor.endings.emptyHint")}</p>}

      {/* CASE A: single ending — number + name pair, with preview. */}
      {count === 1 && endings[0] && (
        <div className="border-border bg-surface-1 flex flex-col gap-2 rounded-lg border p-3">
          <div className="grid grid-cols-[100px_1fr] gap-2">
            <Input
              label={t("editor.endings.numberLabel")}
              type="number"
              min={1}
              max={MAX_ENDINGS}
              value={endings[0].number?.toString() ?? ""}
              placeholder="3"
              onChange={(e) => {
                const v = e.target.value.trim();
                updateEnding(0, { number: v === "" ? null : Number(v) });
              }}
            />
            <Input
              label={t("editor.endings.nameLabel")}
              maxLength={FIELD_LIMITS.SHORT_NAME}
              placeholder={t("editor.endings.namePlaceholder")}
              value={endings[0].name}
              onChange={(e) => updateEnding(0, { name: e.target.value })}
            />
          </div>
          <p className="text-text-muted text-xs">
            {t("editor.endings.previewLabel")}:{" "}
            <span className="text-text-secondary font-mono">{previewFor(endings[0])}</span>
          </p>
          {!endings[0].number && !endings[0].name.trim() && (
            <p className="text-warning flex items-center gap-1.5 text-xs">
              <AlertTriangle className="h-3 w-3" />
              {t("editor.endings.warnings.singleEmpty")}
            </p>
          )}
        </div>
      )}

      {/* CASE B / C: multi-ending table. */}
      {count >= 2 && (
        <div className="flex flex-col gap-2">
          <div className="border-border overflow-hidden rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-surface-1 text-text-muted text-xs uppercase">
                <tr>
                  <th className="px-2 py-1.5 text-left">#</th>
                  <th className="w-[100px] px-2 py-1.5 text-left">
                    {t("editor.endings.numberLabel")}
                  </th>
                  <th className="px-2 py-1.5 text-left">{t("editor.endings.nameLabel")}</th>
                  <th className="px-2 py-1.5 text-left">{t("editor.endings.previewLabel")}</th>
                </tr>
              </thead>
              <tbody>
                {endings.map((entry, i) => (
                  <tr key={i} className="border-border border-t">
                    <td className="text-text-muted px-2 py-1.5">{i + 1}</td>
                    <td className="px-2 py-1.5">
                      <Input
                        type="number"
                        min={1}
                        max={MAX_ENDINGS}
                        value={entry.number?.toString() ?? ""}
                        onChange={(e) => {
                          const v = e.target.value.trim();
                          updateEnding(i, { number: v === "" ? null : Number(v) });
                        }}
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <Input
                        placeholder={t("editor.endings.namePlaceholder")}
                        value={entry.name}
                        onChange={(e) => updateEnding(i, { name: e.target.value })}
                      />
                    </td>
                    <td className="text-text-muted px-2 py-1.5 font-mono text-xs">
                      {previewFor(entry)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Case B: timeline gate banner. */}
      {isMultiEnding && !isMultiVideo && timelineEndingCount < count && (
        <p className="border-warning/40 bg-warning/10 text-warning flex items-start gap-1.5 rounded border p-2 text-xs">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>
            {t("editor.endings.warnings.timelineShort", {
              needed: count,
              found: timelineEndingCount,
            })}
          </span>
        </p>
      )}

      {/* CASE C: video-count input + per-video ranges. */}
      {isMultiEnding && (
        <div className="border-border bg-surface-1 flex flex-col gap-2 rounded-lg border p-3">
          <Input
            label={t("editor.endings.videoCountLabel")}
            type="number"
            min={1}
            max={count}
            value={String(endingVideoCount)}
            onChange={(e) => setVideoCount(Number(e.target.value) || 1)}
          />
          {isMultiVideo && (
            <>
              <p className="text-text-muted text-xs">{t("editor.endings.videoRangeHint")}</p>
              <div className="border-border overflow-hidden rounded border">
                <table className="w-full text-sm">
                  <thead className="bg-surface-2 text-text-muted text-xs uppercase">
                    <tr>
                      <th className="px-2 py-1.5 text-left">{t("editor.endings.videoLabel")}</th>
                      <th className="px-2 py-1.5 text-left">From</th>
                      <th className="px-2 py-1.5 text-left">To</th>
                    </tr>
                  </thead>
                  <tbody>
                    {endingVideoRanges.map((r, i) => (
                      <tr key={i} className="border-border border-t">
                        <td className="px-2 py-1.5">{i + 1}</td>
                        <td className="px-2 py-1.5">
                          <Input
                            type="number"
                            min={1}
                            max={count}
                            value={String(r.from)}
                            onChange={(e) => updateRange(i, { from: Number(e.target.value) || 1 })}
                          />
                        </td>
                        <td className="px-2 py-1.5">
                          <Input
                            type="number"
                            min={1}
                            max={count}
                            value={String(r.to)}
                            onChange={(e) => updateRange(i, { to: Number(e.target.value) || 1 })}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {rangeWarnings.length > 0 && (
                <ul className="border-warning/40 bg-warning/10 text-warning flex flex-col gap-1 rounded border p-2 text-xs">
                  {rangeWarnings.map((w, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      <span>{w}</span>
                    </li>
                  ))}
                </ul>
              )}

              {/* v0.17.1: preview-video selector. Lets the creator
               *  pick which video's slice the Output renders. Engine
               *  already respects `endingVideoIndex` for both title +
               *  description; this just exposes the knob. */}
              <Select
                label={t("editor.endings.videoIndexLabel")}
                options={Array.from({ length: endingVideoCount }, (_, i) => {
                  const r = endingVideoRanges[i];
                  const rangeLabel = r ? ` (${r.from}–${r.to})` : "";
                  return {
                    value: String(i + 1),
                    label: `${t("editor.endings.videoLabel")} ${i + 1}${rangeLabel}`,
                  };
                })}
                value={String(Math.min(endingVideoIndex, endingVideoCount))}
                onChange={(v) => set("endingVideoIndex", Number(v) || 1)}
              />
              <p className="text-text-muted text-xs">{t("editor.endings.videoIndexHint")}</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
