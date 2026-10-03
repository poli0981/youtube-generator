# Hướng dẫn phát triển

> **Lưu ý dịch thuật:** Tiếng Anh là phiên bản chính ([`docs/DEVELOPMENT.md`](../../DEVELOPMENT.md)). Bản tiếng Việt này có thể chậm cập nhật một vài commit.

Hướng dẫn này bao gồm cách cài đặt YTDescGen để phát triển cục bộ trên Windows, macOS hoặc Linux. Ứng dụng là một web app Vite/React, kèm vỏ Tauri (tùy chọn) cho desktop và Android. Bản web chạy tại [ytgenerator.stream](https://ytgenerator.stream) thông qua một Cloudflare Worker — xem [HOSTING.md](../../HOSTING.md).

## Cấu hình máy tham chiếu

Cấu hình máy đã dùng để phát triển và phát hành dự án:

| Thành phần | Thông số                                                                         |
| ---------- | -------------------------------------------------------------------------------- |
| OS         | Windows 11 Pro (24H2 trở lên)                                                    |
| CPU        | x86-64 hiện đại — 6 nhân trở lên có AVX2 (Intel gen 11 / AMD Zen 3 hoặc mới hơn) |
| GPU        | Rời hoặc tích hợp — backend WebView2 của Tauri chạy thoải mái trên iGPU          |
| RAM        | Tối thiểu 16 GB, khuyến nghị 32 GB để chạy song song typecheck + dev server      |
| Lưu trữ    | 5 GB trống cho `node_modules` + `target/` Cargo sau khi build Tauri đầy đủ       |
| Màn hình   | Tối thiểu 1920×1080; layout mobile đã test đến 360×640                           |

macOS và Linux đều dùng được để phát triển. Build release Tauri được cross-compile hoặc chạy trên CI riêng — xem [PACKAGING.md](../../PACKAGING.md).

## Toolchain

Cài theo thứ tự:

| Công cụ                 | Phiên bản                                     | Lý do                                                                                                                                                                                                                                                                                              |
| ----------------------- | --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Node.js**             | **22** — đúng phiên bản trong `.node-version` | CI, các workflow release và Cloudflare Workers Builds đều đọc `.node-version`. Vite 8 cần Node `^20.19` hoặc `>= 22.12`, còn wrangler cần `>= 22`, nên hãy dùng 22.12 trở lên. Dùng [nvm](https://github.com/nvm-sh/nvm) hoặc [fnm](https://github.com/Schniz/fnm) (fnm đọc được `.node-version`). |
| **npm**                 | đi kèm Node 22                                | Dự án dùng npm; `pnpm` và `yarn` chưa test.                                                                                                                                                                                                                                                        |
| **Rust**                | stable, `>= 1.90`                             | Bắt buộc cho bản build Tauri desktop và Android (Tauri 2.12 cần Rust 1.90). Cài qua [rustup](https://rustup.rs/); profile mặc định đã có sẵn `rustfmt` và `clippy`.                                                                                                                                |
| **Python**              | `3.12`                                        | Tùy chọn — chỉ cần cho một số tooling Tauri trên Windows.                                                                                                                                                                                                                                          |
| **Tauri prerequisites** | theo OS                                       | Xem <https://v2.tauri.app/start/prerequisites/>.                                                                                                                                                                                                                                                   |

### Windows

- Cài **Visual Studio Build Tools 2022** với workload "Desktop development with C++" (bắt buộc cho `tauri-build`).
- Cài **WebView2 Runtime** (Windows 11 thường đã có sẵn).
- Bật long path: `git config --global core.longpaths true`.

### macOS

- Cài Xcode Command Line Tools: `xcode-select --install`.

### Linux

- Cài Tauri prerequisites theo từng distro — `libwebkit2gtk-4.1-dev`, `libappindicator3-dev`, v.v. Xem docs Tauri ở link trên.

## Cấu hình IDE

Quy trình tham chiếu dùng **JetBrains 2026.x** (WebStorm hoặc RustRover) làm IDE chính, **VS Code** cho chỉnh sửa nhanh.

### JetBrains (WebStorm / RustRover / IntelliJ Ultimate)

- Bật plugin **Tailwind CSS**.
- Bật plugin **i18next** (hoặc dùng `src/i18n/locales/_schema.json` để autocomplete).
- Settings → Languages → TypeScript → "Use TypeScript from `node_modules/typescript`".
- Settings → Code Style → Prettier → Run on save (`{src,tests,scripts,worker,build-plugins}/**/*.{ts,tsx,css}` — đúng các file mà `npm run format` xử lý).

### VS Code

Extension đề xuất (không có `.vscode/extensions.json` được commit — cài thủ công):

- `dbaeumer.vscode-eslint`
- `esbenp.prettier-vscode`
- `bradlc.vscode-tailwindcss`
- `rust-lang.rust-analyzer` (nếu động vào `src-tauri/`)
- `tauri-apps.tauri-vscode`

## Chạy lần đầu

```bash
# 1. Clone
git clone https://github.com/poli0981/youtube-generator.git
cd youtube-generator

# 2. Cài web dependencies
npm install

# 3. Chạy web dev server
npm run dev
# → http://localhost:5173
```

Dev server chỉ chạy riêng app: không có cổng Turnstile, không có analytics. Muốn chạy Worker phục vụ bản web, xem mục **Cloudflare Worker (chạy cục bộ)** bên dưới.

## Nhánh và Pull Request

- Tạo nhánh từ `main` (`feat/…`, `fix/…`, `docs/…`, `chore/…`) và mở pull request vào `main`. Không có nhánh dài hạn nào khác, và mỗi lần merge vào `main` đều deploy bản web.
- Tiêu đề PR theo định dạng commit `type(scope): message`; CI có kiểm tra.
- Mỗi PR đều chạy job `check` (xem bên dưới), `dependency-review`, `workflow-lint`, `reuse` và `pr-title`; hai job Rust `lint-and-test` và `cargo-deny` chạy khi có thay đổi trong `src-tauri/`.

Quy định đầy đủ: [CONTRIBUTING.md](../../../CONTRIBUTING.md).

## Lệnh thường dùng

### Phát triển và build

| Lệnh                  | Tác dụng                                                                                                                                                                                                 |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run dev`         | Vite dev server, hot reload, chỉ web.                                                                                                                                                                    |
| `npm run build`       | `tsc` + bundle web production vào `dist/`. Bản build web có thêm beacon Web Analytics, `/.well-known/security.txt` và các trang tĩnh `/legal/*`; bản build do Tauri CLI chạy thì không có những thứ này. |
| `npm run preview`     | Phục vụ bundle production để kiểm tra (không qua Worker).                                                                                                                                                |
| `npm run cf:dev`      | `wrangler dev` — Worker đứng trước `dist/` tại `http://localhost:8787`. Xem mục **Cloudflare Worker (chạy cục bộ)**.                                                                                     |
| `npm run tauri:dev`   | Tauri desktop chế độ dev (hoặc `npm run tauri dev`): chạy `npm run dev` rồi mở cửa sổ app trỏ vào đó. Sửa frontend thì hot reload; sửa Rust thì app được build lại.                                      |
| `npm run tauri:build` | Build binary Tauri release cho platform hiện tại.                                                                                                                                                        |

### Kiểm tra

| Lệnh                       | Tác dụng                                                                                                                                                                                                                                                                                                 |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run typecheck`        | `tsc --noEmit` trên `src/` — đúng phần Vite build.                                                                                                                                                                                                                                                       |
| `npm run typecheck:all`    | Như trên, thêm `tests/`, `scripts/`, `worker/` và `build-plugins/` (`tsconfig.check.json`) — những thư mục config gốc cố ý bỏ qua. Có từ v0.35.0, khi phát hiện tests và scripts **chưa từng** được type-check — và lần chạy đầu đã tìm ra ba field bị thiếu âm thầm trong fixture parity editor→engine. |
| `npm run lint`             | ESLint trên `src/`, `tests/`, `scripts/`, `worker/` và `build-plugins/`. Dùng `npm run lint:fix` để tự sửa.                                                                                                                                                                                              |
| `npm run format`           | Chạy Prettier (ghi file) trên `src/`, `tests/`, `scripts/`, `worker/` và `build-plugins/` (`.ts`, `.tsx`, `.css`).                                                                                                                                                                                       |
| `npm run format:check`     | Như trên nhưng chỉ kiểm tra. Là cổng CI. Markdown và JSON locale cố ý nằm ngoài phạm vi.                                                                                                                                                                                                                 |
| `npm run knip`             | Tìm code chết / dependency không dùng. Là cổng CI.                                                                                                                                                                                                                                                       |
| `npm run validate:locales` | Bắt buộc cả 8 locale khớp chính xác với `_schema.json`. **Phải pass trước khi merge PR động đến locale.**                                                                                                                                                                                                |
| `npm run test`             | Vitest chế độ watch.                                                                                                                                                                                                                                                                                     |
| `npm run test:run`         | Vitest chạy một lần.                                                                                                                                                                                                                                                                                     |
| `npm run test:coverage`    | Chạy một lần kèm báo cáo coverage vào `coverage/`; fail nếu thấp hơn ngưỡng đặt cho `src/engine/` và `worker/` trong `vitest.config.ts`. CI chạy lệnh này.                                                                                                                                               |
| `npm run check:version`    | Kiểm tra cả **sáu** trường version khớp nhau (`package.json`, hai chỗ trong `package-lock.json`, `tauri.conf.json`, `Cargo.toml`, `Cargo.lock`). Đây là thứ duy nhất phát hiện khi bỏ sót một chỗ.                                                                                                       |
| `npm run check:tauri`      | Các package npm `@tauri-apps/*` và các crate Tauri phải cùng major.minor. Tauri CLI sẽ từ chối build nếu lệch, mà CI thì không chạy build Tauri.                                                                                                                                                         |
| `npm run check:licenses`   | Mọi package được bundle đều có license nằm trong danh sách cho phép, và `THIRD_PARTY_NOTICES.md` khớp với những gì đang cài.                                                                                                                                                                             |
| `npm run check:copyright`  | NOTICE, REUSE.toml và chuỗi copyright của bộ cài (`tauri.conf.json`) phải ghi đúng năm theo năm của commit HEAD — "2026", rồi "2026-2027" từ commit đầu tiên của năm 2027. Gate của CI (v1.1.0).                                                                                                         |
| `npm run check:bundle`     | Chạy sau `npm run build`: lần tải đầu phải ≤ 280 KB gzip và không chunk JS nào vượt 500 KB (chưa nén).                                                                                                                                                                                                   |
| `npm run cf:check`         | `wrangler deploy --dry-run`: kiểm tra `wrangler.jsonc` và bundle Worker y như Workers Builds sẽ làm, nhưng không deploy.                                                                                                                                                                                 |

### Sinh file

| Lệnh                           | Tác dụng                                                                                                                                                                                                                                        |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run generate:locale`      | Tạo khung locale mới từ bản tiếng Anh. `--lang <mã>`, thêm tùy chọn `--copy-english` / `--force`. (Được nhắc đến từ v0.1 nhưng đến v0.35.0 mới thật sự có script.)                                                                              |
| `npm run generate:third-party` | Ghi lại `THIRD_PARTY_NOTICES.md` từ các package đang cài — cần chạy sau khi đổi dependency, nếu không `check:licenses` sẽ fail.                                                                                                                 |
| `npm run update:copyright`     | Ghi lại năm bản quyền trong NOTICE, REUSE.toml và `tauri.conf.json` — cần chạy với commit đầu tiên của năm mới, nếu không `check:copyright` sẽ fail.                                                                                            |
| `npm run generate:brand`       | Chuyển các SVG thương hiệu trong `assets/brand/` thành icon PNG và ảnh preview khi chia sẻ link của bản web, đặt trong `public/`. Các file PNG được commit. Icon desktop và Android dùng chung logo đó: `npx tauri icon assets/brand/logo.svg`. |

## Trước khi mở PR

Chạy đúng những gì job `check` của CI chạy:

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

Có động đến `src-tauri/`? Chạy thêm phần **Kiểm tra Rust** bên dưới.

## Cloudflare Worker (chạy cục bộ)

Bản web được phục vụ bởi một Cloudflare Worker ([`worker/`](../../../worker), cấu hình trong [`wrangler.jsonc`](../../../wrangler.jsonc)), đứng trước `dist/` để lo cổng Turnstile, các security header và các trang `/legal` công khai. Để chạy cục bộ:

```bash
cp .dev.vars.example .dev.vars   # chỉ chứa key TEST công khai của Cloudflare Turnstile
npm run build                    # Worker phục vụ dist/
npm run cf:dev                   # wrangler dev → http://localhost:8787
```

- `.dev.vars` (đã nằm trong `.gitignore`) chứa các key Turnstile **test** mà Cloudflare công bố: widget luôn pass, và secret chỉ chấp nhận token giả do chính widget đó tạo ra. Tuyệt đối không ghi secret thật vào file — trên production, `TURNSTILE_SECRET` được lưu dưới dạng Secret của Cloudflare.
- Không có `.dev.vars` thì Worker không có `TURNSTILE_SECRET` và sẽ fail open: app vẫn tải lên nhưng không qua cổng.
- Worker phục vụ bản build gần nhất — chạy lại `npm run build` để thấy thay đổi ở frontend.
- Test của Worker chạy chung với cả bộ test (`tests/worker/`).

Deploy, cookie, header, secret và rollback: [HOSTING.md](../../HOSTING.md).

## Build Tauri desktop

Xem [PACKAGING.md](../../PACKAGING.md) cho pipeline release đầy đủ. Build cục bộ nhanh:

```bash
npm run tauri:build
# Output: src-tauri/target/release/bundle/
#   Windows: bộ cài MSI + NSIS · Linux: deb, rpm, AppImage · macOS: .app + DMG
```

Build đầu tiên mất khoảng 5–10 phút (Cargo cache rỗng). Build sau đó là incremental.

Vite dev server không theo dõi `src-tauri/**` và `.wrangler/**` (`server.watch.ignored` trong `vite.config.ts`): khi `tauri dev` đang chạy, Cargo liên tục ghi lại các file trong `src-tauri/target`, và việc theo dõi chúng từng làm Vite crash trên Windows với lỗi `EBUSY` do file `.dll` bị khóa.

### Kiểm tra Rust

Giống các bước của job `lint-and-test` trong `.github/workflows/rust.yml` (chạy khi `src-tauri/` thay đổi, và hằng tuần):

```bash
npm run build          # tauri::generate_context!() nhúng dist/, nên clippy và test cần có bản build
cd src-tauri
cargo fmt --all -- --check
cargo clippy --all-targets --locked -- -D warnings
cargo test --locked
```

Job `cargo-deny` kiểm tra advisory RustSec, license và nguồn crate theo `src-tauri/deny.toml`. Chạy cục bộ (sau khi `cargo install cargo-deny`): `cargo deny check advisories licenses sources` trong `src-tauri/`.

## Khắc phục sự cố

### `validate:locales` fail sau khi thêm key

Bạn quên cập nhật `src/i18n/locales/_schema.json`, hoặc còn thiếu ở một trong 8 locale. Schema là nguồn chuẩn; mọi locale phải khớp 100%.

### `validate:locales` fail mà mình không động đến locale

Có người — hoặc một lần merge từ `main` — đã thêm key vào `_schema.json` (ví dụ nhãn cho một id mới trong `CONTENT_WARNINGS` ở `src/engine/types.ts`) mà chưa có ở mọi locale. Key mới cần có giá trị ở cả 8 locale.

### Build Tauri báo `link.exe not found` (Windows)

Cài Visual Studio Build Tools 2022 + workload Desktop C++, sau đó khởi động lại shell để PATH được cập nhật.

### Build Tauri báo `pkg-config not found` (Linux)

Cài Tauri prerequisites theo distro tại <https://v2.tauri.app/start/prerequisites/>.

### `check:tauri` fail sau khi cập nhật dependency

Một package npm `@tauri-apps/*` đã lên minor mới mà crate chưa lên (hoặc ngược lại). Chạy `cargo update -p tauri` (và các crate plugin mà `check:tauri` liệt kê) trong `src-tauri/`, trên cùng nhánh.

### `check:bundle` không tìm thấy `dist/index.html`

Lệnh này đo bản build — hãy chạy `npm run build` trước.

### `npm run cf:dev` không hiện cổng Turnstile

Thiếu `.dev.vars`, nên Worker không có secret và phục vụ app mà không qua cổng. Copy `.dev.vars.example` thành `.dev.vars` rồi chạy lại.

### `npm install` chậm / treo

Tắt VPN/proxy doanh nghiệp chặn npm registry. Lock file đã commit; install offline chạy được sau lần install thành công đầu tiên.

### Hot reload không bắt được sửa đổi locale

Locale JSON bundle vào lúc build, không được watch. Restart dev server sau khi sửa `src/i18n/locales/*`.

Từ v0.26, chỉ tiếng Anh nằm trong main chunk; các ngôn ngữ khác là async
chunk lazy-load, tải khi dùng lần đầu (xem `src/i18n/index.ts` và
docs/I18N.md). Lời khuyên restart ở trên vẫn áp dụng cho tất cả.

## Xem thêm

- [ARCHITECTURE.md](../../ARCHITECTURE.md) — mô hình layer, data flow, thiết kế engine.
- [HOSTING.md](../../HOSTING.md) — cách ytgenerator.stream được build, deploy và bảo vệ.
- [I18N.md](../../I18N.md) — thêm ngôn ngữ mới từng bước.
- [PACKAGING.md](../../PACKAGING.md) — Tauri release build và signing.
- [CONTRIBUTING.md ở root](../../../CONTRIBUTING.md) — quy trình PR, quy ước commit, auto-ignore rules.
- [SECURITY.md ở root](../../../SECURITY.md) — báo cáo lỗ hổng bảo mật.
