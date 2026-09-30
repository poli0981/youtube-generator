/**
 * GPU catalog for the My Rig editor.
 *
 * v1.0.0 rewrite. The rig used to store `"<brand>|<series>|<model>"` and
 * print `brand label + model` — so descriptions read "NVIDIA RTX 5080"
 * (no GeForce), "AMD RX 9070 XT" (no Radeon) and "Apple Silicon M4 Pro"
 * (not a product name), the picker showed three dropdowns ("NVIDIA -
 * RTX - 5080"), and the list carried cards that were never released.
 *
 * Now every model has a stable `id` and its official `name`, printed
 * verbatim. The rig stores `gpu:<id>`; anything else is the user's own
 * text. Never rename an id — saved drafts, profiles and templates point
 * at it. Removing a model is safe: its id simply stops resolving and the
 * value falls back to the text it was migrated from.
 *
 * Sources for what exists: the vendors' own product pages and
 * announcements (checked 2026-09-30). Deliberately absent: Radeon RX 9080
 * / RX 9090 XT and Arc B380 (rumours that never shipped), Arc B770
 * (cancelled), GeForce RTX 50 SUPER (announced but not on sale).
 */

export type GpuVendorId = "nvidia" | "amd" | "intel" | "apple" | "handheld";

export interface GpuModel {
  /** Stable id; the rig stores `gpu:<id>`. */
  readonly id: string;
  /** Official product name, printed as-is in descriptions. */
  readonly name: string;
  /** Extra words the picker's search matches (devices, codenames). */
  readonly keywords?: readonly string[];
  /** The v0.13–v0.38 model strings that mean this card (migration only). */
  readonly legacy?: readonly string[];
}

export interface GpuGroup {
  readonly id: string;
  readonly vendor: GpuVendorId;
  /** Heading in the picker, e.g. "GeForce RTX 50 Series". */
  readonly label: string;
  readonly models: readonly GpuModel[];
}

const slug = (text: string): string =>
  text
    .toLowerCase()
    .replace(/[()]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

/** `"RTX 5080"` → NVIDIA GeForce RTX 5080 (legacy string "RTX 5080"). */
const geforce = (short: string, legacy: readonly string[] = [short]): GpuModel => ({
  id: `nvidia-${slug(short)}`,
  name: `NVIDIA GeForce ${short}`,
  legacy,
});

/** TITAN cards past the GTX era are "NVIDIA TITAN …", not GeForce. */
const nvidia = (short: string, legacy: readonly string[] = [short]): GpuModel => ({
  id: `nvidia-${slug(short)}`,
  name: `NVIDIA ${short}`,
  legacy,
});

const radeon = (short: string, legacy: readonly string[] = [short]): GpuModel => ({
  id: `amd-${slug(short)}`,
  name: `AMD Radeon ${short}`,
  legacy,
});

const intel = (short: string, legacy: readonly string[] = [short]): GpuModel => ({
  id: `intel-${slug(short)}`,
  name: `Intel ${short}`,
  legacy,
});

const apple = (short: string): GpuModel => ({
  id: `apple-${slug(short)}`,
  name: `Apple ${short}`,
  legacy: [short],
});

export const GPU_GROUPS: readonly GpuGroup[] = [
  // ── NVIDIA ────────────────────────────────────────────────────────────
  {
    id: "rtx-50",
    vendor: "nvidia",
    label: "GeForce RTX 50 Series",
    models: [
      geforce("RTX 5090"),
      geforce("RTX 5080"),
      geforce("RTX 5070 Ti"),
      geforce("RTX 5070"),
      geforce("RTX 5060 Ti"),
      geforce("RTX 5060 Ti 16GB", []),
      geforce("RTX 5060 Ti 8GB", []),
      geforce("RTX 5060"),
      geforce("RTX 5050"),
    ],
  },
  {
    id: "rtx-50-laptop",
    vendor: "nvidia",
    label: "GeForce RTX 50 Series Laptop",
    models: [
      geforce("RTX 5090 Laptop GPU", []),
      geforce("RTX 5080 Laptop GPU", []),
      geforce("RTX 5070 Ti Laptop GPU", []),
      geforce("RTX 5070 Laptop GPU", []),
      geforce("RTX 5060 Laptop GPU", []),
      geforce("RTX 5050 Laptop GPU", []),
    ],
  },
  {
    id: "rtx-40",
    vendor: "nvidia",
    label: "GeForce RTX 40 Series",
    models: [
      geforce("RTX 4090"),
      geforce("RTX 4080 SUPER"),
      geforce("RTX 4080"),
      geforce("RTX 4070 Ti SUPER"),
      geforce("RTX 4070 Ti"),
      geforce("RTX 4070 SUPER"),
      geforce("RTX 4070"),
      geforce("RTX 4060 Ti"),
      geforce("RTX 4060 Ti 16GB", []),
      geforce("RTX 4060 Ti 8GB", []),
      geforce("RTX 4060"),
    ],
  },
  {
    id: "rtx-40-laptop",
    vendor: "nvidia",
    label: "GeForce RTX 40 Series Laptop",
    models: [
      geforce("RTX 4090 Laptop GPU", []),
      geforce("RTX 4080 Laptop GPU", []),
      geforce("RTX 4070 Laptop GPU", []),
      geforce("RTX 4060 Laptop GPU", []),
      geforce("RTX 4050 Laptop GPU", ["RTX 4050 (laptop)"]),
    ],
  },
  {
    id: "rtx-30",
    vendor: "nvidia",
    label: "GeForce RTX 30 Series",
    models: [
      geforce("RTX 3090 Ti"),
      geforce("RTX 3090"),
      geforce("RTX 3080 Ti"),
      geforce("RTX 3080 12GB"),
      geforce("RTX 3080"),
      geforce("RTX 3070 Ti"),
      geforce("RTX 3070"),
      geforce("RTX 3060 Ti"),
      geforce("RTX 3060"),
      geforce("RTX 3060 8GB", []),
      geforce("RTX 3050"),
      geforce("RTX 3050 6GB"),
    ],
  },
  {
    id: "rtx-30-laptop",
    vendor: "nvidia",
    label: "GeForce RTX 30 Series Laptop",
    models: [
      geforce("RTX 3080 Ti Laptop GPU", []),
      geforce("RTX 3080 Laptop GPU", []),
      geforce("RTX 3070 Ti Laptop GPU", []),
      geforce("RTX 3070 Laptop GPU", []),
      geforce("RTX 3060 Laptop GPU", []),
      geforce("RTX 3050 Ti Laptop GPU", []),
      geforce("RTX 3050 Laptop GPU", []),
    ],
  },
  {
    id: "rtx-20",
    vendor: "nvidia",
    label: "GeForce RTX 20 Series",
    models: [
      nvidia("TITAN RTX"),
      geforce("RTX 2080 Ti"),
      geforce("RTX 2080 SUPER"),
      geforce("RTX 2080"),
      geforce("RTX 2070 SUPER"),
      geforce("RTX 2070"),
      geforce("RTX 2060 SUPER"),
      geforce("RTX 2060"),
    ],
  },
  {
    id: "gtx-16",
    vendor: "nvidia",
    label: "GeForce GTX 16 Series",
    models: [
      geforce("GTX 1660 Ti"),
      geforce("GTX 1660 SUPER"),
      geforce("GTX 1660"),
      geforce("GTX 1650 SUPER"),
      geforce("GTX 1650"),
      geforce("GTX 1630"),
    ],
  },
  {
    id: "gtx-10",
    vendor: "nvidia",
    label: "GeForce GTX 10 Series",
    models: [
      nvidia("TITAN Xp"),
      nvidia("TITAN X (Pascal)", []),
      geforce("GTX 1080 Ti"),
      geforce("GTX 1080"),
      geforce("GTX 1070 Ti"),
      geforce("GTX 1070"),
      geforce("GTX 1060 6GB"),
      geforce("GTX 1060 3GB"),
      geforce("GTX 1050 Ti"),
      geforce("GTX 1050"),
    ],
  },
  {
    id: "gtx-900",
    vendor: "nvidia",
    label: "GeForce GTX 900 Series",
    models: [
      geforce("GTX TITAN X", ["TITAN X (Maxwell)"]),
      geforce("GTX 980 Ti"),
      geforce("GTX 980"),
      geforce("GTX 970"),
      geforce("GTX 960"),
      geforce("GTX 950"),
    ],
  },
  {
    id: "gtx-700",
    vendor: "nvidia",
    label: "GeForce GTX 700 Series",
    models: [
      geforce("GTX TITAN Black", ["TITAN Black"]),
      geforce("GTX 780 Ti"),
      geforce("GTX 780"),
      geforce("GTX 770"),
      geforce("GTX 760"),
      geforce("GTX 750 Ti"),
      geforce("GTX 750"),
    ],
  },

  // ── AMD ───────────────────────────────────────────────────────────────
  {
    id: "rx-9000",
    vendor: "amd",
    label: "Radeon RX 9000 Series",
    models: [
      radeon("RX 9070 XT"),
      radeon("RX 9070"),
      radeon("RX 9070 GRE", []),
      radeon("RX 9060 XT"),
      radeon("RX 9060 XT 16GB", []),
      radeon("RX 9060 XT 8GB", []),
      radeon("RX 9060"),
    ],
  },
  {
    id: "rx-7000",
    vendor: "amd",
    label: "Radeon RX 7000 Series",
    models: [
      radeon("RX 7900 XTX"),
      radeon("RX 7900 XT"),
      radeon("RX 7900 GRE"),
      radeon("RX 7800 XT"),
      radeon("RX 7700 XT"),
      radeon("RX 7650 GRE", []),
      radeon("RX 7600 XT"),
      radeon("RX 7600"),
    ],
  },
  {
    id: "rx-6000",
    vendor: "amd",
    label: "Radeon RX 6000 Series",
    models: [
      radeon("RX 6950 XT"),
      radeon("RX 6900 XT"),
      radeon("RX 6800 XT"),
      radeon("RX 6800"),
      radeon("RX 6750 XT"),
      radeon("RX 6700 XT"),
      radeon("RX 6700"),
      radeon("RX 6650 XT"),
      radeon("RX 6600 XT"),
      radeon("RX 6600"),
      radeon("RX 6500 XT"),
      radeon("RX 6400"),
    ],
  },
  {
    id: "rx-5000",
    vendor: "amd",
    label: "Radeon RX 5000 Series",
    models: [
      radeon("RX 5700 XT"),
      radeon("RX 5700"),
      radeon("RX 5600 XT"),
      radeon("RX 5600"),
      radeon("RX 5500 XT"),
      radeon("RX 5500"),
    ],
  },
  {
    id: "rx-vega",
    vendor: "amd",
    label: "Radeon VII / RX Vega",
    models: [radeon("VII", ["Radeon VII"]), radeon("RX Vega 64"), radeon("RX Vega 56")],
  },
  {
    id: "rx-500-400",
    vendor: "amd",
    label: "Radeon RX 500 / 400 Series",
    models: [
      radeon("RX 590"),
      radeon("RX 580"),
      radeon("RX 570"),
      radeon("RX 560"),
      radeon("RX 550"),
      radeon("RX 480"),
      radeon("RX 470"),
      radeon("RX 460"),
    ],
  },
  {
    id: "r9-r7",
    vendor: "amd",
    label: "Radeon R9 / R7 Series",
    models: [
      radeon("R9 Fury X"),
      radeon("R9 Fury"),
      radeon("R9 Nano"),
      radeon("R9 390X"),
      radeon("R9 390"),
      radeon("R9 380X"),
      radeon("R9 380"),
      radeon("R9 290X"),
      radeon("R9 290"),
      radeon("R9 280X"),
      radeon("R9 280"),
      radeon("R9 270X"),
      radeon("R9 270"),
      radeon("R7 370"),
      radeon("R7 360"),
      radeon("R7 260X"),
      radeon("R7 260"),
      radeon("R7 250"),
    ],
  },
  {
    id: "hd-7000",
    vendor: "amd",
    label: "Radeon HD 7000 Series",
    models: [
      radeon("HD 7970"),
      radeon("HD 7950"),
      radeon("HD 7870"),
      radeon("HD 7850"),
      radeon("HD 7770"),
      radeon("HD 7750"),
    ],
  },
  {
    id: "amd-integrated",
    vendor: "amd",
    label: "Radeon integrated graphics",
    models: [
      { ...radeon("8060S", []), keywords: ["Ryzen AI Max+ 395", "Strix Halo"] },
      { ...radeon("8050S", []), keywords: ["Ryzen AI Max 390", "Strix Halo"] },
      { ...radeon("890M", []), keywords: ["Ryzen AI 9 HX 370", "Strix Point"] },
      { ...radeon("880M", []), keywords: ["Ryzen AI 9 365", "Strix Point"] },
      { ...radeon("780M", []), keywords: ["Ryzen 7 7840U", "Ryzen 7 8840U", "Phoenix"] },
      { ...radeon("760M", []), keywords: ["Ryzen 5 7640U", "Phoenix"] },
      { ...radeon("680M", []), keywords: ["Ryzen 7 6800U", "Rembrandt"] },
    ],
  },

  // ── Intel ─────────────────────────────────────────────────────────────
  {
    id: "arc-b",
    vendor: "intel",
    label: "Intel Arc B-Series",
    models: [intel("Arc B580"), intel("Arc B570")],
  },
  {
    id: "arc-a",
    vendor: "intel",
    label: "Intel Arc A-Series",
    models: [
      intel("Arc A770"),
      intel("Arc A750"),
      intel("Arc A580"),
      intel("Arc A380"),
      intel("Arc A310"),
    ],
  },
  {
    id: "intel-integrated",
    vendor: "intel",
    label: "Intel integrated graphics",
    models: [
      { ...intel("Arc 140V", []), keywords: ["Core Ultra 7 258V", "Lunar Lake"] },
      { ...intel("Arc 130V", []), keywords: ["Core Ultra 5 226V", "Lunar Lake"] },
      { ...intel("Arc 140T", []), keywords: ["Core Ultra 9 285H", "Arrow Lake"] },
      { ...intel("Arc Graphics", []), keywords: ["Core Ultra 7 155H", "Meteor Lake"] },
      intel("Iris Xe Graphics", []),
      intel("UHD Graphics 770", []),
    ],
  },

  // ── Handheld PCs ──────────────────────────────────────────────────────
  {
    id: "handheld",
    vendor: "handheld",
    label: "Handheld PCs",
    models: [
      {
        id: "amd-ryzen-z2-extreme",
        name: "AMD Ryzen Z2 Extreme",
        keywords: ["ROG Xbox Ally X", "Legion Go 2"],
      },
      {
        id: "amd-ryzen-z1-extreme",
        name: "AMD Ryzen Z1 Extreme",
        keywords: ["ROG Ally", "Legion Go"],
      },
      { id: "amd-ryzen-z1", name: "AMD Ryzen Z1", keywords: ["ROG Ally"] },
      {
        id: "valve-steam-deck",
        name: "Steam Deck (AMD APU)",
        keywords: ["Valve", "SteamOS", "OLED", "LCD"],
      },
    ],
  },

  // ── Apple silicon ─────────────────────────────────────────────────────
  {
    id: "apple-m5",
    vendor: "apple",
    label: "Apple M5",
    models: [apple("M5"), apple("M5 Pro"), apple("M5 Max"), apple("M5 Ultra")],
  },
  {
    id: "apple-m4",
    vendor: "apple",
    label: "Apple M4",
    models: [apple("M4"), apple("M4 Pro"), apple("M4 Max")],
  },
  {
    id: "apple-m3",
    vendor: "apple",
    label: "Apple M3",
    models: [apple("M3"), apple("M3 Pro"), apple("M3 Max"), apple("M3 Ultra")],
  },
  {
    id: "apple-m2",
    vendor: "apple",
    label: "Apple M2",
    models: [apple("M2"), apple("M2 Pro"), apple("M2 Max"), apple("M2 Ultra")],
  },
  {
    id: "apple-m1",
    vendor: "apple",
    label: "Apple M1",
    models: [apple("M1"), apple("M1 Pro"), apple("M1 Max"), apple("M1 Ultra")],
  },
];

/** Prefix of a catalog value in the rig; anything else is the user's own text. */
export const GPU_VALUE_PREFIX = "gpu:";

const MODELS_BY_ID: ReadonlyMap<string, GpuModel> = new Map(
  GPU_GROUPS.flatMap((group) => group.models.map((model) => [model.id, model] as const)),
);

export function findGpuModel(id: string): GpuModel | undefined {
  return MODELS_BY_ID.get(id);
}

/** The rig value for a catalog model. */
export function gpuValue(model: Pick<GpuModel, "id">): string {
  return `${GPU_VALUE_PREFIX}${model.id}`;
}

/** The catalog model a rig value points at, if it is a catalog value. */
export function modelForGpuValue(value: string): GpuModel | undefined {
  return value.startsWith(GPU_VALUE_PREFIX)
    ? findGpuModel(value.slice(GPU_VALUE_PREFIX.length))
    : undefined;
}

/** Vendor ids of the v0.13 `brand|series|model` format. */
const LEGACY_BRAND_VENDOR: Readonly<Record<string, GpuVendorId>> = {
  nvidia: "nvidia",
  amd: "amd",
  intel: "intel",
  apple: "apple",
};

/**
 * How an unmatched legacy model reads once written out in full — the
 * pre-v1.0 description printed "AMD RX 9080"; the same text, named
 * properly, is kept as the user's own entry.
 */
function legacyFullName(brand: string, model: string): string {
  const m = model.trim();
  if (!m) return "";
  switch (brand) {
    case "nvidia":
      return /^(RTX|GTX)\b/i.test(m) ? `NVIDIA GeForce ${m}` : `NVIDIA ${m}`;
    case "amd":
      return /^radeon\b/i.test(m) ? `AMD ${m}` : `AMD Radeon ${m}`;
    case "intel":
      return `Intel ${m}`;
    case "apple":
      return `Apple ${m}`;
    default:
      return m;
  }
}

/**
 * Convert a stored GPU value to the current format:
 *
 * - `""` and `gpu:<id>` stay as they are;
 * - v0.13–v0.38 `brand|series|model` → `gpu:<id>` when the model is in the
 *   catalog, otherwise its full name as free text;
 * - `custom||<text>` → `<text>`;
 * - anything else is already free text and is kept verbatim.
 *
 * Idempotent, so it is safe to run on every import and migration.
 */
export function migrateGpuValue(raw: string): string {
  const value = raw.trim();
  if (!value || value.startsWith(GPU_VALUE_PREFIX) || !value.includes("|")) return value;

  const [brand = "", , model = ""] = value.split("|");
  if (brand === "custom") return model.trim();

  const vendor = LEGACY_BRAND_VENDOR[brand];
  if (vendor) {
    const needle = model.trim().toLowerCase();
    for (const group of GPU_GROUPS) {
      if (group.vendor !== vendor) continue;
      const match = group.models.find((m) =>
        (m.legacy ?? []).some((legacy) => legacy.toLowerCase() === needle),
      );
      if (match) return gpuValue(match);
    }
  }
  return legacyFullName(brand, model);
}

/** What the description prints for a stored GPU value. */
export function formatGpuValue(raw: string): string {
  const value = migrateGpuValue(raw);
  if (!value.startsWith(GPU_VALUE_PREFIX)) return value;
  return modelForGpuValue(value)?.name ?? "";
}
