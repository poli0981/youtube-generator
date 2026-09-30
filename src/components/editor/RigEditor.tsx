import { lazy, Suspense, useId, useState } from "react";
import { useTranslation } from "react-i18next";
import { AlertTriangle, ChevronsUpDown } from "lucide-react";
import clsx from "clsx";
import { Input } from "@components/ui/Input";
import { Select } from "@components/ui/Select";
import { Field, controlClasses } from "@components/ui/Field";
import { PopoverContent, PopoverRoot, PopoverTrigger } from "@components/ui/Popover";
import { Spinner } from "@components/icons/animated";
import {
  RIG_FIELDS,
  cleanCpuName,
  parseCompositeValue,
  resolveCompositeOptions,
  resolveCompositeLabelKey,
  type RigField,
  type CompositePart,
} from "@config/rig-fields";
import { gpuValue, migrateGpuValue, modelForGpuValue } from "@config/gpu-catalog";
import { useEditorStore } from "@store/editor-store";
import { FIELD_LIMITS } from "@config/field-limits";
import { validateCompositeField, type RigValidationIssue } from "@utils/rig-validation";

const GpuList = lazy(() => import("./GpuList"));

const CUSTOM_PREFIX = "custom:";

function joinComposite(parts: readonly string[]): string {
  if (parts.every((p) => !p)) return "";
  return parts.join("|");
}

/**
 * GPU: one searchable picker over the catalog, printing the official name
 * ("NVIDIA GeForce RTX 5080"), plus a free-text fallback for anything not
 * listed. Replaces three dependent dropdowns (Brand › Series › Model).
 */
function GpuPicker({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
}) {
  const { t } = useTranslation("ui");
  const [open, setOpen] = useState(false);
  const [customMode, setCustomMode] = useState(false);
  const normalized = migrateGpuValue(value);
  const model = modelForGpuValue(normalized);
  const isOwnText = !model && normalized !== "";
  const showCustom = customMode || isOwnText;

  return (
    <div className="flex flex-col gap-2 sm:col-span-2">
      <Field label={label}>
        {(control) => (
          <PopoverRoot open={open} onOpenChange={setOpen}>
            <PopoverTrigger
              {...control}
              className={clsx(
                controlClasses(false),
                "h-control flex cursor-pointer items-center gap-2 text-left text-base sm:text-sm",
              )}
            >
              <span className={clsx("min-w-0 flex-1 truncate", !model && "text-text-muted")}>
                {model?.name ?? (showCustom ? t("editor.gpuCustomChosen") : t("editor.gpuPick"))}
              </span>
              <ChevronsUpDown className="text-text-muted size-4 shrink-0" aria-hidden="true" />
            </PopoverTrigger>
            <PopoverContent ariaLabel={label} className="w-[min(28rem,calc(100vw-2rem))]">
              <Suspense
                fallback={
                  <div className="text-text-muted flex justify-center py-8">
                    <Spinner className="size-4" />
                  </div>
                }
              >
                <GpuList
                  selectedId={model?.id}
                  hasValue={normalized !== ""}
                  onSelect={(next) => {
                    onChange(gpuValue(next));
                    setCustomMode(false);
                    setOpen(false);
                  }}
                  onCustom={() => {
                    // Start from the current card's name so "RTX 5080" can
                    // become "RTX 5080 (overclocked)" without retyping.
                    onChange(model ? model.name : normalized);
                    setCustomMode(true);
                    setOpen(false);
                  }}
                  onClear={() => {
                    onChange("");
                    setCustomMode(false);
                    setOpen(false);
                  }}
                />
              </Suspense>
            </PopoverContent>
          </PopoverRoot>
        )}
      </Field>
      {showCustom && (
        <Input
          label={t("editor.gpuCustomLabel")}
          maxLength={FIELD_LIMITS.SHORT_NAME}
          placeholder="NVIDIA GeForce RTX 3060 12GB"
          value={isOwnText ? normalized : ""}
          onChange={(e) => onChange(e.target.value)}
          autoComplete="off"
        />
      )}
    </div>
  );
}

/** CPU (and any other suggested text field): type freely or pick a suggestion. */
function SuggestedTextField({
  field,
  value,
  onChange,
}: {
  field: RigField;
  value: string;
  onChange: (next: string) => void;
}) {
  const { t } = useTranslation("ui");
  const listId = useId();
  return (
    <>
      <Input
        label={t(field.labelKey)}
        maxLength={FIELD_LIMITS.SHORT_NAME}
        placeholder={field.placeholder}
        value={value}
        list={listId}
        autoComplete="off"
        onChange={(e) => onChange(e.target.value)}
        // "Intel(R) Core(TM) i7-12700K CPU @ 3.60GHz", as Windows shows it,
        // becomes "Intel Core i7-12700K" once the user leaves the field.
        onBlur={(e) => {
          const cleaned = field.id === "cpu" ? cleanCpuName(e.target.value) : e.target.value.trim();
          if (cleaned !== e.target.value) onChange(cleaned);
        }}
      />
      <datalist id={listId}>
        {field.suggestions?.map((s) => (
          <option key={s} value={s} />
        ))}
      </datalist>
    </>
  );
}

export function RigEditor() {
  const { t } = useTranslation("ui");
  const rig = useEditorStore((s) => s.rig);
  const setNested = useEditorStore((s) => s.setNested);

  const renderValidationBadge = (issue: RigValidationIssue | null) => {
    if (!issue) return null;
    return (
      <div className="text-warning flex items-center gap-1 text-xs">
        <AlertTriangle className="size-3" aria-hidden="true" />
        <span>{t(issue.messageKey)}</span>
      </div>
    );
  };

  const renderComposite = (field: RigField) => {
    if (!field.composite) return null;
    const composite = field.composite;
    const raw = rig[field.id] ?? "";
    const { parts: storedParts } = parseCompositeValue(raw);
    const issue = validateCompositeField(field.id, raw);
    const partValues = composite.parts.map((_p, i) => storedParts[i] ?? "");

    // Cascading composites (OS) clear the parts after the one that changed,
    // so switching Windows → macOS can't leave "Pro" behind. Independent
    // ones (RAM) keep them: picking 32 GB must not wipe the DDR5 already set.
    const setPart = (index: number, next: string) => {
      const updated = [...partValues];
      updated[index] = next;
      if (composite.cascade) {
        for (let j = index + 1; j < updated.length; j++) updated[j] = "";
      }
      setNested("rig", field.id, joinComposite(updated));
    };

    const renderPart = (part: CompositePart, index: number, previous: readonly string[]) => {
      const stored = partValues[index] ?? "";
      const isCustom = part.allowCustom && stored.startsWith(CUSTOM_PREFIX);
      const customText = isCustom ? stored.slice(CUSTOM_PREFIX.length) : "";
      const selectValue = isCustom ? "custom" : stored;
      const options = resolveCompositeOptions(part.options, previous);
      const labelKey = resolveCompositeLabelKey(part, previous);

      return (
        <div key={part.id} className="flex flex-col gap-1.5">
          <Select
            label={t(labelKey)}
            value={selectValue}
            options={options}
            onChange={(next) =>
              setPart(index, next === "custom" && part.allowCustom ? CUSTOM_PREFIX : next)
            }
          />
          {isCustom && (
            <div className="flex items-center gap-2">
              <Input
                aria-label={t(labelKey)}
                placeholder={part.customPlaceholder}
                value={customText}
                inputMode="decimal"
                onChange={(e) => setPart(index, `${CUSTOM_PREFIX}${e.target.value}`)}
              />
              {part.customSuffix && (
                <span className="text-text-muted text-sm">{part.customSuffix.trim()}</span>
              )}
            </div>
          )}
        </div>
      );
    };

    // Walk parts in declaration order; each part's resolvers see the values
    // before it, so cascading option lists, dynamic labels and hidden-when
    // predicates line up.
    const previousValues: string[] = [];
    const renderedParts: React.ReactNode[] = [];
    composite.parts.forEach((part, index) => {
      const stored = partValues[index] ?? "";
      if (!part.hiddenWhen?.(previousValues)) {
        renderedParts.push(renderPart(part, index, [...previousValues]));
      }
      previousValues.push(stored);
    });

    return (
      <fieldset key={field.id} className="flex min-w-0 flex-col gap-2 sm:col-span-2">
        <legend className="text-text-secondary mb-1.5 text-xs font-medium">
          {t(field.labelKey)}
        </legend>
        <div className="grid gap-3 sm:grid-cols-3">{renderedParts}</div>
        {renderValidationBadge(issue)}
      </fieldset>
    );
  };

  const renderDropdownWithVersion = (field: RigField) => {
    const raw = rig[field.id] ?? "";
    const [value = "", version = ""] = raw.split("|");

    const commit = (nextValue: string, nextVersion: string) => {
      // Keep the stored form compact: drop the pipe when empty.
      const next = !nextValue && !nextVersion ? "" : `${nextValue}|${nextVersion}`;
      setNested("rig", field.id, next);
    };

    return (
      <div key={field.id} className="grid grid-cols-[1fr_8rem] gap-2 sm:col-span-2">
        <Select
          label={t(field.labelKey)}
          value={value}
          options={field.options ?? []}
          onChange={(v) => commit(v, version)}
        />
        <Input
          label={t("editor.version")}
          maxLength={FIELD_LIMITS.SHORT_NAME}
          placeholder={field.versionPlaceholder}
          value={version}
          onChange={(e) => commit(value, e.target.value)}
        />
      </div>
    );
  };

  return (
    // The section header ("My Rig") already names this block.
    <div className="flex flex-col gap-3">
      <div className="grid gap-3 sm:grid-cols-2">
        {RIG_FIELDS.map((field) => {
          const value = rig[field.id] ?? "";
          const set = (next: string) => setNested("rig", field.id, next);
          if (field.type === "gpu") {
            return (
              <GpuPicker key={field.id} label={t(field.labelKey)} value={value} onChange={set} />
            );
          }
          if (field.type === "composite_dropdown") return renderComposite(field);
          if (field.type === "dropdown_with_version") return renderDropdownWithVersion(field);
          if (field.suggestions) {
            return <SuggestedTextField key={field.id} field={field} value={value} onChange={set} />;
          }
          return (
            <Input
              key={field.id}
              label={t(field.labelKey)}
              maxLength={FIELD_LIMITS.SHORT_NAME}
              placeholder={field.placeholder}
              value={value}
              onChange={(e) => set(e.target.value)}
            />
          );
        })}
      </div>
    </div>
  );
}
