import { describe, it, expect } from "vitest";
import {
  collectEditorIssues,
  collectEditorErrors,
  isRelevantIssueId,
  type EditorIssueContext,
} from "@utils/editor-issues";
import { DEFAULTS } from "@config/defaults";
import type { EditorData } from "@store/editor-store";

function makeEditor(overrides: Partial<EditorData> = {}): EditorData {
  return { ...(DEFAULTS.editor as unknown as EditorData), ...overrides };
}

const CTX: EditorIssueContext = { splitContactEmail: false, language: "en" };

describe("collectEditorIssues", () => {
  it("reports nothing for a clean editor", () => {
    expect(collectEditorIssues(makeEditor(), CTX)).toEqual([]);
  });

  it("ignores empty optional fields", () => {
    // Every field in the app is optional; an empty one is not an error.
    const editor = makeEditor({ playlistLink: "", contactEmail: "", liveUrl: "" });
    expect(collectEditorIssues(editor, CTX)).toEqual([]);
  });

  it("flags a malformed store link", () => {
    const editor = makeEditor({ storeLinks: { steam: "not-a-url" } });
    const issues = collectEditorIssues(editor, CTX);
    expect(issues).toHaveLength(1);
    expect(issues[0]?.id).toBe("storeLinks.steam");
    expect(issues[0]?.severity).toBe("error");
  });

  it("accepts a valid store link", () => {
    const editor = makeEditor({
      storeLinks: { steam: "https://store.steampowered.com/app/2124490" },
    });
    expect(collectEditorIssues(editor, CTX)).toEqual([]);
  });

  it("flags a malformed email and reports the right key", () => {
    const issues = collectEditorIssues(makeEditor({ contactEmail: "nope" }), CTX);
    expect(issues[0]?.id).toBe("contactEmail");
    expect(issues[0]?.messageKey).toBe("validation.emailInvalid");
  });

  it("flags more than three emails — the path an import takes past the input guard", () => {
    const editor = makeEditor({ contactEmail: "a@b.com,c@d.com,e@f.com,g@h.com" });
    const issues = collectEditorIssues(editor, CTX);
    expect(issues[0]?.messageKey).toBe("validation.emailMaxExceeded");
  });

  it("treats a prefix mismatch as a WARNING, never an error", () => {
    // A working link on a vanity domain or regional mirror. Blocking on it
    // would strand exactly the people most likely to have one.
    const editor = makeEditor({ social: { kofi: "https://example.com/me" } });
    const issues = collectEditorIssues(editor, CTX);
    expect(issues).toHaveLength(1);
    expect(issues[0]?.severity).toBe("warning");
    expect(collectEditorErrors(editor, CTX)).toEqual([]);
  });

  it("reports several bad fields at once", () => {
    const editor = makeEditor({
      storeLinks: { steam: "bad" },
      contactEmail: "bad",
      playlistLink: "https://youtube.com/watch?v=x",
    });
    expect(
      collectEditorErrors(editor, CTX)
        .map((i) => i.id)
        .sort(),
    ).toEqual(["contactEmail", "playlistLink", "storeLinks.steam"]);
  });

  describe("relevance — a field nobody can see must never block", () => {
    it("ignores adEmail / gameKeyEmail while the split toggle is off", () => {
      const editor = makeEditor({ adEmail: "bad", gameKeyEmail: "also-bad" });
      expect(collectEditorIssues(editor, { ...CTX, splitContactEmail: false })).toEqual([]);
    });

    it("checks them once the split toggle is on", () => {
      const editor = makeEditor({ adEmail: "bad", gameKeyEmail: "also-bad" });
      const issues = collectEditorIssues(editor, { ...CTX, splitContactEmail: true });
      expect(issues.map((i) => i.id).sort()).toEqual(["adEmail", "gameKeyEmail"]);
    });

    it("ignores the Zalo link outside Vietnamese output", () => {
      const editor = makeEditor({ zaloGroupLink: "https://wrong.example/x" });
      expect(collectEditorIssues(editor, { ...CTX, language: "en" })).toEqual([]);
    });

    it("checks the Zalo link in Vietnamese output", () => {
      const editor = makeEditor({ zaloGroupLink: "https://wrong.example/x" });
      const issues = collectEditorIssues(editor, { ...CTX, language: "vi" });
      expect(issues[0]?.id).toBe("zaloGroupLink");
    });
  });
});

describe("isRelevantIssueId", () => {
  it("gates the split-email fields on the toggle", () => {
    expect(isRelevantIssueId("adEmail", { ...CTX, splitContactEmail: false })).toBe(false);
    expect(isRelevantIssueId("gameKeyEmail", { ...CTX, splitContactEmail: true })).toBe(true);
  });

  it("gates the Zalo link on the output language", () => {
    expect(isRelevantIssueId("zaloGroupLink", { ...CTX, language: "en" })).toBe(false);
    expect(isRelevantIssueId("zaloGroupLink", { ...CTX, language: "vi" })).toBe(true);
  });

  it("lets everything else through", () => {
    expect(isRelevantIssueId("storeLinks.steam", CTX)).toBe(true);
    expect(isRelevantIssueId("contactEmail", CTX)).toBe(true);
  });
});
