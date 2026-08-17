import { GPU_CATALOG, GPU_CUSTOM_BRAND_ID, findGpuBrand, type GpuCatalog } from "./gpu-catalog";

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
type RigFieldType = "text" | "dropdown_with_version" | "cascading_dropdown" | "composite_dropdown";

interface RigFieldOption {
  readonly value: string;
  /** Display label (not translated — software names are brand-preserved). */
  readonly label: string;
}

/**
 * v0.23.0: a composite part's options can now either be a static array
 * (the original RAM-style shape) OR a function that resolves the option
 * list based on previously-selected parts (the OS cascading shape, where
 * version-or-distro depends on OS name and the third slot depends on
 * both). Existing static-array call sites continue to work unchanged.
 */
type RigFieldOptionResolver =
  | readonly RigFieldOption[]
  | ((previousParts: readonly string[]) => readonly RigFieldOption[]);

export interface CompositePart {
  /** Stable id, used to assemble the storage tuple in declaration order. */
  readonly id: string;
  readonly labelKey: string;
  readonly options: RigFieldOptionResolver;
  /** When true, the part renders an extra free-text input when value === `"custom"`. */
  readonly allowCustom?: boolean;
  /** Suffix shown after the custom numeric input (e.g. " GB"). */
  readonly customSuffix?: string;
  /** Optional placeholder for the custom input. */
  readonly customPlaceholder?: string;
  /**
   * v0.23.0: dynamic label key override. Lets a single part show
   * "Distro" when OS = Linux but "Version" when OS = Windows / macOS.
   * Receives previously-selected parts; returns an i18n key.
   */
  readonly labelKeyResolver?: (previousParts: readonly string[]) => string;
  /**
   * v0.23.0: hide this part entirely when the resolver returns `true`
   * (e.g. macOS has no Edition slot). `formatRigValue` also skips the
   * hidden part so it doesn't leak an empty token into the joined
   * output, and the editor doesn't render the dropdown.
   */
  readonly hiddenWhen?: (previousParts: readonly string[]) => boolean;
}

/**
 * Helper for {@link CompositePart.options} — call sites get a plain
 * `RigFieldOption[]` whether the part declares a static array or a
 * function-of-previous-parts resolver. Pure; exported for {@link RigEditor}.
 */
export function resolveCompositeOptions(
  opts: RigFieldOptionResolver,
  previousParts: readonly string[],
): readonly RigFieldOption[] {
  return typeof opts === "function" ? opts(previousParts) : opts;
}

/**
 * Helper for {@link CompositePart.labelKey} / {@link CompositePart.labelKeyResolver}.
 * Returns the dynamic label when present, falling back to the static
 * key on the part. Pure; exported for {@link RigEditor}.
 */
export function resolveCompositeLabelKey(
  part: CompositePart,
  previousParts: readonly string[],
): string {
  return part.labelKeyResolver?.(previousParts) ?? part.labelKey;
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
 * OS composite (v0.22.0, extended v0.23.0). Three dropdowns combined
 * into one logical field. The slot semantics now adapt to the chosen
 * OS family:
 *
 * - Windows: name → version (10/11) → edition (Home/Pro/…)
 * - macOS: name → version (10/11/12/13/14/15/26) → (hidden — Apple has no editions)
 * - Linux: name → distro (Ubuntu/Fedora/…) → version (per-distro)
 *
 * Stored pipe-delimited; format function joins all non-empty parts
 * with single spaces. v0.22.0 stored values like `"windows|11|pro"`
 * round-trip unchanged through the new resolver because the static
 * Windows path remains the default for `name === "windows"`.
 */
const OS_NAME_OPTIONS: readonly RigFieldOption[] = [
  { value: "", label: "—" },
  { value: "windows", label: "Windows" },
  { value: "macos", label: "macOS" },
  { value: "linux", label: "Linux" },
];

const WINDOWS_VERSION_OPTIONS: readonly RigFieldOption[] = [
  { value: "", label: "—" },
  { value: "10", label: "10" },
  { value: "11", label: "11" },
];

/**
 * macOS major versions. Apple jumped from 15 (Sequoia, 2024) to 26
 * (Tahoe, 2025) to year-align the marketing number, so the list is
 * intentionally non-contiguous.
 */
const MACOS_VERSION_OPTIONS: readonly RigFieldOption[] = [
  { value: "", label: "—" },
  { value: "10", label: "10 (Mojave era)" },
  { value: "11 Big Sur", label: "11 Big Sur" },
  { value: "12 Monterey", label: "12 Monterey" },
  { value: "13 Ventura", label: "13 Ventura" },
  { value: "14 Sonoma", label: "14 Sonoma" },
  { value: "15 Sequoia", label: "15 Sequoia" },
  { value: "26 Tahoe", label: "26 Tahoe" },
];

/** Linux distros gameplay creators actually use via Proton. */
const LINUX_DISTRO_OPTIONS: readonly RigFieldOption[] = [
  { value: "", label: "—" },
  { value: "ubuntu", label: "Ubuntu" },
  { value: "fedora", label: "Fedora" },
  { value: "debian", label: "Debian" },
  { value: "arch", label: "Arch" },
  { value: "manjaro", label: "Manjaro" },
  { value: "popos", label: "Pop!_OS" },
  { value: "mint", label: "Linux Mint" },
];

/**
 * Per-distro version lists. The map key matches the distro id from
 * {@link LINUX_DISTRO_OPTIONS}; values are stored verbatim (e.g. the
 * stored Ubuntu version is "22.04 LTS"). Rolling distros surface a
 * single "rolling" / "latest" placeholder so the dropdown isn't empty.
 */
const LINUX_VERSION_BY_DISTRO: Record<string, readonly RigFieldOption[]> = {
  ubuntu: [
    { value: "", label: "—" },
    { value: "20.04 LTS", label: "20.04 LTS" },
    { value: "22.04 LTS", label: "22.04 LTS" },
    { value: "24.04 LTS", label: "24.04 LTS" },
    { value: "26.04 LTS", label: "26.04 LTS" },
  ],
  fedora: [
    { value: "", label: "—" },
    { value: "40", label: "40" },
    { value: "41", label: "41" },
    { value: "42", label: "42" },
  ],
  debian: [
    { value: "", label: "—" },
    { value: "12 Bookworm", label: "12 Bookworm" },
    { value: "13 Trixie", label: "13 Trixie" },
  ],
  arch: [
    { value: "", label: "—" },
    { value: "rolling", label: "rolling" },
  ],
  manjaro: [
    { value: "", label: "—" },
    { value: "latest", label: "latest stable" },
  ],
  popos: [
    { value: "", label: "—" },
    { value: "22.04 LTS", label: "22.04 LTS" },
    { value: "24.04 LTS", label: "24.04 LTS" },
  ],
  mint: [
    { value: "", label: "—" },
    { value: "21", label: "21" },
    { value: "22", label: "22" },
  ],
};

const OS_EDITION_OPTIONS: readonly RigFieldOption[] = [
  { value: "", label: "—" },
  { value: "home", label: "Home" },
  { value: "pro", label: "Pro" },
  { value: "enterprise", label: "Enterprise" },
  { value: "education", label: "Education" },
  { value: "iot", label: "IoT Enterprise" },
];

const EMPTY_OPTIONS: readonly RigFieldOption[] = [{ value: "", label: "—" }];

const OS_COMPOSITE: CompositeFieldSpec = {
  parts: [
    { id: "name", labelKey: "editor.os_name", options: OS_NAME_OPTIONS },
    {
      // Slot 2: Windows/macOS use this as "Version", Linux re-purposes it
      // as "Distro". The labelKeyResolver swaps the label so the editor
      // form reads naturally for each OS family.
      id: "version_or_distro",
      labelKey: "editor.os_version",
      labelKeyResolver: ([name = ""]) =>
        name === "linux" ? "editor.os_distro" : "editor.os_version",
      options: ([name = ""]) => {
        if (name === "windows") return WINDOWS_VERSION_OPTIONS;
        if (name === "macos") return MACOS_VERSION_OPTIONS;
        if (name === "linux") return LINUX_DISTRO_OPTIONS;
        return EMPTY_OPTIONS;
      },
    },
    {
      // Slot 3: Windows uses "Edition"; Linux re-purposes it as "Version"
      // (per-distro). macOS doesn't have a third slot at all — hidden.
      id: "edition_or_linux_version",
      labelKey: "editor.os_edition",
      labelKeyResolver: ([name = ""]) =>
        name === "linux" ? "editor.os_version" : "editor.os_edition",
      hiddenWhen: ([name = ""]) => name === "macos",
      options: ([name = "", distro = ""]) => {
        if (name === "windows") return OS_EDITION_OPTIONS;
        if (name === "linux") return LINUX_VERSION_BY_DISTRO[distro] ?? EMPTY_OPTIONS;
        return EMPTY_OPTIONS;
      },
    },
  ],
  format: (parts) => parts.filter((p) => p.trim() !== "").join(" "),
};

export const RIG_FIELDS: readonly RigField[] = [
  { id: "os", labelKey: "rig.os", type: "composite_dropdown", composite: OS_COMPOSITE },
  {
    id: "cpu",
    labelKey: "rig.cpu",
    type: "text",
    placeholder: "Intel i9-14900K / AMD Ryzen 9 7950X",
  },
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
  { id: "monitor", labelKey: "rig.monitor", type: "text", placeholder: 'LG 27GP950 27" 4K 144Hz' },
  { id: "capture", labelKey: "rig.capture", type: "text", placeholder: "OBS Studio 30.x" },
  {
    id: "motherboard",
    labelKey: "rig.motherboard",
    type: "text",
    placeholder: "ASUS ROG Maximus Z790 Hero",
  },
  {
    id: "controller",
    labelKey: "rig.controller",
    type: "text",
    placeholder: "DualSense / Xbox Elite Series 2",
  },
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

    // Resolve each declared part. v0.23.0: parts may declare a dynamic
    // option resolver and/or a `hiddenWhen` predicate (used by the OS
    // composite where macOS has no third slot). We walk parts in order
    // so each resolver sees the previously-stored values, and we skip
    // hidden parts entirely so they don't leak an empty token into the
    // `composite.format` join. `custom:<value>` segments still collapse
    // to the free-text payload (without the `custom:` prefix).
    const previousStored: string[] = [];
    const resolved = field.composite.parts.map((spec, i) => {
      const stored = (parts[i] ?? "").trim();
      if (spec.hiddenWhen?.(previousStored)) {
        previousStored.push("");
        return "";
      }
      if (!stored) {
        previousStored.push("");
        return "";
      }
      if (spec.allowCustom && stored.startsWith("custom:")) {
        const txt = stored.slice("custom:".length).trim();
        previousStored.push(stored);
        return txt ? `${txt}${spec.customSuffix ?? ""}` : "";
      }
      const opts = resolveCompositeOptions(spec.options, previousStored);
      const opt = opts.find((o) => o.value === stored);
      previousStored.push(stored);
      return opt?.label ?? stored;
    });

    return field.composite.format(resolved);
  }

  return raw;
}
