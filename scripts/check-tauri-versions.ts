/**
 * Verify the @tauri-apps/* npm packages and the tauri crates agree on
 * major.minor.
 *
 * The tauri CLI refuses to build a release when they differ ("Found version
 * mismatched Tauri packages"), but nothing in CI runs `tauri build` — so a
 * Dependabot bump of one side merges green and the break only shows up after
 * a release tag. This runs in CI instead. Run via `npm run check:tauri`.
 */
import { readFileSync } from "fs";
import { resolve } from "path";

const ROOT = resolve(import.meta.dirname, "..");

/** npm package → crate it must match. */
const PAIRS: ReadonlyArray<[npm: string, crate: string]> = [
  ["@tauri-apps/api", "tauri"],
  ["@tauri-apps/cli", "tauri"],
  ["@tauri-apps/plugin-opener", "tauri-plugin-opener"],
];

function npmVersion(name: string): string | null {
  const lock = JSON.parse(readFileSync(resolve(ROOT, "package-lock.json"), "utf8")) as {
    packages: Record<string, { version?: string }>;
  };
  return lock.packages[`node_modules/${name}`]?.version ?? null;
}

function crateVersion(name: string): string | null {
  const lock = readFileSync(resolve(ROOT, "src-tauri/Cargo.lock"), "utf8").replace(/\r\n/g, "\n");
  const match = new RegExp(`\\[\\[package\\]\\]\\nname = "${name}"\\nversion = "([^"]+)"`).exec(
    lock,
  );
  return match?.[1] ?? null;
}

const majorMinor = (version: string): string => version.split(".").slice(0, 2).join(".");

let failed = false;
for (const [npm, crate] of PAIRS) {
  const js = npmVersion(npm);
  const rs = crateVersion(crate);
  if (js === null || rs === null) continue; // not used on one side
  const ok = majorMinor(js) === majorMinor(rs);
  console.log(`${ok ? "✓" : "✗"} ${npm} ${js}  ↔  ${crate} ${rs}`);
  if (!ok) failed = true;
}

if (failed) {
  console.error(
    "\nTauri npm packages and crates differ in major.minor — `tauri build` will refuse to run.\n" +
      "Update the lagging side on this branch, e.g. `cd src-tauri && cargo update -p tauri` or\n" +
      "`npm install @tauri-apps/api@<crate version>`.",
  );
  process.exit(1);
}
