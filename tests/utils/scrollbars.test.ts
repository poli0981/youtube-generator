import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";
import { applyHideScrollbars } from "@utils/scrollbars";

describe("applyHideScrollbars", () => {
  let classes: Set<string>;

  beforeEach(() => {
    classes = new Set(["dark"]);
    // The test environment has no DOM — a classList is all this touches.
    vi.stubGlobal("document", {
      documentElement: {
        classList: {
          toggle: (name: string, force: boolean) => {
            if (force) classes.add(name);
            else classes.delete(name);
            return force;
          },
        },
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("adds the class when scrollbars are hidden and removes it again", () => {
    applyHideScrollbars(true);
    expect(classes.has("hide-scrollbars")).toBe(true);
    applyHideScrollbars(false);
    expect(classes.has("hide-scrollbars")).toBe(false);
  });

  it("leaves the theme class alone", () => {
    applyHideScrollbars(true);
    applyHideScrollbars(false);
    expect(classes.has("dark")).toBe(true);
  });
});

describe("hide-scrollbars wiring", () => {
  // theme-init.js runs before the bundle and cannot import the helper, and the
  // CSS only knows the class by name: the three must agree on it.
  it("uses the same class name in theme-init.js and globals.css", () => {
    const init = readFileSync(resolve("public/theme-init.js"), "utf8");
    const css = readFileSync(resolve("src/styles/globals.css"), "utf8");
    expect(init).toContain('root.classList.toggle("hide-scrollbars", hideScrollbars)');
    expect(init).toContain("state.hideScrollbars === true");
    expect(css).toContain("html.hide-scrollbars *");
    expect(css).toContain("scrollbar-width: none");
  });
});
