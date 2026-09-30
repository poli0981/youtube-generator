/**
 * Rasterise the brand SVGs in `assets/brand/` into the web's static images.
 *
 * One source for every surface: the same `logo.svg` also feeds the Tauri
 * desktop + Android icons (`npx tauri icon assets/brand/logo.svg`), so the
 * favicon, the PWA icons, the link-preview card and the installed app can no
 * longer drift apart the way the pink favicon and the flat indigo square did
 * before v1.0.0.
 *
 * Run via `npm run generate:brand`. The PNGs are committed; this only needs
 * re-running when an SVG in `assets/brand/` changes. Text in the OG card is
 * laid out with the machine's fonts (Segoe UI on Windows), so regenerate on a
 * machine that has a sans-serif covering Latin — the output is checked in, not
 * rebuilt in CI.
 */
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { dirname, resolve } from "path";
import { Resvg } from "@resvg/resvg-js";

const ROOT = resolve(import.meta.dirname, "..");
const BRAND = resolve(ROOT, "assets/brand");
const PUBLIC = resolve(ROOT, "public");

interface Target {
  source: string;
  out: string;
  /** Output width in px; height follows the SVG's aspect ratio. */
  width: number;
}

const TARGETS: readonly Target[] = [
  { source: "logo.svg", out: "apple-touch-icon.png", width: 180 },
  { source: "logo.svg", out: "icons/icon-192.png", width: 192 },
  { source: "logo.svg", out: "icons/icon-512.png", width: 512 },
  { source: "logo-maskable.svg", out: "icons/maskable-512.png", width: 512 },
  { source: "og-image.svg", out: "og-image.png", width: 1200 },
];

function render({ source, out, width }: Target): void {
  const svg = readFileSync(resolve(BRAND, source), "utf8");
  const png = new Resvg(svg, {
    fitTo: { mode: "width", value: width },
    font: { loadSystemFonts: true, defaultFontFamily: "Segoe UI" },
  })
    .render()
    .asPng();
  const target = resolve(PUBLIC, out);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, png);
  console.log(`  ${out.padEnd(24)} ${width}px  ${(png.length / 1024).toFixed(1)} KB`);
}

console.log("Rendering brand assets → public/");
for (const target of TARGETS) render(target);

// The favicon ships as the SVG itself — crisp at every size, one request.
copyFileSync(resolve(BRAND, "logo.svg"), resolve(PUBLIC, "favicon.svg"));
console.log("  favicon.svg              (copied)");

// Legacy `/favicon.ico` requests (browsers still probe it) get the multi-size
// ICO that `tauri icon` generates from the same logo.
copyFileSync(resolve(ROOT, "src-tauri/icons/icon.ico"), resolve(PUBLIC, "favicon.ico"));
console.log("  favicon.ico              (from src-tauri/icons/icon.ico)");

// Android adaptive icon. `tauri icon` pads the whole rounded-square logo onto
// a white background layer, which reads as a purple tile on a white disc in
// the launcher. Replace its foreground with the bare glyph and give the
// background layer the brand colour, in both the generated Gradle project and
// the `icons/android` copy `tauri android init` would restore from.
const ANDROID_BACKGROUND = "#8561F4"; // midpoint of the #6366F1 → #A855F7 logo gradient
const FOREGROUND_SIZES: Readonly<Record<string, number>> = {
  "mipmap-mdpi": 108,
  "mipmap-hdpi": 162,
  "mipmap-xhdpi": 216,
  "mipmap-xxhdpi": 324,
  "mipmap-xxxhdpi": 432,
};
const ANDROID_RES_DIRS = [
  resolve(ROOT, "src-tauri/gen/android/app/src/main/res"),
  resolve(ROOT, "src-tauri/icons/android"),
];
const foregroundSvg = readFileSync(resolve(BRAND, "logo-foreground.svg"), "utf8");
for (const resDir of ANDROID_RES_DIRS) {
  for (const [bucket, size] of Object.entries(FOREGROUND_SIZES)) {
    const png = new Resvg(foregroundSvg, { fitTo: { mode: "width", value: size } })
      .render()
      .asPng();
    mkdirSync(resolve(resDir, bucket), { recursive: true });
    writeFileSync(resolve(resDir, bucket, "ic_launcher_foreground.png"), png);
  }
  mkdirSync(resolve(resDir, "values"), { recursive: true });
  writeFileSync(
    resolve(resDir, "values/ic_launcher_background.xml"),
    `<?xml version="1.0" encoding="utf-8"?>\n<resources>\n  <color name="ic_launcher_background">${ANDROID_BACKGROUND}</color>\n</resources>\n`,
  );
}
console.log(`  android adaptive icon    glyph foreground + ${ANDROID_BACKGROUND} background`);
