import { describe, it, expect, beforeEach } from "vitest";
import { useValidationStore, type FieldIssue } from "@store/validation-store";

function issue(overrides: Partial<FieldIssue> = {}): FieldIssue {
  return {
    id: "editor.storeLinks.steam",
    scope: "editor",
    label: "Store links",
    messageKey: "validation.urlInvalid",
    severity: "error",
    ...overrides,
  };
}

/** `useHasValidationErrors` without React — same predicate, read directly. */
function hasErrors(scope?: string): boolean {
  return Object.values(useValidationStore.getState().issues).some(
    (i) => i.severity === "error" && (scope === undefined || i.scope === scope),
  );
}

describe("validation-store", () => {
  beforeEach(() => {
    useValidationStore.setState({ issues: {} });
  });

  it("starts clean", () => {
    expect(hasErrors()).toBe(false);
  });

  it("blocks once an error is registered, and clears with it", () => {
    const { setIssue, clearIssue } = useValidationStore.getState();
    setIssue(issue());
    expect(hasErrors()).toBe(true);
    clearIssue("editor.storeLinks.steam");
    expect(hasErrors()).toBe(false);
  });

  it("stays blocked while any other error remains", () => {
    const { setIssue, clearIssue } = useValidationStore.getState();
    setIssue(issue({ id: "a" }));
    setIssue(issue({ id: "b" }));
    clearIssue("a");
    expect(hasErrors()).toBe(true);
  });

  it("never blocks on a warning", () => {
    // `validateUrlWithPrefix` emits these for a link that works but doesn't
    // match the platform's usual prefix — a vanity domain or regional mirror.
    // Blocking on it would strand those users.
    useValidationStore.getState().setIssue(issue({ severity: "warning" }));
    expect(hasErrors()).toBe(false);
  });

  it("scopes correctly", () => {
    const { setIssue } = useValidationStore.getState();
    setIssue(issue({ id: "e", scope: "editor" }));
    setIssue(issue({ id: "s", scope: "settings" }));
    expect(hasErrors("editor")).toBe(true);
    expect(hasErrors("settings")).toBe(true);
    expect(hasErrors("batch")).toBe(false);
  });

  it("clearScope leaves other scopes intact", () => {
    const { setIssue, clearScope } = useValidationStore.getState();
    setIssue(issue({ id: "e", scope: "editor" }));
    setIssue(issue({ id: "s", scope: "settings" }));
    clearScope("editor");
    expect(hasErrors("editor")).toBe(false);
    expect(hasErrors("settings")).toBe(true);
  });

  it("re-registering an identical issue does not produce a new issues object", () => {
    // The registering effect runs on every render of the owning input. Without
    // this bail-out it would publish a fresh object each time and re-render
    // every consumer in a loop.
    const { setIssue } = useValidationStore.getState();
    setIssue(issue());
    const first = useValidationStore.getState().issues;
    setIssue(issue());
    expect(useValidationStore.getState().issues).toBe(first);
  });

  it("re-registering a CHANGED issue does replace it", () => {
    const { setIssue } = useValidationStore.getState();
    setIssue(issue());
    const first = useValidationStore.getState().issues;
    setIssue(issue({ messageKey: "validation.emailInvalid" }));
    expect(useValidationStore.getState().issues).not.toBe(first);
    expect(useValidationStore.getState().issues["editor.storeLinks.steam"]?.messageKey).toBe(
      "validation.emailInvalid",
    );
  });

  it("clearing an unknown id is a no-op that preserves identity", () => {
    const { setIssue, clearIssue } = useValidationStore.getState();
    setIssue(issue());
    const first = useValidationStore.getState().issues;
    clearIssue("nope");
    expect(useValidationStore.getState().issues).toBe(first);
  });

  it("distinguishes issues that differ only in params", () => {
    const { setIssue } = useValidationStore.getState();
    setIssue(issue({ params: { max: 3 } }));
    const first = useValidationStore.getState().issues;
    setIssue(issue({ params: { max: 5 } }));
    expect(useValidationStore.getState().issues).not.toBe(first);
  });
});
