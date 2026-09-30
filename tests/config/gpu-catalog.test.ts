import { describe, it, expect } from "vitest";
import {
  GPU_GROUPS,
  findGpuModel,
  formatGpuValue,
  gpuValue,
  migrateGpuValue,
  modelForGpuValue,
} from "@config/gpu-catalog";

const ALL = GPU_GROUPS.flatMap((g) => g.models);

describe("GPU catalog", () => {
  it("has unique ids and names", () => {
    expect(new Set(ALL.map((m) => m.id)).size).toBe(ALL.length);
    expect(new Set(ALL.map((m) => m.name)).size).toBe(ALL.length);
  });

  it("uses each vendor's own naming", () => {
    for (const group of GPU_GROUPS) {
      for (const model of group.models) {
        if (group.vendor === "nvidia") expect(model.name).toMatch(/^NVIDIA (GeForce |TITAN)/);
        if (group.vendor === "amd") expect(model.name).toMatch(/^AMD Radeon /);
        if (group.vendor === "intel") expect(model.name).toMatch(/^Intel /);
        if (group.vendor === "apple") expect(model.name).toMatch(/^Apple M\d/);
      }
    }
  });

  it("does not list cards that never shipped", () => {
    const names = ALL.map((m) => m.name);
    for (const ghost of ["RX 9080", "RX 9090 XT", "Arc B380", "Arc B770", "RTX 5080 SUPER"]) {
      expect(names.some((n) => n.endsWith(ghost))).toBe(false);
    }
  });

  it("includes laptop, integrated, handheld and current Apple parts", () => {
    for (const id of [
      "nvidia-rtx-5070-laptop-gpu",
      "nvidia-rtx-4050-laptop-gpu",
      "amd-rx-9070-gre",
      "amd-890m",
      "amd-8060s",
      "intel-arc-140v",
      "amd-ryzen-z2-extreme",
      "valve-steam-deck",
      "apple-m5-max",
    ]) {
      expect(findGpuModel(id), id).toBeDefined();
    }
  });

  it("round-trips a catalog value", () => {
    const model = findGpuModel("nvidia-rtx-5080");
    expect(model).toBeDefined();
    if (!model) return;
    expect(modelForGpuValue(gpuValue(model))).toBe(model);
    expect(formatGpuValue(gpuValue(model))).toBe("NVIDIA GeForce RTX 5080");
  });
});

describe("migrateGpuValue", () => {
  it("maps every v0.13 catalog model to a current id", () => {
    const cases: Array<[string, string]> = [
      ["nvidia|rtx_50|RTX 5080", "gpu:nvidia-rtx-5080"],
      ["nvidia|rtx_40|RTX 4060 Ti", "gpu:nvidia-rtx-4060-ti"],
      ["nvidia|rtx_20|TITAN RTX", "gpu:nvidia-titan-rtx"],
      ["nvidia|gtx_900|TITAN X (Maxwell)", "gpu:nvidia-gtx-titan-x"],
      ["nvidia|gtx_700|TITAN Black", "gpu:nvidia-gtx-titan-black"],
      ["amd|rx_9000|RX 9070 XT", "gpu:amd-rx-9070-xt"],
      ["amd|rx_vega|Radeon VII", "gpu:amd-vii"],
      ["amd|hd_7000|HD 7970", "gpu:amd-hd-7970"],
      ["intel|arc_b|Arc B580", "gpu:intel-arc-b580"],
      ["apple|m1|M1 Ultra", "gpu:apple-m1-ultra"],
    ];
    for (const [legacy, current] of cases) expect(migrateGpuValue(legacy), legacy).toBe(current);
  });

  it("keeps an unmatched card as its full name", () => {
    expect(migrateGpuValue("amd|rx_9000|RX 9080")).toBe("AMD Radeon RX 9080");
    expect(migrateGpuValue("intel|arc_b|Arc B380")).toBe("Intel Arc B380");
    expect(migrateGpuValue("nvidia|rtx_40|RTX 4090 D")).toBe("NVIDIA GeForce RTX 4090 D");
  });

  it("unwraps the old Custom brand and clears half-picked values", () => {
    expect(migrateGpuValue("custom||My GPU")).toBe("My GPU");
    expect(migrateGpuValue("nvidia|rtx_40|")).toBe("");
    expect(migrateGpuValue("||")).toBe("");
  });

  it("leaves current values and free text alone", () => {
    expect(migrateGpuValue("gpu:amd-rx-7800-xt")).toBe("gpu:amd-rx-7800-xt");
    expect(migrateGpuValue("GeForce RTX 3060 12GB")).toBe("GeForce RTX 3060 12GB");
    expect(migrateGpuValue("")).toBe("");
  });
});
