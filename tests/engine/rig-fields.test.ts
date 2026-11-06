import { describe, it, expect } from "vitest";
import {
  cleanCpuName,
  cleanLutName,
  CPU_SUGGESTIONS,
  formatRigValue,
  LUT_SUGGESTIONS,
  migrateRig,
  RIG_FIELDS,
} from "@config/rig-fields";
import { compareCodeUnits } from "@utils/sort";
import { schemaKeys } from "../helpers/locale-schema";

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

  it("orders the fields CPU, GPU, RAM first", () => {
    expect(RIG_FIELDS.slice(0, 3).map((f) => f.id)).toEqual(["cpu", "gpu", "ram"]);
  });

  describe("GPU (v1.0.0 catalog)", () => {
    it("prints the official name of a catalog card", () => {
      expect(formatRigValue("gpu", "gpu:nvidia-rtx-5080")).toBe("NVIDIA GeForce RTX 5080");
      expect(formatRigValue("gpu", "gpu:amd-rx-9070-xt")).toBe("AMD Radeon RX 9070 XT");
      expect(formatRigValue("gpu", "gpu:apple-m4-pro")).toBe("Apple M4 Pro");
      expect(formatRigValue("gpu", "gpu:nvidia-titan-rtx")).toBe("NVIDIA TITAN RTX");
    });

    it("names pre-v1.0 values properly", () => {
      expect(formatRigValue("gpu", "nvidia|rtx_40|RTX 4090")).toBe("NVIDIA GeForce RTX 4090");
      expect(formatRigValue("gpu", "apple|m4|M4 Pro")).toBe("Apple M4 Pro");
      expect(formatRigValue("gpu", "nvidia|rtx_40|RTX 4050 (laptop)")).toBe(
        "NVIDIA GeForce RTX 4050 Laptop GPU",
      );
    });

    it("returns the verbatim text for the old Custom brand", () => {
      expect(formatRigValue("gpu", "custom||RX 7800 XT (OC)")).toBe("RX 7800 XT (OC)");
    });

    it("returns empty string when nothing is selected", () => {
      expect(formatRigValue("gpu", "")).toBe("");
      expect(formatRigValue("gpu", "||")).toBe("");
    });

    it("passes the user's own text through unchanged", () => {
      expect(formatRigValue("gpu", "NVIDIA GeForce RTX 4090")).toBe("NVIDIA GeForce RTX 4090");
    });

    it("prints nothing for a catalog id that no longer exists", () => {
      expect(formatRigValue("gpu", "gpu:does-not-exist")).toBe("");
    });
  });

  describe("RAM", () => {
    it("formats size + type", () => {
      expect(formatRigValue("ram", "16|DDR5")).toBe("16 GB DDR5");
    });

    it("formats size + type + speed the way kits are named", () => {
      expect(formatRigValue("ram", "32|DDR5|6000")).toBe("32 GB DDR5-6000");
      expect(formatRigValue("ram", "16|LPDDR5X|8533")).toBe("16 GB LPDDR5X-8533");
    });

    it("gives a lone speed its unit", () => {
      expect(formatRigValue("ram", "32||6000")).toBe("32 GB 6000 MT/s");
    });

    it("supports a custom size", () => {
      expect(formatRigValue("ram", "custom:48|DDR5")).toBe("48 GB DDR5");
    });

    it("doesn't double the unit when the user typed it (was '48GB GB')", () => {
      expect(formatRigValue("ram", "custom:48GB|DDR5")).toBe("48 GB DDR5");
      expect(formatRigValue("ram", "custom:48 gb|DDR5")).toBe("48 GB DDR5");
    });

    it("prints the first DDR generation as plain DDR", () => {
      expect(formatRigValue("ram", "4|DDR1")).toBe("4 GB DDR");
    });

    it("renders only the size when the type is empty", () => {
      expect(formatRigValue("ram", "32|")).toBe("32 GB");
    });

    it("renders only the type when the size is empty", () => {
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

  describe("OS", () => {
    it("formats name + version + edition", () => {
      expect(formatRigValue("os", "windows|11|pro")).toBe("Windows 11 Pro");
    });

    it("formats name + version when edition is empty", () => {
      expect(formatRigValue("os", "windows|11|")).toBe("Windows 11");
    });

    it("formats name + edition when version is empty", () => {
      expect(formatRigValue("os", "windows||home")).toBe("Windows Home");
    });

    it("falls back to raw values when name is empty", () => {
      // An empty name means no option list applies, so the raw stored
      // values pass through verbatim. Only a hand-edited blob does this.
      expect(formatRigValue("os", "|10|enterprise")).toBe("10 enterprise");
    });

    it("returns empty string when nothing is set", () => {
      expect(formatRigValue("os", "")).toBe("");
      expect(formatRigValue("os", "||")).toBe("");
    });

    it("renders macOS version-only — third slot hidden", () => {
      expect(formatRigValue("os", "macos|15 Sequoia|")).toBe("macOS 15 Sequoia");
      expect(formatRigValue("os", "macos|26 Tahoe|")).toBe("macOS 26 Tahoe");
    });

    it("skips a stale edition on macOS", () => {
      expect(formatRigValue("os", "macos|15 Sequoia|pro")).toBe("macOS 15 Sequoia");
    });

    it("names a Linux system by its distro", () => {
      expect(formatRigValue("os", "linux|ubuntu|22.04 LTS")).toBe("Ubuntu 22.04 LTS");
      expect(formatRigValue("os", "linux|fedora|43")).toBe("Fedora 43");
      expect(formatRigValue("os", "linux|debian|")).toBe("Debian");
      expect(formatRigValue("os", "linux|steamos|3")).toBe("SteamOS 3");
    });

    it("puts rolling / latest in parentheses", () => {
      expect(formatRigValue("os", "linux|arch|rolling")).toBe("Arch Linux (rolling)");
      expect(formatRigValue("os", "linux|bazzite|latest")).toBe("Bazzite (latest stable)");
    });

    it("prints plain Linux when no distro is chosen", () => {
      expect(formatRigValue("os", "linux||")).toBe("Linux");
    });

    it("preserves the v0.22.0 Windows storage shape", () => {
      expect(formatRigValue("os", "windows|10|enterprise")).toBe("Windows 10 Enterprise");
    });
  });
});

describe("LUT (v1.4.0)", () => {
  it("sits right after the video editor, across both columns", () => {
    const ids = RIG_FIELDS.map((f) => f.id);
    expect(ids.indexOf("lut")).toBe(ids.indexOf("video_editor") + 1);
    const field = RIG_FIELDS.find((f) => f.id === "lut");
    expect(field).toMatchObject({ type: "text", wide: true, labelKey: "rig.lut" });
    expect(field?.suggestions).toBe(LUT_SUGGESTIONS);
  });

  it("prints the name as typed", () => {
    expect(formatRigValue("lut", "Arri Alexa LogC to Rec709")).toBe("Arri Alexa LogC to Rec709");
    expect(formatRigValue("lut", "")).toBe("");
  });

  it("drops a pasted file extension even before the field is left", () => {
    // Ctrl/⌘+Shift+C or Ctrl/⌘+S can run while the cursor is still in the
    // field, before the on-blur tidy-up.
    expect(formatRigValue("lut", "Arri Alexa LogC to Rec709.dat")).toBe(
      "Arri Alexa LogC to Rec709",
    );
  });
});

describe("cleanLutName", () => {
  it("drops the LUT's file extension, whatever its case", () => {
    expect(cleanLutName("Rec709 Kodak 2383 D65.cube")).toBe("Rec709 Kodak 2383 D65");
    expect(cleanLutName("Rec709 Kodak 2383 D65.CUBE")).toBe("Rec709 Kodak 2383 D65");
    expect(cleanLutName("Arri Alexa LogC to Rec709.dat")).toBe("Arri Alexa LogC to Rec709");
    expect(cleanLutName("Horror Look.3dl")).toBe("Horror Look");
  });

  it("keeps only the file name of a pasted path", () => {
    // Explorer's "Copy as path", quotes included.
    expect(
      cleanLutName(
        '"C:\\ProgramData\\Blackmagic Design\\DaVinci Resolve\\Support\\LUT\\Arri\\Arri Alexa LogC to Rec709.dat"',
      ),
    ).toBe("Arri Alexa LogC to Rec709");
    expect(
      cleanLutName(
        "/Library/Application Support/Blackmagic Design/DaVinci Resolve/LUT/Film Looks/Rec709 Kodak 2383 D65.cube",
      ),
    ).toBe("Rec709 Kodak 2383 D65");
    expect(cleanLutName("C:/LUTs/Teal Orange.cube")).toBe("Teal Orange");
  });

  it("keeps dots and slashes that belong to the name", () => {
    expect(cleanLutName("SLog3SGamut3.CineToLC-709")).toBe("SLog3SGamut3.CineToLC-709");
    expect(cleanLutName("SLog3SGamut3.CineToLC-709.cube")).toBe("SLog3SGamut3.CineToLC-709");
    expect(cleanLutName("Leica Pure L-Log to Rec.709 Gamma 2.4")).toBe(
      "Leica Pure L-Log to Rec.709 Gamma 2.4",
    );
    expect(cleanLutName("Teal/Orange")).toBe("Teal/Orange");
  });

  it("trims, and a second pass changes nothing", () => {
    expect(cleanLutName("  Horror Look  ")).toBe("Horror Look");
    for (const raw of ['""Look.cube""', "Look.cube.dat", '"  x.CUBE "', "/", '"', ""]) {
      const once = cleanLutName(raw);
      expect(cleanLutName(once)).toBe(once);
    }
    expect(cleanLutName("Look.cube.dat")).toBe("Look");
  });
});

describe("suggestions", () => {
  it("offers each CPU and LUT once, already in the form its cleaner gives", () => {
    const lists = [
      [CPU_SUGGESTIONS, cleanCpuName],
      [LUT_SUGGESTIONS, cleanLutName],
    ] as const;
    for (const [list, clean] of lists) {
      expect(new Set(list).size).toBe(list.length);
      for (const suggestion of list) expect(clean(suggestion)).toBe(suggestion);
    }
  });

  it("tidies a CPU name pasted from Windows in the output too", () => {
    expect(formatRigValue("cpu", "Intel(R) Core(TM) i9-9900K CPU @ 3.60GHz")).toBe(
      "Intel Core i9-9900K",
    );
  });
});

/**
 * The mock `t` returns a missing key as-is, so a rig field without labels
 * would print "description.rigLabels.x: …" in tests without failing.
 * `_schema.json` covers all eight locales (`validate:locales`).
 */
describe("rig field labels", () => {
  const ids = RIG_FIELDS.map((f) => f.id).sort(compareCodeUnits);

  it("has an editor label for every rig field, and none for unknown ids", () => {
    expect(schemaKeys("ui", "rig")).toEqual(ids);
  });

  it("has a description label for every rig field, and none for unknown ids", () => {
    expect(schemaKeys("templates", "description.rigLabels")).toEqual(ids);
  });
});

describe("cleanCpuName", () => {
  it("strips Windows' trademark marks and clock suffix", () => {
    expect(cleanCpuName("Intel(R) Core(TM) i9-9900K CPU @ 3.60GHz")).toBe("Intel Core i9-9900K");
    expect(cleanCpuName("12th Gen Intel(R) Core(TM) i7-12700K")).toBe("Intel Core i7-12700K");
  });

  it("drops AMD's core-count suffix", () => {
    expect(cleanCpuName("AMD Ryzen 7 7800X3D 8-Core Processor")).toBe("AMD Ryzen 7 7800X3D");
    expect(cleanCpuName("AMD Ryzen 7 7840HS w/ Radeon 780M Graphics")).toBe(
      "AMD Ryzen 7 7840HS w/ Radeon 780M Graphics",
    );
    expect(cleanCpuName("AMD Ryzen 5 5600G with Radeon Graphics")).toBe("AMD Ryzen 5 5600G");
  });

  it("leaves clean or unknown text alone apart from whitespace", () => {
    expect(cleanCpuName("  Apple   M4 Pro ")).toBe("Apple M4 Pro");
    expect(cleanCpuName("Ryzen 9 7950X")).toBe("Ryzen 9 7950X");
  });
});

describe("migrateRig", () => {
  it("converts the GPU and keeps the rest", () => {
    expect(migrateRig({ gpu: "nvidia|rtx_50|RTX 5080", cpu: "Ryzen 7 9800X3D" })).toEqual({
      gpu: "gpu:nvidia-rtx-5080",
      cpu: "Ryzen 7 9800X3D",
    });
  });

  it("drops non-string values and survives null", () => {
    expect(migrateRig({ gpu: null, ram: 32, cpu: "x" })).toEqual({ cpu: "x" });
    expect(migrateRig(null)).toEqual({});
    expect(migrateRig("nope")).toEqual({});
  });

  it("is idempotent", () => {
    const once = migrateRig({ gpu: "amd|rx_9000|RX 9080" });
    expect(migrateRig(once)).toEqual(once);
  });
});
