import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { useProfileStore, type Profile } from "@store/profile-store";
import { usePresetStore } from "@store/preset-store";
import { useTemplateStore } from "@store/template-store";
import { useHistoryStore, type HistoryEntry } from "@store/history-store";
import { useSettingsStore } from "@store/settings-store";
import { initialEditorData, useEditorStore } from "@store/editor-store";
import { makeEnvelope } from "@utils/backup/format";
import { detectFile, type ParsedFile } from "@utils/backup/detect";
import {
  applyRestore,
  defaultRows,
  planRestore,
  readCurrentData,
  type RestoreChoice,
  type RestorePlan,
} from "@utils/backup/restore";
import { collectBackup, historyToCsv } from "@utils/backup/collect";

beforeAll(() => {
  // `setTheme` touches <html>; the test environment has no DOM.
  vi.stubGlobal("document", {
    documentElement: { classList: { toggle: () => undefined }, style: {} },
  });
});

const OLD = "2026-01-01T00:00:00.000Z";
const NEW = "2026-06-01T00:00:00.000Z";

function profile(id: string, name: string, extra: Partial<Profile> = {}): Profile {
  return {
    id,
    name,
    channelName: name,
    contactEmail: "",
    adEmail: "",
    gameKeyEmail: "",
    social: {},
    rig: {},
    resolution: "1080p",
    fps: "60",
    graphicsPreset: "high",
    thirdPartyAdText: "",
    createdAt: OLD,
    updatedAt: OLD,
    ...extra,
  };
}

function entry(id: string, title: string, createdAt: string, description = "d"): HistoryEntry {
  return {
    id,
    gameName: "Hades",
    videoType: "part",
    language: "en",
    genres: ["action"],
    title,
    description,
    tags: "a",
    createdAt,
  };
}

function file(sections: Record<string, unknown>): ParsedFile {
  const result = detectFile(makeEnvelope("backup", 1, sections));
  if (!result.ok || result.file.kind !== "data") throw new Error("bad test file");
  return result.file;
}

function choose(plan: RestorePlan, patch: Partial<RestoreChoice> = {}): RestoreChoice {
  const mode = patch.mode ?? "merge";
  return {
    mode,
    conflict: "newer",
    sections: new Set(["profiles", "presets", "templates", "history", "settings", "draft"]),
    rows: defaultRows(plan, mode),
    ...patch,
  };
}

beforeEach(() => {
  useProfileStore.setState({ profiles: [] });
  usePresetStore.setState({ presets: [] });
  useTemplateStore.setState({ templates: [] });
  useHistoryStore.setState({ entries: [] });
  useEditorStore.setState(initialEditorData());
  useSettingsStore.setState({ theme: "dark", legalConsentVersion: 2, historyLimit: 100 });
});

describe("planRestore", () => {
  it("sorts incoming items into new, already here and different", () => {
    useProfileStore.setState({
      profiles: [profile("a", "Main"), profile("b", "Alt"), profile("c", "Copy")],
    });
    const plan = planRestore(
      file({
        profiles: {
          version: 3,
          items: [
            profile("a", "Main"),
            profile("b", "Alt", { channelName: "Renamed", updatedAt: NEW }),
            profile("z", "Copy"), // same content as "c", different id
            profile("n", "Fresh"),
          ],
        },
      }),
      readCurrentData(),
    );
    const rows = plan.profiles?.rows ?? [];
    expect(rows.map((r) => [r.key, r.status])).toEqual([
      ["a", "same"],
      ["b", "changed"],
      ["z", "same"],
      ["n", "new"],
    ]);
    expect(rows[1]?.incomingNewer).toBe(true);
  });

  it("matches a history entry about the same video even with another id", () => {
    useHistoryStore.setState({ entries: [entry("h1", "Hades Part 1", OLD, "old")] });
    const plan = planRestore(
      file({ history: { version: 3, items: [entry("x9", "Hades Part 1", NEW, "new")] } }),
      readCurrentData(),
    );
    expect(plan.history?.rows[0]).toMatchObject({ status: "changed", incomingNewer: true });
    expect(plan.history?.rows[0]?.existing?.id).toBe("h1");
  });

  it("lists sections too new for this build", () => {
    const plan = planRestore(
      file({ presets: { version: 99, items: [] }, profiles: { version: 3, items: [] } }),
      readCurrentData(),
    );
    expect(plan.tooNew).toEqual(["presets"]);
    expect(plan.presets).toBeUndefined();
  });
});

describe("applyRestore", () => {
  it("merges: adds new items, updates older ones, and undoes everything", () => {
    useProfileStore.setState({ profiles: [profile("a", "Main"), profile("b", "Alt")] });
    const plan = planRestore(
      file({
        profiles: {
          version: 3,
          items: [
            profile("a", "Main", { channelName: "Stale", updatedAt: "2025-01-01T00:00:00.000Z" }),
            profile("b", "Alt", { channelName: "Fresh", updatedAt: NEW }),
            profile("n", "New one"),
          ],
        },
      }),
      readCurrentData(),
    );
    const result = applyRestore(plan, choose(plan));
    const after = useProfileStore.getState().profiles;
    expect(after.map((p) => [p.id, p.channelName])).toEqual([
      ["a", "Main"], // the file's copy is older: kept as is
      ["b", "Fresh"],
      ["n", "New one"],
    ]);
    expect(result.counts).toEqual({ added: 1, updated: 1, removed: 0 });
    result.undo();
    expect(useProfileStore.getState().profiles.map((p) => p.channelName)).toEqual(["Main", "Alt"]);
  });

  it("keeps both copies under distinct names when asked", () => {
    useProfileStore.setState({ profiles: [profile("a", "Main")] });
    const plan = planRestore(
      file({ profiles: { version: 3, items: [profile("a", "Main", { channelName: "Other" })] } }),
      readCurrentData(),
    );
    applyRestore(plan, choose(plan, { conflict: "both" }));
    const names = useProfileStore.getState().profiles.map((p) => p.name);
    expect(names).toEqual(["Main", "Main (2)"]);
    const ids = new Set(useProfileStore.getState().profiles.map((p) => p.id));
    expect(ids.size).toBe(2);
  });

  it("replaces: the section matches the chosen rows, matched ids are kept", () => {
    useProfileStore.setState({ profiles: [profile("a", "Main"), profile("gone", "Old")] });
    const plan = planRestore(
      file({
        profiles: { version: 3, items: [profile("a", "Main", { fps: "30" }), profile("n", "N")] },
      }),
      readCurrentData(),
    );
    const result = applyRestore(plan, choose(plan, { mode: "replace" }));
    expect(useProfileStore.getState().profiles.map((p) => [p.id, p.fps])).toEqual([
      ["a", "30"],
      ["n", "60"],
    ]);
    expect(result.counts.removed).toBe(1);
  });

  it("only touches chosen sections and rows", () => {
    const plan = planRestore(
      file({
        profiles: { version: 3, items: [profile("p1", "One"), profile("p2", "Two")] },
        presets: {
          version: 2,
          items: [
            {
              id: "g1",
              gameName: "Hades",
              genres: ["action"],
              platform: "",
              storeLinks: {},
              createdAt: OLD,
            },
          ],
        },
      }),
      readCurrentData(),
    );
    const choice = choose(plan, {
      sections: new Set(["profiles"]),
      rows: { profiles: new Set(["p2"]) },
    });
    applyRestore(plan, choice);
    expect(useProfileStore.getState().profiles.map((p) => p.id)).toEqual(["p2"]);
    expect(usePresetStore.getState().presets).toEqual([]);
  });

  it("restores settings without touching consent, and the draft", () => {
    const plan = planRestore(
      file({
        settings: { version: 12, value: { theme: "light", legalConsentVersion: 0 } },
        draft: { version: 19, value: { gameName: "Hades" } },
      }),
      readCurrentData(),
    );
    const result = applyRestore(plan, choose(plan));
    expect(useSettingsStore.getState().theme).toBe("light");
    expect(useSettingsStore.getState().legalConsentVersion).toBe(2);
    expect(useEditorStore.getState().gameName).toBe("Hades");
    expect(result.changed).toEqual(["settings", "draft"]);
    result.undo();
    expect(useSettingsStore.getState().theme).toBe("dark");
    expect(useEditorStore.getState().gameName).toBe("");
  });

  it("keeps history one entry per video, newest first, within the limit", () => {
    useSettingsStore.setState({ historyLimit: 10 });
    useHistoryStore.setState({ entries: [entry("h1", "Part 1", OLD, "old")] });
    const items = [entry("x", "Part 1", NEW, "new")];
    for (let i = 2; i <= 12; i++) {
      items.push(
        entry(`e${i}`, `Part ${i}`, `2026-02-${String(i).padStart(2, "0")}T00:00:00.000Z`),
      );
    }
    const plan = planRestore(file({ history: { version: 3, items } }), readCurrentData());
    applyRestore(plan, choose(plan));
    const entries = useHistoryStore.getState().entries;
    expect(entries).toHaveLength(10);
    expect(entries[0]).toMatchObject({ id: "h1", title: "Part 1", description: "new" });
  });
});

describe("collect", () => {
  it("round-trips a full backup through detect and plan", () => {
    useProfileStore.setState({ profiles: [profile("a", "Main")] });
    useSettingsStore.setState({ theme: "light" });
    const envelope = JSON.parse(JSON.stringify(collectBackup(["profiles", "settings"])));
    expect(envelope.data.settings.value).not.toHaveProperty("legalConsentVersion");
    const result = detectFile(envelope);
    if (!result.ok || result.file.kind !== "data") throw new Error("not detected");
    const plan = planRestore(result.file, readCurrentData());
    expect(plan.profiles?.rows.map((r) => r.status)).toEqual(["same"]);
    expect(plan.settings?.status).toBe("same");
  });

  it("writes history as spreadsheet-safe CSV", () => {
    const csv = historyToCsv([{ ...entry("h", '=HYPERLINK("x")', OLD), description: 'say "hi"' }]);
    expect(csv.startsWith("\uFEFF")).toBe(true);
    const [header, row] = csv.slice(1).split("\r\n");
    expect(header).toBe(
      '"created_at","game","video_type","language","genres","title","description","tags"',
    );
    expect(row).toContain(`"'=HYPERLINK(""x"")"`);
    expect(row).toContain('"say ""hi"""');
  });
});
