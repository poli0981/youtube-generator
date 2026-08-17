import { useTranslation } from "react-i18next";
import { AlertTriangle } from "lucide-react";
import { Input } from "@components/ui/Input";
import { Select } from "@components/ui/Select";
import {
  RIG_FIELDS,
  parseCascadingValue,
  parseCompositeValue,
  resolveCompositeOptions,
  resolveCompositeLabelKey,
  type RigField,
  type CompositePart,
} from "@config/rig-fields";
import { GPU_CUSTOM_BRAND_ID, findGpuBrand } from "@config/gpu-catalog";
import { useEditorStore } from "@store/editor-store";
import { FIELD_LIMITS } from "@config/field-limits";
import {
  validateGpuValue,
  validateCompositeField,
  type RigValidationIssue,
} from "@utils/rig-validation";

const CUSTOM_PREFIX = "custom:";

function joinCascading(brand: string, series: string, model: string): string {
  if (!brand && !series && !model) return "";
  return `${brand}|${series}|${model}`;
}

function joinComposite(parts: readonly string[]): string {
  if (parts.every((p) => !p)) return "";
  return parts.join("|");
}

export function RigEditor() {
  const { t } = useTranslation("ui");
  const rig = useEditorStore((s) => s.rig);
  const setNested = useEditorStore((s) => s.setNested);

  const renderValidationBadge = (issue: RigValidationIssue | null) => {
    if (!issue) return null;
    return (
      <div className="text-warning flex items-center gap-1 text-xs">
        <AlertTriangle className="h-3 w-3" />
        <span>{t(issue.messageKey)}</span>
      </div>
    );
  };

  const renderCascading = (field: RigField) => {
    const raw = rig[field.id] ?? "";
    const { brand, series, model } = parseCascadingValue(raw);
    const isCustom = brand === GPU_CUSTOM_BRAND_ID;
    const issue = validateGpuValue(raw);
    const catalog = field.catalog ?? [];

    const brandOptions = [
      { value: "", label: "—" },
      ...catalog.map((b) => ({ value: b.id, label: b.label })),
    ];
    const currentBrand = findGpuBrand(brand);
    const seriesOptions = currentBrand
      ? [
          { value: "", label: "—" },
          ...currentBrand.series.map((s) => ({ value: s.id, label: s.label })),
        ]
      : [{ value: "", label: "—" }];
    const currentSeries = currentBrand?.series.find((s) => s.id === series);
    const modelOptions = currentSeries
      ? [{ value: "", label: "—" }, ...currentSeries.models.map((m) => ({ value: m, label: m }))]
      : [{ value: "", label: "—" }];

    const setBrand = (next: string) => {
      // Switching brand resets series + model so the user can't end up
      // with mismatched cascading values (NVIDIA brand + AMD series).
      setNested("rig", field.id, next ? joinCascading(next, "", "") : "");
    };
    const setSeries = (next: string) => {
      setNested("rig", field.id, joinCascading(brand, next, ""));
    };
    const setModel = (next: string) => {
      setNested("rig", field.id, joinCascading(brand, series, next));
    };
    const setCustomText = (text: string) => {
      setNested("rig", field.id, text ? joinCascading(GPU_CUSTOM_BRAND_ID, "", text) : "");
    };

    return (
      <div key={field.id} className="col-span-2 flex flex-col gap-2">
        <span className="text-text-secondary text-sm font-medium">{t(field.labelKey)}</span>
        <div className="grid grid-cols-3 gap-2">
          <Select
            label={t("editor.gpu_brand")}
            value={brand}
            options={brandOptions}
            onChange={setBrand}
          />
          {isCustom ? (
            <div className="col-span-2">
              <Input
                label={t("editor.gpu_custom")}
                maxLength={FIELD_LIMITS.SHORT_NAME}
                placeholder="e.g. RTX 4090 (custom OC)"
                value={model}
                onChange={(e) => setCustomText(e.target.value)}
              />
            </div>
          ) : (
            <>
              <Select
                label={t("editor.gpu_series")}
                value={series}
                options={seriesOptions}
                onChange={setSeries}
                disabled={!brand}
              />
              <Select
                label={t("editor.gpu_model")}
                value={model}
                options={modelOptions}
                onChange={setModel}
                disabled={!series}
              />
            </>
          )}
        </div>
        {renderValidationBadge(issue)}
      </div>
    );
  };

  const renderComposite = (field: RigField) => {
    if (!field.composite) return null;
    const raw = rig[field.id] ?? "";
    const { parts: storedParts } = parseCompositeValue(raw);
    // Validate per field — only RAM has size/DDR semantics. Running the
    // RAM validator on the OS composite mis-fired "Pick a DDR generation."
    const issue = validateCompositeField(field.id, raw);
    const partValues = field.composite.parts.map((_p, i) => storedParts[i] ?? "");

    // v0.23.0: setting a part also resets all downstream parts to "" so
    // a cascading parent change can't leave the form with a stale child
    // value that no longer exists in the new option list (e.g. switching
    // OS name from Windows to macOS clears any leftover "11" / "Pro").
    const setPart = (index: number, next: string) => {
      const updated = [...partValues];
      updated[index] = next;
      for (let j = index + 1; j < updated.length; j++) {
        updated[j] = "";
      }
      setNested("rig", field.id, joinComposite(updated));
    };

    // Walk parts in declaration order; each part's resolvers see the
    // previously-rendered values so cascading option lists / dynamic
    // labels / hidden-when predicates work cleanly.
    const previousValues: string[] = [];
    const renderedParts: React.ReactNode[] = [];

    field.composite.parts.forEach((part, index) => {
      const stored = partValues[index] ?? "";
      // hiddenWhen short-circuits BEFORE we render — and we still push
      // the stored value into previousValues so a later visible part
      // sees the full history (though in practice, parts after a
      // hidden one are rare).
      if (part.hiddenWhen?.(previousValues)) {
        previousValues.push(stored);
        return;
      }
      renderedParts.push(renderPart(part, index, previousValues, setPart));
      previousValues.push(stored);
    });

    return (
      <div key={field.id} className="col-span-2 flex flex-col gap-2">
        <span className="text-text-secondary text-sm font-medium">{t(field.labelKey)}</span>
        <div className="grid grid-cols-2 gap-2">{renderedParts}</div>
        {renderValidationBadge(issue)}
      </div>
    );

    // Inner closure — needs access to `t`, `partValues`, and the part-
    // local mutators. Defined as a function so the forEach above stays
    // readable; not hoisted out because it captures lexical state.
    function renderPart(
      part: CompositePart,
      index: number,
      previousValues: readonly string[],
      setPart: (index: number, next: string) => void,
    ) {
      const stored = partValues[index] ?? "";
      const isCustom = part.allowCustom && stored.startsWith(CUSTOM_PREFIX);
      const customText = isCustom ? stored.slice(CUSTOM_PREFIX.length) : "";
      const selectValue = isCustom ? "custom" : stored;
      const options = resolveCompositeOptions(part.options, previousValues);
      const labelKey = resolveCompositeLabelKey(part, previousValues);

      const onSelectChange = (next: string) => {
        if (next === "custom" && part.allowCustom) {
          setPart(index, `${CUSTOM_PREFIX}`);
        } else {
          setPart(index, next);
        }
      };
      const onCustomChange = (next: string) => {
        setPart(index, `${CUSTOM_PREFIX}${next}`);
      };

      return (
        <div key={part.id} className="flex flex-col gap-1">
          <Select
            label={t(labelKey)}
            value={selectValue}
            options={options}
            onChange={onSelectChange}
          />
          {isCustom && part.allowCustom && (
            <div className="flex items-center gap-2">
              <Input
                placeholder={part.customPlaceholder}
                value={customText}
                inputMode="numeric"
                onChange={(e) => onCustomChange(e.target.value)}
              />
              {part.customSuffix && (
                <span className="text-text-muted text-sm">{part.customSuffix.trim()}</span>
              )}
            </div>
          )}
        </div>
      );
    }
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
      <div key={field.id} className="col-span-2 grid grid-cols-[1fr_auto] gap-2">
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
    <div className="flex flex-col gap-3">
      <span className="text-text-secondary text-sm font-medium">{t("editor.rig")}</span>
      <div className="grid grid-cols-2 gap-2">
        {RIG_FIELDS.map((field) => {
          if (field.type === "cascading_dropdown") return renderCascading(field);
          if (field.type === "composite_dropdown") return renderComposite(field);
          if (field.type === "dropdown_with_version") return renderDropdownWithVersion(field);
          return (
            <Input
              key={field.id}
              label={t(field.labelKey)}
              maxLength={FIELD_LIMITS.SHORT_NAME}
              placeholder={field.placeholder}
              value={rig[field.id] ?? ""}
              onChange={(e) => setNested("rig", field.id, e.target.value)}
            />
          );
        })}
      </div>
    </div>
  );
}
