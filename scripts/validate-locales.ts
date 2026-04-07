import { readFileSync, readdirSync, existsSync } from "fs";
import { join, resolve } from "path";

const LOCALES_DIR = resolve("src/i18n/locales");
const SCHEMA_PATH = join(LOCALES_DIR, "_schema.json");

interface Schema {
  ui: Record<string, string[]>;
  templates: Record<string, string[]>;
}

function getNestedKeys(obj: Record<string, unknown>, prefix = ""): string[] {
  const keys: string[] = [];
  for (const key of Object.keys(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    const value = obj[key];
    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      keys.push(...getNestedKeys(value as Record<string, unknown>, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

function getExpectedKeys(schema: Schema, namespace: "ui" | "templates"): string[] {
  const section = schema[namespace];
  const keys: string[] = [];
  for (const [path, fields] of Object.entries(section)) {
    for (const field of fields) {
      keys.push(`${path}.${field}`);
    }
  }
  return keys;
}

function validate(): void {
  if (!existsSync(SCHEMA_PATH)) {
    console.error("Schema file not found:", SCHEMA_PATH);
    process.exit(1);
  }

  const schema: Schema = JSON.parse(readFileSync(SCHEMA_PATH, "utf-8"));
  const expectedUIKeys = getExpectedKeys(schema, "ui");
  const expectedTemplateKeys = getExpectedKeys(schema, "templates");

  const localeDirs = readdirSync(LOCALES_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

  let hasErrors = false;

  for (const locale of localeDirs) {
    const localeDir = join(LOCALES_DIR, locale);

    for (const [filename, expectedKeys] of [
      ["ui.json", expectedUIKeys],
      ["templates.json", expectedTemplateKeys],
    ] as const) {
      const filePath = join(localeDir, filename);

      if (!existsSync(filePath)) {
        console.error(`✗ ${locale}/${filename} — FILE MISSING`);
        hasErrors = true;
        continue;
      }

      const content: Record<string, unknown> = JSON.parse(readFileSync(filePath, "utf-8"));
      const actualKeys = getNestedKeys(content);
      const missing = expectedKeys.filter((k) => !actualKeys.includes(k));
      const extra = actualKeys.filter((k) => !expectedKeys.includes(k));

      if (missing.length === 0 && extra.length === 0) {
        console.log(`✓ ${locale}/${filename} — ${actualKeys.length}/${expectedKeys.length} keys`);
      } else {
        hasErrors = true;
        console.error(
          `✗ ${locale}/${filename} — ${actualKeys.length}/${expectedKeys.length} keys`,
        );
        if (missing.length > 0) {
          console.error(`  Missing: ${missing.join(", ")}`);
        }
        if (extra.length > 0) {
          console.error(`  Extra: ${extra.join(", ")}`);
        }
      }
    }
  }

  if (hasErrors) {
    process.exit(1);
  } else {
    console.log("\nAll locale files are complete!");
  }
}

validate();
