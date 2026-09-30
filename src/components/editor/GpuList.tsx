import { useTranslation } from "react-i18next";
import { Command } from "cmdk";
import { Check, PenLine, Search, X } from "lucide-react";
import { GPU_GROUPS, type GpuModel } from "@config/gpu-catalog";

const itemClass =
  "flex min-h-8 cursor-pointer items-center gap-2 rounded-lg px-2 py-1 text-sm text-text-primary select-none data-[selected=true]:bg-surface-2";

const headingClass =
  "[&_[cmdk-group-heading]]:text-text-muted [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:pt-2 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:text-[0.6875rem] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:tracking-wide [&_[cmdk-group-heading]]:uppercase";

interface GpuListProps {
  selectedId: string | undefined;
  hasValue: boolean;
  onSelect: (model: GpuModel) => void;
  onCustom: () => void;
  onClear: () => void;
}

/**
 * Every word of the query must appear in the card's name or keywords:
 * "5080" finds the RTX 5080s only, where cmdk's default fuzzy score also
 * offered the RX 580 and the HD 7850 ("5…8…0"). Exact model-number hits
 * rank first.
 */
function gpuFilter(value: string, search: string, keywords?: string[]): number {
  const haystack = [value, ...(keywords ?? [])].join(" ").toLowerCase();
  const words = search.toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return 1;
  if (!words.every((word) => haystack.includes(word))) return 0;
  const whole = words.every((word) =>
    new RegExp(`(^|[^a-z0-9])${word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}($|[^a-z0-9])`).test(
      haystack,
    ),
  );
  return whole ? 1 : 0.5;
}

/**
 * The searchable GPU list in the rig editor ("5080", "9070 xt", "m4 pro",
 * "rog ally"…). Lazily loaded with the search library it needs.
 */
export default function GpuList({
  selectedId,
  hasValue,
  onSelect,
  onCustom,
  onClear,
}: GpuListProps) {
  const { t } = useTranslation("ui");
  return (
    <Command loop filter={gpuFilter}>
      <div className="border-border flex items-center gap-2 border-b px-3">
        <Search className="text-text-muted size-4 shrink-0" aria-hidden="true" />
        <Command.Input
          autoFocus
          placeholder={t("editor.gpuSearch")}
          className="text-text-primary placeholder:text-text-muted h-10 w-full bg-transparent text-sm outline-none"
        />
      </div>
      <Command.List className="max-h-80 scrollbar-thin overflow-y-auto p-1">
        <Command.Empty className="text-text-muted py-4 text-center text-sm">
          {t("editor.gpuNoMatch")}
        </Command.Empty>
        {GPU_GROUPS.map((group) => (
          <Command.Group key={group.id} heading={group.label} className={headingClass}>
            {group.models.map((model) => (
              <Command.Item
                key={model.id}
                value={model.id}
                keywords={[model.name, ...(model.keywords ?? [])]}
                onSelect={() => onSelect(model)}
                className={itemClass}
              >
                <span
                  className="flex size-4 shrink-0 items-center justify-center"
                  aria-hidden="true"
                >
                  {model.id === selectedId && <Check className="text-accent size-4" />}
                </span>
                <span className="min-w-0 flex-1">{model.name}</span>
              </Command.Item>
            ))}
          </Command.Group>
        ))}
        <Command.Group forceMount className="border-border mt-1 border-t pt-1">
          <Command.Item forceMount value="__custom" onSelect={onCustom} className={itemClass}>
            <PenLine className="text-text-muted size-4 shrink-0" aria-hidden="true" />
            <span className="min-w-0 flex-1">{t("editor.gpuCustom")}</span>
          </Command.Item>
          {hasValue && (
            <Command.Item forceMount value="__clear" onSelect={onClear} className={itemClass}>
              <X className="text-text-muted size-4 shrink-0" aria-hidden="true" />
              <span className="min-w-0 flex-1">{t("editor.gpuNone")}</span>
            </Command.Item>
          )}
        </Command.Group>
      </Command.List>
    </Command>
  );
}
