/**
 * Verify that every manifest carrying the app version agrees.
 *
 * A release bumps SIX places, and nothing but this script notices when one is
 * missed. A stale `tauri.conf.json` ships an installer whose About screen and
 * updater metadata disagree with the tag; a stale `Cargo.lock` self-entry makes
 * the next `cargo build` rewrite the lockfile mid-release.
 *
 * Run via `npm run check:version`. Exits non-zero (and prints every mismatch,
 * not just the first) so CI fails the PR rather than the release.
 */
import { readFileSync } from "fs";
import { resolve } from "path";

interface VersionSource {
  /** Human-readable location, printed on mismatch. */
  label: string;
  /** Repo-relative path. */
  file: string;
  /** Pull the version out of the file's raw text. */
  extract: (raw: string) => string | null;
}

/** Read `version` from a top-level JSON object. */
function jsonVersion(raw: string): string | null {
  const parsed: unknown = JSON.parse(raw);
  if (typeof parsed !== "object" || parsed === null) return null;
  const version = (parsed as Record<string, unknown>).version;
  return typeof version === "string" ? version : null;
}

const SOURCES: VersionSource[] = [
  {
    label: "package.json → version",
    file: "package.json",
    extract: jsonVersion,
  },
  {
    label: "package-lock.json → version",
    file: "package-lock.json",
    extract: jsonVersion,
  },
  {
    label: 'package-lock.json → packages[""].version',
    file: "package-lock.json",
    extract: (raw) => {
      const parsed: unknown = JSON.parse(raw);
      if (typeof parsed !== "object" || parsed === null) return null;
      const packages = (parsed as Record<string, unknown>).packages;
      if (typeof packages !== "object" || packages === null) return null;
      const root = (packages as Record<string, unknown>)[""];
      if (typeof root !== "object" || root === null) return null;
      const version = (root as Record<string, unknown>).version;
      return typeof version === "string" ? version : null;
    },
  },
  {
    label: "src-tauri/tauri.conf.json → version",
    file: "src-tauri/tauri.conf.json",
    extract: jsonVersion,
  },
  {
    label: "src-tauri/Cargo.toml → [package] version",
    file: "src-tauri/Cargo.toml",
    // Anchor on the [package] table so a dependency's `version = "…"` in the
    // same file can never be picked up instead.
    extract: (raw) => /^\[package\][\s\S]*?^version\s*=\s*"([^"]+)"/m.exec(raw)?.[1] ?? null,
  },
  {
    label: "src-tauri/Cargo.lock → yt-desc-gen entry",
    file: "src-tauri/Cargo.lock",
    extract: (raw) => /^name = "yt-desc-gen"\r?\nversion = "([^"]+)"/m.exec(raw)?.[1] ?? null,
  },
];

function main(): void {
  const found: { label: string; version: string | null }[] = SOURCES.map((source) => {
    let raw: string;
    try {
      raw = readFileSync(resolve(source.file), "utf8");
    } catch {
      return { label: source.label, version: null };
    }
    try {
      return { label: source.label, version: source.extract(raw) };
    } catch {
      return { label: source.label, version: null };
    }
  });

  const missing = found.filter((entry) => entry.version === null);
  const versions = [...new Set(found.map((entry) => entry.version).filter(Boolean))];

  if (missing.length === 0 && versions.length === 1) {
    console.log(`✓ All ${found.length} manifests agree on version ${versions[0]}`);
    return;
  }

  console.error("✗ Version manifests are out of sync.\n");
  for (const entry of found) {
    const mark = entry.version === null ? "?" : entry.version === versions[0] ? " " : "!";
    console.error(`  ${mark} ${entry.version ?? "<not found>"}  ${entry.label}`);
  }
  console.error(
    "\nBump every manifest to the same version before tagging. `npm version --no-git-tag-version <v>`",
  );
  console.error("covers package.json + package-lock.json; the three Rust/Tauri files are manual.");
  process.exit(1);
}

main();
