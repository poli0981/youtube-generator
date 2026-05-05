import pkg from "../../package.json";

interface ThirdPartyEntry {
  readonly name: string;
  readonly version: string;
  readonly license: string;
  readonly url: string;
}

const deps = pkg.dependencies as Record<string, string>;
const devDeps = pkg.devDependencies as Record<string, string>;

// Tiny lookup helper because tsconfig has `noUncheckedIndexedAccess`,
// which would otherwise type every `deps.foo` as `string | undefined`.
// `?` is a sentinel an upgrade is more likely to surface than a silent
// blank — easier to spot than an empty cell.
function v(map: Record<string, string>, key: string): string {
  return map[key] ?? "?";
}

/**
 * Credits surfaced on the About page. Versions are pulled from
 * `package.json` so a `npm install <pkg>` keeps this list honest.
 * License + URL are hardcoded (refresh on major upgrades).
 *
 * Listed in rough import-order: framework first, runtime libs next,
 * tooling last.
 */
export const THIRD_PARTY: readonly ThirdPartyEntry[] = [
  {
    name: "React",
    version: v(deps, "react"),
    license: "MIT",
    url: "https://react.dev/",
  },
  {
    name: "react-dom",
    version: v(deps, "react-dom"),
    license: "MIT",
    url: "https://react.dev/",
  },
  {
    name: "react-router-dom",
    version: v(deps, "react-router-dom"),
    license: "MIT",
    url: "https://reactrouter.com/",
  },
  {
    name: "Zustand",
    version: v(deps, "zustand"),
    license: "MIT",
    url: "https://zustand-demo.pmnd.rs/",
  },
  {
    name: "i18next",
    version: v(deps, "i18next"),
    license: "MIT",
    url: "https://www.i18next.com/",
  },
  {
    name: "react-i18next",
    version: v(deps, "react-i18next"),
    license: "MIT",
    url: "https://react.i18next.com/",
  },
  {
    name: "react-hot-toast",
    version: v(deps, "react-hot-toast"),
    license: "MIT",
    url: "https://react-hot-toast.com/",
  },
  {
    name: "lucide-react",
    version: v(deps, "lucide-react"),
    license: "ISC",
    url: "https://lucide.dev/",
  },
  {
    name: "clsx",
    version: v(deps, "clsx"),
    license: "MIT",
    url: "https://github.com/lukeed/clsx",
  },
  {
    name: "Tauri",
    version: v(deps, "@tauri-apps/api"),
    license: "Apache-2.0 / MIT",
    url: "https://tauri.app/",
  },
  {
    name: "Vite",
    version: v(devDeps, "vite"),
    license: "MIT",
    url: "https://vitejs.dev/",
  },
  {
    name: "TypeScript",
    version: v(devDeps, "typescript"),
    license: "Apache-2.0",
    url: "https://www.typescriptlang.org/",
  },
  {
    name: "Tailwind CSS",
    version: v(devDeps, "tailwindcss"),
    license: "MIT",
    url: "https://tailwindcss.com/",
  },
  {
    name: "Vitest",
    version: v(devDeps, "vitest"),
    license: "MIT",
    url: "https://vitest.dev/",
  },
];

export type { ThirdPartyEntry };
