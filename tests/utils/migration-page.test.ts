import { describe, expect, it } from "vitest";
import fs from "fs";
import path from "path";
import { readBackupText } from "@utils/backup/detect";
import { sanitizeSections } from "@utils/backup/sanitize";
import { initialSettings } from "@store/settings-heal";

/**
 * The page left on poli0981.github.io/youtube-generator hands users their
 * old data as a backup file. This is the file it writes for a typical
 * v0.38 browser (zustand's `{ state, version }` per store), byte for byte.
 */
const FROM_MIGRATION_PAGE = JSON.stringify({
  _app: "ytdescgen",
  _format: 2,
  _type: "backup",
  _schemaVersion: 1,
  _appVersion: "0.38.0",
  _exportedAt: "2026-09-30T15:32:31.505Z",
  _source: "poli0981.github.io/youtube-generator",
  data: {
    profiles: {
      version: 2,
      items: [
        {
          id: "old-1",
          name: "Old main",
          channelName: "Skullmute",
          social: {},
          rig: { gpu: "nvidia|rtx_40|RTX 4070" },
          resolution: "1080p",
          fps: "60",
          graphicsPreset: "Ultra",
          thirdPartyAdText: "",
          createdAt: "2026-05-01T00:00:00.000Z",
          updatedAt: "2026-05-01T00:00:00.000Z",
        },
      ],
    },
    history: {
      version: 2,
      items: [
        {
          id: "h1",
          gameName: "Hades",
          videoType: "part",
          language: "en",
          genres: ["action"],
          title: "Hades Part 1",
          description: "d",
          tags: "t",
          createdAt: "2026-05-02T00:00:00.000Z",
        },
        {
          id: "h2",
          gameName: "Hades",
          videoType: "part",
          language: "en",
          genres: ["action"],
          title: "Hades Part 1",
          description: "d2",
          tags: "t",
          createdAt: "2026-05-03T00:00:00.000Z",
        },
      ],
    },
    settings: { version: 12, value: { theme: "light", appLanguage: "vi", legalConsentVersion: 1 } },
  },
});

describe("GitHub Pages migration page", () => {
  it("writes a file the restore reads, migrating the old data", () => {
    const result = readBackupText(FROM_MIGRATION_PAGE);
    if (!result.ok || result.file.kind !== "data") throw new Error("not restorable");
    const clean = sanitizeSections(result.file.sections, {
      ...initialSettings,
      legalConsentVersion: 2,
    });
    expect(clean.profiles?.[0]).toMatchObject({
      name: "Old main",
      rig: { gpu: "gpu:nvidia-rtx-4070" },
      graphicsPreset: "ultra",
    });
    // v0.38 history piled up one entry per Output visit; v3 keeps one per video.
    expect(clean.history).toHaveLength(1);
    expect(clean.settings).toMatchObject({
      theme: "light",
      appLanguage: "vi",
      legalConsentVersion: 2,
    });
  });

  it("reads every store the app saved, under the keys the app used", () => {
    const script = fs.readFileSync(
      path.resolve(import.meta.dirname, "../../migration-page/app.js"),
      "utf8",
    );
    for (const key of [
      "ytdescgen-profiles",
      "ytdescgen-presets",
      "ytdescgen-templates",
      "ytdescgen-history",
      "ytdescgen-settings",
      "ytdescgen-editor-draft",
    ]) {
      expect(script).toContain(`"${key}"`);
    }
  });
});
