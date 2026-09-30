import { beforeEach, describe, expect, it } from "vitest";
import { initialEditorData, useEditorStore } from "@store/editor-store";
import { useSettingsStore } from "@store/settings-store";
import type { GamePreset } from "@store/preset-store";
import type { Profile } from "@store/profile-store";
import {
  applyPreset,
  applyProfile,
  applyTemplate,
  changedSince,
  nextPartNumber,
  overwrittenFields,
  presetPatch,
  startNewVideo,
  startNextPart,
  startOver,
} from "@utils/library-apply";
import { applyStoreLink, matchStoreLink } from "@utils/store-paste";
import { extractGameNameFromUrl } from "@utils/url-extractors";
import { PLATFORMS } from "@config/platforms";
import { renamedVietnameseBank, VIETNAMESE_BANKS } from "@config/vietnamese-banks";

const NOW = "2026-09-30T00:00:00.000Z";

function preset(gameName: string, extra: Partial<GamePreset> = {}): GamePreset {
  return {
    id: `p-${gameName}`,
    gameName,
    genres: ["action"],
    platform: "steam",
    storeLinks: {},
    createdAt: NOW,
    ...extra,
  };
}

const profile: Profile = {
  id: "main",
  name: "Main",
  channelName: "Skullmute",
  contactEmail: "me@example.com",
  adEmail: "",
  gameKeyEmail: "",
  social: { youtube: "https://www.youtube.com/@skullmute" },
  rig: { cpu: "AMD Ryzen 7 9800X3D" },
  resolution: "1440p",
  fps: "60",
  graphicsPreset: "high",
  thirdPartyAdText: "",
  vnMomo: "0900000000",
  createdAt: NOW,
  updatedAt: NOW,
};

beforeEach(() => {
  useEditorStore.setState(initialEditorData());
  useSettingsStore.setState({
    lastProfileId: null,
    lastPresetId: null,
    defaultOutputLanguage: "vi",
  });
});

describe("next part / new video / start over", () => {
  it("counts parts on", () => {
    expect(nextPartNumber("7")).toBe("8");
    expect(nextPartNumber(" 09 ")).toBe("10");
    expect(nextPartNumber("7b")).toBeNull();
    expect(nextPartNumber("")).toBeNull();
  });

  it("moves to the next part and clears what belonged to the last one", () => {
    useEditorStore.setState({
      gameName: "Hades",
      partNumber: "7",
      bossName: "Megaera",
      timestamps: "0:00 Intro",
      endings: [{ number: 1, name: "True" }],
      channelName: "Skullmute",
    });
    startNextPart();
    const s = useEditorStore.getState();
    expect(s.partNumber).toBe("8");
    expect(s.bossName).toBe("");
    expect(s.timestamps).toBe("");
    expect(s.endings).toEqual([]);
    expect(s.gameName).toBe("Hades");
    expect(s.channelName).toBe("Skullmute");
  });

  it("starts a new video of the same game without touching the part number", () => {
    useEditorStore.setState({ gameName: "Hades", partNumber: "3", pinnedComment: "hi" });
    startNewVideo();
    expect(useEditorStore.getState()).toMatchObject({
      gameName: "Hades",
      partNumber: "3",
      pinnedComment: "",
    });
  });

  it("starts over but keeps the channel and uses the default output language", () => {
    useEditorStore.setState({
      gameName: "Hades",
      channelName: "Skullmute",
      rig: { cpu: "X" },
      vnMomo: "0900",
      language: "en",
    });
    startOver();
    const s = useEditorStore.getState();
    expect(s.gameName).toBe("");
    expect(s.channelName).toBe("Skullmute");
    expect(s.rig).toEqual({ cpu: "X" });
    expect(s.vnMomo).toBe("0900");
    expect(s.language).toBe("vi");
  });
});

describe("applying profiles, presets and templates", () => {
  it("fills every channel field a profile holds and remembers it", () => {
    applyProfile(profile);
    const s = useEditorStore.getState();
    expect(s.channelName).toBe("Skullmute");
    expect(s.vnMomo).toBe("0900000000");
    expect(s.social.youtube).toBe("https://www.youtube.com/@skullmute");
    expect(useSettingsStore.getState().lastProfileId).toBe("main");
  });

  it("clears per-video fields when the preset is for another game", () => {
    useEditorStore.setState({ gameName: "Hades", bossName: "Megaera", timestamps: "0:00 x" });
    applyPreset(preset("Hollow Knight", { playlistLink: "https://youtube.com/playlist?list=PL1" }));
    const s = useEditorStore.getState();
    expect(s).toMatchObject({ gameName: "Hollow Knight", bossName: "", timestamps: "" });
    expect(s.playlistLink).toBe("https://youtube.com/playlist?list=PL1");
    expect(useSettingsStore.getState().lastPresetId).toBe("p-Hollow Knight");
  });

  it("keeps per-video fields when the preset is for the same game", () => {
    useEditorStore.setState({ gameName: "Hades", bossName: "Megaera" });
    applyPreset(preset("hades"));
    expect(useEditorStore.getState().bossName).toBe("Megaera");
  });

  it("clears per-video fields a template doesn't hold", () => {
    useEditorStore.setState({ bossName: "Megaera", thumbnailText: "old" });
    applyTemplate({ id: "t", name: "T", createdAt: NOW, snapshot: { gameName: "Hades" } });
    expect(useEditorStore.getState()).toMatchObject({
      gameName: "Hades",
      bossName: "",
      thumbnailText: "",
    });
  });

  it("counts only filled fields that would change", () => {
    const editor = { ...initialEditorData(), gameName: "Hades", platform: "" };
    const patch = presetPatch(preset("Hollow Knight", { platform: "gog" }));
    expect(overwrittenFields(editor, patch)).toEqual(["gameName"]);
    expect(overwrittenFields({ ...editor, gameName: "Hollow Knight" }, patch)).toEqual([]);
  });

  it("notices when the editor drifts from what a preset saved", () => {
    const patch = presetPatch(preset("Hades"));
    const editor = { ...initialEditorData(), ...patch };
    expect(changedSince(editor, patch)).toEqual([]);
    expect(changedSince({ ...editor, platform: "epic" }, patch)).toEqual(["platform"]);
  });
});

describe("store links pasted anywhere", () => {
  it("recognises store links and nothing else", () => {
    expect(
      matchStoreLink("https://store.steampowered.com/app/1145350/Hades_II/?snr=1"),
    ).toMatchObject({
      platformId: "steam",
      url: "https://store.steampowered.com/app/1145350/Hades_II/",
    });
    expect(matchStoreLink("  https://www.gog.com/en/game/baldurs_gate_3  ")?.platformId).toBe(
      "gog",
    );
    expect(
      matchStoreLink("https://apps.apple.com/us/app/genshin-impact/id1517783697")?.platformId,
    ).toBe("appstore");
    expect(matchStoreLink("https://example.com/my-game")).toBeNull();
    expect(matchStoreLink("see https://store.steampowered.com/app/1")).toBeNull();
    expect(matchStoreLink("Hades")).toBeNull();
  });

  it("puts the link in its field, sets the platform and names the game", () => {
    const match = matchStoreLink("https://store.steampowered.com/app/2344520/Diablo_IV/");
    if (!match) throw new Error("no match");
    useEditorStore.setState({ platform: "" });
    applyStoreLink(match);
    const s = useEditorStore.getState();
    expect(s.storeLinks.steam).toBe("https://store.steampowered.com/app/2344520/Diablo_IV/");
    expect(s.platform).toBe("steam");
    expect(s.gameName).toBe("Diablo IV");
  });

  it("leaves a typed game name and the platform of an earlier link alone", () => {
    useEditorStore.setState({
      gameName: "My Name",
      platform: "steam",
      storeLinks: { steam: "https://store.steampowered.com/app/1" },
    });
    const match = matchStoreLink("https://www.gog.com/game/hades");
    if (!match) throw new Error("no match");
    applyStoreLink(match);
    expect(useEditorStore.getState()).toMatchObject({ gameName: "My Name", platform: "steam" });
    expect(useEditorStore.getState().storeLinks.gog).toBe("https://www.gog.com/game/hades");
  });
});

describe("game names from store links", () => {
  it("restores sequel numbers and possessives", () => {
    expect(
      extractGameNameFromUrl("https://store.steampowered.com/app/1/FINAL_FANTASY_VII_REMAKE/"),
    ).toBe("Final Fantasy VII Remake");
    expect(extractGameNameFromUrl("https://www.gog.com/game/baldurs_gate_3")).toBe(
      "Baldur's Gate 3",
    );
    expect(extractGameNameFromUrl("https://store.steampowered.com/app/1/Civilization_VI/")).toBe(
      "Civilization VI",
    );
    // Single letters stay ordinary words.
    expect(extractGameNameFromUrl("https://store.steampowered.com/app/1/Mega_Man_X/")).toBe(
      "Mega Man X",
    );
  });

  it("reads the newer stores", () => {
    expect(
      extractGameNameFromUrl("https://apps.apple.com/us/app/genshin-impact/id1517783697"),
    ).toBe("Genshin Impact");
    expect(
      extractGameNameFromUrl("https://www.meta.com/experiences/beat-saber/2448060205267927/"),
    ).toBe("Beat Saber");
    expect(extractGameNameFromUrl("https://www.ea.com/games/battlefield/battlefield-6")).toBe(
      "Battlefield 6",
    );
    expect(extractGameNameFromUrl("https://shop.battle.net/en-us/product/diablo_iv")).toBe(
      "Diablo IV",
    );
    expect(extractGameNameFromUrl("https://www.meta.com/experiences/2448060205267927/")).toBeNull();
  });

  it("validates every new store's links", () => {
    const cases: Record<string, string> = {
      ea: "https://www.ea.com/games/battlefield/battlefield-6",
      ubisoft: "https://store.ubisoft.com/us/assassins-creed-shadows/6427f9.html",
      battlenet: "https://us.shop.battle.net/en-us/product/diablo_iv",
      googleplay: "https://play.google.com/store/apps/details?id=com.miHoYo.GenshinImpact&hl=en",
      appstore: "https://apps.apple.com/us/app/genshin-impact/id1517783697",
      meta: "https://www.meta.com/experiences/beat-saber/2448060205267927/",
    };
    for (const [id, url] of Object.entries(cases)) {
      expect(PLATFORMS.find((p) => p.id === id)?.urlPattern.test(url), id).toBe(true);
    }
    const play = PLATFORMS.find((p) => p.id === "googleplay");
    expect(play?.urlPattern.test("https://play.google.com/store/apps/details?hl=en&id=com.x")).toBe(
      true,
    );
    expect(play?.urlPattern.test("https://play.google.com/store/apps/developer?id=x")).toBe(false);
  });
});

describe("Vietnamese banks", () => {
  it("offers the new names of renamed banks", () => {
    expect(renamedVietnameseBank("OceanBank")).toBe("MBV");
    expect(renamedVietnameseBank(" cbbank ")).toBe("VCBNeo");
    expect(renamedVietnameseBank("DongA Bank")).toBe("Vikki Bank");
    expect(renamedVietnameseBank("Vietcombank")).toBeNull();
    for (const name of ["MBV", "VCBNeo", "Vikki Bank", "Cake by VPBank", "Timo"]) {
      expect(VIETNAMESE_BANKS as readonly string[]).toContain(name);
    }
  });
});
