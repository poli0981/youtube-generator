import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Eye } from "lucide-react";
import { useGeneratedOutput } from "@hooks/use-generated-output";
import { useOutputLimits } from "@hooks/use-output-limits";
import { useStrictBlock } from "@hooks/use-strict-block";
import { EMPTY_GENERATOR_OUTPUT, YT_LIMITS } from "@engine/types";
import { useEditorStore } from "@store/editor-store";
import { Card } from "@components/ui/Card";
import { TabPanel, Tabs } from "@components/ui/Tabs";
import { CharCounter } from "@components/output/CharCounter";
import { CopyButton } from "@components/output/CopyButton";

type PreviewTab = "title" | "description" | "tags";

/**
 * The generated title / description / tags, live, next to the form — with
 * the same counters and copy gates as the Output page. Replaces the old
 * three-line "Quick Preview", which clipped the description to three lines
 * and could not copy anything.
 */
export function LivePreview({
  layoutId = "live-preview-tab",
  showHeading = true,
}: {
  layoutId?: string;
  /** Off inside the phone sheet, whose own title already says it. */
  showHeading?: boolean;
}) {
  const { t } = useTranslation("ui");
  const generated = useGeneratedOutput();
  // Without a game name the engine still renders "— Gameplay No Commentary";
  // show the prompt instead so nothing half-built can be copied.
  const hasGame = useEditorStore((s) => s.gameName.trim() !== "");
  const output = hasGame ? generated : EMPTY_GENERATOR_OUTPUT;
  const [tab, setTab] = useState<PreviewTab>("title");

  const outputs = useMemo(() => [output], [output]);
  const limitStatus = useOutputLimits(outputs);
  const strictBlocked = useStrictBlock();
  const blocked = limitStatus.blocked || strictBlocked;

  const over = (field: PreviewTab) => limitStatus.overflows.some((o) => o.field === field);
  const dot = (field: PreviewTab) =>
    over(field) ? <span className="bg-danger size-1.5 rounded-full" aria-hidden="true" /> : null;

  const empty = <p className="text-text-muted text-sm italic">{t("editor.previewEmpty")}</p>;

  return (
    <Card className="overflow-hidden">
      {showHeading && (
        <div className="flex items-center gap-2 px-4 pt-3.5">
          <Eye className="text-accent size-4" aria-hidden="true" />
          <h2 className="text-text-primary text-sm font-semibold">{t("editor.quickPreview")}</h2>
        </div>
      )}
      <Tabs
        value={tab}
        onChange={setTab}
        ariaLabel={t("editor.quickPreview")}
        layoutId={layoutId}
        listClassName="px-2 mt-1"
        items={[
          { value: "title", label: t("output.title"), badge: dot("title") },
          { value: "description", label: t("output.description"), badge: dot("description") },
          {
            value: "tags",
            label: `${t("output.tags")} · ${output.tags.length}`,
            badge: dot("tags"),
          },
        ]}
      >
        <TabPanel value="title" className="p-4">
          {output.title ? (
            <p className="text-text-primary text-[0.9375rem] leading-snug font-medium">
              {output.title}
            </p>
          ) : (
            empty
          )}
        </TabPanel>
        <TabPanel value="description" className="p-4">
          {output.description ? (
            <pre className="text-text-secondary max-h-[min(52dvh,32rem)] scrollbar-thin overflow-y-auto font-sans text-xs leading-relaxed whitespace-pre-wrap">
              {output.description}
            </pre>
          ) : (
            empty
          )}
        </TabPanel>
        <TabPanel value="tags" className="p-4">
          {output.tags.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {output.tags.map((tag, i) => (
                <span
                  key={i}
                  className="bg-surface-2 text-text-secondary rounded-md px-1.5 py-0.5 text-[0.6875rem]"
                >
                  {tag}
                </span>
              ))}
            </div>
          ) : (
            empty
          )}
        </TabPanel>
      </Tabs>
      <div className="border-border flex items-center justify-between gap-2 border-t px-4 py-2.5">
        {tab === "title" && <CharCounter text={output.title} limit={YT_LIMITS.TITLE_MAX} />}
        {tab === "description" && (
          <CharCounter text={output.description} limit={YT_LIMITS.DESCRIPTION_MAX} />
        )}
        {tab === "tags" && <CharCounter text={output.tagString} limit={YT_LIMITS.TAGS_MAX} />}
        {tab === "title" && (
          <CopyButton
            text={output.title}
            label={t("output.copyTitle")}
            limit={YT_LIMITS.TITLE_MAX}
            fieldLabel={t("output.title")}
            blocked={blocked}
          />
        )}
        {tab === "description" && (
          <CopyButton
            text={output.description}
            label={t("output.copyDescription")}
            limit={YT_LIMITS.DESCRIPTION_MAX}
            fieldLabel={t("output.description")}
            blocked={blocked}
          />
        )}
        {tab === "tags" && (
          <CopyButton
            text={output.tagString}
            label={t("output.copyTags")}
            limit={YT_LIMITS.TAGS_MAX}
            fieldLabel={t("output.tags")}
            blocked={blocked}
          />
        )}
      </div>
    </Card>
  );
}
