# Privacy Policy

**Effective:** 2026-09-30

This policy covers YTDescGen — the web app at **https://ytgenerator.stream** and the desktop (Windows, macOS, Linux) and Android apps built from the same source. It is maintained by **poli0981 (SkullMute)**, who is responsible for it. Questions and requests: **privacy@poli0981.dev**.

## In short

- There is **no account** and **no YTDescGen server that receives your work**. Everything you type — profiles, presets, templates, drafts, history — is stored **on your own device** and nowhere else.
- The **web app** is delivered through **Cloudflare**. To do that, Cloudflare necessarily sees technical request data (such as your IP address), runs a one-time **Turnstile** bot check before you enter, and provides **cookieless** visit statistics (**Cloudflare Web Analytics**).
- The **desktop and Android apps** have none of that: no analytics, no bot check, no telemetry.
- Nothing is sold, shared for advertising, or used to profile you.

## 1. What stays on your device

### Web app

Your work is saved in your browser's **`localStorage`** for `ytgenerator.stream`:

| Key                      | Contents                                                                               |
| ------------------------ | -------------------------------------------------------------------------------------- |
| `ytdescgen-settings`     | Theme, languages, editor preferences, the version of these terms you accepted and when |
| `ytdescgen-profiles`     | Saved channel profiles (channel name, social links, contact emails, PC rig)            |
| `ytdescgen-presets`      | Saved game presets (game name, genres, store links)                                    |
| `ytdescgen-templates`    | Saved full-form templates                                                              |
| `ytdescgen-history`      | Recently generated titles, descriptions and tags                                       |
| `ytdescgen-editor-draft` | The draft currently open in the editor                                                 |
| `ytdescgen-logs`         | The app's own event log (errors, imports, exports)                                     |

This data never leaves your browser unless **you** export it. Clearing site data, using a private window, or a "clear cookies and site data on exit" setting erases it.

### Desktop and Android apps

The apps keep the same data in the app's own WebView storage and application-data folder (the event log and automatic backups live there too):

- **Windows:** `%APPDATA%\com.skullmute.ytdescgen` and `%LOCALAPPDATA%\com.skullmute.ytdescgen`
- **macOS:** `~/Library/Application Support/com.skullmute.ytdescgen`
- **Linux:** `~/.local/share/com.skullmute.ytdescgen`
- **Android:** the app's private storage (removed when you uninstall the app or clear its data)

The desktop app keeps its automatic backups (the newest ten, plus one made before each restore) in the `backups` folder inside the application-data folder, and its event log in `logs`. Uninstalling the app or deleting those folders removes everything. The apps make no network requests of their own; links you choose to open (store pages, donation pages, this policy on the web) open in your browser.

### The old address

Until 29 November 2026, `poli0981.github.io/youtube-generator` — where the web app used to live — shows a moving notice hosted by **GitHub Pages**. Browser storage belongs to a site, so data saved there can't move on its own: the notice reads what your browser saved on that address and lets you download it as a file. Nothing is uploaded; GitHub, as the host, receives the usual request data (see the [GitHub Privacy Statement](https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement)).

## 2. What the web app's hosting provider processes

The web app is hosted on **Cloudflare Workers**. Cloudflare acts as a service provider (processor) for the site and handles:

- **Delivery and security.** Every request carries technical data — IP address, browser user-agent, requested URL, referrer, date and time. Cloudflare uses it to deliver the site, keep it available and protect it from abuse. Error and request logs for the site's Worker (Cloudflare Workers Logs) are kept by Cloudflare for a short period (currently up to 7 days) and are used only to fix problems.
- **Turnstile bot check.** Before you enter, [Cloudflare Turnstile](https://www.cloudflare.com/products/turnstile/) runs a check — usually invisible — that evaluates technical browser and device signals and your IP address to tell people from automated traffic. Its data handling is described in Cloudflare's [Turnstile Privacy Addendum](https://www.cloudflare.com/turnstile-privacy-policy/). YTDescGen receives only a pass/fail result.
- **Cloudflare Web Analytics.** Aggregate, **cookieless** statistics: page views, referrer, country, browser, operating system and device type, and page-load performance. It sets no cookies, uses no local storage and does not fingerprint visitors. See [Cloudflare's Web Analytics privacy notes](https://www.cloudflare.com/web-analytics/) and the [Cloudflare Privacy Policy](https://www.cloudflare.com/privacypolicy/).

Cloudflare operates a global network, so this data may be processed outside your country under Cloudflare's data-processing terms (including the EU Standard Contractual Clauses).

## 3. Cookies

The web app sets exactly two cookies, both first-party and both needed for the bot check:

| Cookie            | Purpose                                                                                                                                                                                                   | Lifetime |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| `__Host-ytg_gate` | Remembers that this browser passed the Turnstile check. Contains only an expiry time, a shortened one-way hash of your browser's user-agent string and a signature — no identifier. `HttpOnly`, `Secure`. | 24 hours |
| `ytg_terms`       | Records which version of these Terms and this Privacy Policy you agreed to on the check page, so the app does not ask twice.                                                                              | 1 year   |

There are no advertising, tracking or third-party analytics cookies. Cloudflare's own security systems may set strictly necessary cookies of their own as described in Cloudflare's [cookie policy](https://www.cloudflare.com/cookie-policy/).

## 4. Legal bases (EEA/UK)

- Operating and securing the web app, including the bot check and its cookies: **legitimate interests** (Art. 6(1)(f) GDPR); the cookies are strictly necessary for a service you request, so they need no separate consent.
- Aggregate, cookieless visit statistics: **legitimate interests** in understanding how the site is used.
- Everything in section 1 is processed only on your device, by you.

## 5. What is never done

- No selling or renting of data, no advertising networks, no behavioural profiling.
- No YouTube, Google, Steam or other third-party account access — the app never sees your channel.
- No crash reporting or telemetry from the desktop or Android apps.

## 6. Your rights

- **Access and portability:** your content is already on your device; **Settings › Backup & restore** saves all of it (or the parts you choose) as one file, and the library and History pages export their own lists.
- **Erasure:** clear site data (web) or uninstall the app / delete its folders (desktop, Android).
- **Data processed by Cloudflare:** write to **privacy@poli0981.dev**. Because YTDescGen has no accounts, it holds no data that can be looked up by your name or email; requests about Cloudflare's own processing can also go to Cloudflare directly.
- You may also complain to your local data-protection authority.

## 7. Children

YTDescGen is not directed at children under 13 (or the minimum age of digital consent in your country) and does not knowingly process their personal data.

## 8. Changes

Changes are published at [ytgenerator.stream/legal/privacy](https://ytgenerator.stream/legal/privacy) and in the repository's `PRIVACY.md`, with the **Effective** date updated. When a change is material, the app asks you to review and accept it again on your next visit.

## 9. Contact

- Privacy and data requests: **privacy@poli0981.dev**
- Security issues: **security@poli0981.dev** (see the [Security Policy](SECURITY.md))
- Everything else: **contact@poli0981.dev** · [poli0981.dev/links](https://poli0981.dev/links/)
