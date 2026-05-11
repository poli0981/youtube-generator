# Developer Machine

Reference hardware spec for the primary YTDescGen developer workstation. This
is the box the public web build, the desktop Tauri binaries, and the recorded
demo videos all come off of. See [`dev_env.md`](dev_env.md) for the IDE +
language toolchain side of the same setup, and [`i18n/vi/pc_spec.md`](i18n/vi/pc_spec.md)
for the Vietnamese mirror.

## Primary workstation

| Component | Details |
|-----------|---------|
| OS        | Windows 11 Pro 25H2 Insider Preview (Dev Channel) |
| Build     | 26300.8376 |
| CPU       | Intel Core i7-14700KF |
| GPU       | NVIDIA GeForce RTX 5080 (16 GB VRAM) |
| RAM       | 32 GB DDR5 |
| Storage   | 1 TB SSD |
| IDE       | JetBrains paid lineup, 2026.x — PyCharm, WebStorm, RustRover, Rider — plus VS Code |

## Mobile devices used for web QA

We check the web build on Safari and Chromium browsers on these phones:

- iPhone 14 Pro (iOS 26.x)
- iPhone 13 Pro Max (iOS 26.x)
- Browsers: Chrome, Brave

## Why this matters

Render performance, scrollbar styling, and the `position: sticky` editor
sidebar all behave subtly differently on mobile Safari than on desktop
Chromium. Anything UI-heavy gets smoke-tested on the listed phones before it
ships.

## Companion docs

- [`dev_env.md`](dev_env.md) — IDE + toolchain table.
- [`../webapp/TAURI.md`](../webapp/TAURI.md) — desktop build prerequisites.
- [`i18n/vi/pc_spec.md`](i18n/vi/pc_spec.md) — Vietnamese mirror.
