import { readFileSync } from "fs";
import { resolve } from "path";
import { compareCodeUnits } from "@utils/sort";

interface LocaleSchema {
  ui: Record<string, string[]>;
  templates: Record<string, string[]>;
}

/**
 * `src/i18n/locales/_schema.json` — every leaf key, listed under its parent
 * path. `validate:locales` holds all eight locales to it, so a key checked
 * here is a key every locale has.
 */
export const LOCALE_SCHEMA = JSON.parse(
  readFileSync(resolve("src/i18n/locales/_schema.json"), "utf8"),
) as LocaleSchema;

/** The leaf keys under one parent path, sorted; empty when the path is missing. */
export function schemaKeys(namespace: keyof LocaleSchema, parent: string): string[] {
  return [...(LOCALE_SCHEMA[namespace][parent] ?? [])].sort(compareCodeUnits);
}
