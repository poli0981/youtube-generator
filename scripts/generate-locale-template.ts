/**
 * Scaffold a new locale directory from the English source.
 *
 * `package.json` has advertised `npm run generate:locale` since v0.1, and
 * `docs/I18N.md` step 1 tells contributors to run it — but the script was never
 * committed, so the documented first step of adding a language failed outright.
 * This is that script.
 *
 * Usage:
 *   npm run generate:locale -- --lang pt-BR            # empty values to translate
 *   npm run generate:locale -- --lang id --copy-english # pre-fill with EN text
 *   npm run generate:locale -- --lang id --force        # overwrite an existing dir
 *
 * Output mirrors `src/i18n/locales/en/{ui,templates}.json` key-for-key, so
 * `npm run validate:locales` passes the moment the files are written (it checks
 * key parity, not whether the values were actually translated).
 *
 * Registering the locale in code is NOT done here — see the checklist printed
 * on success, and docs/I18N.md.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join, resolve } from "path";

const LOCALES_DIR = resolve("src/i18n/locales");
const SOURCE_LOCALE = "en";
const NAMESPACES = ["ui", "templates"] as const;

/** BCP-47-ish: `pt`, `pt-BR`, `zh-Hant`. Keeps a typo from creating a junk dir. */
const LANG_PATTERN = /^[a-z]{2,3}(-[A-Za-z]{2,8})*$/;

interface Options {
  lang: string;
  copyEnglish: boolean;
  force: boolean;
}

function parseArgs(argv: string[]): Options {
  let lang = "";
  let copyEnglish = false;
  let force = false;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--lang" || arg === "-l") {
      lang = argv[++i] ?? "";
    } else if (arg?.startsWith("--lang=")) {
      lang = arg.slice("--lang=".length);
    } else if (arg === "--copy-english") {
      copyEnglish = true;
    } else if (arg === "--force") {
      force = true;
    }
  }

  if (!lang) {
    console.error("Missing --lang.\n\n  npm run generate:locale -- --lang pt-BR\n");
    process.exit(1);
  }
  if (!LANG_PATTERN.test(lang)) {
    console.error(`Invalid language code "${lang}". Expected e.g. "id", "pt-BR", "zh-Hant".\n`);
    process.exit(1);
  }
  return { lang, copyEnglish, force };
}

/**
 * Rebuild the tree with every leaf replaced by `""`, preserving key order so
 * the generated file diffs cleanly against the English source.
 */
function blankLeaves(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(blankLeaves);
  if (typeof value === "object" && value !== null) {
    const out: Record<string, unknown> = {};
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      out[key] = blankLeaves(child);
    }
    return out;
  }
  return "";
}

function countLeaves(value: unknown): number {
  if (Array.isArray(value)) return value.reduce<number>((n, v) => n + countLeaves(v), 0);
  if (typeof value === "object" && value !== null) {
    return Object.values(value as Record<string, unknown>).reduce<number>(
      (n, v) => n + countLeaves(v),
      0,
    );
  }
  return 1;
}

function main(): void {
  const { lang, copyEnglish, force } = parseArgs(process.argv.slice(2));
  const targetDir = join(LOCALES_DIR, lang);

  if (existsSync(targetDir) && !force) {
    console.error(`✗ ${targetDir} already exists. Pass --force to overwrite.\n`);
    process.exit(1);
  }
  mkdirSync(targetDir, { recursive: true });

  let total = 0;
  for (const ns of NAMESPACES) {
    const sourcePath = join(LOCALES_DIR, SOURCE_LOCALE, `${ns}.json`);
    if (!existsSync(sourcePath)) {
      console.error(`✗ Source locale missing: ${sourcePath}`);
      process.exit(1);
    }
    const source: unknown = JSON.parse(readFileSync(sourcePath, "utf-8"));
    const output = copyEnglish ? source : blankLeaves(source);
    const outPath = join(targetDir, `${ns}.json`);
    // Two-space indent + trailing newline matches the existing locale files.
    writeFileSync(outPath, `${JSON.stringify(output, null, 2)}\n`, "utf-8");
    const leaves = countLeaves(source);
    total += leaves;
    console.log(
      `✓ ${lang}/${ns}.json — ${leaves} keys${copyEnglish ? " (English text)" : " (empty)"}`,
    );
  }

  console.log(`\n${total} strings to translate. Remaining steps to register "${lang}":

  1. src/i18n/index.ts          — add to SUPPORTED_LANGUAGES (flag + nativeName)
  2. src/engine/types.ts        — add to the SupportedLanguage union
  3. src/store/settings-heal.ts — add to detectBrowserLanguage's supported list
  4. src/engine/tag-generator.ts— add a MULTILINGUAL_TAGS entry (TS enforces this)
  5. npm run validate:locales   — must pass before committing

See docs/I18N.md for the full checklist.`);
}

main();
