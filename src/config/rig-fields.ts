import {
  GPU_CATALOG,
  GPU_CUSTOM_BRAND_ID,
  findGpuBrand,
  type GpuCatalog,
} from "./gpu-catalog";

/**
 * Supported rig field input types.
 *
 * - `text`: plain text input (existing behaviour).
 * - `dropdown_with_version`: a dropdown of preset options paired with a
 *   free-form version text input. The stored value is
 *   `"<option_value>|<version>"` so we don't break the flat
 *   `Partial<Record<string, string>>` rig shape in the editor store.
 * - `cascading_dropdown` (v0.13): three-level Brand → Series → Model
 *   dropdown for GPU. Stored as `"<brand>|<series>|<model>"`. When
 *   brand = `"custom"`, the UI swaps to a single free-text input and
 *   stores `"custom||<freeText>"` (the model is the verbatim text the
 *   user typed). Pre-v0.13 free-text values lack pipes — they pass
 *   through `formatRigValue` unchanged so old profiles render the same
 *   string they did before.
 * - `composite_dropdown` (v0.13): two-or-more dropdowns combined into
 *   one logical field. Used by RAM (size + DDR generation). Each part
 *   may opt into a free-text "Custom" override; the stored format is
 *   pipe-delimited in the order parts are declared.
 */
type RigFieldType =
  | "text"
  | "dropdown_with_version"
  | "cascading_dropdown"
  | "composite_dropdown";

interface RigFieldOption {
  readonly value: string;
  /** Display label (not translated — software names are brand-preserved). */
  readonly label: string;
}

export interface CompositePart {
  /** Stable id, used to assemble the storage tuple in declaration order. */
  readonly id: string;
  readonly labelKey: string;
  readonly options: readonly RigFieldOption[];
  /** When true, the part renders an extra free-text input when value === `"custom"`. */
  readonly allowCustom?: boolean;
  /** Suffix shown after the custom numeric input (e.g. " GB"). */
  readonly customSuffix?: string;
  /** Optional placeholder for the custom input. */
  readonly customPlaceholder?: string;
}

interface CompositeFieldSpec {
  readonly parts: readonly CompositePart[];
  /**
   * Format the stored parts into the description-output string. Receives
   * resolved labels (not raw ids) — for `custom` parts the resolved value
   * is the free-text the user typed.
   */
  readonly format: (resolvedParts: readonly string[]) => string;
}

export interface RigField {
  readonly id: string;
  readonly labelKey: string;
  readonly type: RigFieldType;
  readonly placeholder?: string;
  readonly options?: readonly RigFieldOption[];
  readonly versionPlaceholder?: string;
  /** Set when {@link type} is `"cascading_dropdown"`. */
  readonly catalog?: GpuCatalog;
  /** Set when {@link type} is `"composite_dropdown"`. */
  readonly composite?: CompositeFieldSpec;
}

/**
 * Dropdown options for the video editing software field.
 *
 * Order loosely reflects popularity among no-commentary gameplay
 * creators. Add new entries here — the UI picks them up automatically.
 */
const VIDEO_EDITOR_OPTIONS: readonly RigFieldOption[] = [
  { value: "", label: "—" },
  { value: "davinci_resolve", label: "DaVinci Resolve" },
  { value: "davinci_resolve_studio", label: "DaVinci Resolve Studio" },
  { value: "premiere", label: "Adobe Premiere Pro" },
  { value: "after_effects", label: "Adobe After Effects" },
  { value: "capcut", label: "CapCut" },
  { value: "vegas", label: "Vegas Pro" },
  { value: "final_cut", label: "Final Cut Pro" },
  { value: "kdenlive", label: "Kdenlive" },
  { value: "shotcut", label: "Shotcut" },
  { value: "filmora", label: "Wondershare Filmora" },
  { value: "other", label: "Other" },
];

/** RAM size options in GB. `custom` opens a numeric free-text input. */
const RAM_SIZE_OPTIONS: readonly RigFieldOption[] = [
  { value: "", label: "—" },
  { value: "4", label: "4 GB" },
  { value: "6", label: "6 GB" },
  { value: "8", label: "8 GB" },
  { value: "12", label: "12 GB" },
  { value: "16", label: "16 GB" },
  { value: "32", label: "32 GB" },
  { value: "64", label: "64 GB" },
  { value: "96", label: "96 GB" },
  { value: "128", label: "128 GB" },
  { value: "256", label: "256 GB" },
  { value: "custom", label: "Custom…" },
];

/** DDR generation. DDR1 stays in the list for legacy gear; users with
 *  unusual rigs (DDR6/DDR7) can pick early-spec options. */
const RAM_DDR_OPTIONS: readonly RigFieldOption[] = [
  { value: "", label: "—" },
  { value: "DDR1", label: "DDR1" },
  { value: "DDR2", label: "DDR2" },
  { value: "DDR3", label: "DDR3" },
  { value: "DDR4", label: "DDR4" },
  { value: "DDR5", label: "DDR5" },
  { value: "DDR6", label: "DDR6" },
  { value: "DDR7", label: "DDR7" },
];

const RAM_COMPOSITE: CompositeFieldSpec = {
  parts: [
    {
      id: "size",
      labelKey: "editor.ram_size",
      options: RAM_SIZE_OPTIONS,
      allowCustom: true,
      customSuffix: " GB",
      customPlaceholder: "48",
    },
    {
      id: "ddr",
      labelKey: "editor.ram_ddr",
      options: RAM_DDR_OPTIONS,
    },
  ],
  format: ([size = "", ddr = ""]) => {
    if (!size && !ddr) return "";
    if (!size) return ddr;
    if (!ddr) return size;
    return `${size} ${ddr}`;
  },
};

/**
 * OS composite (v0.22.0). Three dropdowns combined into one logical
 * field — OS name → version → edition. Stored pipe-delimited as
 * `"windows|11|pro"` → renders as `"Windows 11 Pro"`. Edition is
 * optional, so `"windows|11|"` → `"Windows 11"`. Only Windows 10/11 is
 * surfaced for now; macOS / Linux can be added later by extending the
 * option arrays without changing storage or format logic.
 */
const OS_NAME_OPTIONS: readonly RigFieldOption[] = [
  { value: "", label: "—" },
  { value: "windows", label: "Windows" },
];

const OS_VERSION_OPTIONS: readonly RigFieldOption[] = [
  { value: "", label: "—" },
  { value: "10", label: "10" },
  { value: "11", label: "11" },
];

const OS_EDITION_OPTIONS: readonly RigFieldOption[] = [
  { value: "", label: "—" },
  { value: "home", label: "Home" },
  { value: "pro", label: "Pro" },
  { value: "enterprise", label: "Enterprise" },
  { value: "education", label: "Education" },
  { value: "iot", label: "IoT Enterprise" },
];

const OS_COMPOSITE: CompositeFieldSpec = {
  parts: [
    { id: "name", labelKey: "editor.os_name", options: OS_NAME_OPTIONS },
    { id: "version", labelKey: "editor.os_version", options: OS_VERSION_OPTIONS },
    { id: "edition", labelKey: "editor.os_edition", options: OS_EDITION_OPTIONS },
  ],
  format: (parts) => parts.filter((p) => p.trim() !== "").join(" "),
};

export const RIG_FIELDS: readonly RigField[] = [
  { id: "os", labelKey: "rig.os", type: "composite_dropdown", composite: OS_COMPOSITE },
  { id: "cpu", labelKey: "rig.cpu", type: "text", placeholder: "Intel i9-14900K / AMD Ryzen 9 7950X" },
  {
    id: "gpu",
    labelKey: "rig.gpu",
    type: "cascading_dropdown",
    catalog: GPU_CATALOG,
  },
  {
    id: "ram",
    labelKey: "rig.ram",
    type: "composite_dropdown",
    composite: RAM_COMPOSITE,
  },
  { id: "storage", labelKey: "rig.storage", type: "text", placeholder: "2TB Samsung 990 PRO NVMe" },
  { id: "monitor", labelKey: "rig.monitor", type: "text", placeholder: "LG 27GP950 27\" 4K 144Hz" },
  { id: "capture", labelKey: "rig.capture", type: "text", placeholder: "OBS Studio 30.x" },
  { id: "motherboard", labelKey: "rig.motherboard", type: "text", placeholder: "ASUS ROG Maximus Z790 Hero" },
  { id: "controller", labelKey: "rig.controller", type: "text", placeholder: "DualSense / Xbox Elite Series 2" },
  {
    id: "video_editor",
    labelKey: "rig.video_editor",
    type: "dropdown_with_version",
    options: VIDEO_EDITOR_OPTIONS,
    versionPlaceholder: "19.1 / 2024 / v5.0",
  },
];

/**
 * Parse a cascading-dropdown stored value into its three segments.
 * Empty segments stay as empty strings. Pipeless legacy values are
 * returned as `["", "", raw]` so the caller can render them under the
 * Custom brand without losing the original text.
 */
export function parseCascadingValue(raw: string): {
  brand: string;
  series: string;
  model: string;
  isLegacy: boolean;
} {
  if (!raw) return { brand: "", series: "", model: "", isLegacy: false };
  if (!raw.includes("|")) {
    // Pre-v0.13 free-text. Treat as Custom + verbatim model.
    return { brand: GPU_CUSTOM_BRAND_ID, series: "", model: raw, isLegacy: true };
  }
  const [brand = "", series = "", model = ""] = raw.split("|");
  return { brand, series, model, isLegacy: false };
}

/**
 * Parse a composite-dropdown stored value into its segments. The order
 * matches the parts declared on the field's {@link CompositeFieldSpec}.
 * Pipeless legacy values are returned as a single-element tuple so the
 * caller can render them as a fallback string.
 */
export function parseCompositeValue(raw: string): {
  parts: readonly string[];
  isLegacy: boolean;
} {
  if (!raw) return { parts: [], isLegacy: false };
  if (!raw.includes("|")) return { parts: [raw], isLegacy: true };
  return { parts: raw.split("|"), isLegacy: false };
}

/**
 * Format a stored rig value for display in the description output.
 *
 * - `dropdown_with_version` ("davinci_resolve_studio|19.1") →
 *   `"DaVinci Resolve Studio 19.1"`.
 * - `cascading_dropdown` ("nvidia|rtx_40|RTX 4090") →
 *   `"NVIDIA RTX 4090"` (series label dropped — the model string is
 *   already verbose enough). Custom brand returns the verbatim model.
 *   Legacy pipeless values pass through unchanged.
 * - `composite_dropdown` ("16|DDR5", "custom:48|DDR5") →
 *   `"16 GB DDR5"` / `"48 GB DDR5"` via the field's
 *   {@link CompositeFieldSpec.format}.
 * - All other field types pass the raw value through.
 */
export function formatRigValue(fieldId: string, raw: string): string {
  const field = RIG_FIELDS.find((f) => f.id === fieldId);
  if (!field) return raw;

  if (field.type === "dropdown_with_version") {
    const [value = "", version = ""] = raw.split("|");
    const trimmedVersion = version.trim();
    if (!value && !trimmedVersion) return "";

    let label = "";
    if (value) {
      const option = field.options?.find((o) => o.value === value);
      label = option?.label ?? value;
    }

    if (!label) return trimmedVersion;
    return trimmedVersion ? `${label} ${trimmedVersion}` : label;
  }

  if (field.type === "cascading_dropdown") {
    const { brand, model, isLegacy } = parseCascadingValue(raw);
    if (isLegacy) return raw;
    if (!brand && !model) return "";
    if (brand === GPU_CUSTOM_BRAND_ID) return model.trim();
    const brandLabel = findGpuBrand(brand)?.label ?? brand;
    if (!model.trim()) return brandLabel;
    return `${brandLabel} ${model.trim()}`;
  }

  if (field.type === "composite_dropdown" && field.composite) {
    const { parts, isLegacy } = parseCompositeValue(raw);
    if (isLegacy) return raw;
    if (parts.length === 0) return "";

    // Resolve each declared part. `custom:<value>` segments collapse to
    // the free-text payload (without the `custom:` prefix).
    const resolved = field.composite.parts.map((spec, i) => {
      const stored = (parts[i] ?? "").trim();
      if (!stored) return "";
      if (spec.allowCustom && stored.startsWith("custom:")) {
        const txt = stored.slice("custom:".length).trim();
        return txt ? `${txt}${spec.customSuffix ?? ""}` : "";
      }
      const opt = spec.options.find((o) => o.value === stored);
      return opt?.label ?? stored;
    });

    return field.composite.format(resolved);
  }

  return raw;
}
