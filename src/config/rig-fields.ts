/**
 * Supported rig field input types.
 *
 * - `text`: plain text input (existing behaviour).
 * - `dropdown_with_version`: a dropdown of preset options paired with a
 *   free-form version text input. The stored value is
 *   `"<option_value>|<version>"` so we don't break the flat
 *   `Partial<Record<string, string>>` rig shape in the editor store.
 */
export type RigFieldType = "text" | "dropdown_with_version";

export interface RigFieldOption {
  readonly value: string;
  /** Display label (not translated — software names are brand-preserved). */
  readonly label: string;
}

export interface RigField {
  readonly id: string;
  readonly labelKey: string;
  readonly type: RigFieldType;
  readonly placeholder?: string;
  readonly options?: readonly RigFieldOption[];
  readonly versionPlaceholder?: string;
}

/**
 * Dropdown options for the video editing software field.
 *
 * Order loosely reflects popularity among no-commentary gameplay
 * creators. Add new entries here — the UI picks them up automatically.
 */
export const VIDEO_EDITOR_OPTIONS: readonly RigFieldOption[] = [
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

export const RIG_FIELDS: readonly RigField[] = [
  { id: "cpu", labelKey: "rig.cpu", type: "text", placeholder: "Intel i9-14900K / AMD Ryzen 9 7950X" },
  { id: "gpu", labelKey: "rig.gpu", type: "text", placeholder: "NVIDIA RTX 4090 / AMD RX 7900 XTX" },
  { id: "ram", labelKey: "rig.ram", type: "text", placeholder: "32GB DDR5-6000" },
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

export type RigFieldId = (typeof RIG_FIELDS)[number]["id"];

/**
 * Format a stored rig value for display in the description output.
 * For dropdown_with_version fields, this turns `"davinci_resolve_studio|19.1"`
 * into `"DaVinci Resolve Studio 19.1"`. Other values pass through.
 */
export function formatRigValue(fieldId: string, raw: string): string {
  const field = RIG_FIELDS.find((f) => f.id === fieldId);
  if (!field || field.type !== "dropdown_with_version") return raw;

  const [value = "", version = ""] = raw.split("|");
  const trimmedVersion = version.trim();
  if (!value && !trimmedVersion) return "";

  // The empty-value sentinel option renders as "—" in the dropdown but
  // should act as "no selection" in the output.
  let label = "";
  if (value) {
    const option = field.options?.find((o) => o.value === value);
    label = option?.label ?? value;
  }

  if (!label) return trimmedVersion;
  return trimmedVersion ? `${label} ${trimmedVersion}` : label;
}
