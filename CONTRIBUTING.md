# Contributing to YTDescGen

Thanks for taking the time to contribute. Read this once before opening your first PR — it saves time on both sides.

## Code of Conduct

Participation is governed by the [Code of Conduct](./CODE_OF_CONDUCT.md). By contributing, you agree to its terms.

## Maintenance mode

Since 1.6.0 (November 2026) YTDescGen is in **maintenance mode**. It is feature-complete and stays maintained, but it doesn't grow new features. These changes are still accepted:

1. **Dependency updates** on a regular schedule (weekly, grouped by Dependabot after a 7-day cooldown).
2. **Security fixes**, as soon as possible: a dependency with a high or critical CVE, or a serious security issue in a runtime such as Node.js.
3. **Major upgrades** of a language, runtime or framework, for example Node 24 → 26 or TypeScript 6 → 7.
4. **Issues and pull requests** that:
   - add or remove an option in one of the app's lists when people really need it — a store, a social or donate platform, a genre, a video type, a content warning or tech note, a GPU, an upscaler or frame-generation mode (open an [option request](#option-requests) first);
   - fix a bug, a broken UI/UX or an accessibility barrier.
5. **Language fixes**: wording that doesn't fit a culture or region, and spelling mistakes that could mislead (see [i18n Contributions](#i18n-contributions)).
6. **Cloudflare / Worker** changes when the platform changes significantly.
7. **Website incidents** such as DDoS or bot spam.

Anything else is out of scope, new features in particular, unless the maintainer judges one genuinely necessary.

- The [maintenance triage workflow](.github/workflows/maintenance-triage.yml) closes feature issues and `feat:` pull requests from outside contributors automatically — a `feat(options)`, `feat(a11y)` or `feat(i18n)` pull request stays open. It also closes anything the maintainer labels `out-of-scope`.
- Feature ideas are welcome in [Discussions → Ideas](https://github.com/poli0981/youtube-generator/discussions/categories/ideas), with no commitment.
- If your issue or pull request was closed by mistake, reply to it and the maintainer will take another look.

Releases ship only when one of these changes needs one, for example a security fix for the desktop and Android apps. The website keeps deploying from `main`.

## Getting Started

1. Read the [Development Guide](./docs/DEVELOPMENT.md) — also available in [Vietnamese](./docs/i18n/vi/DEVELOPMENT.md).
2. Install dependencies: `npm install`.
3. Start the dev server: `npm run dev`.
4. Before opening a PR, run the same gates CI runs (the required `check` job):
   ```bash
   npm run typecheck && npm run typecheck:all
   npm run lint && npm run format:check
   npm run validate:locales
   npm run test:coverage
   npm run knip
   npm run check:version && npm run check:tauri && npm run check:licenses
   npm run check:copyright
   npm run build && npm run check:bundle
   npm run cf:check
   ```
   `check:licenses` fails when `THIRD_PARTY_NOTICES.md` is stale — `npm run generate:third-party` rewrites it. `check:copyright` fails in the first commit of a new year — `npm run update:copyright` fixes it. Touched `src-tauri/`? Also `cargo fmt --check`, `cargo clippy --all-targets --locked -- -D warnings` and `cargo test` in `src-tauri/` (after `npm run build` — see the [Development Guide](./docs/DEVELOPMENT.md#rust-checks)).

## How to Contribute

### Issues

Use the templates in `.github/ISSUE_TEMPLATE/`:

- **Bug report** — only if you can reproduce on the latest release.
- **Option request** — add or remove an option in one of the app's lists; see [Option requests](#option-requests).
- **Translation or wording fix** — wording that doesn't fit a culture or region, or a spelling mistake that could mislead, in any of the eight languages.
- **Accessibility barrier** — anything that gets in the way with a keyboard, a screen reader, zoom, high contrast, voice control or touch. No reproduction on the latest release needed, and you don't need to know the cause. See [ACCESSIBILITY.md](./ACCESSIBILITY.md#reporting-a-barrier).

There is no feature request form any more: YTDescGen is in [maintenance mode](#maintenance-mode). Share ideas in [Discussions → Ideas](https://github.com/poli0981/youtube-generator/discussions/categories/ideas).

### Option requests

The one kind of addition maintenance mode still takes: an option in a list the app already has, when people really need it — a store (store links), a social or donate platform, a genre, a video type, a content warning or tech note, a GPU in the rig catalog, an upscaler or frame-generation mode. Removing one that no longer makes sense works the same way.

Open an **Option request** issue first: the option's name as it should appear, which list, and who needs it and why (a link to the store page, the vendor's announcement or a video that needed it helps). Once it's agreed, a pull request titled `feat(options): …` is welcome. [ARCHITECTURE.md → Extensibility Points](./docs/ARCHITECTURE.md) and CLAUDE.md's "Important Notes" say which files each kind of option touches, and the checks fail until all eight locales have its strings.

### Pull Requests

- Branch from `main` (`feat/…`, `fix/…`, `docs/…`) and open the PR against `main`. Every merge to `main` deploys the web app, so `main` stays releasable.
- Commit format and **PR title**: `type(scope): message` — e.g. `feat(engine): add Spanish template support`. Types: `feat`, `fix`, `refactor`, `docs`, `test`, `ci`, `chore`. CI checks the PR title.
- Required checks: `check`, `dependency-review`, `workflow-lint`, `reuse`, `pr-title`. When `src-tauri/` changes, the Rust workflow's `lint-and-test` and `cargo-deny` run too, and GitHub's CodeQL code scanning runs on every PR. SonarCloud analyses PRs opened from this repository — its quality gate wants A ratings, reviewed security hotspots, at most 3 % duplication and at least 80 % test coverage on new code in the layers Vitest measures (PRs from forks get no secrets and skip it; the maintainer's merge runs it on `main`). JetBrains Qodana does the same for TypeScript and for the Rust shell, and fails on any problem it finds. Commits on `main` are signed.
- PR titles start with a lower-case letter after the colon (`feat(editor): add …`, not `feat(editor): Add …`).
- In [maintenance mode](#maintenance-mode) a `feat` pull request from an outside contributor is closed automatically, unless its scope is `options`, `a11y` or `i18n`. A fix is a `fix`.
- One logical change per PR. Don't bundle unrelated refactors.
- All locale files must stay in lock-step — see the i18n section below.
- AI-assisted contributions are welcome but **must be disclosed** in the PR description.

### Accessibility

UI changes keep YTDescGen usable with the keyboard alone and with screen readers. Run through the checklist in [ACCESSIBILITY.md](./ACCESSIBILITY.md#for-contributors) (the PR template repeats it); the contrast test (`tests/styles/contrast.test.ts`) fails if a colour token drops under WCAG AA.

### i18n Contributions

If your change adds or removes any user-facing string:

1. Update the locale schema at `src/i18n/locales/_schema.json` first.
2. Add the key to **all 8 locales** (`en` / `vi` / `ja` / `es` / `ko` / `zh` / `pt-BR` / `id`).
3. `npm run validate:locales` must pass.

Native-speaker corrections to AI-translated locales (JA / ES / KO / ZH / PT-BR / ID) are especially welcome — see [DISCLAIMER.md](./DISCLAIMER.md) for the current translation-quality status.

## Auto-ignored Contributions

The following are closed without review and may result in a contributor ban — no exceptions:

- **Suspected malicious code.** If a PR contains code we suspect may be a supply-chain attack, obfuscation, credential harvesting, cryptominer, or any form of malware — even if CodeQL and Dependabot don't flag it, the maintainer may investigate manually. **Detection equals ban.**
- **Unverified or suspicious links** in issues, PRs, or comments (pastebin scrapers, redirect chains, unfamiliar shortlinks, link-shortener URLs without context).
- **Behavior or language violating** [GitHub's Acceptable Use Policies](https://docs.github.com/en/site-policy/acceptable-use-policies).
- **Off-topic / rambling reports** that don't get to the point. Example of what gets ignored: _"Good morning, today is a beautiful day, I was just wondering if maybe…"_ — get straight to the problem.
- **PRs that touch hundreds of files for a one-line fix** (typical sign of an auto-formatter run on unrelated files).
- **Tests deleted or skipped to make CI pass.**
- **"AI rewrote my entire codebase in a different style" PRs.** AI-assisted edits are welcome (disclosed); whole-repo rewrites are not.
- **Spam, drive-by typo fixes** that don't address a real issue, and karma-farming PRs.

## What We Want

Within [maintenance mode](#maintenance-mode):

- Bug fixes with a reproduction case and a regression test.
- Locale corrections from native speakers.
- An option people really need, agreed in an [option request](#option-requests) first — for example a content-warning or tech-note ID with all 8 translations and a clear rationale (especially horror-genre vocabulary), a store, a genre or a video type that fits the gameplay no-commentary use case.
- Accessibility and mobile-responsive fixes.
- Performance fixes with a `before/after` measurement.

## What We Don't Want

- New features, unless the maintainer judges one genuinely necessary — share the idea in [Discussions → Ideas](https://github.com/poli0981/youtube-generator/discussions/categories/ideas) instead.
- Cosmetic refactors with no behavior change.
- Adding new runtime dependencies without first opening an issue to discuss the tradeoff.
- Renaming files without coordinating with open PRs.
- Changes to the LICENSE or NOTICE files (these are governance, not contributions).

## Contact

Questions about contributing or conduct: `code@poli0981.dev`. Security issues go through [SECURITY.md](./SECURITY.md), never a public issue. Accessibility barriers you'd rather not post publicly: `contact@poli0981.dev`, subject starting with `[Accessibility]`.

## License

By contributing, you agree your contribution will be licensed under the [Apache License 2.0](./LICENSE), the same license as the project, and that you have the right to grant that license.
