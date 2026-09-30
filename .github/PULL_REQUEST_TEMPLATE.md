## Summary

<!-- 1-3 bullet points describing the change -->

-
-

## Type

- [ ] `feat` — new feature
- [ ] `fix` — bug fix
- [ ] `refactor` — code change with no behavior change
- [ ] `docs` — documentation only
- [ ] `test` — tests only
- [ ] `ci` — CI / build pipeline
- [ ] `chore` — other

## Checklist

- [ ] `npm run typecheck` and `npm run typecheck:all` pass
- [ ] `npm run lint` and `npm run format:check` pass
- [ ] `npm run validate:locales` passes — new strings are in all 8 locales (en, vi, ja, es, ko, zh, pt-BR, id)
- [ ] `npm run test:run` passes, with tests for the change
- [ ] `npm run build && npm run check:bundle` stay within budget
- [ ] Touched `src-tauri/`: `cargo fmt --check`, `cargo clippy -- -D warnings`, `cargo test`
- [ ] No secrets, credentials, or PII committed
- [ ] No new runtime dependencies without prior discussion in an issue
- [ ] Commit messages follow `type(scope): message`

## UI Changes

<!--
If this PR touches the UI, attach screenshots or short recordings at:
  - Desktop (≥1024px)
  - Tablet (768px)
  - Mobile (390px)
  - Dark and light theme
  - The desktop / Android app, if the change is platform-specific
Otherwise delete this section.
-->

## AI-Assisted Contribution

- [ ] Yes — AI tool used: <!-- e.g. Claude Code (Claude Opus 5.5), Cursor, GitHub Copilot -->
- [ ] No

If yes: did you review every line of generated code/text yourself before submitting? <!-- yes/no -->

## Related Issues

<!-- Fixes #123, Closes #456 -->
