export const RIG_FIELDS = [
  { id: "cpu", labelKey: "rig.cpu", placeholder: "Intel i9-14900K / AMD Ryzen 9 7950X" },
  { id: "gpu", labelKey: "rig.gpu", placeholder: "NVIDIA RTX 4090 / AMD RX 7900 XTX" },
  { id: "ram", labelKey: "rig.ram", placeholder: "32GB DDR5-6000" },
  { id: "storage", labelKey: "rig.storage", placeholder: "2TB Samsung 990 PRO NVMe" },
  { id: "monitor", labelKey: "rig.monitor", placeholder: "LG 27GP950 27\" 4K 144Hz" },
  { id: "capture", labelKey: "rig.capture", placeholder: "OBS Studio 30.x" },
] as const;

export type RigFieldId = (typeof RIG_FIELDS)[number]["id"];
