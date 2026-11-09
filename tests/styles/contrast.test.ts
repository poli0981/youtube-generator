import { readFileSync } from "fs";
import { resolve } from "path";
import { describe, expect, it } from "vitest";

/**
 * WCAG 2.2 AA colour contrast for the design tokens in src/styles/globals.css
 * (ACCESSIBILITY.md promises it): 4.5:1 for text, 3:1 for marks that are not
 * text (a checkbox tick, a switch thumb). Change a token and this says which
 * pair stopped passing.
 */

const CSS = readFileSync(resolve(import.meta.dirname, "../../src/styles/globals.css"), "utf8");

type Rgb = readonly [number, number, number];

/** The declarations of the first `<selector> { … }` rule that defines the palette. */
function paletteBlock(selector: string): string {
  const rule = new RegExp(`(?:^|\\n)${selector.replace(".", "\\.")} \\{([^}]*)\\}`, "g");
  for (const match of CSS.matchAll(rule)) {
    const body = match[1] ?? "";
    if (body.includes("--surface-0:")) return body;
  }
  throw new Error(`no palette rule for ${selector}`);
}

function hexTokens(body: string): Map<string, Rgb> {
  const tokens = new Map<string, Rgb>();
  for (const [, name, hex] of body.matchAll(/--([a-z0-9-]+):\s?#([0-9a-f]{6});/gi)) {
    if (!name || !hex) continue;
    tokens.set(
      name,
      [0, 2, 4].map((i) => Number.parseInt(hex.slice(i, i + 2), 16)) as unknown as Rgb,
    );
  }
  return tokens;
}

function rgbaToken(body: string, name: string): { rgb: Rgb; alpha: number } {
  const match = new RegExp(
    `--${name}:\\s?rgba\\((\\d{1,3}), (\\d{1,3}), (\\d{1,3}), ([\\d.]{1,5})\\);`,
  ).exec(body);
  if (!match) throw new Error(`no rgba token --${name}`);
  return {
    rgb: [Number(match[1]), Number(match[2]), Number(match[3])],
    alpha: Number(match[4]),
  };
}

function luminance([r, g, b]: Rgb): number {
  const [lr, lg, lb] = [r, g, b].map((channel) => {
    const c = channel / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * lr + 0.7152 * lg + 0.0722 * lb;
}

function contrast(a: Rgb, b: Rgb): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

function over(top: { rgb: Rgb; alpha: number }, base: Rgb): Rgb {
  return top.rgb.map((c, i) =>
    Math.round(top.alpha * c + (1 - top.alpha) * (base[i] ?? 0)),
  ) as unknown as Rgb;
}

const darkBody = paletteBlock(":root");
const lightBody = paletteBlock(".light");
const dark = hexTokens(darkBody);
// The light theme overrides what it needs and inherits the rest.
const light = new Map([...dark, ...hexTokens(lightBody)]);

const THEMES = [
  { name: "dark", tokens: dark, body: darkBody },
  { name: "light", tokens: light, body: lightBody },
] as const;

const SURFACES = ["surface-0", "surface-1", "surface-2"] as const;
const TEXT_TOKENS = [
  "text-primary",
  "text-secondary",
  "text-muted",
  "accent",
  "success",
  "warning",
  "danger",
  "info",
  "donate",
] as const;

function token(tokens: Map<string, Rgb>, name: string): Rgb {
  const value = tokens.get(name);
  if (!value) throw new Error(`missing token --${name}`);
  return value;
}

describe.each(THEMES)("$name theme — WCAG AA contrast", ({ tokens, body }) => {
  it.each(TEXT_TOKENS)("--%s reads at 4.5:1 on every surface text sits on", (name) => {
    for (const surface of SURFACES) {
      const ratio = contrast(token(tokens, name), token(tokens, surface));
      expect(ratio, `--${name} on --${surface}`).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("--text-muted also reads at 4.5:1 on --surface-3 (hover rows, chips)", () => {
    expect(
      contrast(token(tokens, "text-muted"), token(tokens, "surface-3")),
    ).toBeGreaterThanOrEqual(4.5);
  });

  it.each(["accent-solid", "accent-solid-hover", "danger-solid", "danger-solid-hover"])(
    "white text reads at 4.5:1 on --%s (filled buttons)",
    (fill) => {
      expect(contrast(token(tokens, "accent-fg"), token(tokens, fill))).toBeGreaterThanOrEqual(4.5);
      expect(contrast([255, 255, 255], token(tokens, fill))).toBeGreaterThanOrEqual(4.5);
    },
  );

  it("marks on --accent (checkbox tick, switch thumb) reach 3:1", () => {
    expect(contrast(token(tokens, "accent-fg"), token(tokens, "accent"))).toBeGreaterThanOrEqual(3);
  });

  it("--accent text reads at 4.5:1 on its own tint (--accent-muted chips)", () => {
    const tint = over(rgbaToken(body, "accent-muted"), token(tokens, "surface-1"));
    expect(contrast(token(tokens, "accent"), tint)).toBeGreaterThanOrEqual(4.5);
  });
});

describe("contrast()", () => {
  it("matches the WCAG reference values", () => {
    expect(contrast([0, 0, 0], [255, 255, 255])).toBeCloseTo(21, 5);
    expect(contrast([255, 255, 255], [255, 255, 255])).toBe(1);
    // #767676 on white is the classic 4.54:1.
    expect(contrast([0x76, 0x76, 0x76], [255, 255, 255])).toBeCloseTo(4.54, 2);
  });
});
