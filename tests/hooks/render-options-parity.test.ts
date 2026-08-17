import { describe, it, expect } from "vitest";
import {
  buildRenderOptions,
  SETTINGS_DERIVED_RENDER_KEYS,
  type RenderSettingsSlice,
} from "@hooks/use-render-options";
import { initialSettings } from "@store/settings-heal";
import { buildDescription } from "@engine/description-builder";
import { renderAll } from "@engine/template-renderer";
import { DEFAULTS } from "@config/defaults";
import type { GeneratorInput } from "@engine/types";
import { createMockT } from "../helpers/mock-t";

/**
 * Regression suite for the v0.34.0 bug where `splitContactEmail` reached the
 * engine from the Output tab but not from Batch.
 *
 * `renderAll` had three call sites, each hand-copying the same list of settings
 * fields into an options object. BatchPage's copy was missing two of them, so a
 * creator with split contact emails configured saw all three labeled lines on
 * Output and only the legacy single "📧 Business inquiries" line in Batch —
 * silently, because the engine simply defaults an absent flag to `false`.
 *
 * `buildRenderOptions` is now the single mapping. These tests are the runtime
 * half of the guard (the compile-time half is the
 * `Required<SettingsRenderOptions>` annotation inside it): they fail if a new
 * settings-derived option is added to the engine but never wired here.
 */

/** The settings slice the engine consumes, at its shipped defaults. */
function makeSettings(overrides: Partial<RenderSettingsSlice> = {}): RenderSettingsSlice {
  return {
    includeMultilingualTags: initialSettings.includeMultilingualTags,
    includeTrendingTags: initialSettings.includeTrendingTags,
    hashtagCount: initialSettings.hashtagCount,
    showQualityBadge: initialSettings.showQualityBadge,
    titleFormat: initialSettings.titleFormat,
    showCopyright: initialSettings.showCopyright,
    showUsagePolicy: initialSettings.showUsagePolicy,
    showSponsorCredit: initialSettings.showSponsorCredit,
    showThirdPartyAds: initialSettings.showThirdPartyAds,
    splitContactEmail: initialSettings.splitContactEmail,
    showGameCopyright: initialSettings.showGameCopyright,
    showTranslationQuality: initialSettings.showTranslationQuality,
    ...overrides,
  };
}

function makeInput(overrides: Partial<GeneratorInput> = {}): GeneratorInput {
  return {
    ...(DEFAULTS.editor as unknown as GeneratorInput),
    videoType: "full",
    language: "en",
    genres: ["horror"],
    gameName: "Test Game",
    ...overrides,
  };
}

describe("buildRenderOptions — settings → engine parity", () => {
  it("produces exactly the declared settings-derived keys, no more, no less", () => {
    const produced = Object.keys(buildRenderOptions(makeSettings())).sort();
    const declared = [...SETTINGS_DERIVED_RENDER_KEYS].sort();

    const missing = declared.filter((k) => !produced.includes(k));
    const extra = produced.filter((k) => !declared.includes(k as never));

    expect(
      { missing, extra },
      `buildRenderOptions drifted from SETTINGS_DERIVED_RENDER_KEYS. ` +
        `Missing ${JSON.stringify(missing)} (added to the engine but never wired), ` +
        `extra ${JSON.stringify(extra)} (produced but not declared). ` +
        `Both lists live in src/hooks/use-render-options.ts.`,
    ).toEqual({ missing: [], extra: [] });
  });

  it("copies each key from the matching settings field, not a neighbouring one", () => {
    // Flip every boolean away from its default and change the numeric, so a
    // copy-paste that reads the wrong settings field cannot coincidentally pass.
    const flipped = makeSettings({
      includeMultilingualTags: !initialSettings.includeMultilingualTags,
      includeTrendingTags: !initialSettings.includeTrendingTags,
      hashtagCount: initialSettings.hashtagCount + 1,
      showQualityBadge: !initialSettings.showQualityBadge,
      showCopyright: !initialSettings.showCopyright,
      showUsagePolicy: !initialSettings.showUsagePolicy,
      showSponsorCredit: !initialSettings.showSponsorCredit,
      showThirdPartyAds: !initialSettings.showThirdPartyAds,
      splitContactEmail: !initialSettings.splitContactEmail,
      showGameCopyright: !initialSettings.showGameCopyright,
      showTranslationQuality: !initialSettings.showTranslationQuality,
    });
    const built = buildRenderOptions(flipped) as Record<string, unknown>;

    for (const key of SETTINGS_DERIVED_RENDER_KEYS) {
      expect(built[key], `option "${key}" does not match settings.${key}`).toEqual(flipped[key]);
    }
  });

  it("carries splitContactEmail and showThirdPartyAds through (the v0.34.0 Batch bug)", () => {
    const opts = buildRenderOptions(
      makeSettings({ splitContactEmail: true, showThirdPartyAds: true }),
    );
    expect(opts.splitContactEmail).toBe(true);
    expect(opts.showThirdPartyAds).toBe(true);
  });

  it("omits per-caller overrides entirely when not supplied", () => {
    const opts = buildRenderOptions(makeSettings());
    // Absent, not `undefined` — the engine's `options?.tEn ?? t` fallback and
    // the `bilingualContentBlocks` default both key off absence. Batch relies
    // on this to stay single-language.
    expect("tEn" in opts).toBe(false);
    expect("bilingualContentBlocks" in opts).toBe(false);
  });

  it("applies per-caller overrides when supplied", () => {
    const tEn = createMockT("en");
    const opts = buildRenderOptions(makeSettings(), { tEn, bilingualContentBlocks: false });
    expect(opts.tEn).toBe(tEn);
    expect(opts.bilingualContentBlocks).toBe(false);
  });
});

describe("split contact email reaches the description via buildRenderOptions", () => {
  const input = makeInput({
    contactEmail: "hello@example.com",
    adEmail: "ads@example.com",
    gameKeyEmail: "keys@example.com",
  });

  it("renders all three labeled lines when the setting is on", () => {
    const t = createMockT("en");
    const description = buildDescription(
      input,
      t,
      buildRenderOptions(makeSettings({ splitContactEmail: true })),
    );

    expect(description).toContain("hello@example.com");
    expect(description).toContain("ads@example.com");
    expect(description).toContain("keys@example.com");
  });

  it("renders only the single business line when the setting is off", () => {
    const t = createMockT("en");
    const description = buildDescription(
      input,
      t,
      buildRenderOptions(makeSettings({ splitContactEmail: false })),
    );

    expect(description).toContain("hello@example.com");
    expect(description).not.toContain("ads@example.com");
    expect(description).not.toContain("keys@example.com");
  });

  it("survives the full renderAll path — the one Batch actually calls", () => {
    const t = createMockT("en");
    const output = renderAll(
      input,
      t,
      buildRenderOptions(makeSettings({ splitContactEmail: true })),
    );

    expect(output.description).toContain("ads@example.com");
    expect(output.description).toContain("keys@example.com");
  });
});
