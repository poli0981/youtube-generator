# Disclaimer

## Solo project, AI-assisted

YTDescGen is a personal project built by a single maintainer (`@poli0981`) for use with the [`@SkullMute`](https://www.youtube.com/@SkullMute) YouTube channel and shared publicly as open source. It is **not a commercial product** and there is no support obligation.

Code, documentation, locale translations, and design decisions in this repository were **co-authored with the assistance of Anthropic's Claude Code (model 4.7 Opus, 1M-context variant)**. All commits, releases, and architectural decisions are reviewed and approved by the maintainer before merging.

This disclosure applies to:

- Source code in `src/` and `src-tauri/`.
- Documentation in `docs/` and all root markdown files.
- Locale files in `src/i18n/locales/`.
- CI/CD workflows in `.github/workflows/`.

See also: [`THIRD_PARTY_NOTICES.md`](./THIRD_PARTY_NOTICES.md) § "AI-Assisted Development Disclosure".

## Translation quality

The application UI ships in eight languages. Authoring quality varies:

| Locale | Authoring | Notes |
| --- | --- | --- |
| English (`en`) | Maintainer + AI | Primary working locale. Strings reviewed before commit. |
| Vietnamese (`vi`) | Maintainer (native) + AI | Reviewed by the maintainer, who is a native Vietnamese speaker. |
| Japanese (`ja`) | AI-translated | Not native-reviewed. Grammar and tone may be imperfect. |
| Spanish (`es`) | AI-translated | Not native-reviewed. Regional voice (LatAm vs. Castilian) not specifically targeted. |
| Korean (`ko`) | AI-translated | Not native-reviewed. Honorific register chosen for neutrality, not specific cultural fit. |
| Chinese (`zh`) | AI-translated | Simplified Chinese only. Not native-reviewed. |
| Portuguese, Brazil (`pt-BR`) | AI-translated | Not native-reviewed. Brazilian Portuguese specifically — European Portuguese is not separately targeted. |
| Indonesian (`id`) | AI-translated | Not native-reviewed. Standard Indonesian; gaming loanwords kept in English where that is the common usage. |

If you're a native speaker and spot mistranslations, please open an issue or PR — see [CONTRIBUTING.md](./CONTRIBUTING.md) § "i18n Contributions".

## Voice and tone

Generated description templates use an opinionated tone tailored to the **gameplay no-commentary** YouTube niche, with extra emphasis on horror / scary games (because that's the maintainer's channel). The output may not fit every channel's voice or every country's reader expectations. The application is template-driven — you can edit any generated text before publishing.

Some Vietnamese phrasings deliberately keep loanwords and casual tone reflecting how Vietnamese gameplay creators commonly write descriptions. These are not "incorrect translations"; they are stylistic choices for the target audience.

## No warranty

This software is provided **as-is, with no warranty of any kind**. See [`LICENSE`](./LICENSE) (Apache 2.0) §§ 7 and 8 for the full disclaimer of warranty and limitation of liability.

In plain English: if the application crashes, mangles your draft, generates a description that gets your video flagged by YouTube, or causes any other harm — the maintainer is not liable. Use at your own risk; back up your drafts.

## Not affiliated with YouTube / Anthropic

YTDescGen is **not** affiliated with, endorsed by, or sponsored by YouTube, Google LLC, or Alphabet Inc. The generated output is intended to be pasted into the YouTube Studio editor; this application does not interact with the YouTube API.

Use of Claude Code during development does **not** make this an Anthropic product. Anthropic, Claude, and Claude Code are trademarks of Anthropic, PBC. This project is independent.

## Not legal or financial advice

Any mention of GDPR, CCPA, copyright law, YouTube's monetization policies, or similar topics in this repository's documentation is provided for orientation only and is **not legal advice**. Consult a qualified lawyer in your jurisdiction if you need an authoritative answer.
