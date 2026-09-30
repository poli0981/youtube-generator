/**
 * Bundle budget for the web build — run after `npm run build`.
 *
 * CLAUDE.md used to say "keep the bundle under 500KB" without saying what was
 * measured, and nothing measured it. This does:
 *
 *  - INITIAL LOAD: every script, modulepreload and stylesheet `dist/index.html`
 *    references, summed gzip. That is what a first visit downloads before the
 *    app can render. Lazy chunks (pages, locales, the legal documents) are
 *    excluded on purpose — they only load when used.
 *  - LARGEST CHUNK: no single JS file over the raw limit, so one accidental
 *    import cannot balloon a lazy page either.
 *
 * Numbers are printed as a table (and to the GitHub step summary in CI).
 * Run via `npm run check:bundle`.
 */
import { appendFileSync, readFileSync, readdirSync } from "fs";
import { resolve } from "path";
import { gzipSync } from "zlib";

const DIST = resolve(import.meta.dirname, "../dist");

/** v1.0.0 baseline was 193 KB gzip before the redesign; keep headroom, not a blank cheque. */
export const INITIAL_GZIP_BUDGET = 280 * 1024;
export const MAX_CHUNK_RAW = 500 * 1024;

const kb = (bytes: number): string => `${(bytes / 1024).toFixed(1)} KB`;

function initialAssets(html: string): string[] {
  const refs = new Set<string>();
  const pattern = /(?:src|href)="\/(assets\/[^"]+\.(?:js|css))"/g;
  for (let match = pattern.exec(html); match; match = pattern.exec(html)) {
    if (match[1]) refs.add(match[1]);
  }
  return [...refs];
}

const html = readFileSync(resolve(DIST, "index.html"), "utf8");
const initial = initialAssets(html).map((file) => {
  const bytes = readFileSync(resolve(DIST, file));
  return { file, raw: bytes.length, gzip: gzipSync(bytes, { level: 9 }).length };
});
const initialGzip = initial.reduce((sum, a) => sum + a.gzip, 0);

const chunks = readdirSync(resolve(DIST, "assets"))
  .filter((name) => name.endsWith(".js"))
  .map((name) => ({ name, raw: readFileSync(resolve(DIST, "assets", name)).length }))
  .sort((a, b) => b.raw - a.raw);
const largest = chunks[0];

const rows = [
  `| Initial load (${initial.length} files, gzip) | ${kb(initialGzip)} | ${kb(INITIAL_GZIP_BUDGET)} | ${initialGzip <= INITIAL_GZIP_BUDGET ? "✅" : "❌"} |`,
  `| Largest chunk (${largest?.name ?? "—"}, raw) | ${kb(largest?.raw ?? 0)} | ${kb(MAX_CHUNK_RAW)} | ${(largest?.raw ?? 0) <= MAX_CHUNK_RAW ? "✅" : "❌"} |`,
];
const table = ["| Metric | Size | Budget | |", "| --- | --- | --- | --- |", ...rows].join("\n");
console.log(table);
console.log("\nInitial-load files:");
for (const a of initial.sort((x, y) => y.gzip - x.gzip)) {
  console.log(
    `  ${a.file.padEnd(48)} ${kb(a.raw).padStart(10)} raw  ${kb(a.gzip).padStart(9)} gzip`,
  );
}

if (process.env.GITHUB_STEP_SUMMARY) {
  appendFileSync(process.env.GITHUB_STEP_SUMMARY, `### Bundle budget\n\n${table}\n`);
}

const overChunks = chunks.filter((c) => c.raw > MAX_CHUNK_RAW);
if (initialGzip > INITIAL_GZIP_BUDGET || overChunks.length > 0) {
  console.error(
    "\nBundle budget exceeded — lazy-load the new code or raise the budget deliberately.",
  );
  process.exit(1);
}
