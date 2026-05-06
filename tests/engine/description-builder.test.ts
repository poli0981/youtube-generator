import { describe, it, expect } from "vitest";
import { buildDescription, checkDescriptionWarning } from "@engine/description-builder";
import { createMockT } from "../helpers/mock-t";
import type { GeneratorInput } from "@engine/types";

function makeInput(overrides: Partial<GeneratorInput> = {}): GeneratorInput {
  return {
    videoType: "full",
    language: "en",
    genres: ["action"],
    gameName: "Elden Ring",
    channelName: "TestChannel",
    platform: "steam",
    spoilerWarning: false,
    matureWarning: false,
    storeLinks: {},
    social: {},
    rig: {},
    ...overrides,
  };
}

describe("buildDescription", () => {
  it("generates minimal description with only required fields", () => {
    const t = createMockT("en");
    const result = buildDescription(makeInput(), t);

    expect(result).toContain("full gameplay of Elden Ring on TestChannel");
    expect(result).toContain("No Commentary");
    expect(result).toContain("Like | 🔔 Subscribe");
    expect(result).toContain("#EldenRing");
  });

  it("sanitises hashtags for game names with special characters", () => {
    const t = createMockT("en");
    const result = buildDescription(
      makeInput({ gameName: "S.T.A.L.K.E.R. 2" }),
      t,
    );
    expect(result).toContain("#STALKER2");
    expect(result).not.toMatch(/#\s?S\./);
  });

  it("sanitises hashtags for snake_case genre ids (fixes #visual_novel bug)", () => {
    const t = createMockT("en");
    const result = buildDescription(makeInput({ genres: ["visual_novel"] }), t);
    expect(result).toContain("#visualnovel");
    expect(result).not.toContain("#visual_novel");
  });

  it("uses the first genre for the hashtag when multiple are selected", () => {
    const t = createMockT("en");
    const result = buildDescription(
      makeInput({ genres: ["hack_slash", "action", "soulslike"] }),
      t,
    );
    expect(result).toContain("#hackslash");
    expect(result).not.toContain("#action");
    expect(result).not.toContain("#soulslike");
  });

  it("includes timestamps when provided", () => {
    const t = createMockT("en");
    const result = buildDescription(
      makeInput({ timestamps: "0:00 Intro\n5:30 Boss" }),
      t,
    );
    expect(result).toContain("TIMESTAMPS");
    expect(result).toContain("0:00 Intro");
    expect(result).toContain("5:30 Boss");
  });

  it("includes store links when provided (paid default → Buy heading)", () => {
    const t = createMockT("en");
    const result = buildDescription(
      makeInput({ storeLinks: { Steam: "https://store.steampowered.com/app/123" } }),
      t,
    );
    expect(result).toContain("GET THE GAME (if you want to buy)");
    expect(result).toContain("Steam: https://store.steampowered.com/app/123");
    expect(result).not.toContain("DOWNLOAD THE GAME");
  });

  it("switches to Download heading when majority of links are free/demo", () => {
    const t = createMockT("en");
    const result = buildDescription(
      makeInput({
        storeLinks: {
          steam: "https://store.steampowered.com/app/1",
          itchio: "https://dev.itch.io/demo",
          epic: "https://store.epicgames.com/freegame",
        },
        storeLinkTypes: {
          steam: "paid",
          itchio: "demo",
          epic: "free",
        },
      }),
      t,
    );
    expect(result).toContain("DOWNLOAD THE GAME (if you want to play)");
    expect(result).not.toContain("GET THE GAME");
  });

  it("ties favour the Buy heading", () => {
    const t = createMockT("en");
    const result = buildDescription(
      makeInput({
        storeLinks: {
          steam: "https://store.steampowered.com/app/1",
          itchio: "https://dev.itch.io/game",
        },
        storeLinkTypes: { steam: "paid", itchio: "free" },
      }),
      t,
    );
    // 1 paid, 1 free → nonPaid (1) is NOT > entries.length/2 (1) → Buy
    expect(result).toContain("GET THE GAME (if you want to buy)");
  });

  it("adds (free demo) suffix to demo links", () => {
    const t = createMockT("en");
    const result = buildDescription(
      makeInput({
        storeLinks: { itchio: "https://dev.itch.io/demo" },
        storeLinkTypes: { itchio: "demo" },
      }),
      t,
    );
    expect(result).toContain("(free demo)");
  });

  it("adds (free) suffix to free links but not paid ones", () => {
    const t = createMockT("en");
    const result = buildDescription(
      makeInput({
        storeLinks: {
          steam: "https://store.steampowered.com/app/1",
          itchio: "https://dev.itch.io/game",
        },
        storeLinkTypes: { steam: "paid", itchio: "free" },
      }),
      t,
    );
    // Find the itchio line and make sure it has (free), Steam line does not
    const lines = result.split("\n");
    const itchLine = lines.find((l) => l.includes("itch.io"));
    const steamLine = lines.find((l) => l.includes("steampowered"));
    expect(itchLine).toContain("(free)");
    expect(steamLine).not.toContain("(free)");
  });

  it("defaults unspecified link types to paid", () => {
    const t = createMockT("en");
    const result = buildDescription(
      makeInput({
        storeLinks: { steam: "https://store.steampowered.com/app/1" },
        // storeLinkTypes omitted entirely
      }),
      t,
    );
    expect(result).toContain("GET THE GAME (if you want to buy)");
    expect(result).not.toContain("(free)");
  });

  it("includes video settings with the v0.8-polish multi-line block", () => {
    const t = createMockT("en");
    const result = buildDescription(
      makeInput({ resolution: "4K", fps: "60", graphicsPreset: "ultra" }),
      t,
    );
    expect(result).toContain("VIDEO SETTINGS");
    expect(result).toContain("Video: 4K - 60 FPS");
    expect(result).toContain("In-game Setting: Ultra");
  });

  it("composes Cinematic + NVIDIA Frame Gen x2 + Ray Tracing line", () => {
    const t = createMockT("en");
    const result = buildDescription(
      makeInput({
        resolution: "1440p",
        fps: "120",
        graphicsPreset: "cinematic",
        frameGenVendor: "nvidia",
        frameGenMultiplier: "x2",
        rayTracingModes: ["ray_tracing"],
      }),
      t,
    );
    expect(result).toContain("Video: 1440p - 120 FPS");
    expect(result).toContain(
      "In-game Setting: Cinematic - NVIDIA Frame Generation x2 with Ray Tracing",
    );
  });

  it("combines upscaling quality and frame generation under one vendor (v0.11 vendor-aware labels)", () => {
    const t = createMockT("en");
    const result = buildDescription(
      makeInput({
        resolution: "4K",
        fps: "60",
        graphicsPreset: "ultra",
        frameGenVendor: "amd",
        upscaleQuality: "quality",
        frameGenMultiplier: "x3",
        rayTracingModes: ["full_rt"],
      }),
      t,
    );
    // v0.11 dropped the "skip brand on second mention" optimization in
    // favour of vendor-keyed full labels — both halves now carry brand.
    expect(result).toContain(
      "In-game Setting: Ultra - AMD FSR Quality + AMD Fluid Motion Frames x3 with Full Ray Tracing",
    );
  });

  it("renders DLAA as a quality tier under NVIDIA (v0.11)", () => {
    const t = createMockT("en");
    const result = buildDescription(
      makeInput({
        resolution: "4K",
        fps: "60",
        graphicsPreset: "ultra",
        frameGenVendor: "nvidia",
        upscaleQuality: "dlaa",
      }),
      t,
    );
    // DLAA replaces DLSS upscaling — should NOT read "NVIDIA DLSS DLAA".
    expect(result).toContain("In-game Setting: Ultra - NVIDIA DLAA");
    expect(result).not.toContain("NVIDIA DLSS DLAA");
  });

  it("renders XeSS Ultra Quality under Intel (v0.11)", () => {
    const t = createMockT("en");
    const result = buildDescription(
      makeInput({
        resolution: "1440p",
        fps: "60",
        graphicsPreset: "high",
        frameGenVendor: "intel",
        upscaleQuality: "ultra_quality",
        frameGenMultiplier: "x2",
      }),
      t,
    );
    expect(result).toContain(
      "In-game Setting: High - Intel XeSS Ultra Quality + Intel XeFG x2",
    );
  });

  it("emits multiple RT modes joined with commas", () => {
    const t = createMockT("en");
    const result = buildDescription(
      makeInput({
        resolution: "1080p",
        fps: "60",
        graphicsPreset: "high",
        rayTracingModes: ["path_tracing", "ray_reconstruction"],
      }),
      t,
    );
    expect(result).toContain(
      "In-game Setting: High with Path Tracing, Ray Reconstruction",
    );
  });

  it("uses the user's free-form label when graphicsPreset is custom", () => {
    const t = createMockT("en");
    const result = buildDescription(
      makeInput({
        resolution: "1080p",
        fps: "60",
        graphicsPreset: "custom",
        graphicsPresetCustom: "Epic",
      }),
      t,
    );
    expect(result).toContain("Video: 1080p - 60 FPS");
    expect(result).toContain("In-game Setting: Epic");
  });

  it("emits Art Style on its own line", () => {
    const t = createMockT("en");
    const result = buildDescription(
      makeInput({
        graphicsPreset: "medium",
        artStyle: "pixel_art",
      }),
      t,
    );
    expect(result).toContain("In-game Setting: Medium");
    expect(result).toContain("Art Style: Pixel Art");
  });

  it("emits Version on its own line", () => {
    const t = createMockT("en");
    const result = buildDescription(
      makeInput({
        resolution: "1080p",
        fps: "60",
        graphicsPreset: "ultra",
        versionInfo: "GeForce 565.90 | Game v1.4",
      }),
      t,
    );
    expect(result).toContain("Video: 1080p - 60 FPS");
    expect(result).toContain("In-game Setting: Ultra");
    expect(result).toContain("Version: GeForce 565.90 | Game v1.4");
  });

  it("renders the four video-settings tokens as separate labelled lines", () => {
    const t = createMockT("en");
    const result = buildDescription(
      makeInput({
        resolution: "1440p",
        fps: "60",
        graphicsPreset: "cinematic",
        frameGenVendor: "nvidia",
        frameGenMultiplier: "x2",
        rayTracingModes: ["ray_tracing"],
        artStyle: "realistic",
        versionInfo: "GeForce 566.36",
      }),
      t,
    );
    // Each line carries its own label — find the section and verify the
    // four expected lines are present in order.
    const section = result.split("🖥 VIDEO SETTINGS\n")[1]?.split("\n\n")[0];
    expect(section).toBeTruthy();
    const lines = section!.split("\n");
    expect(lines[0]).toBe("Video: 1440p - 60 FPS");
    expect(lines[1]).toBe(
      "In-game Setting: Cinematic - NVIDIA Frame Generation x2 with Ray Tracing",
    );
    expect(lines[2]).toBe("Art Style: Realistic");
    expect(lines[3]).toBe("Version: GeForce 566.36");
  });

  it("omits the entire VIDEO SETTINGS section when skipGraphicsSettings is true", () => {
    const t = createMockT("en");
    const result = buildDescription(
      makeInput({
        resolution: "1080p",
        fps: "60",
        graphicsPreset: "ultra",
        skipGraphicsSettings: true,
      }),
      t,
    );
    expect(result).not.toContain("VIDEO SETTINGS");
    expect(result).not.toContain("Ultra Setting");
  });

  it("renders livestream intro + watch link + scheduled time", () => {
    const t = createMockT("en");
    const result = buildDescription(
      makeInput({
        videoType: "livestream",
        gameName: "Elden Ring",
        channelName: "TestChannel",
        liveUrl: "https://www.youtube.com/watch?v=live123",
        scheduledTime: "2026-05-04T20:00:00",
      }),
      t,
    );
    expect(result).toContain(
      "Live stream of Elden Ring on TestChannel",
    );
    expect(result).toContain("🔴 LIVE on");
    expect(result).toContain("Watch / replay: https://www.youtube.com/watch?v=live123");
  });

  it("falls back to the raw scheduledTime string when it can't be parsed", () => {
    const t = createMockT("en");
    const result = buildDescription(
      makeInput({
        videoType: "livestream",
        liveUrl: "https://www.youtube.com/watch?v=abc",
        scheduledTime: "tomorrow at 8pm", // not ISO
      }),
      t,
    );
    expect(result).toContain("🔴 LIVE on tomorrow at 8pm");
  });

  it("renders the Vietnam donate block when language is 'vi' and bank fields set", () => {
    const t = createMockT("en"); // mock-t falls back to en for keys not in vi mock; section header is what matters
    const result = buildDescription(
      makeInput({
        language: "vi",
        vnBankName: "Vietcombank",
        vnBankAccount: "0123456789",
        vnBankHolder: "NGUYEN VAN A",
        vnMomo: "0901234567",
        vnZalopay: "0907654321",
      }),
      t,
    );
    expect(result).toContain("BANK TRANSFER / E-WALLET (Vietnam)");
    expect(result).toContain("🏦 Vietcombank: 0123456789 (NGUYEN VAN A)");
    expect(result).toContain("💸 MoMo: 0901234567");
    expect(result).toContain("💸 ZaloPay: 0907654321");
  });

  it("omits the holder parens when the holder field is empty", () => {
    const t = createMockT("en");
    const result = buildDescription(
      makeInput({
        language: "vi",
        vnBankName: "MB Bank",
        vnBankAccount: "9876543210",
      }),
      t,
    );
    expect(result).toContain("🏦 MB Bank: 9876543210");
    expect(result).not.toContain("()");
  });

  it("skips the bank line when only one of bankName/bankAccount is set", () => {
    const t = createMockT("en");
    const result = buildDescription(
      makeInput({
        language: "vi",
        vnBankName: "Vietcombank",
        // vnBankAccount missing
        vnMomo: "0901234567",
      }),
      t,
    );
    expect(result).not.toContain("🏦 Vietcombank");
    // MoMo line still emits
    expect(result).toContain("💸 MoMo: 0901234567");
  });

  it("never renders the Vietnam donate block when language is not 'vi'", () => {
    const t = createMockT("en");
    const result = buildDescription(
      makeInput({
        language: "en",
        vnBankName: "Vietcombank",
        vnBankAccount: "0123456789",
        vnMomo: "0901234567",
      }),
      t,
    );
    expect(result).not.toContain("BANK TRANSFER");
    expect(result).not.toContain("🏦 Vietcombank");
    expect(result).not.toContain("💸 MoMo");
  });

  it("renders the Mod List block when videoType is 'mods' and modList is non-empty", () => {
    const t = createMockT("en");
    const modList = "• Requiem\n• NaturalVision Evolved\n• Custom Skinpack v2.1";
    const result = buildDescription(
      makeInput({
        videoType: "mods",
        modName: "Requiem",
        modList,
      }),
      t,
    );
    expect(result).toContain("🧩 MOD LIST");
    expect(result).toContain(modList);
  });

  it("never renders the Mod List block for non-mods video types", () => {
    const t = createMockT("en");
    const result = buildDescription(
      makeInput({
        videoType: "full",
        modList: "• Requiem",
      }),
      t,
    );
    expect(result).not.toContain("MOD LIST");
    expect(result).not.toContain("Requiem");
  });

  it("skips the livestream block when no live metadata is set", () => {
    const t = createMockT("en");
    const result = buildDescription(
      makeInput({
        videoType: "livestream",
        gameName: "Elden Ring",
        channelName: "TestChannel",
      }),
      t,
    );
    // Intro still emits, but no metadata block
    expect(result).toContain("Live stream of Elden Ring on TestChannel");
    expect(result).not.toContain("🔴 LIVE on");
    expect(result).not.toContain("Watch / replay:");
  });

  it("includes rig info when provided", () => {
    const t = createMockT("en");
    const result = buildDescription(
      makeInput({ rig: { CPU: "i9-14900K", GPU: "RTX 4090" } }),
      t,
    );
    expect(result).toContain("MY RIG");
    expect(result).toContain("CPU: i9-14900K");
    expect(result).toContain("GPU: RTX 4090");
  });

  it("humanises snake_case rig keys (e.g. video_editor → VIDEO EDITOR)", () => {
    const t = createMockT("en");
    const result = buildDescription(
      makeInput({ rig: { video_editor: "davinci_resolve_studio|19.1" } }),
      t,
    );
    expect(result).toContain("VIDEO EDITOR: DaVinci Resolve Studio 19.1");
    expect(result).not.toContain("VIDEO_EDITOR");
  });

  it("legacy spoilerWarning boolean no longer renders a standalone block (v0.11 deprecation)", () => {
    // v0.11: the standalone SPOILER WARNING section was merged into the
    // unified content-warning checklist as the `spoiler_story` item.
    // Setting just the legacy boolean (without the equivalent checklist
    // entry) renders nothing — by design; the editor-store v8→v9
    // migration translates true→checklist for persisted drafts, and
    // `normalizeEditorPatch` does the same for profile/preset/template
    // loads, so live drafts surface the warning correctly.
    const t = createMockT("en");
    const result = buildDescription(makeInput({ spoilerWarning: true }), t);
    expect(result).not.toContain("SPOILER WARNING");
    expect(result).not.toContain("CONTENT WARNINGS");
  });

  it("includes music attribution section when provided", () => {
    const t = createMockT("en");
    const result = buildDescription(
      makeInput({ musicAttribution: "Music by Karl Casey @ White Bat Audio" }),
      t,
    );
    expect(result).toContain("🎵 MUSIC / SOUND");
    expect(result).toContain("Music by Karl Casey @ White Bat Audio");
  });

  it("places music section before donate/social sections", () => {
    const t = createMockT("en");
    const result = buildDescription(
      makeInput({
        musicAttribution: "Music credit here",
        social: { twitter: "https://x.com/me", kofi: "https://ko-fi.com/me" },
      }),
      t,
    );
    const musicIdx = result.indexOf("🎵 MUSIC / SOUND");
    const donateIdx = result.indexOf("SUPPORT THE CHANNEL");
    expect(musicIdx).toBeGreaterThan(-1);
    expect(donateIdx).toBeGreaterThan(-1);
    expect(musicIdx).toBeLessThan(donateIdx);
  });

  it("renders the sponsor credit line when toggle is on and both sponsor fields are filled", () => {
    const t = createMockT("en");
    const result = buildDescription(
      makeInput({ sponsorName: "Ubisoft", sponsorPlatform: "Steam" }),
      t,
      { showSponsorCredit: true },
    );
    expect(result).toContain("🎁 Thanks to Ubisoft for providing the Steam key of this game.");
  });

  it("skips the sponsor credit when the toggle is off", () => {
    const t = createMockT("en");
    const result = buildDescription(
      makeInput({ sponsorName: "Ubisoft", sponsorPlatform: "Steam" }),
      t,
      { showSponsorCredit: false },
    );
    expect(result).not.toContain("🎁 Thanks to Ubisoft");
  });

  it("skips the sponsor credit when sponsorName is blank even if toggle is on", () => {
    const t = createMockT("en");
    const result = buildDescription(
      makeInput({ sponsorName: "", sponsorPlatform: "Steam" }),
      t,
      { showSponsorCredit: true },
    );
    expect(result).not.toContain("🎁");
    expect(result).not.toContain("Steam key of this game");
  });

  it("skips the sponsor credit when sponsorPlatform is blank even if toggle is on", () => {
    const t = createMockT("en");
    const result = buildDescription(
      makeInput({ sponsorName: "Ubisoft", sponsorPlatform: "" }),
      t,
      { showSponsorCredit: true },
    );
    expect(result).not.toContain("🎁");
    expect(result).not.toContain("Thanks to Ubisoft");
  });

  it("trims whitespace around sponsor fields before rendering", () => {
    const t = createMockT("en");
    const result = buildDescription(
      makeInput({ sponsorName: "  Ubisoft  ", sponsorPlatform: "  Steam  " }),
      t,
      { showSponsorCredit: true },
    );
    expect(result).toContain("Thanks to Ubisoft for providing the Steam key");
    expect(result).not.toContain("  Ubisoft  ");
  });

  it("places the sponsor credit above the music section and donate block", () => {
    const t = createMockT("en");
    const result = buildDescription(
      makeInput({
        sponsorName: "Ubisoft",
        sponsorPlatform: "Steam",
        musicAttribution: "Music credit",
        social: { kofi: "https://ko-fi.com/me" },
      }),
      t,
      { showSponsorCredit: true },
    );
    const sponsorIdx = result.indexOf("🎁");
    const musicIdx = result.indexOf("🎵 MUSIC / SOUND");
    const donateIdx = result.indexOf("SUPPORT THE CHANNEL");
    expect(sponsorIdx).toBeGreaterThan(-1);
    expect(musicIdx).toBeGreaterThan(sponsorIdx);
    expect(donateIdx).toBeGreaterThan(musicIdx);
  });

  it("renders sponsor credit in Vietnamese with the localized template", () => {
    const t = createMockT("vi");
    const result = buildDescription(
      makeInput({
        language: "vi",
        sponsorName: "Ubisoft",
        sponsorPlatform: "Steam",
      }),
      t,
      { showSponsorCredit: true },
    );
    expect(result).toContain("🎁 Cảm ơn Ubisoft đã tặng key Steam của game này.");
  });

  it("omits the music section when attribution is blank or whitespace", () => {
    const t = createMockT("en");
    const blank = buildDescription(makeInput({ musicAttribution: "" }), t);
    const whitespace = buildDescription(makeInput({ musicAttribution: "   \n  " }), t);
    expect(blank).not.toContain("🎵 MUSIC / SOUND");
    expect(whitespace).not.toContain("🎵 MUSIC / SOUND");
  });

  it("renders copyright line when showCopyright is true and channelName is set", () => {
    const t = createMockT("en");
    const result = buildDescription(makeInput(), t, { showCopyright: true });
    const year = new Date().getFullYear();
    expect(result).toContain(`© ${year} TestChannel. All rights reserved.`);
  });

  it("skips copyright when channelName is blank even if toggle is on", () => {
    const t = createMockT("en");
    const result = buildDescription(makeInput({ channelName: "" }), t, {
      showCopyright: true,
    });
    expect(result).not.toContain("All rights reserved");
  });

  it("skips copyright when the toggle is off", () => {
    const t = createMockT("en");
    const result = buildDescription(makeInput(), t, { showCopyright: false });
    expect(result).not.toContain("All rights reserved");
  });

  it("renders the usage policy block when showUsagePolicy is true", () => {
    const t = createMockT("en");
    const result = buildDescription(makeInput(), t, { showUsagePolicy: true });
    expect(result).toContain("📋 USAGE POLICY");
    expect(result).toContain("Always credit");
    expect(result).toContain("Compilation, review, commentary");
  });

  it("skips the usage policy when the toggle is off", () => {
    const t = createMockT("en");
    const result = buildDescription(makeInput(), t, { showUsagePolicy: false });
    expect(result).not.toContain("📋 USAGE POLICY");
  });

  it("places copyright and usage policy between CTA and hashtags", () => {
    const t = createMockT("en");
    const result = buildDescription(makeInput(), t, {
      showCopyright: true,
      showUsagePolicy: true,
    });
    const ctaIdx = result.indexOf("Like | 🔔 Subscribe");
    const copyrightIdx = result.indexOf("All rights reserved");
    const policyIdx = result.indexOf("📋 USAGE POLICY");
    const hashtagsIdx = result.indexOf("#EldenRing");
    expect(ctaIdx).toBeGreaterThan(-1);
    expect(copyrightIdx).toBeGreaterThan(ctaIdx);
    expect(policyIdx).toBeGreaterThan(copyrightIdx);
    expect(hashtagsIdx).toBeGreaterThan(policyIdx);
  });

  it("renders third-party ads block when toggle is on AND text is non-empty (v0.11)", () => {
    const t = createMockT("en");
    const result = buildDescription(
      makeInput({ thirdPartyAdText: "Use code SAVE10 at GameStore.com" }),
      t,
      { showThirdPartyAds: true },
    );
    expect(result).toContain("🤝 SPONSORS & PARTNERS");
    expect(result).toContain("Use code SAVE10 at GameStore.com");
  });

  it("preserves multi-line third-party ad text verbatim (v0.11)", () => {
    const t = createMockT("en");
    const adText = "Sponsored by ChairCo — link below\nUse code SAVE10 for 10% off";
    const result = buildDescription(
      makeInput({ thirdPartyAdText: adText }),
      t,
      { showThirdPartyAds: true },
    );
    expect(result).toContain(adText);
  });

  it("skips ads block when toggle is off, even with non-empty text (v0.11)", () => {
    const t = createMockT("en");
    const result = buildDescription(
      makeInput({ thirdPartyAdText: "Sponsor copy" }),
      t,
      { showThirdPartyAds: false },
    );
    expect(result).not.toContain("SPONSORS & PARTNERS");
    expect(result).not.toContain("Sponsor copy");
  });

  it("skips ads block when toggle is on but text is empty (v0.11)", () => {
    const t = createMockT("en");
    const result = buildDescription(
      makeInput({ thirdPartyAdText: "  " }),
      t,
      { showThirdPartyAds: true },
    );
    expect(result).not.toContain("SPONSORS & PARTNERS");
  });

  it("legacy matureWarning boolean no longer renders a standalone block (v0.11 deprecation)", () => {
    // Counterpart to the spoilerWarning deprecation test: the standalone
    // MATURE CONTENT section was merged into the unified checklist as
    // the `mature_18plus` item. Migration handles persisted state.
    const t = createMockT("en");
    const result = buildDescription(makeInput({ matureWarning: true }), t);
    expect(result).not.toContain("MATURE CONTENT");
    expect(result).not.toContain("CONTENT WARNINGS");
  });

  it("includes social links when provided", () => {
    const t = createMockT("en");
    const result = buildDescription(
      makeInput({ social: { twitter: "https://x.com/test", discord: "https://discord.gg/test" } }),
      t,
    );
    expect(result).toContain("FOLLOW ME");
    expect(result).toContain("Twitter / X: https://x.com/test");
  });

  it("includes playlist link when provided", () => {
    const t = createMockT("en");
    const result = buildDescription(
      makeInput({ playlistLink: "https://youtube.com/playlist?list=abc" }),
      t,
    );
    expect(result).toContain("Watch the full series: https://youtube.com/playlist?list=abc");
  });

  it("includes contact email when provided", () => {
    const t = createMockT("en");
    const result = buildDescription(
      makeInput({ contactEmail: "test@example.com" }),
      t,
    );
    expect(result).toContain("Business inquiries: test@example.com");
  });

  it("generates part description correctly", () => {
    const t = createMockT("en");
    const result = buildDescription(
      makeInput({ videoType: "part", partNumber: "5" }),
      t,
    );
    expect(result).toContain("Part 5 of Elden Ring");
  });

  it("generates boss description correctly", () => {
    const t = createMockT("en");
    const result = buildDescription(
      makeInput({ videoType: "boss", bossName: "Margit" }),
      t,
    );
    expect(result).toContain("Margit boss fight");
  });

  it("generates description in Vietnamese", () => {
    const t = createMockT("vi");
    const result = buildDescription(makeInput({ language: "vi" }), t);
    expect(result).toContain("full gameplay của Elden Ring");
    expect(result).toContain("Không bình luận");
  });
});

describe("buildDescription — v0.12 Playthrough Notes consolidation", () => {
  it("renders run type as a bullet of the unified PLAYTHROUGH NOTES block", () => {
    const t = createMockT("en");
    const result = buildDescription(
      makeInput({ playthroughStatus: "blind" }),
      t,
    );
    expect(result).toContain("▸ 🎮 PLAYTHROUGH NOTES");
    expect(result).toContain("• Run type: Blind run (first time playing)");
    // The block sits between the intro and No Commentary, replacing the
    // pre-v0.12 standalone "🎯 Playthrough:" line.
    const introIdx = result.indexOf("full gameplay of Elden Ring");
    const pnIdx = result.indexOf("▸ 🎮 PLAYTHROUGH NOTES");
    const noCommentaryIdx = result.indexOf("No Commentary");
    expect(pnIdx).toBeGreaterThan(introIdx);
    expect(noCommentaryIdx).toBeGreaterThan(pnIdx);
    // The legacy single-line block must NOT render anymore.
    expect(result).not.toContain("🎯 Playthrough:");
  });

  it("omits the entire PLAYTHROUGH NOTES block when every field is unset", () => {
    const t = createMockT("en");
    const result = buildDescription(
      makeInput({
        playthroughStatus: "none",
        difficulty: "none",
        endingsShown: "",
        languagePatch: "none",
        gameVersion: "full_release",
      }),
      t,
    );
    expect(result).not.toContain("▸ 🎮 PLAYTHROUGH NOTES");
    expect(result).not.toContain("🎯 Playthrough");
    expect(result).not.toContain("🎮 DIFFICULTY");
  });

  it("renders difficulty as a bullet using the preset label", () => {
    const t = createMockT("en");
    const result = buildDescription(makeInput({ difficulty: "hard" }), t);
    expect(result).toContain("▸ 🎮 PLAYTHROUGH NOTES");
    expect(result).toContain("• Difficulty: Hard");
    // Old standalone block must be gone.
    expect(result).not.toContain("🎮 DIFFICULTY\n");
  });

  it("uses the custom difficulty label verbatim when difficulty is 'custom'", () => {
    const t = createMockT("en");
    const result = buildDescription(
      makeInput({ difficulty: "custom", difficultyCustomLabel: "Lethal" }),
      t,
    );
    expect(result).toContain("• Difficulty: Lethal");
  });

  it("skips the Difficulty bullet when difficulty='custom' but label is blank", () => {
    const t = createMockT("en");
    const result = buildDescription(
      makeInput({ difficulty: "custom", difficultyCustomLabel: "   " }),
      t,
    );
    // The whole PN block should be skipped (no other PN field set either).
    expect(result).not.toContain("▸ 🎮 PLAYTHROUGH NOTES");
  });

  it("renders all five PLAYTHROUGH NOTES bullets when fully filled", () => {
    const t = createMockT("en");
    const result = buildDescription(
      makeInput({
        playthroughStatus: "blind",
        difficulty: "hard",
        endingsShown: "True ending only",
        languagePatch: "fan_translation",
        gameVersion: "early_access",
      }),
      t,
    );
    expect(result).toContain("▸ 🎮 PLAYTHROUGH NOTES");
    expect(result).toContain("• Run type: Blind run (first time playing)");
    expect(result).toContain("• Difficulty: Hard");
    expect(result).toContain("• Endings shown: True ending only");
    expect(result).toContain("• Language patch: Fan translation");
    expect(result).toContain("• Game version: Early Access");
  });

  it("uses the custom slot for languagePatch='official_other'", () => {
    const t = createMockT("en");
    const result = buildDescription(
      makeInput({
        languagePatch: "official_other",
        languagePatchCustom: "Official KR",
      }),
      t,
    );
    expect(result).toContain("• Language patch: Official KR");
  });

  it("uses the custom slot for gameVersion='custom'", () => {
    const t = createMockT("en");
    const result = buildDescription(
      makeInput({
        gameVersion: "custom",
        gameVersionCustom: "Kickstarter backer build",
      }),
      t,
    );
    expect(result).toContain("• Game version: Kickstarter backer build");
  });

  it("renders bilingual EN · VI bullets when language=vi and tEn is provided", () => {
    const t = createMockT("vi");
    const tEn = createMockT("en");
    const result = buildDescription(
      makeInput({
        language: "vi",
        playthroughStatus: "blind",
        difficulty: "hard",
        languagePatch: "fan_translation",
      }),
      t,
      { tEn },
    );
    expect(result).toContain(
      "▸ 🎮 PLAYTHROUGH NOTES / ▸ 🎮 GHI CHÚ LƯỢT CHƠI",
    );
    expect(result).toContain(
      "• Run type · Kiểu chơi: Blind run (first time playing) · Chơi lần đầu (blind run)",
    );
    expect(result).toContain("• Difficulty · Độ khó: Hard · Khó");
    expect(result).toContain(
      "• Language patch · Bản dịch: Fan translation · Bản dịch của fan",
    );
  });
});

describe("buildDescription — v0.12 Tech Notes", () => {
  it("renders selected tech notes as a bulleted block (en single-language)", () => {
    const t = createMockT("en");
    const result = buildDescription(
      makeInput({
        techNotes: ["copyright_muted_sections", "fps_drops_hardware"],
      }),
      t,
    );
    expect(result).toContain("▸ 🛠 TECH NOTES");
    expect(result).toContain(
      "Production and playstyle notes for transparency.",
    );
    expect(result).toContain(
      "• Some sections muted due to YouTube copyright",
    );
    expect(result).toContain(
      "• FPS drops — caused by hardware (FPS counter visible top-left)",
    );
    expect(result).not.toContain("• Game music replaced");
  });

  it("omits the TECH NOTES block when the list is empty", () => {
    const t = createMockT("en");
    const result = buildDescription(makeInput({ techNotes: [] }), t);
    expect(result).not.toContain("TECH NOTES");
  });

  it("preserves selection order in the rendered tech-note bullets", () => {
    const t = createMockT("en");
    const result = buildDescription(
      makeInput({
        techNotes: [
          "not_no_hit_run",
          "support_developers",
          "loading_cut",
        ],
      }),
      t,
    );
    const noHitIdx = result.indexOf("• NOT a no-hit run");
    const supportIdx = result.indexOf("• Original game music");
    const loadingIdx = result.indexOf("• Loading screens");
    expect(noHitIdx).toBeGreaterThan(-1);
    expect(supportIdx).toBeGreaterThan(noHitIdx);
    expect(loadingIdx).toBeGreaterThan(supportIdx);
  });

  it("renders bilingual EN · VI tech-note bullets when language=vi and tEn provided", () => {
    const t = createMockT("vi");
    const tEn = createMockT("en");
    const result = buildDescription(
      makeInput({
        language: "vi",
        techNotes: ["copyright_muted_sections", "casual_no_commentary"],
      }),
      t,
      { tEn },
    );
    expect(result).toContain("▸ 🛠 TECH NOTES / ▸ 🛠 GHI CHÚ KỸ THUẬT");
    expect(result).toContain(
      "• Some sections muted due to YouTube copyright · Một số đoạn tắt tiếng do bản quyền YouTube",
    );
    expect(result).toContain(
      "• Casual play, no commentary · Chơi giải trí, không bình luận",
    );
  });

  it("renders bilingual EN · JA tech-note bullets in Japanese mode", () => {
    const t = createMockT("ja");
    const tEn = createMockT("en");
    const result = buildDescription(
      makeInput({
        language: "ja",
        techNotes: ["fps_drops_hardware", "support_developers"],
      }),
      t,
      { tEn },
    );
    expect(result).toContain("▸ 🛠 TECH NOTES / ▸ 🛠 技術メモ");
    expect(result).toContain(
      "• FPS drops — caused by hardware (FPS counter visible top-left) · FPS低下 — ハード起因（左上にFPS表示）",
    );
    expect(result).toContain(
      "• Original game music — please support the developers · 原曲使用 — 開発者への応援をよろしくお願いします",
    );
  });

  it("falls back to single-language tech-note bullets when tEn is omitted", () => {
    const t = createMockT("vi");
    const result = buildDescription(
      makeInput({ language: "vi", techNotes: ["fps_drops_hardware"] }),
      t,
    );
    // No `· ` separator since tEn isn't passed.
    expect(result).not.toContain(" · ");
    expect(result).toContain("▸ 🛠 GHI CHÚ KỸ THUẬT");
    expect(result).toContain(
      "• Có sụt FPS — do phần cứng (xem FPS góc trái video)",
    );
  });
});

describe("buildDescription — v0.7 content fields (legacy)", () => {
  it("renders content warnings as a bulleted block (v0.11 unified, en single-language)", () => {
    const t = createMockT("en");
    const result = buildDescription(
      makeInput({ contentWarnings: ["flashing_lights", "loud_noises"] }),
      t,
    );
    expect(result).toContain("▸ ⚠️ CONTENT WARNINGS");
    expect(result).toContain(
      "This video contains the following content. Viewer discretion advised.",
    );
    expect(result).toContain(
      "• Flashing lights — photosensitive viewers take care",
    );
    expect(result).toContain("• Loud / sudden sounds");
    expect(result).not.toContain("• Jumpscares");
  });

  it("omits the content-warnings block when the list is empty", () => {
    const t = createMockT("en");
    const result = buildDescription(makeInput({ contentWarnings: [] }), t);
    expect(result).not.toContain("CONTENT WARNINGS");
  });

  it("preserves selection order in the rendered bullets (v0.11)", () => {
    const t = createMockT("en");
    const result = buildDescription(
      makeInput({
        contentWarnings: ["mature_18plus", "flashing_lights", "spoiler_story"],
      }),
      t,
    );
    const matureIdx = result.indexOf("• Mature themes");
    const flashIdx = result.indexOf("• Flashing lights");
    const spoilerIdx = result.indexOf("• Spoilers");
    expect(matureIdx).toBeGreaterThan(-1);
    expect(flashIdx).toBeGreaterThan(matureIdx);
    expect(spoilerIdx).toBeGreaterThan(flashIdx);
  });

  it("renders bilingual EN · VI when output language is vi and tEn is provided (v0.11)", () => {
    const t = createMockT("vi");
    const tEn = createMockT("en");
    const result = buildDescription(
      makeInput({
        language: "vi",
        contentWarnings: ["jump_scares", "flashing_lights"],
      }),
      t,
      { tEn },
    );
    // Header is bilingual: EN / VI
    expect(result).toContain("▸ ⚠️ CONTENT WARNINGS / ▸ ⚠️ CẢNH BÁO NỘI DUNG");
    // Two-line intro
    expect(result).toContain(
      "This video contains the following content. Viewer discretion advised.",
    );
    expect(result).toContain("Video này chứa các nội dung sau");
    // Bullets pair EN with VI using U+00B7 MIDDLE DOT
    expect(result).toContain("• Jumpscares · Có jumpscare");
    expect(result).toContain(
      "• Flashing lights — photosensitive viewers take care · Hiệu ứng chớp sáng — người nhạy sáng cẩn thận",
    );
  });

  it("falls back to single-language when tEn is omitted (v0.11 back-compat)", () => {
    const t = createMockT("vi");
    const result = buildDescription(
      makeInput({ language: "vi", contentWarnings: ["jump_scares"] }),
      t,
    );
    // No `· ` separator since tEn is not provided
    expect(result).not.toContain(" · ");
    expect(result).toContain("▸ ⚠️ CẢNH BÁO NỘI DUNG");
    expect(result).toContain("• Có jumpscare");
  });

  it("censors YouTube-flag-prone Vietnamese terms with asterisks (v0.11)", () => {
    const t = createMockT("vi");
    const tEn = createMockT("en");
    const result = buildDescription(
      makeInput({
        language: "vi",
        contentWarnings: ["sexual_assault", "self_harm", "detailed_killing", "child_harm"],
      }),
      t,
      { tEn },
    );
    // Asterisk-masked terms ARE present
    expect(result).toContain("x*m h*i");
    expect(result).toContain("t* tử");
    expect(result).toContain("g*ết người");
    expect(result).toContain("ng*y h*i");
    // Uncensored terms are NOT present
    expect(result).not.toContain("xâm hại");
    expect(result).not.toContain("tự tử");
    expect(result).not.toContain("giết người");
    // EN side stays clinical (no censoring needed)
    expect(result).toContain("Sexual assault references");
    expect(result).toContain("Self-harm / suicide themes");
  });
});

describe("buildDescription — gacha_quest video type (v0.9)", () => {
  it("dispatches to the per-quest-type intro for main_story", () => {
    const t = createMockT("en");
    const result = buildDescription(
      makeInput({
        videoType: "gacha_quest",
        gachaQuestType: "main_story",
        gameName: "Genshin Impact",
        chapterName: "Chapter 5 Act 2: Where the Stars Fall",
      }),
      t,
    );
    expect(result).toContain(
      "Welcome to Chapter 5 Act 2: Where the Stars Fall of Genshin Impact on TestChannel!",
    );
  });

  it("dispatches to the per-quest-type intro for world_quest", () => {
    const t = createMockT("en");
    const result = buildDescription(
      makeInput({
        videoType: "gacha_quest",
        gachaQuestType: "world_quest",
        gameName: "Genshin Impact",
        questName: "A Solitary Constellation",
      }),
      t,
    );
    expect(result).toContain(
      'Today\'s video covers the World Quest "A Solitary Constellation" in Genshin Impact on TestChannel.',
    );
  });

  it("dispatches to the per-quest-type intro for endgame", () => {
    const t = createMockT("en");
    const result = buildDescription(
      makeInput({
        videoType: "gacha_quest",
        gachaQuestType: "endgame",
        gameName: "Honkai: Star Rail",
        chapterName: "Memory of Chaos",
      }),
      t,
    );
    expect(result).toContain(
      'Endgame mode "Memory of Chaos" in Honkai: Star Rail on TestChannel.',
    );
  });

  it("falls back to main_story intro when gachaQuestType is missing", () => {
    const t = createMockT("en");
    const result = buildDescription(
      makeInput({
        videoType: "gacha_quest",
        gameName: "Wuthering Waves",
        chapterName: "Chapter 1",
      }),
      t,
    );
    expect(result).toContain(
      "Welcome to Chapter 1 of Wuthering Waves on TestChannel!",
    );
  });
});

describe("checkDescriptionWarning", () => {
  it("returns null for description under limit", () => {
    expect(checkDescriptionWarning("Short description")).toBeNull();
  });

  it("returns warning for description exceeding 5000 chars", () => {
    const longDesc = "A".repeat(5001);
    const warning = checkDescriptionWarning(longDesc);
    expect(warning).not.toBeNull();
    expect(warning!.field).toBe("description");
    expect(warning!.limit).toBe(5000);
  });
});
