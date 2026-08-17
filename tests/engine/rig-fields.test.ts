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
    expect(formatRigValue("video_editor", "unknown_tool|1.0")).toBe("unknown_tool 1.0");
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
      expect(formatRigValue("gpu", "NVIDIA GeForce RTX 4090")).toBe("NVIDIA GeForce RTX 4090");
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

    it("falls back to raw values when name is empty (v0.23.0 cascading change)", () => {
      // Defensive — pre-v0.23 static OS_EDITION_OPTIONS resolved
      // "enterprise" → "Enterprise" regardless of name. Post-v0.23 the
      // option list cascades from name; an empty name means no option
      // list applies, so the raw stored values pass through verbatim.
      // A real editor session always sets name first, so this is purely
      // a hand-edited / malformed-blob guard.
      expect(formatRigValue("os", "|10|enterprise")).toBe("10 enterprise");
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

  describe("composite_dropdown (OS cascading, v0.23.0)", () => {
    it("renders macOS version-only — third slot hidden", () => {
      expect(formatRigValue("os", "macos|15 Sequoia|")).toBe("macOS 15 Sequoia");
    });

    it("renders macOS Tahoe (the 2025 year-aligned jump)", () => {
      expect(formatRigValue("os", "macos|26 Tahoe|")).toBe("macOS 26 Tahoe");
    });

    it("renders Linux distro + version with three visible parts", () => {
      expect(formatRigValue("os", "linux|ubuntu|22.04 LTS")).toBe("Linux Ubuntu 22.04 LTS");
    });

    it("renders Linux rolling distros (Arch) with the placeholder version", () => {
      expect(formatRigValue("os", "linux|arch|rolling")).toBe("Linux Arch rolling");
    });

    it("renders Linux Fedora with a numeric version", () => {
      expect(formatRigValue("os", "linux|fedora|40")).toBe("Linux Fedora 40");
    });

    it("renders just distro name when version slot is empty", () => {
      expect(formatRigValue("os", "linux|debian|")).toBe("Linux Debian");
    });

    it("falls back gracefully when macOS edition slot carries stale data", () => {
      // Hand-edited / future-downgrade case: macOS with a third
      // segment. Engine should skip it (hiddenWhen) rather than
      // surfacing "macOS 15 Sequoia pro".
      expect(formatRigValue("os", "macos|15 Sequoia|pro")).toBe("macOS 15 Sequoia");
    });

    it("preserves v0.22.0 Windows storage shape (backward-compat guard)", () => {
      // Pre-v0.23 stored values must round-trip identically — this
      // case validates the editor-store v13/v14 doesn't need a
      // dedicated OS migration step.
      expect(formatRigValue("os", "windows|11|pro")).toBe("Windows 11 Pro");
      expect(formatRigValue("os", "windows|10|enterprise")).toBe("Windows 10 Enterprise");
    });
  });

  describe("RAM composite — regression guard for v0.23.0 type widening", () => {
    it("still resolves static option arrays after CompositePart.options widened to a union", () => {
      // The v0.23.0 change made CompositePart.options accept either a
      // static array (RAM-style) or a function (OS cascading). RAM uses
      // the static form — re-running its formatter ensures the union
      // didn't break the simpler path.
      expect(formatRigValue("ram", "16|DDR5")).toBe("16 GB DDR5");
      expect(formatRigValue("ram", "custom:48|DDR5")).toBe("48 GB DDR5");
    });
  });
});
