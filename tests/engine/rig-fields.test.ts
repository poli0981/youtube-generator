import { describe, it, expect } from "vitest";
import { formatRigValue, RIG_FIELDS } from "@config/rig-fields";

describe("formatRigValue", () => {
  it("passes text fields through unchanged", () => {
    expect(formatRigValue("cpu", "Ryzen 9 7950X")).toBe("Ryzen 9 7950X");
  });

  it("formats dropdown_with_version with both parts", () => {
    expect(formatRigValue("video_editor", "davinci_resolve_studio|19.1")).toBe(
      "DaVinci Resolve Studio 19.1",
    );
  });

  it("formats dropdown_with_version with no version", () => {
    expect(formatRigValue("video_editor", "capcut|")).toBe("CapCut");
  });

  it("formats dropdown_with_version with only version", () => {
    // Only a version with an empty option renders just the version —
    // this is technically malformed input but we shouldn't crash.
    expect(formatRigValue("video_editor", "|1.0")).toBe("1.0");
  });

  it("returns empty string when the whole value is blank", () => {
    expect(formatRigValue("video_editor", "")).toBe("");
    expect(formatRigValue("video_editor", "|")).toBe("");
  });

  it("falls back to the raw option id when unknown", () => {
    expect(formatRigValue("video_editor", "unknown_tool|1.0")).toBe(
      "unknown_tool 1.0",
    );
  });

  it("includes a video_editor entry in RIG_FIELDS", () => {
    const field = RIG_FIELDS.find((f) => f.id === "video_editor");
    expect(field?.type).toBe("dropdown_with_version");
    expect(field?.options?.length).toBeGreaterThan(3);
  });

  describe("cascading_dropdown (GPU, v0.13)", () => {
    it("formats brand + model and drops the redundant series label", () => {
      expect(formatRigValue("gpu", "nvidia|rtx_40|RTX 4090")).toBe("NVIDIA RTX 4090");
    });

    it("returns the verbatim model for the Custom brand", () => {
      expect(formatRigValue("gpu", "custom||RX 7800 XT (OC)")).toBe("RX 7800 XT (OC)");
    });

    it("renders just the brand label when model is empty", () => {
      expect(formatRigValue("gpu", "amd|rx_7000|")).toBe("AMD");
    });

    it("returns empty string when nothing is selected", () => {
      expect(formatRigValue("gpu", "")).toBe("");
      expect(formatRigValue("gpu", "||")).toBe("");
    });

    it("passes legacy free-text values through unchanged", () => {
      // Pre-v0.13 rigs persisted GPU as plain text. Round-trip those.
      expect(formatRigValue("gpu", "NVIDIA GeForce RTX 4090")).toBe(
        "NVIDIA GeForce RTX 4090",
      );
    });
  });

  describe("composite_dropdown (RAM, v0.13)", () => {
    it("formats preset size + DDR generation", () => {
      expect(formatRigValue("ram", "16|DDR5")).toBe("16 GB DDR5");
    });

    it("supports a custom numeric size", () => {
      expect(formatRigValue("ram", "custom:48|DDR5")).toBe("48 GB DDR5");
    });

    it("renders only the size when DDR is empty", () => {
      expect(formatRigValue("ram", "32|")).toBe("32 GB");
    });

    it("renders only DDR when size is empty", () => {
      expect(formatRigValue("ram", "|DDR4")).toBe("DDR4");
    });

    it("returns empty string when nothing is set", () => {
      expect(formatRigValue("ram", "")).toBe("");
      expect(formatRigValue("ram", "|")).toBe("");
    });

    it("passes legacy free-text values through unchanged", () => {
      // Pre-v0.13 rigs persisted RAM as plain text like "32GB DDR5-6000".
      expect(formatRigValue("ram", "32GB DDR5-6000")).toBe("32GB DDR5-6000");
    });
  });

  describe("composite_dropdown (OS, v0.22.0)", () => {
    it("formats name + version + edition", () => {
      expect(formatRigValue("os", "windows|11|pro")).toBe("Windows 11 Pro");
    });

    it("formats name + version when edition is empty", () => {
      expect(formatRigValue("os", "windows|11|")).toBe("Windows 11");
    });

    it("formats name + edition when version is empty", () => {
      expect(formatRigValue("os", "windows||home")).toBe("Windows Home");
    });

    it("formats version + edition when name is empty", () => {
      // Defensive — name will always be Windows in v0.22.0, but the
      // format function should still degrade cleanly if a future version
      // omits the name.
      expect(formatRigValue("os", "|10|enterprise")).toBe("10 Enterprise");
    });

    it("returns empty string when nothing is set", () => {
      expect(formatRigValue("os", "")).toBe("");
      expect(formatRigValue("os", "||")).toBe("");
    });

    it("includes an OS entry in RIG_FIELDS as the first field", () => {
      expect(RIG_FIELDS[0]?.id).toBe("os");
      expect(RIG_FIELDS[0]?.type).toBe("composite_dropdown");
    });
  });
});
