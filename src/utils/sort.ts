/**
 * UTF-16 code-unit order — exactly what a bare `.sort()` does on strings,
 * spelled out as a comparator. Unlike `localeCompare` it never depends on the
 * runtime's locale, so generated files sort the same on every machine.
 */
export function compareCodeUnits(a: string, b: string): number {
  if (a === b) return 0;
  return a < b ? -1 : 1;
}
