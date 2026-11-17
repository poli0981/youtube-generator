/**
 * JSON with every object's keys sorted, so equal data compares equal
 * whatever order its keys were written in. Arrays keep their order.
 * Used to compare library items (restore) and editor fields (applying a
 * profile, preset or template).
 */
export function stableJson(value: unknown): string {
  return JSON.stringify(value, (_key, v: unknown) =>
    v && typeof v === "object" && !Array.isArray(v)
      ? Object.fromEntries(
          Object.entries(v as Record<string, unknown>).sort(([a], [b]) => (a < b ? -1 : 1)),
        )
      : v,
  );
}
