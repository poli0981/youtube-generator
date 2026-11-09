# Accessibility

**Last updated:** 2026-11-09

YTDescGen should work for everyone who makes videos, including people who use a keyboard instead of a mouse, a screen reader, zoom or magnification, high-contrast modes, voice control or a touch screen. This statement says what works today, how it is checked, what doesn't work yet, and how to tell us about a barrier.

It covers the website at [ytgenerator.stream](https://ytgenerator.stream), the desktop apps (Windows, macOS, Linux) and the Android app. They share one interface, so what is said here applies to all of them unless a platform is named.

## Our goal

We aim for [WCAG 2.2](https://www.w3.org/TR/WCAG22/) level **AA**. That is a goal, not a claim of conformance: YTDescGen is a solo open-source project and has not had an independent audit. When we find something that falls short, it is fixed or listed under [Known limitations](#known-limitations).

## What works today

### Keyboard

- Every page, menu and dialog works with the keyboard alone. **Skip to content** is the first stop on the app's pages, and a visible outline shows where the focus is.
- Dialogs keep the focus inside while they are open, close with **Esc**, and give the focus back to the control that opened them.
- Shortcuts work on every page:
  - **Ctrl/⌘ + K**: command palette (any page, copy, profiles, presets, templates, theme, languages).
  - **Ctrl/⌘ + G** or **Ctrl/⌘ + Enter**: Output.
  - **Ctrl/⌘ + Shift + C**: Copy All.
  - **Ctrl/⌘ + S**: save to History.
  - **Ctrl/⌘ + B**: sidebar.
  - **Alt + T**: notifications.
  - **Ctrl/⌘ + /** (or **?**): the full list.
- The single-key **?** shortcut can be turned off in **Settings › Editor › Single-key shortcuts**, for speech input and stray key presses.

### Screen readers

- Every control has a name, including icon-only buttons, and every field has a label. Hints and errors are tied to their field.
- Confirmations and errors are announced ("Copied!", "Saved to History", why something can't be copied), and so are Strict Mode problems.
- After you open another page, its name is read out. The focus stays on the link you used.
- Each page has its own title and a single main heading, and the page language follows the interface language you pick (eight languages).
- Generated titles, descriptions and tags are marked with the language they were written in, so a Japanese description is read with a Japanese voice even when the interface is in English.

### Vision

- Dark and light themes, both at WCAG AA contrast for text (4.5:1) on every background. A test keeps them there ([tests/styles/contrast.test.ts](tests/styles/contrast.test.ts)).
- The layout reflows from wide screens down to phone width, so zooming in moves content into one column instead of off the screen.
- The desktop apps zoom with **Ctrl/⌘ + =** and **Ctrl/⌘ + −** (Ctrl + mouse wheel works on Windows too). On Android, pinch to zoom.
- In Windows High Contrast (forced colours), the focus outline stays visible.
- **Settings › Appearance › Hide scrollbars** removes the scrollbars; scrolling still works with the keyboard, mouse wheel and touch.

### Motion

- With **Reduce motion** turned on in your operating system, animations and smooth scrolling are switched off.

### Touch

- On touch screens, buttons and fields grow to about 44 px, and so do small close and dismiss buttons.

### The website's check page

- The Cloudflare Turnstile check before the website usually finishes on its own. Its status ("Checking your browser…", errors) is announced, and it works with the keyboard. See [Known limitations](#known-limitations) if Cloudflare asks you to solve a challenge.

## How it is checked

- **By hand.** The maintainer uses YTDescGen with the keyboard alone (mouse unplugged) and with Windows Narrator, through the main flows: editor, output, copying, profiles, presets, templates, History, Settings and backups.
- **Automatically.** A unit test checks the contrast of every colour token in both themes.
- **Design rules.** Interface parts come from accessible building blocks (Radix primitives). An icon-only button can't be built without a name, and every field gets its label and error wiring from one shared component.

The app has **not** been tested yet with NVDA, JAWS, VoiceOver (macOS), TalkBack (Android) or Orca (Linux). Reports from people who use them are very welcome.

## Supported environments

| Platform | Runs on | Screen reader |
| --- | --- | --- |
| Windows: desktop app, or the website in Edge / Chrome | Windows 10 or 11 with WebView2; Chrome or Edge 111+ | Narrator: tested |
| Website on other browsers | Firefox 114+, Safari 16.4+ | Not tested yet |
| macOS desktop app | macOS 11 or later, Apple silicon | VoiceOver: not tested yet |
| Linux desktop app | WebKitGTK 2.40 or later | Orca: not tested yet |
| Android app | Android 11 or later, current Android System WebView | TalkBack: not tested yet |

## Known limitations

- **Cloudflare's challenge on the website.** If Turnstile asks you to solve a challenge instead of passing on its own, that challenge is Cloudflare's, and its accessibility is theirs to fix. If it stops you, the desktop and Android apps have no check page at all, or [email us](#reporting-a-barrier).
- **Field borders are faint.** The outline of an empty text field is about 1.2–1.3:1 against the page, under the 3:1 that WCAG asks for. Fields are still marked by their labels, and the focused field gets an accent border and ring.
- **The Continue button on the first-run screen** uses the brand gradient. White text on its lighter violet end is 3.96:1.
- **Character counters are not read out as you type.** That would interrupt every keystroke. When a field is over YouTube's limit, copying it is refused with a message that says why, and Strict Mode lists the problem in an announced banner.
- **No automated accessibility linting yet.** `eslint-plugin-jsx-a11y` does not support ESLint 10, which the project uses, and the unit tests run without a browser DOM. Checks are manual (see above) apart from the contrast test.
- **Translations.** Interface languages other than English and Vietnamese were translated with AI assistance (see the [Disclaimer](DISCLAIMER.md)). Some labels may sound unnatural when read aloud.
- **Emoji in descriptions.** Generated descriptions use a few emoji as section markers (for example 👍 and 🔔), and screen readers on YouTube read them out by name.

## Reporting a barrier

If something in YTDescGen gets in your way, please tell us. You don't need to know what causes it.

- **Preferred:** open an [accessibility issue](https://github.com/poli0981/youtube-generator/issues/new?template=accessibility.yml). The form asks for the platform, the assistive technology you use and what happened.
- **Not comfortable posting publicly?** Email **contact@poli0981.dev** with `[Accessibility]` at the start of the subject.
- **Quick question?** Ask on [Discord](https://discord.gg/kDM9GMu5vm).

### Severity

| Level | Meaning |
| --- | --- |
| **Critical** | You can't finish a core task: write, generate, copy, save, or get past the website's check. |
| **High** | You can finish it, but only with real difficulty or a workaround. |
| **Medium** | It works, but inconsistently or confusingly. |
| **Low** | A minor annoyance that doesn't stop you. |

### How we respond

- We reply within **7 days**, and we will take your report at face value.
- **Critical** barriers are fixed in the next patch release. Others are planned like any other bug, with the more severe first.
- If there is a workaround, we tell you while the fix is on its way.
- When the fix ships, we'll ask you to check it if you're willing.

This is a one-person project, so timelines are honest estimates, not guarantees. If one slips, we'll say so in the issue.

## For contributors

Changes to the interface should keep everything above true. Before opening a pull request that touches the UI:

- **Keyboard.** Everything works with the keyboard: the focus order makes sense, the focus outline is visible, **Esc** closes what you opened, and nothing traps the focus.
- **Names.** Use the shared `Field` (label, hint and error wiring) and `IconButton` (which can't be rendered without a `label`) components. `aria-label` text goes through `t()` like any other string, in all eight locales.
- **Errors and status.** They are announced: `Banner` with `alert`, a toast, or an existing live region.
- **Colour.** Colour is never the only signal. Use the design tokens only, and run `npm run test:run`. The contrast test fails if a token drops under AA, and white text belongs on the `*-solid` fills.
- **Motion.** New animation respects reduced motion. Motion's components do this already, and CSS animations are covered by the global rule in `globals.css`.
- **Targets.** Anything clickable is at least 24 × 24 px and grows on touch screens.
- **Screen reader.** Try the change once with a screen reader: Narrator (Win + Ctrl + Enter), VoiceOver (⌘ + F5), NVDA or Orca.

The pull request template has the same checklist.

## Feedback on this statement

Ideas for improving this statement or the way accessibility is handled are welcome in [GitHub Discussions](https://github.com/poli0981/youtube-generator/discussions). Please report barriers through the [reporting process](#reporting-a-barrier) so they can be tracked.
