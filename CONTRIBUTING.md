# Contributing to YTDescGen

Thanks for taking the time to contribute. Read this once before opening your first PR — it saves time on both sides.

## Code of Conduct

Participation is governed by the [Code of Conduct](./CODE_OF_CONDUCT.md). By contributing, you agree to its terms.

## Getting Started

1. Read the [Development Guide](./docs/DEVELOPMENT.md) — also available in [Vietnamese](./docs/i18n/vi/DEVELOPMENT.md).
2. Install dependencies: `npm install`.
3. Start the dev server: `npm run dev`.
4. Before opening a PR run all gates:
   ```bash
   npm run typecheck
   npm run lint
   npm run validate:locales
   npm run test:run
   ```

## How to Contribute

### Issues

Use the templates in `.github/ISSUE_TEMPLATE/`:

- **Bug report** — only if you can reproduce on the latest release.
- **Feature request** — only with a concrete use case, not abstract requests.

### Pull Requests

- Branch from `dev`, not `main`.
- Commit format: `type(scope): message` — e.g. `feat(engine): add Spanish template support`. Types: `feat`, `fix`, `refactor`, `docs`, `test`, `ci`, `chore`.
- One logical change per PR. Don't bundle unrelated refactors.
- All locale files must stay in lock-step — see the i18n section below.
- AI-assisted contributions are welcome but **must be disclosed** in the PR description.

### i18n Contributions

If your change adds or removes any user-facing string:

1. Update the locale schema at `src/i18n/locales/_schema.json` first.
2. Add the key to **all 6 locales** (`en` / `vi` / `ja` / `es` / `ko` / `zh`).
3. `npm run validate:locales` must pass.

Native-speaker corrections to AI-translated locales (JA / ES / KO / ZH) are especially welcome — see [DISCLAIMER.md](./DISCLAIMER.md) for the current translation-quality status.

## Auto-ignored Contributions

The following are closed without review and may result in a contributor ban — no exceptions:

- **Suspected malicious code.** If a PR contains code we suspect may be a supply-chain attack, obfuscation, credential harvesting, cryptominer, or any form of malware — even if CodeQL and Dependabot don't flag it, the maintainer may investigate manually. **Detection equals ban.**
- **Unverified or suspicious links** in issues, PRs, or comments (pastebin scrapers, redirect chains, unfamiliar shortlinks, link-shortener URLs without context).
- **Behavior or language violating** [GitHub's Acceptable Use Policies](https://docs.github.com/en/site-policy/acceptable-use-policies).
- **Off-topic / rambling reports** that don't get to the point. Example of what gets ignored: *"Good morning, today is a beautiful day, I was just wondering if maybe…"* — get straight to the problem.
- **PRs that touch hundreds of files for a one-line fix** (typical sign of an auto-formatter run on unrelated files).
- **Tests deleted, or `--no-verify` used to bypass pre-commit hooks.**
- **"AI rewrote my entire codebase in a different style" PRs.** AI-assisted edits are welcome (disclosed); whole-repo rewrites are not.
- **Spam, drive-by typo fixes** that don't address a real issue, and karma-farming PRs.

## What We Want

- Bug fixes with a reproduction case and a regression test.
- Locale corrections from native speakers.
- New content-warning IDs with all 6 translations and a clear rationale (especially horror-genre vocabulary).
- New video types or genres that fit the gameplay no-commentary use case.
- Accessibility and mobile-responsive improvements.
- Performance fixes with a `before/after` measurement.

## What We Don't Want

- Cosmetic refactors with no behavior change.
- Adding new runtime dependencies without first opening an issue to discuss the tradeoff.
- Renaming files without coordinating with open PRs.
- Changes to the LICENSE or NOTICE files (these are governance, not contributions).

## License

By contributing, you agree your contribution will be licensed under the [Apache License 2.0](./LICENSE), the same license as the project, and that you have the right to grant that license.
