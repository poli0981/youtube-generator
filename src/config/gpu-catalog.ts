/**
 * GPU catalog for the My Rig editor (v0.13). Three-level taxonomy:
 *
 *   Brand → Series → Model
 *
 * The cascading-dropdown UI in {@link RigEditor} stores the user's
 * choice as a pipe-delimited string `"<brandId>|<seriesId>|<model>"` so
 * the rig store stays a flat `Record<string, string>` (no schema
 * migration vs. v0.12). The third segment is the verbatim model display
 * string — it's stored as-is so we never need a reverse lookup table to
 * render the value back into the description output.
 *
 * Backward-compatibility: pre-v0.13 rigs persisted GPU as free-form text
 * (`"NVIDIA RTX 4090"`). Those values lack pipes, so `formatRigValue`
 * passes them through unchanged, and the editor renders them under the
 * `custom` brand for further editing.
 *
 * Scope: ambitious — covers the GPUs viewers commonly own in 2026,
 * which still includes 10+ years of legacy NVIDIA / AMD parts because
 * gameplay-no-commentary audiences run a wide spread of hardware ages.
 *
 * Apple Silicon is included for creators who edit on Mac and want their
 * rig listing to reflect that, even though Apple chips aren't really
 * "gaming GPUs" in the discrete-card sense.
 */

export interface GpuSeries {
  /** Stable id used in the storage tuple (`<brandId>|<seriesId>|<model>`). */
  readonly id: string;
  readonly label: string;
  /** Free-form display strings — stored verbatim as the model segment. */
  readonly models: readonly string[];
}

export interface GpuBrand {
  readonly id: string;
  readonly label: string;
  readonly series: readonly GpuSeries[];
}

export type GpuCatalog = readonly GpuBrand[];

const NVIDIA_SERIES: readonly GpuSeries[] = [
  {
    id: "rtx_50",
    label: "RTX 50 Series",
    models: ["RTX 5050", "RTX 5060", "RTX 5060 Ti", "RTX 5070", "RTX 5070 Ti", "RTX 5080", "RTX 5090"],
  },
  {
    id: "rtx_40",
    label: "RTX 40 Series",
    models: [
      "RTX 4050 (laptop)",
      "RTX 4060",
      "RTX 4060 Ti",
      "RTX 4070",
      "RTX 4070 SUPER",
      "RTX 4070 Ti",
      "RTX 4070 Ti SUPER",
      "RTX 4080",
      "RTX 4080 SUPER",
      "RTX 4090",
    ],
  },
  {
    id: "rtx_30",
    label: "RTX 30 Series",
    models: [
      "RTX 3050",
      "RTX 3050 6GB",
      "RTX 3060",
      "RTX 3060 Ti",
      "RTX 3070",
      "RTX 3070 Ti",
      "RTX 3080",
      "RTX 3080 12GB",
      "RTX 3080 Ti",
      "RTX 3090",
      "RTX 3090 Ti",
    ],
  },
  {
    id: "rtx_20",
    label: "RTX 20 Series",
    models: [
      "RTX 2060",
      "RTX 2060 SUPER",
      "RTX 2070",
      "RTX 2070 SUPER",
      "RTX 2080",
      "RTX 2080 SUPER",
      "RTX 2080 Ti",
      "TITAN RTX",
    ],
  },
  {
    id: "gtx_16",
    label: "GTX 16 Series",
    models: ["GTX 1630", "GTX 1650", "GTX 1650 SUPER", "GTX 1660", "GTX 1660 SUPER", "GTX 1660 Ti"],
  },
  {
    id: "gtx_10",
    label: "GTX 10 Series",
    models: [
      "GTX 1050",
      "GTX 1050 Ti",
      "GTX 1060 3GB",
      "GTX 1060 6GB",
      "GTX 1070",
      "GTX 1070 Ti",
      "GTX 1080",
      "GTX 1080 Ti",
      "TITAN Xp",
    ],
  },
  {
    id: "gtx_900",
    label: "GTX 900 Series",
    models: ["GTX 950", "GTX 960", "GTX 970", "GTX 980", "GTX 980 Ti", "TITAN X (Maxwell)"],
  },
  {
    id: "gtx_700",
    label: "GTX 700 Series",
    models: ["GTX 750", "GTX 750 Ti", "GTX 760", "GTX 770", "GTX 780", "GTX 780 Ti", "TITAN Black"],
  },
];

const AMD_SERIES: readonly GpuSeries[] = [
  {
    id: "rx_9000",
    label: "Radeon RX 9000",
    models: ["RX 9060", "RX 9060 XT", "RX 9070", "RX 9070 XT", "RX 9080", "RX 9090 XT"],
  },
  {
    id: "rx_7000",
    label: "Radeon RX 7000",
    models: [
      "RX 7600",
      "RX 7600 XT",
      "RX 7700 XT",
      "RX 7800 XT",
      "RX 7900 GRE",
      "RX 7900 XT",
      "RX 7900 XTX",
    ],
  },
  {
    id: "rx_6000",
    label: "Radeon RX 6000",
    models: [
      "RX 6400",
      "RX 6500 XT",
      "RX 6600",
      "RX 6600 XT",
      "RX 6650 XT",
      "RX 6700",
      "RX 6700 XT",
      "RX 6750 XT",
      "RX 6800",
      "RX 6800 XT",
      "RX 6900 XT",
      "RX 6950 XT",
    ],
  },
  {
    id: "rx_5000",
    label: "Radeon RX 5000",
    models: ["RX 5500", "RX 5500 XT", "RX 5600", "RX 5600 XT", "RX 5700", "RX 5700 XT"],
  },
  {
    id: "rx_vega",
    label: "Radeon RX Vega",
    models: ["RX Vega 56", "RX Vega 64", "Radeon VII"],
  },
  {
    id: "rx_500",
    label: "Radeon RX 500",
    models: ["RX 550", "RX 560", "RX 570", "RX 580", "RX 590"],
  },
  {
    id: "rx_400",
    label: "Radeon RX 400",
    models: ["RX 460", "RX 470", "RX 480"],
  },
  {
    id: "r9_300",
    label: "Radeon R7/R9 300",
    models: ["R7 360", "R7 370", "R9 380", "R9 380X", "R9 390", "R9 390X", "R9 Fury", "R9 Fury X", "R9 Nano"],
  },
  {
    id: "r9_200",
    label: "Radeon R7/R9 200",
    models: ["R7 250", "R7 260", "R7 260X", "R9 270", "R9 270X", "R9 280", "R9 280X", "R9 290", "R9 290X"],
  },
  {
    id: "hd_7000",
    label: "Radeon HD 7000",
    models: ["HD 7750", "HD 7770", "HD 7850", "HD 7870", "HD 7950", "HD 7970"],
  },
];

const INTEL_SERIES: readonly GpuSeries[] = [
  {
    id: "arc_b",
    label: "Arc B Series (Battlemage)",
    models: ["Arc B380", "Arc B570", "Arc B580"],
  },
  {
    id: "arc_a",
    label: "Arc A Series (Alchemist)",
    models: ["Arc A310", "Arc A380", "Arc A580", "Arc A750", "Arc A770"],
  },
];

const APPLE_SERIES: readonly GpuSeries[] = [
  {
    id: "m4",
    label: "Apple M4",
    models: ["M4", "M4 Pro", "M4 Max"],
  },
  {
    id: "m3",
    label: "Apple M3",
    models: ["M3", "M3 Pro", "M3 Max", "M3 Ultra"],
  },
  {
    id: "m2",
    label: "Apple M2",
    models: ["M2", "M2 Pro", "M2 Max", "M2 Ultra"],
  },
  {
    id: "m1",
    label: "Apple M1",
    models: ["M1", "M1 Pro", "M1 Max", "M1 Ultra"],
  },
];

export const GPU_CATALOG: GpuCatalog = [
  { id: "nvidia", label: "NVIDIA", series: NVIDIA_SERIES },
  { id: "amd", label: "AMD", series: AMD_SERIES },
  { id: "intel", label: "Intel", series: INTEL_SERIES },
  { id: "apple", label: "Apple Silicon", series: APPLE_SERIES },
  { id: "custom", label: "Custom", series: [] },
];

/** Stable signal that the user picked the free-text fallback. */
export const GPU_CUSTOM_BRAND_ID = "custom";

/**
 * Lookup a brand by id without throwing. Returns `undefined` for unknown
 * ids so callers can render a graceful fallback (legacy free-text values
 * round-trip without exploding).
 */
export function findGpuBrand(brandId: string): GpuBrand | undefined {
  return GPU_CATALOG.find((b) => b.id === brandId);
}

/**
 * Lookup a series within a known brand. Returns `undefined` for both
 * unknown brand and unknown series; the caller decides whether to clear
 * the downstream model selection or preserve it.
 */
export function findGpuSeries(brandId: string, seriesId: string): GpuSeries | undefined {
  return findGpuBrand(brandId)?.series.find((s) => s.id === seriesId);
}
