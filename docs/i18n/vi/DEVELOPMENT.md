# Hướng dẫn phát triển

> **Lưu ý dịch thuật:** Tiếng Anh là phiên bản chính ([`docs/DEVELOPMENT.md`](../../DEVELOPMENT.md)). Bản tiếng Việt này có thể chậm cập nhật một vài commit.

Hướng dẫn này bao gồm cách cài đặt YTDescGen để phát triển cục bộ trên Windows, macOS hoặc Linux. Ứng dụng là một web app Vite/React với tùy chọn vỏ desktop Tauri.

## Cấu hình máy tham chiếu

Cấu hình máy đã dùng để phát triển và phát hành dự án:

| Thành phần | Thông số |
| --- | --- |
| OS | Windows 11 Pro (24H2 trở lên) |
| CPU | x86-64 hiện đại — 6 nhân trở lên có AVX2 (Intel gen 11 / AMD Zen 3 hoặc mới hơn) |
| GPU | Rời hoặc tích hợp — backend WebView2 của Tauri chạy thoải mái trên iGPU |
| RAM | Tối thiểu 16 GB, khuyến nghị 32 GB để chạy song song typecheck + dev server |
| Lưu trữ | 5 GB trống cho `node_modules` + `target/` Cargo sau khi build Tauri đầy đủ |
| Màn hình | Tối thiểu 1920×1080; layout mobile đã test đến 360×640 |

macOS và Linux đều dùng được để phát triển. Build release Tauri được cross-compile hoặc chạy trên CI riêng — xem [PACKAGING.md](../../PACKAGING.md).

## Toolchain

Cài theo thứ tự:

| Công cụ | Phiên bản | Lý do |
| --- | --- | --- |
| **Node.js** | `>= 22.0.0` | Vite 7 đã bỏ hỗ trợ Node cũ. Dùng [nvm](https://github.com/nvm-sh/nvm) hoặc [fnm](https://github.com/Schniz/fnm). |
| **npm** | đi kèm Node 22 | Dự án dùng npm; `pnpm` và `yarn` chưa test. |
| **Rust** | stable, `>= 1.78` | Bắt buộc cho build Tauri. Cài qua [rustup](https://rustup.rs/). |
| **Python** | `3.12` | Tùy chọn — chỉ cần cho một số tooling Tauri trên Windows. |
| **Tauri prerequisites** | theo OS | Xem <https://v2.tauri.app/start/prerequisites/>. |

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
- Settings → Code Style → Prettier → Run on save (`src/**/*.{ts,tsx,json,css}`).

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

## Lệnh thường dùng

| Lệnh | Tác dụng |
| --- | --- |
| `npm run dev` | Vite dev server, hot reload, chỉ web. |
| `npm run build` | Bundle web production vào `dist/`. |
| `npm run preview` | Phục vụ bundle production để kiểm tra. |
| `npm run typecheck` | `tsc --noEmit`. Chạy trước mỗi PR. |
| `npm run lint` | ESLint. Dùng `npm run lint:fix` để autofix. |
| `npm run format` | Chạy Prettier trên `src/`. |
| `npm run test` | Vitest chế độ watch. |
| `npm run test:run` | Vitest chạy một lần (cho CI / pre-commit). |
| `npm run test:coverage` | Báo cáo coverage vào `coverage/`. |
| `npm run validate:locales` | Bắt buộc cả 6 locale có cùng key với `_schema.json`. **Phải pass trước khi merge PR động đến locale.** |
| `npm run generate:locale` | Scaffold locale rỗng từ `_schema.json` cho ngôn ngữ mới. |
| `npm run tauri:dev` | Tauri desktop chế độ dev (tự restart khi đổi Rust hoặc frontend). |
| `npm run tauri:build` | Build binary Tauri release cho platform hiện tại. |

## Build Tauri desktop

Xem [PACKAGING.md](../../PACKAGING.md) cho pipeline release đầy đủ. Build cục bộ nhanh:

```bash
npm run tauri:build
# Output: src-tauri/target/release/bundle/{msi,deb,dmg,app}
```

Build đầu tiên mất khoảng 5–10 phút (Cargo cache rỗng). Build sau đó là incremental.

## Khắc phục sự cố

### `validate:locales` fail sau khi thêm key

Bạn quên cập nhật `src/i18n/locales/_schema.json`. Schema là source of truth; locale phải khớp 100%.

### Build Tauri báo `link.exe not found` (Windows)

Cài Visual Studio Build Tools 2022 + workload Desktop C++, sau đó khởi động lại shell để PATH được cập nhật.

### Build Tauri báo `pkg-config not found` (Linux)

Cài Tauri prerequisites theo distro tại <https://v2.tauri.app/start/prerequisites/>.

### `npm install` chậm / treo

Tắt VPN/proxy doanh nghiệp chặn npm registry. Lock file đã commit; install offline chạy được sau lần install thành công đầu tiên.

### Hot reload không bắt được sửa đổi locale

Locale JSON bundle vào lúc build, không được watch. Restart dev server sau khi sửa `src/i18n/locales/*`.

Từ v0.26, chỉ tiếng Anh nằm trong main chunk; các ngôn ngữ khác là async
chunk lazy-load, tải khi dùng lần đầu (xem `src/i18n/index.ts` và
docs/I18N.md). Lời khuyên restart ở trên vẫn áp dụng cho tất cả.

### Pre-commit hook fail ở `validate:locales` mà mình không động đến locale

Có thể bạn vô tình thêm key mới vào `_schema.json` thông qua `src/engine/types.ts` → `CONTENT_WARNINGS`. ID mới cần dịch ở cả 6 locale.

## Xem thêm

- [ARCHITECTURE.md](../../ARCHITECTURE.md) — mô hình layer, data flow, thiết kế engine.
- [I18N.md](../../I18N.md) — thêm ngôn ngữ mới từng bước.
- [PACKAGING.md](../../PACKAGING.md) — Tauri release build và signing.
- [CONTRIBUTING.md ở root](../../../CONTRIBUTING.md) — quy trình PR, quy ước commit, auto-ignore rules.
- [SECURITY.md ở root](../../../SECURITY.md) — báo cáo lỗ hổng bảo mật.
