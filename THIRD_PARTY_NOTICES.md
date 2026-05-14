# Third-Party Notices

YTDescGen incorporates the following third-party software. Each dependency retains its own license; consult the linked project page for the full text of each license.

## Runtime Dependencies (web bundle)

| Package | Version | License | Project |
| --- | --- | --- | --- |
| `react` | ^18.3.0 | MIT | <https://github.com/facebook/react> |
| `react-dom` | ^18.3.0 | MIT | <https://github.com/facebook/react> |
| `react-router-dom` | ^6.26.0 | MIT | <https://github.com/remix-run/react-router> |
| `react-i18next` | ^15.0.0 | MIT | <https://github.com/i18next/react-i18next> |
| `i18next` | ^23.15.0 | MIT | <https://github.com/i18next/i18next> |
| `zustand` | ^4.5.0 | MIT | <https://github.com/pmndrs/zustand> |
| `react-hot-toast` | ^2.4.0 | MIT | <https://github.com/timolins/react-hot-toast> |
| `lucide-react` | ^0.400.0 | ISC | <https://github.com/lucide-icons/lucide> |
| `clsx` | ^2.1.0 | MIT | <https://github.com/lukeed/clsx> |
| `@tauri-apps/api` | ^2.11.0 | Apache-2.0 OR MIT | <https://github.com/tauri-apps/tauri> |
| `@tauri-apps/plugin-dialog` | ^2.0.0 | Apache-2.0 OR MIT | <https://github.com/tauri-apps/plugins-workspace> |
| `@tauri-apps/plugin-fs` | ^2.0.0 | Apache-2.0 OR MIT | <https://github.com/tauri-apps/plugins-workspace> |
| `@tauri-apps/plugin-opener` | ^2.0.0 | Apache-2.0 OR MIT | <https://github.com/tauri-apps/plugins-workspace> |
| `@tauri-apps/plugin-shell` | ^2.0.0 | Apache-2.0 OR MIT | <https://github.com/tauri-apps/plugins-workspace> |

## Build / Dev Dependencies

| Package | Version | License | Project |
| --- | --- | --- | --- |
| `vite` | ^7.3.3 | MIT | <https://github.com/vitejs/vite> |
| `@vitejs/plugin-react` | ^4.3.0 | MIT | <https://github.com/vitejs/vite-plugin-react> |
| `typescript` | ^5.5.0 | Apache-2.0 | <https://github.com/microsoft/TypeScript> |
| `tsx` | ^4.16.0 | MIT | <https://github.com/privatenumber/tsx> |
| `tailwindcss` | ^3.4.0 | MIT | <https://github.com/tailwindlabs/tailwindcss> |
| `prettier-plugin-tailwindcss` | ^0.6.0 | MIT | <https://github.com/tailwindlabs/prettier-plugin-tailwindcss> |
| `postcss` | ^8.5.14 | MIT | <https://github.com/postcss/postcss> |
| `autoprefixer` | ^10.4.0 | MIT | <https://github.com/postcss/autoprefixer> |
| `eslint` | ^9.0.0 | MIT | <https://github.com/eslint/eslint> |
| `@eslint/js` | ^9.0.0 | MIT | <https://github.com/eslint/eslint> |
| `eslint-plugin-react-hooks` | ^5.0.0 | MIT | <https://github.com/facebook/react> |
| `typescript-eslint` | ^8.0.0 | MIT | <https://github.com/typescript-eslint/typescript-eslint> |
| `prettier` | ^3.3.0 | MIT | <https://github.com/prettier/prettier> |
| `vitest` | ^3.2.4 | MIT | <https://github.com/vitest-dev/vitest> |
| `@testing-library/react` | ^16.0.0 | MIT | <https://github.com/testing-library/react-testing-library> |
| `@testing-library/jest-dom` | ^6.4.0 | MIT | <https://github.com/testing-library/jest-dom> |
| `@types/react` | ^18.3.0 | MIT | DefinitelyTyped |
| `@types/react-dom` | ^18.3.0 | MIT | DefinitelyTyped |

## Tauri Desktop (Rust crates)

| Crate | Version | License | Project |
| --- | --- | --- | --- |
| `tauri` | ^2 | Apache-2.0 OR MIT | <https://github.com/tauri-apps/tauri> |
| `tauri-build` | ^2 | Apache-2.0 OR MIT | <https://github.com/tauri-apps/tauri> |
| `tauri-plugin-dialog` | ^2 | Apache-2.0 OR MIT | <https://github.com/tauri-apps/plugins-workspace> |
| `tauri-plugin-fs` | ^2 | Apache-2.0 OR MIT | <https://github.com/tauri-apps/plugins-workspace> |
| `tauri-plugin-opener` | ^2 | Apache-2.0 OR MIT | <https://github.com/tauri-apps/plugins-workspace> |
| `tauri-plugin-shell` | ^2 | Apache-2.0 OR MIT | <https://github.com/tauri-apps/plugins-workspace> |
| `tauri-plugin-single-instance` | ^2 | Apache-2.0 OR MIT | <https://github.com/tauri-apps/plugins-workspace> |
| `serde` | ^1 | Apache-2.0 OR MIT | <https://github.com/serde-rs/serde> |
| `serde_json` | ^1 | Apache-2.0 OR MIT | <https://github.com/serde-rs/json> |

Transitive dependencies are not enumerated here. `cargo tree` (in `src-tauri/`) and `npm list --all` produce the exhaustive trees; this list covers the direct dependencies declared in `package.json` and `src-tauri/Cargo.toml`.

## Fonts & Icons

The application uses **system fonts** (`Inter` / `SF Pro` / `Segoe UI` / `Roboto`, fallback `sans-serif`). No custom font files are bundled in the web build.

Icons are provided by [`lucide-react`](https://github.com/lucide-icons/lucide) (ISC license — see above).

## AI-Assisted Development Disclosure

Per [`DISCLAIMER.md`](./DISCLAIMER.md), this project was co-authored with **Anthropic's Claude Code (model 4.7 Opus, 1M-context variant)**. The model contributed to source code, locale translations, documentation, and CI configuration. All output was reviewed by the human maintainer (`@poli0981`) before being committed.

No third-party content was reproduced verbatim from the model's training data. Any external text quoted in this repository (notably the Apache License 2.0 in [`LICENSE`](./LICENSE) and the Contributor Covenant link in [`CODE_OF_CONDUCT.md`](./CODE_OF_CONDUCT.md)) is sourced from canonical public locations.

Claude is a product of Anthropic, PBC — <https://www.anthropic.com>. No license is granted by Anthropic to use this project; the Apache 2.0 license in `LICENSE` is granted by `@poli0981` as the project author.

## Reporting an Omission

If you believe a dependency is missing from this list, please open an issue or PR per [`CONTRIBUTING.md`](./CONTRIBUTING.md).
